
import { test, expect } from '@playwright/test';

test.describe('Mobile Layout', () => {
    // Use Mobile Safari device for these tests
    test.use({ viewport: { width: 375, height: 667 } });

    test('should stack stats cards on mobile', async ({ page }) => {
        await page.goto('/app');
        await page.waitForLoadState('networkidle');

        // Wait for the stats cards to load
        await page.waitForSelector('text=Websites', { timeout: 10000 });

        // Find stats cards by looking for the stat container grid
        const statsGrid = page.locator('div.grid').first();
        await statsGrid.waitFor();

        // Get all the cards within the grid
        const cards = statsGrid.locator('> div');
        const cardCount = await cards.count();

        // Verify we have cards
        expect(cardCount).toBeGreaterThan(0);

        // Get positions of first two cards
        const card1 = cards.nth(0);
        const card2 = cards.nth(1);

        const box1 = await card1.boundingBox();
        const box2 = await card2.boundingBox();

        if (box1 && box2) {
            // In mobile view (375px), cards should stack vertically
            // Card 2 should be below card 1
            expect(box2.y).toBeGreaterThan(box1.y);

            // They should have similar x coordinates (stacked vertically)
            // Allowing for some margin/padding
            expect(Math.abs(box1.x - box2.x)).toBeLessThan(50);
        } else {
            throw new Error('Could not get bounding boxes for stats cards');
        }

        // Capture screenshot for evidence
        await page.screenshot({ path: 'test-results/mobile-layout-verified.png', fullPage: true });
    });
});
