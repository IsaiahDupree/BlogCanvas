/**
 * Real E2E Authentication Tests with Playwright
 * 
 * Tests full auth flows in browser against live Supabase
 */

import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'sashleyblogs@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'thenewaccount123'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848'

test.describe('E2E Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies()
  })

  test('should display login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    
    // Should show validation message
    await expect(page.locator('text=/required|invalid|enter/i')).toBeVisible({ timeout: 5000 })
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    
    // Should show error message
    await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible({ timeout: 10000 })
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    
    // Should redirect to dashboard or app
    await expect(page).toHaveURL(/\/(app|dashboard)/, { timeout: 15000 })
  })

  test('should persist session after login', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    
    await expect(page).toHaveURL(/\/(app|dashboard)/, { timeout: 15000 })
    
    // Refresh page
    await page.reload()
    
    // Should still be on protected page (not redirected to login)
    await expect(page).not.toHaveURL(/\/auth\/login/)
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    
    await expect(page).toHaveURL(/\/(app|dashboard)/, { timeout: 15000 })
    
    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /log ?out|sign ?out/i })
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
    } else {
      // Try menu/dropdown
      await page.click('[data-testid="user-menu"], [aria-label="User menu"], button:has-text("Account")')
      await page.click('text=/log ?out|sign ?out/i')
    }
    
    // Should redirect to login or home
    await expect(page).toHaveURL(/\/(auth\/login|$)/, { timeout: 10000 })
  })

  test('should protect dashboard routes when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/app`)
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/auth/, { timeout: 10000 })
  })
})

test.describe('Client Portal Authentication', () => {
  test('should display client login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/portal/login`)
    
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('should protect client portal routes', async ({ page }) => {
    await page.goto(`${BASE_URL}/portal/dashboard`)
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/(portal\/login|auth)/, { timeout: 10000 })
  })
})

test.describe('2FA Flow', () => {
  test('should show 2FA page if enabled', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    
    // Wait for either dashboard or 2FA page
    await page.waitForURL(/\/(app|dashboard|auth\/2fa)/, { timeout: 15000 })
    
    const url = page.url()
    if (url.includes('2fa')) {
      // 2FA is enabled - verify page elements
      await expect(page.locator('input[type="text"], input[inputmode="numeric"]')).toBeVisible()
    }
  })

  test('should access 2FA settings page when authenticated', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    
    await page.waitForURL(/\/(app|dashboard|auth\/2fa)/, { timeout: 15000 })
    
    // Navigate to 2FA settings
    await page.goto(`${BASE_URL}/app/settings/2fa`)
    
    // Should show 2FA settings
    await expect(page.locator('text=/two.factor|2fa|authenticator/i')).toBeVisible({ timeout: 10000 })
  })
})
