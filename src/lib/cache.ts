/**
 * In-Memory Cache Utility
 * feat-053: Performance optimization
 *
 * Simple in-memory cache for API responses and expensive computations.
 * For production, consider using Redis or a distributed cache.
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

class InMemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 1000; // 1000 items default
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Enforce max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const useTTL = ttl || this.defaultTTL;
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + useTTL,
      createdAt: Date.now(),
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    defaultTTL: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Remove expired entries (garbage collection)
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const value = await fetcher();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    let removed = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// Global cache instance
export const cache = new InMemoryCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
});

// Specialized caches for different use cases
export const queryCache = new InMemoryCache({
  ttl: 2 * 60 * 1000, // 2 minutes for database queries
  maxSize: 500,
});

export const apiCache = new InMemoryCache({
  ttl: 5 * 60 * 1000, // 5 minutes for API responses
  maxSize: 200,
});

export const statsCache = new InMemoryCache({
  ttl: 10 * 60 * 1000, // 10 minutes for statistics
  maxSize: 100,
});

/**
 * Cache key builders for consistent key generation
 */
export const CacheKeys = {
  blogPost: (id: string) => `blog-post:${id}`,
  blogPosts: (filters: Record<string, any>) =>
    `blog-posts:${JSON.stringify(filters)}`,

  client: (id: string) => `client:${id}`,
  clients: (filters: Record<string, any>) =>
    `clients:${JSON.stringify(filters)}`,

  website: (id: string) => `website:${id}`,
  websites: (filters: Record<string, any>) =>
    `websites:${JSON.stringify(filters)}`,

  contentBatch: (id: string) => `content-batch:${id}`,
  contentBatches: (filters: Record<string, any>) =>
    `content-batches:${JSON.stringify(filters)}`,

  seoAudit: (websiteId: string) => `seo-audit:${websiteId}`,
  topicClusters: (websiteId: string) => `topic-clusters:${websiteId}`,

  stats: (type: string, id?: string) =>
    id ? `stats:${type}:${id}` : `stats:${type}`,
} as const;

/**
 * Decorator-style cache wrapper for async functions
 */
export function withCache<T>(
  keyFn: (...args: any[]) => string,
  ttl?: number
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = keyFn(...args);
      return cache.getOrSet(key, () => originalMethod.apply(this, args), ttl);
    };

    return descriptor;
  };
}

/**
 * Higher-order function to cache async function results
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyFn: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyFn(...args);
    return cache.getOrSet(key, () => fn(...args), ttl);
  }) as T;
}

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  /**
   * Invalidate all blog post related caches
   */
  blogPost(postId?: string) {
    if (postId) {
      cache.delete(CacheKeys.blogPost(postId));
    }
    cache.invalidatePattern(/^blog-posts:/);
  },

  /**
   * Invalidate all client related caches
   */
  client(clientId?: string) {
    if (clientId) {
      cache.delete(CacheKeys.client(clientId));
    }
    cache.invalidatePattern(/^clients:/);
  },

  /**
   * Invalidate all website related caches
   */
  website(websiteId?: string) {
    if (websiteId) {
      cache.delete(CacheKeys.website(websiteId));
      cache.delete(CacheKeys.seoAudit(websiteId));
      cache.delete(CacheKeys.topicClusters(websiteId));
    }
    cache.invalidatePattern(/^websites:/);
  },

  /**
   * Invalidate all content batch related caches
   */
  contentBatch(batchId?: string) {
    if (batchId) {
      cache.delete(CacheKeys.contentBatch(batchId));
    }
    cache.invalidatePattern(/^content-batches:/);
  },

  /**
   * Invalidate all statistics caches
   */
  stats() {
    cache.invalidatePattern(/^stats:/);
  },

  /**
   * Clear all caches
   */
  all() {
    cache.clear();
    queryCache.clear();
    apiCache.clear();
    statsCache.clear();
  },
} as const;

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
    queryCache.cleanup();
    apiCache.cleanup();
    statsCache.cleanup();
  }, 5 * 60 * 1000);
}

export default cache;
