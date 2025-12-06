
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (Cross-Platform)', () => {
    // Pages to test
    const pages = [
        { name: 'Landing Page', path: '/' },
        { name: 'Login Page', path: '/portal/login' },
        // Add authenticated routes if we mock auth, but sticking to public/login for now
    ];

    for (const { name, path } of pages) {
        test(`should have no automatically detectable violations on ${name}`, async ({ page }) => {
            await page.goto(path);

            // Wait for content to load
            await page.waitForLoadState('networkidle');

            const accessibilityScanResults = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                .analyze();

            // Log violations if any
            if (accessibilityScanResults.violations.length > 0) {
                console.log(`\nAccessibility Violations on ${name} (${path}):`);
                accessibilityScanResults.violations.forEach(violation => {
                    console.log(`- [${violation.impact}] ${violation.id}: ${violation.help}`);
                    violation.nodes.forEach(node => {
                        console.log(`  Selector: ${node.target}`);
                    });
                });
            }

            expect(accessibilityScanResults.violations).toEqual([]);
        });
    }
});
