/**
 * Authentication Helper for E2E Tests
 * Provides mock authentication for Playwright tests
 */

import { Page } from '@playwright/test';

export interface TestUser {
    id: string;
    email: string;
    role: 'owner' | 'staff' | 'client_admin' | 'client_reviewer';
    vendorId?: string;
    clientId?: string;
}

/**
 * Mock vendor user for testing
 */
export const MOCK_VENDOR_USER: TestUser = {
    id: 'test-vendor-user-id',
    email: 'vendor@test.com',
    role: 'owner',
    vendorId: 'test-vendor-id'
};

/**
 * Mock client user for testing
 */
export const MOCK_CLIENT_USER: TestUser = {
    id: 'test-client-user-id',
    email: 'client@test.com',
    role: 'client_admin',
    clientId: 'test-client-id'
};

/**
 * Setup mock authentication by injecting session cookies/localStorage
 * This bypasses the actual Supabase authentication for testing
 */
export async function setupMockAuth(page: Page, user: TestUser = MOCK_VENDOR_USER) {
    // Navigate to a page first to set cookies
    await page.goto('/');

    // Mock Supabase session in localStorage
    const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            app_metadata: {
                provider: 'email',
                role: user.role
            },
            user_metadata: {
                vendor_id: user.vendorId,
                client_id: user.clientId
            }
        }
    };

    // Set session in localStorage (Supabase Auth uses this)
    await page.evaluate((session) => {
        const key = 'sb-' + window.location.host.split('.')[0] + '-auth-token';
        localStorage.setItem(key, JSON.stringify(session));
    }, mockSession);

    // Also set auth cookies if needed
    await page.context().addCookies([
        {
            name: 'sb-access-token',
            value: 'mock-access-token',
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax'
        }
    ]);
}

/**
 * Clear authentication
 */
export async function clearAuth(page: Page) {
    await page.goto('/');

    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    await page.context().clearCookies();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
        const keys = Object.keys(localStorage);
        return keys.some(key => key.includes('auth-token'));
    });
}
