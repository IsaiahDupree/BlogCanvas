/**
 * Visual Regression Tests
 * VENDOR-WC-021: Screenshot comparison for critical pages
 *
 * Tests visual consistency across:
 * - Dashboard
 * - Client lists
 * - Forms
 * - Settings
 */

import { test, expect } from '@playwright/test';

// Configuration for visual regression
const visualConfig = {
    maxDiffPixels: 100, // Allow small differences
    threshold: 0.2,      // 20% threshold for differences
};

test.describe('Visual Regression Tests', () => {
    test.describe('Dashboard Views', () => {
        test('vendor dashboard matches snapshot', async ({ page }) => {
            // Navigate to login
            await page.goto('/login');

            // Login as vendor (you'll need to create test credentials)
            await page.fill('[name="email"]', process.env.TEST_VENDOR_EMAIL || 'test@vendor.com');
            await page.fill('[name="password"]', process.env.TEST_VENDOR_PASSWORD || 'testpass123');
            await page.click('button[type="submit"]');

            // Wait for dashboard to load
            await page.waitForURL('/dashboard');
            await page.waitForLoadState('networkidle');

            // Take full page screenshot
            await expect(page).toHaveScreenshot('vendor-dashboard.png', {
                fullPage: true,
                ...visualConfig,
            });
        });

        test('client portal dashboard matches snapshot', async ({ page }) => {
            await page.goto('/portal');
            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('client-portal-dashboard.png', {
                fullPage: true,
                ...visualConfig,
            });
        });

        test('analytics dashboard matches snapshot', async ({ page }) => {
            await page.goto('/dashboard/analytics');
            await page.waitForLoadState('networkidle');

            // Wait for charts to render
            await page.waitForSelector('[data-testid="analytics-chart"]', { timeout: 5000 });

            await expect(page).toHaveScreenshot('analytics-dashboard.png', {
                fullPage: true,
                ...visualConfig,
            });
        });
    });

    test.describe('List Views', () => {
        test('clients list matches snapshot', async ({ page }) => {
            await page.goto('/clients');
            await page.waitForLoadState('networkidle');

            // Wait for table to render
            await page.waitForSelector('table', { timeout: 5000 });

            await expect(page).toHaveScreenshot('clients-list.png', {
                fullPage: true,
                ...visualConfig,
            });
        });

        test('blog posts list matches snapshot', async ({ page }) => {
            await page.goto('/blog-posts');
            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('blog-posts-list.png', {
                fullPage: true,
                ...visualConfig,
            });
        });

        test('websites list matches snapshot', async ({ page }) => {
            await page.goto('/websites');
            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('websites-list.png', {
                fullPage: true,
                ...visualConfig,
            });
        });

        test('pipeline view matches snapshot', async ({ page }) => {
            await page.goto('/pipeline');
            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('pipeline-view.png', {
                fullPage: true,
                ...visualConfig,
            });
        });
    });

    test.describe('Forms', () => {
        test('create client form matches snapshot', async ({ page }) => {
            await page.goto('/clients/new');
            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('create-client-form.png', {
                fullPage: true,
                ...visualConfig,
            });
        });

        test('create blog post form matches snapshot', async ({ page }) => {
            await page.goto('/blog-posts/new');
            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('create-blog-post-form.png', {
                fullPage: true,
                ...visualConfig,
            });
        });

        test('client invite form matches snapshot', async ({ page }) => {
            await page.goto('/clients');
            await page.waitForLoadState('networkidle');

            // Click invite button
            await page.click('[data-testid="invite-client-button"]');

            // Wait for modal
            await page.waitForSelector('[role="dialog"]');

            await expect(page).toHaveScreenshot('client-invite-form.png', {
                ...visualConfig,
            });
        });
    });

    test.describe('Settings Pages', () => {
        test('account settings matches snapshot', async ({ page }) => {
            await page.goto('/settings/account');
            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('settings-account.png', {
                fullPage: true,
                ...visualConfig,
            });
        });

        test('billing settings matches snapshot', async ({ page }) => {
            await page.goto('/settings/billing');
            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('settings-billing.png', {
                fullPage: true,
                ...visualConfig,
            });
        });

        test('integrations settings matches snapshot', async ({ page }) => {
            await page.goto('/settings/integrations');
            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('settings-integrations.png', {
                fullPage: true,
                ...visualConfig,
            });
        });

        test('security settings matches snapshot', async ({ page }) => {
            await page.goto('/settings/security');
            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('settings-security.png', {
                fullPage: true,
                ...visualConfig,
            });
        });
    });

    test.describe('Component States', () => {
        test('empty state matches snapshot', async ({ page }) => {
            // Navigate to a page with no data
            await page.goto('/clients?filter=archived');
            await page.waitForLoadState('networkidle');

            // Wait for empty state
            await page.waitForSelector('[data-testid="empty-state"]', { timeout: 5000 });

            await expect(page).toHaveScreenshot('empty-state.png', {
                ...visualConfig,
            });
        });

        test('loading state matches snapshot', async ({ page }) => {
            // Intercept API to delay response
            await page.route('**/api/clients', route => {
                setTimeout(() => route.continue(), 2000);
            });

            await page.goto('/clients');

            // Capture loading state
            await expect(page).toHaveScreenshot('loading-state.png', {
                ...visualConfig,
            });
        });

        test('error state matches snapshot', async ({ page }) => {
            // Intercept API to return error
            await page.route('**/api/clients', route => {
                route.fulfill({
                    status: 500,
                    body: JSON.stringify({ error: 'Internal server error' }),
                });
            });

            await page.goto('/clients');
            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('error-state.png', {
                ...visualConfig,
            });
        });
    });

    test.describe('Responsive Views', () => {
        test('mobile dashboard matches snapshot', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
            await page.goto('/dashboard');
            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('mobile-dashboard.png', {
                fullPage: true,
                ...visualConfig,
            });
        });

        test('tablet dashboard matches snapshot', async ({ page }) => {
            await page.setViewportSize({ width: 768, height: 1024 }); // iPad
            await page.goto('/dashboard');
            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('tablet-dashboard.png', {
                fullPage: true,
                ...visualConfig,
            });
        });

        test('desktop dashboard matches snapshot', async ({ page }) => {
            await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
            await page.goto('/dashboard');
            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('desktop-dashboard.png', {
                fullPage: true,
                ...visualConfig,
            });
        });
    });

    test.describe('Dark Mode', () => {
        test('dark mode dashboard matches snapshot', async ({ page }) => {
            await page.goto('/dashboard');

            // Enable dark mode
            await page.evaluate(() => {
                document.documentElement.classList.add('dark');
            });

            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('dark-mode-dashboard.png', {
                fullPage: true,
                ...visualConfig,
            });
        });

        test('dark mode settings matches snapshot', async ({ page }) => {
            await page.goto('/settings');

            // Enable dark mode
            await page.evaluate(() => {
                document.documentElement.classList.add('dark');
            });

            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot('dark-mode-settings.png', {
                fullPage: true,
                ...visualConfig,
            });
        });
    });
});
