
import { test, expect } from '@playwright/test';

test.describe('Mobile Layout', () => {
    // Use Mobile Safari device for these tests
    test.use({ viewport: { width: 375, height: 667 } });

    test('should stack stats cards on mobile', async ({ page }) => {
        await page.goto('/');

        // Use text locator which is more robust than class names
        // Find the card containing "Total Blog Posts"
        const totalPostsCard = page.locator('div:has-text("Total Blog Posts")').locator('..').locator('..').first();
        // Text -> p -> div (card content) -> div (card)
        // Wait for it
        await totalPostsCard.waitFor();

        // Find the card containing "published" (case insensitive usually but let's be approximate)
        const publishedCard = page.locator('div:has-text("Published")').locator('..').locator('..').first();

        const card1 = await totalPostsCard.boundingBox();
        const card2 = await publishedCard.boundingBox();

        if (card1 && card2) {
            // In mobile stack, card 2 should be below card 1
            expect(card2.y).toBeGreaterThan(card1.y);

            // Also they should have similar x coordinates (stacked vertically)
            // Allowing for some margin error
            expect(Math.abs(card1.x - card2.x)).toBeLessThan(50);
        } else {
            // If we can't find bounds, logging for debug but failing test
            throw new Error('Could not get bounding boxes for stats cards');
        }

        // Capture screenshot for evidence
        await page.screenshot({ path: 'mobile-layout-verified.png', fullPage: true });
    });
});
