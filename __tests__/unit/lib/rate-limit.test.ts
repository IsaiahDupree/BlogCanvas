/**
 * Unit Tests: Rate Limiting
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import rateLimiter, { checkRateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Reset all rate limiter state before each test
    // We need to reset all possible test identifiers
    rateLimiter.reset('test-user');
    rateLimiter.reset('user-1');
    rateLimiter.reset('user-2');
    rateLimiter.reset('user-3');
  });

  describe('Basic rate limiting', () => {
    it('should allow requests within limit', () => {
      const result1 = checkRateLimit('test-user', 5, 60000);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = checkRateLimit('test-user', 5, 60000);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it('should block requests exceeding limit', () => {
      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        checkRateLimit('test-user', 5, 60000);
      }

      // 6th request should be blocked
      const result = checkRateLimit('test-user', 5, 60000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after time window expires', async () => {
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        checkRateLimit('test-user', 5, 100);
      }

      // Should be blocked
      let result = checkRateLimit('test-user', 5, 100);
      expect(result.allowed).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be allowed again
      result = checkRateLimit('test-user', 5, 100);
      expect(result.allowed).toBe(true);
    }, 10000);

    it('should track different identifiers separately', () => {
      const result1 = checkRateLimit('user-1', 5, 60000);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = checkRateLimit('user-2', 5, 60000);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(4);

      // Different users have independent limits
      expect(result1.remaining).toBe(result2.remaining);
    });
  });

  describe('Rate limit headers', () => {
    it('should include rate limit headers', () => {
      const result = checkRateLimit('test-user', 100, 60000);

      expect(result.headers).toHaveProperty('X-RateLimit-Limit');
      expect(result.headers).toHaveProperty('X-RateLimit-Remaining');
      expect(result.headers).toHaveProperty('X-RateLimit-Reset');

      expect(result.headers['X-RateLimit-Limit']).toBe('100');
      expect(parseInt(result.headers['X-RateLimit-Remaining'])).toBeLessThan(100);
    });

    it('should update remaining count correctly', () => {
      const result1 = checkRateLimit('test-user', 10, 60000);
      expect(result1.headers['X-RateLimit-Remaining']).toBe('9');

      const result2 = checkRateLimit('test-user', 10, 60000);
      expect(result2.headers['X-RateLimit-Remaining']).toBe('8');
    });
  });

  describe('Rate limit presets', () => {
    it('should have strict auth rate limit', () => {
      expect(RateLimitPresets.AUTH.maxRequests).toBe(5);
      expect(RateLimitPresets.AUTH.windowMs).toBe(15 * 60 * 1000);
    });

    it('should have very strict password reset limit', () => {
      expect(RateLimitPresets.PASSWORD_RESET.maxRequests).toBe(3);
      expect(RateLimitPresets.PASSWORD_RESET.windowMs).toBe(60 * 60 * 1000);
    });

    it('should have moderate API limit', () => {
      expect(RateLimitPresets.API.maxRequests).toBe(100);
      expect(RateLimitPresets.API.windowMs).toBe(60 * 1000);
    });

    it('should have lenient public page limit', () => {
      expect(RateLimitPresets.PUBLIC.maxRequests).toBe(300);
      expect(RateLimitPresets.PUBLIC.windowMs).toBe(60 * 1000);
    });
  });

  describe('Client identifier extraction', () => {
    it('should extract IP from x-forwarded-for', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
            return null;
          }
        }
      } as unknown as Request;

      const identifier = getClientIdentifier(mockRequest);
      expect(identifier).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-real-ip') return '192.168.1.2';
            return null;
          }
        }
      } as unknown as Request;

      const identifier = getClientIdentifier(mockRequest);
      expect(identifier).toBe('192.168.1.2');
    });

    it('should return unknown for missing headers', () => {
      const mockRequest = {
        headers: {
          get: () => null
        }
      } as unknown as Request;

      const identifier = getClientIdentifier(mockRequest);
      expect(identifier).toBe('unknown');
    });
  });

  describe('Rate limiter stats', () => {
    it('should track number of identifiers', () => {
      checkRateLimit('user-1', 10, 60000);
      checkRateLimit('user-2', 10, 60000);
      checkRateLimit('user-3', 10, 60000);

      const stats = rateLimiter.getStats();
      expect(stats.totalTracked).toBeGreaterThanOrEqual(3);
    });
  });
});
