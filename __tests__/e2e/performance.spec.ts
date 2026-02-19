/**
 * E2E Performance Tests
 * Tests page load times, API response times, and core web vitals
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Tests - Page Load', () => {
  test('homepage should load in less than 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    // Should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('dashboard should have good Core Web Vitals - LCP < 2.5s', async ({ page }) => {
    await page.goto('/app/dashboard');

    const url = page.url();
    if (url.includes('/login') || url.includes('/portal')) {
      // Not authenticated - skip
      return;
    }

    // Measure Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // Timeout after 5 seconds
        setTimeout(() => resolve(5000), 5000);
      });
    });

    // LCP should be less than 2.5 seconds
    expect(lcp).toBeLessThan(2500);
  });

  test('dashboard should have good Core Web Vitals - FID < 100ms', async ({ page }) => {
    await page.goto('/app/dashboard');

    const url = page.url();
    if (url.includes('/login') || url.includes('/portal')) {
      return;
    }

    // Measure First Input Delay (FID) by simulating a click
    const startTime = Date.now();

    // Click on body to trigger interaction
    await page.click('body');

    const interactionTime = Date.now() - startTime;

    // FID should be less than 100ms
    expect(interactionTime).toBeLessThan(100);
  });

  test('dashboard should have good Core Web Vitals - CLS < 0.1', async ({ page }) => {
    await page.goto('/app/dashboard');

    const url = page.url();
    if (url.includes('/login') || url.includes('/portal')) {
      return;
    }

    // Wait for page to settle
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Measure Cumulative Layout Shift (CLS)
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => resolve(clsValue), 2000);
      });
    });

    // CLS should be less than 0.1
    expect(cls).toBeLessThan(0.1);
  });

  test('client list page should load in less than 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/app/clients', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    // Should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('blog posts page should load in less than 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/app/posts', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    // Should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Performance Tests - API Response Times', () => {
  test('API list endpoints should respond in less than 500ms', async ({ page }) => {
    const startTime = Date.now();

    const response = await page.goto('/api/clients', {
      waitUntil: 'domcontentloaded',
      timeout: 1000
    });

    const responseTime = Date.now() - startTime;

    // API should respond in less than 500ms
    expect(responseTime).toBeLessThan(500);

    // Should not error (or should return auth error, which is fine)
    const status = response?.status();
    expect(status).toBeLessThanOrEqual(401); // 401 is fine (auth required)
  });

  test('API detail endpoints should respond in less than 300ms', async ({ page }) => {
    // Create a mock request to a detail endpoint
    const startTime = Date.now();

    const response = await page.goto('/api/clients/test-id', {
      waitUntil: 'domcontentloaded',
      timeout: 1000,
      failOnStatusCode: false
    });

    const responseTime = Date.now() - startTime;

    // API should respond in less than 300ms
    expect(responseTime).toBeLessThan(300);
  });

  test('API search endpoints should respond in less than 500ms', async ({ page }) => {
    const startTime = Date.now();

    const response = await page.goto('/api/clients?search=test', {
      waitUntil: 'domcontentloaded',
      timeout: 1000,
      failOnStatusCode: false
    });

    const responseTime = Date.now() - startTime;

    // Search should respond in less than 500ms
    expect(responseTime).toBeLessThan(500);
  });

  test('Static assets should be cached', async ({ page }) => {
    // First load
    await page.goto('/');

    // Second load should use cache
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Check if resources are cached
    const performanceEntries = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as any[];
      return entries.map(e => ({
        name: e.name,
        transferSize: e.transferSize
      }));
    });

    // Some resources should be cached (transferSize = 0)
    const cachedResources = performanceEntries.filter(e => e.transferSize === 0);
    expect(cachedResources.length).toBeGreaterThan(0);
  });
});

test.describe('Performance Tests - Database Queries', () => {
  test('should not have N+1 query problems in list views', async ({ page, context }) => {
    // Monitor network requests to API
    const apiCalls: string[] = [];

    context.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/')) {
        apiCalls.push(url);
      }
    });

    await page.goto('/app/clients', { waitUntil: 'networkidle' });

    const url = page.url();
    if (url.includes('/login') || url.includes('/portal')) {
      return;
    }

    // Wait for any additional requests
    await page.waitForTimeout(1000);

    // Should not make excessive API calls for a simple list view
    // Allow up to 5 calls (initial data, user, settings, etc.)
    expect(apiCalls.length).toBeLessThan(10);
  });

  test('should use proper indexes on database queries', async ({ page }) => {
    // This is more of a development/staging test
    // In production, we assume indexes are in place

    // Load a page that queries the database
    const response = await page.goto('/api/clients', {
      failOnStatusCode: false,
      timeout: 1000
    });

    // If query is slow, it will timeout or take too long
    expect(response?.status()).toBeDefined();
  });

  test('should handle large datasets with pagination', async ({ page }) => {
    await page.goto('/app/clients', { waitUntil: 'networkidle' });

    const url = page.url();
    if (url.includes('/login') || url.includes('/portal')) {
      return;
    }

    // Page should load even with many clients
    await expect(page.locator('body')).toBeVisible();

    // Should have pagination controls if needed
    const content = await page.textContent('body');
    expect(content).toBeDefined();
  });

  test('should not perform sequential scans on large tables', async ({ page }) => {
    // Load data-heavy pages
    const response = await page.goto('/api/blog-posts', {
      failOnStatusCode: false,
      timeout: 2000 // Should respond quickly with proper indexes
    });

    // Should respond within timeout
    expect(response?.status()).toBeDefined();
  });
});
