
import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation', () => {
    // Use Mobile Safari
    test.use({ viewport: { width: 375, height: 667 } });

    test('should toggle sidebar on mobile', async ({ page }) => {
        await page.goto('/app');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check if hamburger menu is visible (using aria-label)
        const menuButton = page.locator('button[aria-label="Open sidebar"]');
        await expect(menuButton).toBeVisible({ timeout: 10000 });

        // Sidebar should be initially hidden (off-screen)
        const sidebar = page.locator('aside').filter({ hasText: 'BlogCanvas' });

        // Initial state: -translate-x-full
        await expect(sidebar).toHaveClass(/-translate-x-full/);

        // Click menu to open
        await menuButton.click();
        await page.waitForTimeout(500); // Wait for animation

        // Sidebar should now be visible (translate-x-0)
        await expect(sidebar).toHaveClass(/translate-x-0/);

        // Overlay should be present
        const overlay = page.locator('div.fixed.inset-0.bg-black\\/50');
        await expect(overlay).toBeVisible();

        // Click overlay to close
        await overlay.click();
        await page.waitForTimeout(500); // Wait for animation

        // Sidebar should be hidden again
        await expect(sidebar).toHaveClass(/-translate-x-full/);
    });

    test('should hide menu button on desktop', async ({ page }) => {
        // Override viewport for desktop
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/app');
        await page.waitForLoadState('networkidle');

        // On desktop, the hamburger button should be hidden (has lg:hidden class)
        const menuButton = page.locator('button[aria-label="Open sidebar"]');
        await expect(menuButton).toBeHidden();
    });
});
