
import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation', () => {
    // Use Mobile Safari
    test.use({ viewport: { width: 375, height: 667 } });

    test('should toggle sidebar on mobile', async ({ page }) => {
        await page.goto('/app');

        // Check if hamburger menu is visible
        const menuButton = page.locator('button:has(svg.lucide-menu)');
        // Note: Icon might just be an svg, checking generic button in header

        await expect(menuButton).toBeVisible();

        // Sidebar should be initially hidden (off-screen)
        // We check this by checking if it is mostly off-screen or has the transform class
        const sidebar = page.locator('div.fixed.inset-y-0.left-0.z-40');

        // Initial state: -translate-x-full
        await expect(sidebar).toHaveClass(/-translate-x-full/);

        // Click menu to open
        await menuButton.click();

        // Sidebar should now be visible (translate-x-0)
        await expect(sidebar).toHaveClass(/translate-x-0/);

        // Overlay should be present
        const overlay = page.locator('.fixed.inset-0.bg-black\\/50');
        await expect(overlay).toBeVisible();

        // Click overlay to close
        await overlay.click();

        // Sidebar should be hidden again
        await expect(sidebar).toHaveClass(/-translate-x-full/);
    });

    test('should hide menu button on desktop', async ({ page }) => {
        // Override viewport for desktop
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/app');

        const menuButton = page.locator('button:has(svg.lucide-menu)');
        await expect(menuButton).toBeHidden();
    });
});
