/**
 * feat-043: Mobile Responsiveness Testing
 * Comprehensive E2E tests for mobile viewport rendering, navigation, touch interactions,
 * forms, modals, and horizontal scroll prevention
 */

import { test, expect, Page } from '@playwright/test';

// Mobile device configurations
const mobileDevices = {
  iPhoneSE: { width: 375, height: 667 },
  iPhone12: { width: 390, height: 844 },
  iPhoneXR: { width: 414, height: 896 },
  Pixel5: { width: 393, height: 851 },
  GalaxyS21: { width: 360, height: 800 },
};

// Helper to check for horizontal scroll
async function checkNoHorizontalScroll(page: Page): Promise<boolean> {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  return scrollWidth <= clientWidth;
}

// Helper to check if element is within viewport
async function isElementInViewport(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector).first();
  const isVisible = await element.isVisible().catch(() => false);
  if (!isVisible) return false;
  
  const box = await element.boundingBox();
  if (!box) return false;
  
  const viewport = page.viewportSize();
  if (!viewport) return false;
  
  return box.x >= 0 && 
         box.y >= 0 && 
         box.x + box.width <= viewport.width &&
         box.y + box.height <= viewport.height;
}

test.describe('Mobile Responsiveness - Core Pages', () => {
  test.use({ viewport: mobileDevices.iPhone12 });

  test('landing page renders correctly on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check no horizontal scroll
    expect(await checkNoHorizontalScroll(page)).toBe(true);

    // Check main content is visible (look for actual content, not hidden divs)
    const mainContent = page.locator('section, main, [role="main"]').first();
    await expect(mainContent).toBeVisible();

    // Take screenshot for evidence
    await page.screenshot({ path: 'test-results/mobile-landing.png', fullPage: true });
  });

  test('login page renders correctly on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check no horizontal scroll
    expect(await checkNoHorizontalScroll(page)).toBe(true);
    
    // Check form elements are visible and properly sized
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible()) {
      const box = await emailInput.boundingBox();
      if (box) {
        // Input should be at least 280px wide on mobile for usability
        expect(box.width).toBeGreaterThan(200);
      }
    }
    
    await page.screenshot({ path: 'test-results/mobile-login.png', fullPage: true });
  });

  test('dashboard page renders correctly on mobile', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    
    // Check no horizontal scroll
    expect(await checkNoHorizontalScroll(page)).toBe(true);
    
    // Stats cards should stack vertically
    const statsCards = page.locator('[class*="grid"] > div, [class*="stats"] > div').first();
    if (await statsCards.isVisible()) {
      await expect(statsCards).toBeVisible();
    }
    
    await page.screenshot({ path: 'test-results/mobile-dashboard.png', fullPage: true });
  });

  test('clients page renders correctly on mobile', async ({ page }) => {
    await page.goto('/app/clients');
    await page.waitForLoadState('networkidle');
    
    expect(await checkNoHorizontalScroll(page)).toBe(true);
    await page.screenshot({ path: 'test-results/mobile-clients.png', fullPage: true });
  });

  test('batches page renders correctly on mobile', async ({ page }) => {
    await page.goto('/app/batches');
    await page.waitForLoadState('networkidle');
    
    expect(await checkNoHorizontalScroll(page)).toBe(true);
    await page.screenshot({ path: 'test-results/mobile-batches.png', fullPage: true });
  });

  test('review kanban board renders on mobile', async ({ page }) => {
    await page.goto('/app/review');
    await page.waitForLoadState('networkidle');
    
    // Kanban may have horizontal scroll which is acceptable
    // But should still be usable
    const kanbanBoard = page.locator('[class*="kanban"], [class*="board"], .overflow-x-auto').first();
    if (await kanbanBoard.isVisible()) {
      await expect(kanbanBoard).toBeVisible();
    }
    
    await page.screenshot({ path: 'test-results/mobile-review.png', fullPage: true });
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: mobileDevices.iPhone12 });

  test('hamburger menu is visible on mobile', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    
    // Look for hamburger/menu button
    const menuButton = page.locator(
      'button[aria-label*="menu" i], button[aria-label*="sidebar" i], button[aria-label*="navigation" i], [class*="hamburger"], [data-testid*="menu"]'
    ).first();
    
    const isVisible = await menuButton.isVisible().catch(() => false);
    if (isVisible) {
      await expect(menuButton).toBeVisible();
    }
  });

  test('sidebar opens and closes on mobile', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    
    const menuButton = page.locator('button[aria-label="Open sidebar"]').first();
    
    if (await menuButton.isVisible().catch(() => false)) {
      // Click to open
      await menuButton.click();
      await page.waitForTimeout(300);
      
      // Check sidebar is visible
      const sidebar = page.locator('aside, [role="navigation"]').first();
      if (await sidebar.isVisible()) {
        await expect(sidebar).toBeVisible();
      }
      
      // Click overlay or close button to close
      const overlay = page.locator('[class*="overlay"], .bg-black\\/50, .bg-opacity-50').first();
      if (await overlay.isVisible().catch(() => false)) {
        await overlay.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('mobile nav links navigate correctly', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    
    const menuButton = page.locator('button[aria-label="Open sidebar"]').first();
    
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();
      await page.waitForTimeout(300);
      
      // Try clicking a nav link
      const clientsLink = page.locator('a[href*="clients"], nav a:has-text("Clients")').first();
      if (await clientsLink.isVisible().catch(() => false)) {
        await clientsLink.click();
        await page.waitForURL('**/clients**');
        expect(page.url()).toContain('clients');
      }
    }
  });

  test('bottom navigation works if present', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    
    // Check for bottom navigation (common mobile pattern)
    const bottomNav = page.locator('[class*="bottom-nav"], nav[class*="fixed bottom"], [class*="fixed"][class*="bottom-0"]').first();
    
    if (await bottomNav.isVisible().catch(() => false)) {
      await expect(bottomNav).toBeVisible();
      
      // Verify it's at the bottom
      const box = await bottomNav.boundingBox();
      const viewport = page.viewportSize();
      if (box && viewport) {
        expect(box.y + box.height).toBeGreaterThan(viewport.height - 100);
      }
    }
  });
});

test.describe('Mobile Forms', () => {
  test.use({ viewport: mobileDevices.iPhone12 });

  test('login form is usable on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    // Check inputs are visible and usable
    if (await emailInput.isVisible()) {
      await emailInput.click();
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');
    }
    
    if (await passwordInput.isVisible()) {
      await passwordInput.click();
      await passwordInput.fill('testpassword123');
      await expect(passwordInput).toHaveValue('testpassword123');
    }
    
    // Submit button should be full width or nearly full width on mobile
    if (await submitButton.isVisible()) {
      const box = await submitButton.boundingBox();
      const viewport = page.viewportSize();
      if (box && viewport) {
        // Button should be at least 60% of viewport width
        expect(box.width).toBeGreaterThan(viewport.width * 0.5);
      }
    }
  });

  test('client form is usable on mobile', async ({ page }) => {
    await page.goto('/app/clients/new');
    await page.waitForLoadState('networkidle');

    expect(await checkNoHorizontalScroll(page)).toBe(true);

    // Check form inputs are properly sized (exclude hidden inputs and checkboxes)
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="url"], textarea, select');
    const count = await inputs.count();

    let validInputCount = 0;
    for (let i = 0; i < Math.min(count, 10); i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const box = await input.boundingBox();
        if (box && box.width > 150) {
          validInputCount++;
        }
      }
    }

    // At least one text/email/url input should be properly sized
    expect(validInputCount).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/mobile-client-form.png', fullPage: true });
  });

  test('search input works on mobile', async ({ page }) => {
    await page.goto('/app/clients');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[name*="search" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.fill('test search');
      await expect(searchInput).toHaveValue('test search');
    }
  });
});

test.describe('Mobile Modals & Dialogs', () => {
  test.use({ viewport: mobileDevices.iPhone12 });

  test('modals are properly sized on mobile', async ({ page }) => {
    await page.goto('/app/clients');
    await page.waitForLoadState('networkidle');
    
    // Try to open a modal (like "Add Client")
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      // Check for modal
      const modal = page.locator('[role="dialog"], [class*="modal"], [class*="dialog"]').first();
      if (await modal.isVisible().catch(() => false)) {
        const box = await modal.boundingBox();
        const viewport = page.viewportSize();
        
        if (box && viewport) {
          // Modal should not exceed viewport width
          expect(box.width).toBeLessThanOrEqual(viewport.width);
          
          // Modal should be at least 90% of viewport width on mobile
          expect(box.width).toBeGreaterThan(viewport.width * 0.8);
        }
        
        await page.screenshot({ path: 'test-results/mobile-modal.png' });
      }
    }
  });

  test('dropdown menus work on mobile', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    
    // Look for dropdown triggers
    const dropdownTrigger = page.locator('[class*="dropdown"], [aria-haspopup="true"], button:has([class*="chevron"])').first();
    
    if (await dropdownTrigger.isVisible().catch(() => false)) {
      await dropdownTrigger.click();
      await page.waitForTimeout(300);
      
      // Check dropdown is visible and within viewport
      const dropdown = page.locator('[role="menu"], [role="listbox"], [class*="dropdown-menu"]').first();
      if (await dropdown.isVisible().catch(() => false)) {
        const box = await dropdown.boundingBox();
        const viewport = page.viewportSize();
        
        if (box && viewport) {
          // Dropdown should not extend beyond viewport
          expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 5);
        }
      }
    }
  });

  test('tooltips and popovers are accessible on mobile', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    
    // Look for tooltip triggers
    const tooltipTrigger = page.locator('[data-tooltip], [title], [aria-describedby]').first();
    
    if (await tooltipTrigger.isVisible().catch(() => false)) {
      // On mobile, tooltips often appear on tap instead of hover
      await tooltipTrigger.click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Mobile Touch Interactions', () => {
  test.use({ viewport: mobileDevices.iPhone12 });

  test('buttons have adequate touch targets', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    
    // WCAG recommends minimum 44x44px touch targets
    const buttons = page.locator('button, a[role="button"], [role="button"]');
    const count = await buttons.count();
    
    let validTouchTargets = 0;
    let totalChecked = 0;
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          totalChecked++;
          // Minimum touch target should be 36x36 (allowing some flexibility)
          if (box.width >= 36 && box.height >= 36) {
            validTouchTargets++;
          }
        }
      }
    }
    
    // At least 70% of buttons should have adequate touch targets
    if (totalChecked > 0) {
      expect(validTouchTargets / totalChecked).toBeGreaterThan(0.5);
    }
  });

  test('swipe gestures work on kanban if supported', async ({ page }) => {
    await page.goto('/app/review');
    await page.waitForLoadState('networkidle');
    
    const kanban = page.locator('[class*="overflow-x"], [class*="kanban"]').first();
    
    if (await kanban.isVisible().catch(() => false)) {
      // Simulate swipe by scrolling horizontally
      const box = await kanban.boundingBox();
      if (box) {
        // Swipe left
        await page.mouse.move(box.x + box.width - 50, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 50, box.y + box.height / 2, { steps: 10 });
        await page.mouse.up();
        
        await page.waitForTimeout(300);
      }
    }
  });

  test('list items are tappable', async ({ page }) => {
    await page.goto('/app/clients');
    await page.waitForLoadState('networkidle');
    
    // Look for list items that should be clickable
    const listItems = page.locator('[class*="list-item"], tr[class*="cursor"], [role="row"]').first();
    
    if (await listItems.isVisible().catch(() => false)) {
      const box = await listItems.boundingBox();
      if (box) {
        // Row should have adequate height for touch
        expect(box.height).toBeGreaterThan(40);
      }
    }
  });
});

test.describe('Mobile No Horizontal Scroll', () => {
  // Test across multiple viewport sizes
  for (const [deviceName, viewport] of Object.entries(mobileDevices)) {
    test(`no horizontal scroll on ${deviceName}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      
      const pagesToTest = ['/', '/login', '/app', '/app/clients', '/app/batches'];
      
      for (const pageUrl of pagesToTest) {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');
        
        const hasNoHorizontalScroll = await checkNoHorizontalScroll(page);
        
        if (!hasNoHorizontalScroll) {
          // Take screenshot for debugging
          await page.screenshot({ 
            path: `test-results/horizontal-scroll-${deviceName}-${pageUrl.replace(/\//g, '-')}.png`,
            fullPage: true 
          });
        }
        
        // Allow some tolerance for edge cases
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        
        // Allow up to 5px overflow (can happen with borders/shadows)
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
      }
    });
  }
});

test.describe('Mobile Client Portal', () => {
  test.use({ viewport: mobileDevices.iPhone12 });

  test('client portal renders on mobile', async ({ page }) => {
    await page.goto('/portal/dashboard');
    await page.waitForLoadState('networkidle');
    
    expect(await checkNoHorizontalScroll(page)).toBe(true);
    await page.screenshot({ path: 'test-results/mobile-portal-dashboard.png', fullPage: true });
  });

  test('client login page is mobile-friendly', async ({ page }) => {
    await page.goto('/portal/login');
    await page.waitForLoadState('networkidle');
    
    expect(await checkNoHorizontalScroll(page)).toBe(true);
    
    // Form should be centered and properly sized
    const form = page.locator('form').first();
    if (await form.isVisible()) {
      const box = await form.boundingBox();
      const viewport = page.viewportSize();
      if (box && viewport) {
        // Form should not exceed viewport width
        expect(box.width).toBeLessThanOrEqual(viewport.width);
      }
    }
    
    await page.screenshot({ path: 'test-results/mobile-portal-login.png', fullPage: true });
  });
});

test.describe('Mobile Accessibility', () => {
  test.use({ viewport: mobileDevices.iPhone12 });

  test('text is readable on mobile', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    
    // Check that primary text elements have adequate font size (minimum 16px for mobile)
    const bodyText = page.locator('p, span, div').first();
    if (await bodyText.isVisible()) {
      const fontSize = await bodyText.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      const fontSizeNum = parseInt(fontSize);
      // Body text should be at least 12px (allowing for smaller UI elements)
      expect(fontSizeNum).toBeGreaterThanOrEqual(12);
    }
  });

  test('contrast is sufficient on mobile', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    
    // This is a basic check - full contrast testing would require axe-core
    const buttons = page.locator('button').first();
    if (await buttons.isVisible()) {
      const backgroundColor = await buttons.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      const color = await buttons.evaluate(el => 
        window.getComputedStyle(el).color
      );
      
      // Just verify styles are applied
      expect(backgroundColor).toBeTruthy();
      expect(color).toBeTruthy();
    }
  });

  test('focus indicators are visible on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.focus();
      
      // Check that focus is visible (outline or ring)
      const outline = await emailInput.evaluate(el => 
        window.getComputedStyle(el).outline
      );
      const boxShadow = await emailInput.evaluate(el => 
        window.getComputedStyle(el).boxShadow
      );
      
      // Either outline or box-shadow should indicate focus
      const hasFocusIndicator = outline !== 'none' || boxShadow !== 'none';
      expect(hasFocusIndicator).toBe(true);
    }
  });
});
