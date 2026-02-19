
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (Cross-Platform)', () => {
    // Pages to test
    const pages = [
        { name: 'Landing Page', path: '/' },
        { name: 'Login Page', path: '/portal/login' },
        { name: 'Dashboard', path: '/app/dashboard' },
        { name: 'Clients Page', path: '/app/clients' },
        { name: 'Posts Page', path: '/app/posts' },
        { name: 'Settings Page', path: '/app/settings' },
    ];

    for (const { name, path } of pages) {
        test(`should have no critical or serious violations on ${name}`, async ({ page }) => {
            await page.goto(path);

            // Wait for content to load
            await page.waitForLoadState('networkidle');

            const accessibilityScanResults = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                .analyze();

            // Filter for critical and serious violations only
            const criticalViolations = accessibilityScanResults.violations.filter(
                v => v.impact === 'critical' || v.impact === 'serious'
            );

            // Log violations if any
            if (criticalViolations.length > 0) {
                console.log(`\nCritical/Serious Accessibility Violations on ${name} (${path}):`);
                criticalViolations.forEach(violation => {
                    console.log(`- [${violation.impact}] ${violation.id}: ${violation.help}`);
                    violation.nodes.forEach(node => {
                        console.log(`  Selector: ${node.target}`);
                    });
                });
            }

            // Only fail on critical and serious violations
            expect(criticalViolations).toEqual([]);
        });
    }

    test('should have correct ARIA attributes on interactive elements', async ({ page }) => {
        await page.goto('/');

        // Wait for content
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        // Check specifically for ARIA violations
        const ariaViolations = accessibilityScanResults.violations.filter(
            v => v.id.includes('aria')
        );

        expect(ariaViolations.length).toBe(0);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
        await page.goto('/');

        // Wait for content
        await page.waitForLoadState('networkidle');

        const headings = await page.evaluate(() => {
            const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            return headingElements.map(h => ({
                tag: h.tagName,
                text: h.textContent?.trim().substring(0, 50)
            }));
        });

        // Should have at least one h1
        const h1Count = headings.filter(h => h.tag === 'H1').length;
        expect(h1Count).toBeGreaterThanOrEqual(1);

        // Should not have more than one h1 (best practice)
        expect(h1Count).toBeLessThanOrEqual(1);
    });

    test('should have alt text on all images', async ({ page }) => {
        await page.goto('/');

        // Wait for content
        await page.waitForLoadState('networkidle');

        const imagesWithoutAlt = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img'));
            return images.filter(img => !img.hasAttribute('alt')).length;
        });

        // All images should have alt attribute (even if empty for decorative images)
        expect(imagesWithoutAlt).toBe(0);
    });

    test('should have proper form labels', async ({ page }) => {
        await page.goto('/portal/login');

        // Wait for content
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a'])
            .analyze();

        // Check for label violations
        const labelViolations = accessibilityScanResults.violations.filter(
            v => v.id.includes('label')
        );

        expect(labelViolations.length).toBe(0);
    });
});
