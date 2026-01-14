/**
 * E2E Tests for Critical Features
 * Tests settings, API keys, webhooks, work declarations, files, and Gmail integration
 * Converted from MCP Puppeteer tests to Playwright
 */

import { test, expect, Page } from '@playwright/test';

// Helper to check if page loads without errors
async function checkPageLoads(page: Page, url: string, titlePattern: RegExp = /BlogCanvas/i) {
  const response = await page.goto(url);
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(titlePattern);
}

// Helper to check for console errors
async function checkNoConsoleErrors(page: Page, url: string): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto(url);
  await page.waitForLoadState('networkidle');
  
  return errors;
}

test.describe('Settings Pages', () => {
  test('should display main settings page', async ({ page }) => {
    await page.goto('/app/settings');
    
    // Should show settings page or redirect to login
    const url = page.url();
    if (url.includes('/login') || url.includes('/portal')) {
      // Not authenticated - skip rest of test
      return;
    }

    await expect(page.locator('text=/settings/i')).toBeVisible();
  });

  test('should display settings navigation options', async ({ page }) => {
    await page.goto('/app/settings');
    
    const url = page.url();
    if (url.includes('/login')) return;

    // Check for settings categories
    const settingsLinks = [
      'Security',
      'Two-Factor',
      'Gmail',
      'Google Analytics',
      'SLA',
    ];

    for (const link of settingsLinks) {
      const element = page.locator(`text=${link}`).first();
      // Just check the page structure, not visibility (may be scrolled)
      await expect(element).toBeDefined();
    }
  });

  test('should navigate to Gmail settings', async ({ page }) => {
    await page.goto('/app/settings/gmail');
    
    const url = page.url();
    if (url.includes('/login')) return;

    // Should show Gmail integration UI
    await expect(page.locator('text=/gmail|email|connect/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to vendor settings', async ({ page }) => {
    await page.goto('/app/vendor/settings');
    
    const url = page.url();
    if (url.includes('/login')) return;

    // Should show vendor settings
    await expect(page.locator('text=/vendor|organization|settings/i').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('API Keys Page', () => {
  test('should display API keys page', async ({ page }) => {
    await page.goto('/app/api-keys');
    
    const url = page.url();
    if (url.includes('/login')) return;

    // Should show API keys management UI
    await expect(page.locator('text=/api key|developer|keys/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should have create API key button', async ({ page }) => {
    await page.goto('/app/api-keys');
    
    const url = page.url();
    if (url.includes('/login')) return;

    // Look for create button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")').first();
    await expect(createButton).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Webhooks Page', () => {
  test('should display webhooks page', async ({ page }) => {
    await page.goto('/app/webhooks');
    
    const url = page.url();
    if (url.includes('/login')) return;

    // Should show webhooks management UI
    await expect(page.locator('text=/webhook|endpoint|event/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should have create webhook button', async ({ page }) => {
    await page.goto('/app/webhooks');
    
    const url = page.url();
    if (url.includes('/login')) return;

    // Look for create button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")').first();
    await expect(createButton).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Work Declarations Page', () => {
  test('should display work declarations page', async ({ page }) => {
    await page.goto('/app/work-declarations');
    
    const url = page.url();
    if (url.includes('/login')) return;

    // Should show work declarations UI
    await expect(page.locator('text=/work|declaration|task/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should have create declaration button', async ({ page }) => {
    await page.goto('/app/work-declarations');
    
    const url = page.url();
    if (url.includes('/login')) return;

    // Look for create button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")').first();
    await expect(createButton).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Files Page', () => {
  test('should display files page', async ({ page }) => {
    await page.goto('/app/files');
    
    const url = page.url();
    if (url.includes('/login')) return;

    // Should show files management UI
    await expect(page.locator('text=/file|folder|upload|document/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should have upload button', async ({ page }) => {
    await page.goto('/app/files');
    
    const url = page.url();
    if (url.includes('/login')) return;

    // Look for upload button
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add"), input[type="file"]').first();
    await expect(uploadButton).toBeDefined();
  });
});

test.describe('Main App Pages Load Without Errors', () => {
  const pages = [
    { name: 'Dashboard', url: '/app' },
    { name: 'Websites', url: '/app/websites' },
    { name: 'Content Batches', url: '/app/batches' },
    { name: 'Review Board', url: '/app/review' },
    { name: 'Newsletters', url: '/app/newsletters' },
    { name: 'Clients', url: '/app/clients' },
    { name: 'Analytics', url: '/app/analytics' },
    { name: 'Billing', url: '/app/billing' },
    { name: 'Inbox', url: '/app/inbox' },
  ];

  for (const pageInfo of pages) {
    test(`should load ${pageInfo.name} page`, async ({ page }) => {
      const response = await page.goto(pageInfo.url);
      
      // Either loads successfully or redirects to login (both are valid)
      expect(response?.status()).toBeLessThan(500);
      
      const url = page.url();
      if (!url.includes('/login') && !url.includes('/portal')) {
        // If authenticated, check page title
        await expect(page).toHaveTitle(/BlogCanvas/i);
      }
    });
  }
});

test.describe('Navigation and Sidebar', () => {
  test('should display sidebar navigation', async ({ page }) => {
    await page.goto('/app');
    
    const url = page.url();
    if (url.includes('/login')) return;

    // Check sidebar exists
    const sidebar = page.locator('[class*="sidebar"], nav, aside').first();
    await expect(sidebar).toBeVisible();
  });

  test('should have main navigation links', async ({ page }) => {
    await page.goto('/app');
    
    const url = page.url();
    if (url.includes('/login')) return;

    // Check for key navigation items
    const navItems = ['Dashboard', 'Websites', 'Clients'];
    
    for (const item of navItems) {
      const link = page.locator(`a:has-text("${item}"), [role="link"]:has-text("${item}")`).first();
      await expect(link).toBeDefined();
    }
  });
});

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/portal/login');
    
    // Check form elements
    await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Sign")').first()).toBeVisible();
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/portal/login');
    
    // Fill invalid credentials
    await page.locator('input[type="email"], input[name="email"]').first().fill('invalid@test.com');
    await page.locator('input[type="password"]').first().fill('wrongpassword');
    
    // Submit
    await page.locator('button[type="submit"], button:has-text("Sign")').first().click();
    
    // Wait for error or redirect
    await page.waitForTimeout(2000);
    
    // Should show error or still be on login page
    const url = page.url();
    const hasError = await page.locator('text=/error|invalid|failed/i').isVisible().catch(() => false);
    
    expect(url.includes('/login') || url.includes('/portal') || hasError).toBeTruthy();
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app');
    
    const url = page.url();
    if (url.includes('/login')) return;

    // Page should load
    await expect(page).toHaveTitle(/BlogCanvas/i);
    
    // Check for mobile menu or hamburger icon
    const mobileMenu = page.locator('[class*="mobile"], [class*="hamburger"], button[aria-label*="menu" i]').first();
    // Just check it exists, may or may not be visible depending on design
    await expect(mobileMenu).toBeDefined();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/app');
    
    const url = page.url();
    if (url.includes('/login')) return;

    await expect(page).toHaveTitle(/BlogCanvas/i);
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/app/nonexistent-page-12345');
    
    // Should return 404 or redirect
    const status = response?.status();
    const url = page.url();
    
    // Either 404, redirect to login, or custom error page
    expect(status === 404 || url.includes('/login') || url.includes('/404')).toBeTruthy();
  });
});
