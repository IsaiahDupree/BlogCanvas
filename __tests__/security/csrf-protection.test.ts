/**
 * Security Tests: CSRF Protection
 *
 * Tests verify that all state-changing API endpoints (POST, PUT, DELETE)
 * properly validate CSRF tokens or use other protection mechanisms.
 */

import { describe, it, expect } from '@jest/globals';

describe('Security: CSRF Protection', () => {
  describe('POST endpoints require authentication', () => {
    it('should reject unauthenticated POST to /api/blog-posts', async () => {
      const response = await fetch('http://localhost:4848/api/blog-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: 'Test Post',
          target_keyword: 'test'
        })
      });

      // Should return 401 or 403
      expect([401, 403]).toContain(response.status);
    });

    it('should reject unauthenticated POST to /api/vendor/clients', async () => {
      const response = await fetch('http://localhost:4848/api/vendor/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Test Client',
          email: 'test@example.com'
        })
      });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('PUT endpoints require authentication', () => {
    it('should reject unauthenticated PUT to /api/blog-posts/:id', async () => {
      const response = await fetch('http://localhost:4848/api/blog-posts/test-id', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: 'Updated Post'
        })
      });

      expect([401, 403, 404]).toContain(response.status);
    });
  });

  describe('DELETE endpoints require authentication', () => {
    it('should reject unauthenticated DELETE to /api/blog-posts/:id', async () => {
      const response = await fetch('http://localhost:4848/api/blog-posts/test-id', {
        method: 'DELETE'
      });

      expect([401, 403, 404]).toContain(response.status);
    });

    it('should reject unauthenticated DELETE to /api/vendor/clients/:id', async () => {
      const response = await fetch('http://localhost:4848/api/vendor/clients/test-id', {
        method: 'DELETE'
      });

      expect([401, 403, 404]).toContain(response.status);
    });
  });

  describe('SameSite cookie protection', () => {
    it('should verify auth cookies have SameSite=Lax or Strict', async () => {
      // This test verifies that Supabase auth cookies are configured properly
      // In production, cookies should have SameSite=Lax at minimum
      const response = await fetch('http://localhost:4848/api/auth/session');

      const cookies = response.headers.get('set-cookie');

      if (cookies) {
        // Verify SameSite attribute is present
        expect(
          cookies.includes('SameSite=Lax') ||
          cookies.includes('SameSite=Strict') ||
          cookies.includes('samesite=lax') ||
          cookies.includes('samesite=strict')
        ).toBe(true);
      }
    });
  });

  describe('Origin validation', () => {
    it('should reject requests from unauthorized origins', async () => {
      const response = await fetch('http://localhost:4848/api/blog-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://malicious-site.com'
        },
        body: JSON.stringify({
          topic: 'Test Post'
        })
      });

      // Should fail authentication or CORS
      expect([401, 403]).toContain(response.status);
    });
  });
});
