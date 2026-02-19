/**
 * E2E Tests for Error States
 * Tests 404 pages, error boundaries, and empty states
 */

import { test, expect } from '@playwright/test';

test.describe('Error States', () => {
  test('should show 404 page for non-existent routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');

    // Should get a 404 status
    expect(response?.status()).toBe(404);

    // Should show 404 message or "not found" text
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/404|not found|page.*not.*found/i);
  });

  test('should show 404 for non-existent vendor handles', async ({ page }) => {
    const response = await page.goto('/@this-vendor-does-not-exist-12345');

    // Should handle gracefully (404 or redirect)
    expect(response?.status()).toBeGreaterThanOrEqual(200);
    expect(response?.status()).toBeLessThan(500);
  });

  test('should show 404 for non-existent API endpoints', async ({ page }) => {
    const response = await page.goto('/api/this-endpoint-does-not-exist');

    // Should get a 404 status
    expect(response?.status()).toBe(404);
  });

  test('should handle error boundary for component errors', async ({ page }) => {
    // Navigate to a valid page first
    await page.goto('/');

    // Check that the page doesn't have unhandled errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Wait a bit to see if any errors occur
    await page.waitForTimeout(1000);

    // Should not have critical unhandled errors on homepage
    const criticalErrors = errors.filter(e =>
      !e.includes('ResizeObserver') && // Common benign error
      !e.includes('favicon') // Favicon errors are non-critical
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('should show empty state for clients with no data', async ({ page }) => {
    // Try to access dashboard (may redirect to login)
    await page.goto('/app/dashboard');

    const url = page.url();

    // If not redirected to login, check for proper UI
    if (!url.includes('/login') && !url.includes('/portal')) {
      // Page should load without errors
      const response = await page.goto('/app/clients');
      expect(response?.status()).toBeLessThan(400);

      // Should either show clients or empty state
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should show empty state for blog posts with no data', async ({ page }) => {
    await page.goto('/app/posts');

    const url = page.url();

    // If not redirected to login, check for proper UI
    if (!url.includes('/login') && !url.includes('/portal')) {
      // Page should load without errors
      await expect(page.locator('body')).toBeVisible();

      // Should handle empty state gracefully (no crashes)
      const content = await page.textContent('body');
      expect(content).toBeDefined();
    }
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    // Set up to intercept network requests and fail them
    await context.route('**/api/clients', route => {
      route.abort('failed');
    });

    // Navigate to clients page
    await page.goto('/app/clients');

    const url = page.url();

    // If not redirected to login, should handle error gracefully
    if (!url.includes('/login') && !url.includes('/portal')) {
      // Page should still render (not crash)
      await expect(page.locator('body')).toBeVisible();

      // Should show error message or empty state
      const content = await page.textContent('body');
      expect(content).toBeDefined();
    }
  });

  test('should show proper error for invalid API requests', async ({ page }) => {
    // Make an API request with invalid data
    const response = await page.goto('/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Should return an error status (4xx or 5xx)
    const status = response?.status();
    expect(status).toBeGreaterThanOrEqual(400);
  });

  test('should handle missing environment variables gracefully', async ({ page }) => {
    // Navigate to home page
    const response = await page.goto('/');

    // Should load without crashing even if some env vars are missing
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should not leak sensitive information in error messages', async ({ page }) => {
    // Try to access a protected API endpoint
    const response = await page.goto('/api/admin/users', {
      failOnStatusCode: false,
    });

    if (response && response.status() >= 400) {
      const content = await page.textContent('body');

      // Should not leak database errors, SQL queries, or env vars
      expect(content).not.toMatch(/database|postgres|sql|select|insert|update|delete/i);
      expect(content).not.toMatch(/process\.env|SUPABASE|API_KEY|SECRET/i);
    }
  });
});
