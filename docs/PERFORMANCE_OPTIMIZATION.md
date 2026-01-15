# Performance Optimization Guide

**Feature:** feat-053
**Status:** ✅ Complete
**Date:** 2026-01-15

## Overview

This document describes the performance optimizations implemented in BlogCanvas to ensure fast, scalable API responses and responsive UI.

## 1. Database Indexes

### Migration: `20260115000001_performance_optimization.sql`

Comprehensive indexes have been added to optimize query performance across all tables.

#### Key Index Categories

**SEO Retainer System**
- `seo_audits`: indexed on website_id, audit_date, baseline_score
- `topic_clusters`: indexed on website_id, coverage, difficulty, traffic
- `content_batches`: indexed on website_id, status, dates
- `blog_post_revisions`: indexed on blog_post_id, type, date, creator
- `blog_post_metrics`: indexed on blog_post_id, snapshot_date, seo_score
- `reports`: indexed on website_id, type, period_start, generated_at
- `check_back_schedules`: indexed on blog_post_id, date, status, type

**Core Tables Enhanced**
- `blog_posts`: added indexes for content_batch_id, topic_cluster_id, seo_quality_score
- `websites`: indexed on client_id, scrape_status, created_at
- `clients`: existing indexes maintained

**Composite Indexes** (for common query patterns)
- Blog posts by batch and status
- Blog posts by client and status
- Metrics by post and date range
- Check-backs by status and scheduled date
- Email queue by status and scheduled time
- Comments by post and resolved status

### Benefits
- ✅ Faster WHERE clause filtering
- ✅ Optimized ORDER BY operations
- ✅ Efficient JOIN operations
- ✅ Reduced full table scans

## 2. Pagination System

### Library: `src/lib/pagination.ts`

#### Features

**Offset-Based Pagination**
- Default limit: 20 items per page
- Max limit: 100 items per page
- Supports custom sorting (sortBy, sortOrder)
- Returns comprehensive metadata

**Cursor-Based Pagination**
- More efficient for large datasets
- Real-time data friendly
- No offset performance degradation

#### API Usage

```typescript
import {
  parsePaginationParams,
  applyPagination,
  applySorting,
  createPaginatedResponse,
} from '@/lib/pagination';

// In your API route
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams);

  let query = supabase.from('table').select('*', { count: 'exact' });
  query = applySorting(query, sortBy || 'created_at', sortOrder);
  query = applyPagination(query, page, limit);

  const { data, count, error } = await query;

  return NextResponse.json({
    success: true,
    ...createPaginatedResponse(data || [], count || 0, page, limit),
  });
}
```

#### Request Parameters

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Column to sort by (default: created_at)
- `sortOrder`: Sort direction (`asc` or `desc`, default: desc)

#### Response Format

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## 3. Caching System

### Library: `src/lib/cache.ts`

#### Features

**In-Memory Cache**
- Fast in-memory storage
- TTL-based expiration
- Automatic cleanup
- Pattern-based invalidation
- Size limits to prevent memory bloat

**Specialized Caches**
- `cache`: General purpose (5 min TTL)
- `queryCache`: Database queries (2 min TTL)
- `apiCache`: API responses (5 min TTL)
- `statsCache`: Statistics (10 min TTL)

#### Usage Examples

**Basic Cache Operations**

```typescript
import { cache, CacheKeys } from '@/lib/cache';

// Set a value
cache.set('key', data, 60000); // 60 seconds

// Get a value
const data = cache.get('key');

// Delete a value
cache.delete('key');

// Get or set pattern
const data = await cache.getOrSet('key', async () => {
  return await fetchExpensiveData();
}, 300000); // 5 minutes
```

**Using Cache Keys**

```typescript
import { queryCache, CacheKeys } from '@/lib/cache';

// Build consistent cache keys
const cacheKey = CacheKeys.blogPosts({ status, page, limit });

// Check cache
const cached = queryCache.get(cacheKey);
if (cached) {
  return NextResponse.json(cached);
}

// Fetch and cache
const data = await fetchData();
queryCache.set(cacheKey, data);
```

**Cache Invalidation**

```typescript
import { CacheInvalidation } from '@/lib/cache';

// After creating/updating a blog post
CacheInvalidation.blogPost(postId);

// After creating a client
CacheInvalidation.client();

// After creating a content batch
CacheInvalidation.contentBatch();

// Clear all caches
CacheInvalidation.all();
```

#### Cache Keys Structure

- `blog-post:{id}` - Individual blog post
- `blog-posts:{filters}` - Blog post lists
- `client:{id}` - Individual client
- `clients:{filters}` - Client lists
- `website:{id}` - Individual website
- `websites:{filters}` - Website lists
- `content-batch:{id}` - Individual content batch
- `content-batches:{filters}` - Content batch lists
- `seo-audit:{websiteId}` - SEO audit data
- `topic-clusters:{websiteId}` - Topic clusters
- `stats:{type}:{id?}` - Statistics

## 4. Optimized API Routes

The following routes have been optimized with pagination and caching:

### ✅ Optimized Routes

- **GET /api/blog-posts** - Blog posts list with pagination
- **GET /api/clients** - Clients list with pagination
- **GET /api/websites** - Websites list with pagination
- **GET /api/content-batches** - Content batches list with pagination

### Response Structure

All optimized routes now return:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Frontend Integration

When consuming these APIs on the frontend:

```typescript
// Add pagination params to requests
const response = await fetch(
  `/api/blog-posts?page=1&limit=20&sortBy=created_at&sortOrder=desc`
);

const { data, meta } = await response.json();

// Use meta for pagination controls
if (meta.hasNextPage) {
  // Show "Load More" or "Next Page" button
}
```

## 5. Loading Skeletons

### Library: `src/components/ui/skeleton.tsx`

Comprehensive skeleton components for improved perceived performance.

#### Available Components

**Generic Skeletons**
- `Skeleton` - Base skeleton component
- `CardSkeleton` - Generic card skeleton
- `TableSkeleton` - Table with rows
- `TableRowSkeleton` - Single table row
- `ListSkeleton` - List items
- `FormSkeleton` - Form fields
- `PageHeaderSkeleton` - Page header
- `ChartSkeleton` - Charts and graphs
- `AvatarSkeleton` - User avatars

**Domain-Specific Skeletons**
- `BlogPostCardSkeleton` - Blog post cards
- `ContentBatchCardSkeleton` - Content batch cards
- `ClientCardSkeleton` - Client cards
- `StatCardSkeleton` - Stat cards
- `StatsGridSkeleton` - Grid of stat cards

#### Usage

```tsx
import { BlogPostCardSkeleton, TableSkeleton } from '@/components/ui/skeleton';

export default function BlogPostsPage() {
  const { data, isLoading } = useBlogPosts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BlogPostCardSkeleton />
        <BlogPostCardSkeleton />
        <BlogPostCardSkeleton />
      </div>
    );
  }

  return <div>{/* Render actual data */}</div>;
}
```

## 6. Performance Best Practices

### Database Queries

✅ **DO**
- Use indexes for frequently queried columns
- Apply pagination to all list queries
- Use `select()` to fetch only needed columns
- Use composite indexes for multi-column filters
- Run `ANALYZE` after major data changes

❌ **DON'T**
- Fetch all records without limits
- Use `SELECT *` when you only need specific columns
- Create queries without WHERE clause on large tables
- Ignore database query performance in development

### Caching

✅ **DO**
- Cache expensive computations
- Cache database queries with appropriate TTL
- Invalidate cache on data changes
- Use specialized caches for different use cases
- Monitor cache hit rates

❌ **DON'T**
- Cache data that changes frequently
- Forget to invalidate cache on updates
- Cache sensitive user data
- Use cache for real-time data

### API Design

✅ **DO**
- Return paginated responses for lists
- Include total count in responses
- Support sorting and filtering
- Use consistent response formats
- Document pagination parameters

❌ **DON'T**
- Return all records by default
- Ignore pagination on frontend
- Fetch more data than needed
- Mix paginated and non-paginated responses

### Frontend

✅ **DO**
- Show loading skeletons during data fetch
- Implement infinite scroll or pagination
- Cache API responses on client side
- Debounce search inputs
- Use React Query or SWR for data fetching

❌ **DON'T**
- Block UI during data loading
- Fetch same data multiple times
- Show blank screens while loading
- Ignore loading and error states

## 7. Monitoring and Metrics

### Key Performance Indicators

Monitor these metrics to ensure optimization effectiveness:

**Response Times**
- API response time < 200ms (cached)
- API response time < 500ms (uncached)
- Database query time < 100ms

**Cache Performance**
- Cache hit rate > 70%
- Cache memory usage < 500MB
- Cache cleanup cycles running

**Database Performance**
- Query execution time < 100ms
- Index usage rate > 80%
- Connection pool utilization < 80%

### Logging

Performance logging is integrated with the error handler:

```typescript
import { logger } from '@/lib/logger';

// Log slow queries
logger.database('Slow query detected', {
  query: 'SELECT * FROM blog_posts',
  duration: 1500,
  threshold: 1000,
});
```

## 8. Future Improvements

### Short Term
- [ ] Add Redis for distributed caching
- [ ] Implement query result streaming
- [ ] Add database connection pooling
- [ ] Optimize image loading with CDN

### Long Term
- [ ] Implement full-text search with Elasticsearch
- [ ] Add database read replicas
- [ ] Implement GraphQL with DataLoader
- [ ] Add edge caching with Vercel/Cloudflare

## 9. Testing

### Performance Tests

```bash
# Test pagination
curl "http://localhost:4848/api/blog-posts?page=1&limit=20"

# Test sorting
curl "http://localhost:4848/api/blog-posts?sortBy=seo_quality_score&sortOrder=desc"

# Test filtering with pagination
curl "http://localhost:4848/api/blog-posts?status=published&page=2&limit=10"

# Test caching (run twice, second should be faster)
time curl "http://localhost:4848/api/clients?page=1&limit=20"
time curl "http://localhost:4848/api/clients?page=1&limit=20"
```

### Load Testing

For production, use tools like:
- Apache Bench (ab)
- Locust
- k6
- Artillery

## 10. Troubleshooting

### Slow Queries

1. Check if indexes are being used:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM blog_posts WHERE status = 'published';
   ```

2. Add missing indexes if needed

3. Check query cache hit rate:
   ```typescript
   import { queryCache } from '@/lib/cache';
   console.log(queryCache.getStats());
   ```

### High Memory Usage

1. Check cache sizes:
   ```typescript
   import { cache, queryCache, apiCache, statsCache } from '@/lib/cache';
   console.log({
     cache: cache.getStats(),
     queryCache: queryCache.getStats(),
     apiCache: apiCache.getStats(),
     statsCache: statsCache.getStats(),
   });
   ```

2. Reduce cache TTL or maxSize if needed

3. Clear caches manually:
   ```typescript
   import { CacheInvalidation } from '@/lib/cache';
   CacheInvalidation.all();
   ```

## Summary

The performance optimization feature (feat-053) delivers:

✅ **Database Indexes** - 50+ indexes for optimal query performance
✅ **Pagination System** - Scalable list queries with metadata
✅ **Caching System** - In-memory caching with TTL and invalidation
✅ **Optimized APIs** - 4 major routes optimized with pagination
✅ **Loading Skeletons** - 15+ skeleton components for better UX
✅ **Documentation** - Comprehensive guide for developers

**Result**: Faster API responses, scalable list queries, and improved user experience.
