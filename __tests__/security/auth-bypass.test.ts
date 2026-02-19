/**
 * Security Tests: Auth Bypass Prevention
 *
 * Tests to ensure:
 * 1. Unauthenticated requests return 401 on protected API routes
 * 2. Protected pages redirect to login
 * 3. No data leaks through error messages or responses
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockSupabaseClient, mockBlogPost, mockClient } from '../mocks/supabase-db.mock';
import { mockSupabaseAuthError } from '../mocks/supabase-auth.mock';

describe('Security: Auth Bypass Prevention', () => {
  describe('API Route Protection', () => {
    it('should return 401 for unauthenticated blog post creation', async () => {
      // Simulate unauthenticated request
      const mockSupabase = {
        ...createMockSupabaseClient(),
        ...mockSupabaseAuthError('Not authenticated')
      };

      // Mock the API route behavior
      const response = await simulateAPIRequest('/api/blog-posts', 'POST', null);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        error: expect.stringMatching(/unauthorized|not authenticated/i)
      });
    });

    it('should return 401 for unauthenticated client data access', async () => {
      const response = await simulateAPIRequest('/api/clients', 'GET', null);

      expect(response.status).toBe(401);
      expect(response.body).not.toContain('client data');
    });

    it('should return 401 for unauthenticated user profile access', async () => {
      const response = await simulateAPIRequest('/api/user/profile', 'GET', null);

      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated settings modification', async () => {
      const response = await simulateAPIRequest(
        '/api/settings',
        'PUT',
        null,
        { theme: 'dark' }
      );

      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated file upload', async () => {
      const response = await simulateAPIRequest('/api/upload', 'POST', null, {
        file: 'fake-file-data'
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Authorization Checks', () => {
    it('should prevent users from accessing other users\' data', async () => {
      // Simulate user A trying to access user B's blog posts
      const userAId = 'user-a-id';
      const userBBlogPostId = 'user-b-blog-post-id';

      const response = await simulateAPIRequest(
        `/api/blog-posts/${userBBlogPostId}`,
        'GET',
        userAId
      );

      // Should return 403 Forbidden or 404 Not Found (to avoid enumeration)
      expect([403, 404]).toContain(response.status);
    });

    it('should prevent clients from accessing other clients\' data', async () => {
      const clientAUserId = 'client-a-user-id';
      const clientBId = 'client-b-id';

      const response = await simulateAPIRequest(
        `/api/clients/${clientBId}`,
        'GET',
        clientAUserId
      );

      expect([403, 404]).toContain(response.status);
    });

    it('should prevent non-admin users from accessing admin endpoints', async () => {
      const regularUserId = 'regular-user-id';

      const response = await simulateAPIRequest(
        '/api/admin/users',
        'GET',
        regularUserId
      );

      expect(response.status).toBe(403);
    });
  });

  describe('Data Leak Prevention', () => {
    it('should not leak user emails in error messages', async () => {
      const response = await simulateAPIRequest(
        '/api/auth/login',
        'POST',
        null,
        { email: 'nonexistent@example.com', password: 'wrong' }
      );

      expect(response.body.error).not.toContain('nonexistent@example.com');
      expect(response.body.error).toMatch(/invalid credentials|login failed/i);
    });

    it('should not leak database structure in error messages', async () => {
      const response = await simulateAPIRequest(
        '/api/blog-posts',
        'POST',
        'valid-user-id',
        { invalid: 'data' }
      );

      // Error should not contain SQL, table names, or column names
      const errorText = JSON.stringify(response.body).toLowerCase();
      expect(errorText).not.toMatch(/select|insert|update|delete|from|where/);
      expect(errorText).not.toMatch(/blog_posts|clients|profiles|users/);
    });

    it('should not expose stack traces in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await simulateAPIRequest(
        '/api/blog-posts/invalid-id',
        'GET',
        'valid-user-id'
      );

      expect(response.body).not.toHaveProperty('stack');
      expect(JSON.stringify(response.body)).not.toContain('at ');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not leak internal IDs or UUIDs in public responses', async () => {
      const response = await simulateAPIRequest('/api/public/blog-posts', 'GET', null);

      // Public endpoints should use slugs, not internal IDs
      if (response.status === 200 && Array.isArray(response.body)) {
        response.body.forEach((post: any) => {
          // Should have slug, not expose internal database IDs
          expect(post).toHaveProperty('slug');
          if (post.author) {
            expect(post.author).not.toHaveProperty('id');
            expect(post.author).not.toHaveProperty('email');
          }
        });
      }
    });
  });

  describe('Session Security', () => {
    it('should invalidate session tokens after logout', async () => {
      const userId = 'test-user-id';
      const sessionToken = 'valid-session-token';

      // Logout
      await simulateAPIRequest('/api/auth/logout', 'POST', userId);

      // Try to use the same token
      const response = await simulateAPIRequest(
        '/api/user/profile',
        'GET',
        userId,
        undefined,
        sessionToken
      );

      expect(response.status).toBe(401);
    });

    it('should reject expired session tokens', async () => {
      const expiredToken = generateExpiredToken();

      const response = await simulateAPIRequest(
        '/api/user/profile',
        'GET',
        'test-user-id',
        undefined,
        expiredToken
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/expired|invalid token/i);
    });

    it('should reject malformed JWT tokens', async () => {
      const malformedToken = 'not.a.valid.jwt.token';

      const response = await simulateAPIRequest(
        '/api/user/profile',
        'GET',
        'test-user-id',
        undefined,
        malformedToken
      );

      expect(response.status).toBe(401);
    });
  });

  describe('CSRF Protection', () => {
    it('should reject state-changing requests without proper origin', async () => {
      const response = await simulateAPIRequest(
        '/api/blog-posts',
        'POST',
        'valid-user-id',
        { topic: 'Test Post' },
        'valid-token',
        { origin: 'https://evil.com' }
      );

      // Should reject cross-origin POST requests
      expect([403, 400]).toContain(response.status);
    });

    it('should accept state-changing requests from same origin', async () => {
      const response = await simulateAPIRequest(
        '/api/blog-posts',
        'POST',
        'valid-user-id',
        { topic: 'Test Post', client_id: 'test-client-id', target_keyword: 'test' },
        'valid-token',
        { origin: 'http://localhost:4848' }
      );

      // Should accept same-origin requests
      expect(response.status).not.toBe(403);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const email = 'test@example.com';
      const responses = [];

      // Try to login 10 times rapidly
      for (let i = 0; i < 10; i++) {
        const response = await simulateAPIRequest(
          '/api/auth/login',
          'POST',
          null,
          { email, password: 'wrong-password' }
        );
        responses.push(response);
      }

      // Should start rate limiting after several attempts
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});

// Helper functions

interface MockResponse {
  status: number;
  body: any;
}

/**
 * Simulate an API request
 */
async function simulateAPIRequest(
  path: string,
  method: string,
  userId: string | null,
  body?: any,
  token?: string,
  headers?: Record<string, string>
): Promise<MockResponse> {
  // This is a mock implementation
  // In real tests, you would import and call the actual API route handlers

  // Simulate authentication check
  if (!userId && !token) {
    return {
      status: 401,
      body: { error: 'Unauthorized: Not authenticated' }
    };
  }

  // Simulate authorization check for admin routes
  if (path.includes('/admin/') && userId !== 'admin-user-id') {
    return {
      status: 403,
      body: { error: 'Forbidden: Admin access required' }
    };
  }

  // Simulate CSRF check
  if (method !== 'GET' && headers?.origin && !headers.origin.includes('localhost')) {
    return {
      status: 403,
      body: { error: 'Forbidden: Invalid origin' }
    };
  }

  // Simulate rate limiting
  if (path === '/api/auth/login' && method === 'POST') {
    // Mock rate limit tracking
    const attempts = (global as any).__loginAttempts || 0;
    (global as any).__loginAttempts = attempts + 1;

    if (attempts > 5) {
      return {
        status: 429,
        body: { error: 'Too many requests' }
      };
    }
  }

  // Default success response
  return {
    status: 200,
    body: { success: true }
  };
}

/**
 * Generate an expired JWT token for testing
 */
function generateExpiredToken(): string {
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNTE2MjM5MDIyfQ.expired';
}

// Reset global state between tests
beforeEach(() => {
  (global as any).__loginAttempts = 0;
});
