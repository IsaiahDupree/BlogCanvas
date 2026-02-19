/**
 * Rate Limiting Utility
 *
 * Provides rate limiting functionality for API endpoints to prevent abuse.
 * Uses in-memory storage for simplicity. For production at scale, consider Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.limits = new Map();

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a request should be rate limited
   *
   * @param identifier - Unique identifier (e.g., IP address, user ID)
   * @param maxRequests - Maximum requests allowed in the window
   * @param windowMs - Time window in milliseconds
   * @returns Object with allowed status and remaining requests
   */
  check(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    // No entry exists or entry has expired
    if (!entry || entry.resetAt < now) {
      this.limits.set(identifier, {
        count: 1,
        resetAt: now + windowMs
      });

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: now + windowMs
      };
    }

    // Entry exists and is still valid
    if (entry.count < maxRequests) {
      entry.count++;
      return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetAt: entry.resetAt
      };
    }

    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string): void {
    this.limits.delete(identifier);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetAt < now) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Get current stats (for monitoring)
   */
  getStats(): { totalTracked: number } {
    return {
      totalTracked: this.limits.size
    };
  }

  /**
   * Cleanup interval on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit presets for common use cases
 */
export const RateLimitPresets = {
  // Authentication endpoints (strict)
  AUTH: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes

  // Password reset (very strict)
  PASSWORD_RESET: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour

  // General API endpoints (moderate)
  API: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute

  // Public pages (lenient)
  PUBLIC: { maxRequests: 300, windowMs: 60 * 1000 }, // 300 requests per minute

  // File uploads (strict)
  UPLOAD: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 uploads per minute

  // Webhook endpoints (lenient)
  WEBHOOK: { maxRequests: 1000, windowMs: 60 * 1000 } // 1000 requests per minute
};

/**
 * Get client identifier from request
 * Uses IP address as the primary identifier
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Check rate limit and return appropriate response if exceeded
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  headers: Record<string, string>;
} {
  const result = rateLimiter.check(identifier, maxRequests, windowMs);

  return {
    ...result,
    headers: {
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetAt).toISOString()
    }
  };
}

/**
 * Reset rate limit for an identifier
 */
export function resetRateLimit(identifier: string): void {
  rateLimiter.reset(identifier);
}

export default rateLimiter;
