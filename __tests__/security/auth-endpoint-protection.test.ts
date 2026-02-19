/**
 * Security Tests: Authentication on Every Endpoint
 *
 * Verifies that all API endpoints properly require authentication
 * and reject unauthenticated requests.
 */

import { describe, it, expect } from '@jest/globals';

describe('Security: Authentication on Every Endpoint', () => {
  const baseUrl = 'http://localhost:4848';

  describe('Blog Posts API', () => {
    it('should reject unauthenticated POST to /api/blog-posts', async () => {
      const response = await fetch(`${baseUrl}/api/blog-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'Test', target_keyword: 'test' })
      });

      expect([401, 403]).toContain(response.status);
    });

    it('should reject unauthenticated PUT to /api/blog-posts/:id', async () => {
      const response = await fetch(`${baseUrl}/api/blog-posts/test-id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'Updated' })
      });

      expect([401, 403, 404]).toContain(response.status);
    });

    it('should reject unauthenticated DELETE to /api/blog-posts/:id', async () => {
      const response = await fetch(`${baseUrl}/api/blog-posts/test-id`, {
        method: 'DELETE'
      });

      expect([401, 403, 404]).toContain(response.status);
    });
  });

  describe('Vendor Clients API', () => {
    it('should reject unauthenticated POST to /api/vendor/clients', async () => {
      const response = await fetch(`${baseUrl}/api/vendor/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', email: 'test@example.com' })
      });

      expect([401, 403]).toContain(response.status);
    });

    it('should reject unauthenticated GET to /api/vendor/clients', async () => {
      const response = await fetch(`${baseUrl}/api/vendor/clients`);

      expect([401, 403]).toContain(response.status);
    });

    it('should reject unauthenticated DELETE to /api/vendor/clients/:id', async () => {
      const response = await fetch(`${baseUrl}/api/vendor/clients/test-id`, {
        method: 'DELETE'
      });

      expect([401, 403, 404]).toContain(response.status);
    });
  });

  describe('Content Batches API', () => {
    it('should reject unauthenticated POST to /api/content-batches', async () => {
      const response = await fetch(`${baseUrl}/api/content-batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Batch' })
      });

      expect([401, 403]).toContain(response.status);
    });

    it('should reject unauthenticated GET to /api/content-batches', async () => {
      const response = await fetch(`${baseUrl}/api/content-batches`);

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Websites API', () => {
    it('should reject unauthenticated POST to /api/websites', async () => {
      const response = await fetch(`${baseUrl}/api/websites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });

      expect([401, 403]).toContain(response.status);
    });

    it('should reject unauthenticated GET to /api/websites', async () => {
      const response = await fetch(`${baseUrl}/api/websites`);

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Offer Pages API', () => {
    it('should reject unauthenticated POST to /api/vendor/offer-pages', async () => {
      const response = await fetch(`${baseUrl}/api/vendor/offer-pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Offer' })
      });

      expect([401, 403, 404]).toContain(response.status);
    });

    it('should reject unauthenticated DELETE to /api/vendor/offer-pages/:id', async () => {
      const response = await fetch(`${baseUrl}/api/vendor/offer-pages/test-id`, {
        method: 'DELETE'
      });

      expect([401, 403, 404]).toContain(response.status);
    });
  });

  describe('Upload Endpoints', () => {
    it('should reject unauthenticated POST to /api/upload', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.txt');

      const response = await fetch(`${baseUrl}/api/upload`, {
        method: 'POST',
        body: formData
      });

      expect([401, 403, 404]).toContain(response.status);
    });
  });

  describe('Newsletters API', () => {
    it('should reject unauthenticated POST to /api/newsletters', async () => {
      const response = await fetch(`${baseUrl}/api/newsletters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'Test' })
      });

      expect([401, 403, 404]).toContain(response.status);
    });
  });

  describe('Profile API', () => {
    it('should reject unauthenticated GET to /api/profile', async () => {
      const response = await fetch(`${baseUrl}/api/profile`);

      expect([401, 403, 404]).toContain(response.status);
    });

    it('should reject unauthenticated PUT to /api/profile', async () => {
      const response = await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' })
      });

      expect([401, 403, 404]).toContain(response.status);
    });
  });

  describe('Dashboard Stats API', () => {
    it('should reject unauthenticated GET to /api/vendor/dashboard/stats', async () => {
      const response = await fetch(`${baseUrl}/api/vendor/dashboard/stats`);

      expect([401, 403, 404]).toContain(response.status);
    });
  });
});
