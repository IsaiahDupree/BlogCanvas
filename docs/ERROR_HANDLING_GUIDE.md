# Error Handling & Monitoring Guide

**Last Updated:** 2026-01-15
**Status:** Production Ready

## Overview

BlogCanvas uses a comprehensive error handling system that provides:

- ✅ **Consistent error responses** across all API routes
- ✅ **Correlation IDs** for request tracing
- ✅ **Structured logging** for production monitoring
- ✅ **User-friendly error messages** (no internal details leaked)
- ✅ **Error boundaries** to prevent UI crashes
- ✅ **Request/response tracking** with performance monitoring

## Table of Contents

1. [Architecture](#architecture)
2. [API Error Handling](#api-error-handling)
3. [Client-Side Error Handling](#client-side-error-handling)
4. [Logging](#logging)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Best Practices](#best-practices)
7. [Examples](#examples)

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Request Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Client Request                                           │
│       ↓                                                      │
│  2. Middleware (middleware.ts)                               │
│       - Generate/extract correlation ID                      │
│       - Add to request headers (x-request-id)               │
│       - Log request start                                    │
│       ↓                                                      │
│  3. API Route Handler                                        │
│       - Use error-handler utilities                          │
│       - Use structured logger                                │
│       - Catch and format errors                              │
│       ↓                                                      │
│  4. Response                                                 │
│       - Include correlation ID in headers                    │
│       - Log request completion with duration                 │
│       - Standardized error/success format                    │
│       ↓                                                      │
│  5. Client receives response                                 │
│       - Error boundaries catch UI errors                     │
│       - Display user-friendly error messages                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `/src/lib/error-handler.ts` | Error utilities, factories, response formatters |
| `/src/lib/logger.ts` | Structured logging system |
| `/src/middleware.ts` | Correlation ID generation, request logging |
| `/src/components/error-boundary.tsx` | React error boundaries |
| `/src/app/error.tsx` | Root error page |
| `/src/app/app/error.tsx` | Vendor dashboard error page |
| `/src/app/portal/error.tsx` | Client portal error page |

---

## API Error Handling

### Standard Error Response Format

All API errors follow this consistent format:

```typescript
{
  "success": false,
  "error": {
    "message": "User-friendly error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-01-15T12:00:00.000Z",
    "details": { /* Optional additional context */ }
  }
}
```

### Standard Success Response Format

```typescript
{
  "success": true,
  "data": { /* Your response data */ },
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-01-15T12:00:00.000Z"
}
```

### Using Error Utilities in API Routes

**Basic Example:**

```typescript
// src/app/api/example/route.ts
import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorFactory,
  getRequestId
} from '@/lib/error-handler'
import { createRequestLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request)
  const log = createRequestLogger(request)

  try {
    log.info('Fetching example data')

    // Your business logic here
    const data = await fetchSomeData()

    if (!data) {
      throw ErrorFactory.notFound('Example data')
    }

    log.info('Example data fetched successfully')
    return createSuccessResponse(data, requestId)

  } catch (error) {
    log.error('Failed to fetch example data', error as Error)

    if (error instanceof AppError) {
      return createErrorResponse(error, requestId)
    }

    const internalError = ErrorFactory.internal('Failed to fetch example data')
    return createErrorResponse(internalError, requestId)
  }
}
```

**Using asyncHandler Wrapper:**

```typescript
import { asyncHandler, ErrorFactory } from '@/lib/error-handler'

export const GET = asyncHandler(async (request) => {
  const log = createRequestLogger(request)
  const requestId = getRequestId(request)

  log.info('Processing request')

  // Throw AppError - will be caught and formatted automatically
  if (!isAuthorized) {
    throw ErrorFactory.unauthorized('Please log in to continue')
  }

  const data = await getData()
  return createSuccessResponse(data, requestId)
})
```

### Error Factory Methods

Pre-configured error types for common scenarios:

```typescript
// 401 Unauthorized
throw ErrorFactory.unauthorized('Authentication required')

// 403 Forbidden
throw ErrorFactory.forbidden('You do not have permission to access this resource')

// 404 Not Found
throw ErrorFactory.notFound('Blog post', { id: postId })

// 400 Validation Error
throw ErrorFactory.validation('Email and password are required', {
  fields: ['email', 'password']
})

// 500 Database Error
throw ErrorFactory.database('Failed to save blog post', { table: 'blog_posts' })

// 502 External API Error
throw ErrorFactory.externalApi('WordPress', 'WordPress API is unavailable', {
  endpoint: '/wp-json/wp/v2/posts'
})

// 429 Rate Limit
throw ErrorFactory.rateLimit('Too many requests, please try again later', {
  retryAfter: 60
})

// 500 Internal Server Error
throw ErrorFactory.internal('An unexpected error occurred')
```

### Custom AppError

For custom error scenarios:

```typescript
import { AppError, ErrorCategory, ErrorSeverity } from '@/lib/error-handler'

throw new AppError(
  'Payment processing failed',
  402, // Payment Required
  'PAYMENT_FAILED',
  ErrorCategory.EXTERNAL_API,
  ErrorSeverity.HIGH,
  { provider: 'Stripe', amount: 4900 }
)
```

---

## Client-Side Error Handling

### Error Boundaries

Wrap components to prevent crashes:

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

function MyPage() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  )
}
```

**With Custom Fallback:**

```tsx
<ErrorBoundary
  fallback={
    <div className="p-4 text-red-600">
      Failed to load content. Please refresh.
    </div>
  }
>
  <MyComponent />
</ErrorBoundary>
```

**With Reset Keys (re-mount on dependency change):**

```tsx
<ErrorBoundary resetKeys={[userId, postId]}>
  <BlogPostEditor />
</ErrorBoundary>
```

**With Error Handler:**

```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Send to analytics
    trackError(error, errorInfo)
  }}
>
  <MyComponent />
</ErrorBoundary>
```

### Displaying API Errors

```tsx
import { ApiError } from '@/components/error-boundary'

function MyComponent() {
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/example')
      const data = await response.json()

      if (!data.success) {
        setError(data.error)
        return
      }

      // Handle success
    } catch (err) {
      setError({
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      })
    }
  }

  if (error) {
    return <ApiError error={error} onRetry={() => setError(null)} />
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### Route-Level Error Pages

Next.js automatically uses these error pages:

- `/src/app/error.tsx` - Root error page (all unhandled errors)
- `/src/app/app/error.tsx` - Vendor dashboard errors
- `/src/app/portal/error.tsx` - Client portal errors

These are already implemented and will catch errors in their respective sections.

---

## Logging

### Using the Structured Logger

```typescript
import { logger, createRequestLogger } from '@/lib/logger'

// Simple logging
logger.info('Server started on port 4848')
logger.warn('Rate limit approaching', { userId: '123', remaining: 5 })
logger.error('Database connection failed', dbError, { host: 'localhost' })

// Request logging (includes correlation ID)
export async function GET(request: NextRequest) {
  const log = createRequestLogger(request)

  log.info('Processing blog post request')
  log.debug('Query parameters', { params: request.nextUrl.searchParams })

  try {
    const result = await fetchData()
    log.info('Request completed successfully')
    return result
  } catch (error) {
    log.error('Request failed', error as Error)
    throw error
  }
}
```

### Log Levels

| Level | When to Use | Production Output |
|-------|-------------|-------------------|
| `debug` | Development debugging | No (filtered out) |
| `info` | Normal operations, audit trail | Yes |
| `warn` | Recoverable issues, slow queries | Yes |
| `error` | Errors that need attention | Yes |
| `critical` | Service down, data loss risk | Yes + Alert |

### Specialized Logging Methods

**Request Logging:**

```typescript
logger.request('GET', '/api/blog-posts', 200, 150, { userId: '123' })
// Automatically warns if duration > 2s or status >= 400
```

**Database Logging:**

```typescript
logger.database('SELECT', 'blog_posts', 450, { rows: 100 })
// Automatically warns if duration > 1s
```

**External API Logging:**

```typescript
logger.externalApi('WordPress', '/wp-json/wp/v2/posts', 201, 800, {
  postId: 456
})
```

**Authentication Logging:**

```typescript
logger.auth('login', userId, true, { method: 'email' })
logger.auth('login', undefined, false, { reason: 'invalid_credentials' })
```

### Context Logger

For maintaining context across multiple log calls:

```typescript
const log = logger.child({
  requestId: '550e8400-e29b-41d4-a716-446655440000',
  userId: 'user_123',
  batchId: 'batch_456'
})

log.info('Starting batch processing')
log.debug('Processing item 1')
log.debug('Processing item 2')
log.info('Batch processing completed')

// All logs include the context automatically
```

---

## Monitoring & Alerting

### Current Setup

- **Development:** Pretty console logs with stack traces
- **Production:** JSON-formatted logs for aggregation services

### Production Logs Format

```json
{
  "timestamp": "2026-01-15T12:00:00.000Z",
  "level": "error",
  "message": "Failed to publish blog post",
  "context": {
    "service": "BlogCanvas",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user_123",
    "postId": "post_456"
  },
  "error": {
    "message": "WordPress API timeout",
    "code": "EXTERNAL_API_ERROR"
  }
}
```

### Correlation ID Tracing

Every request gets a unique correlation ID:

1. **Generated in middleware** (`middleware.ts`)
2. **Included in request headers** (`x-request-id`, `x-correlation-id`)
3. **Included in response headers** (client can reference it)
4. **Included in all logs** (search by ID to see full request lifecycle)
5. **Included in error responses** (users can report error ID for support)

**Tracing a Request:**

```bash
# Search logs by correlation ID to see entire request flow
grep "550e8400-e29b-41d4-a716-446655440000" logs.json

# Example output:
[REQUEST] { requestId: "550e8400...", method: "POST", path: "/api/blog-posts" }
[INFO] { requestId: "550e8400...", message: "Creating blog post" }
[DATABASE] { requestId: "550e8400...", operation: "INSERT", table: "blog_posts" }
[INFO] { requestId: "550e8400...", message: "Blog post created successfully" }
[REQUEST] { requestId: "550e8400...", status: 201, duration: "320ms" }
```

### Future Enhancements

The system is ready for integration with:

- **Sentry** - Error tracking and alerts
- **Datadog** - Log aggregation and monitoring
- **New Relic** - APM and performance monitoring
- **PagerDuty** - Critical error alerting
- **Slack** - Error notifications

Integration points are marked with `// TODO:` comments in:
- `/src/lib/error-handler.ts` (line ~70, ~90)
- `/src/lib/logger.ts` (line ~90, ~95)

---

## Best Practices

### DO ✅

1. **Use error factories for common errors**
   ```typescript
   throw ErrorFactory.unauthorized() // Good
   ```

2. **Include correlation ID in responses**
   ```typescript
   const requestId = getRequestId(request)
   return createSuccessResponse(data, requestId)
   ```

3. **Log errors before returning them**
   ```typescript
   log.error('Operation failed', error)
   return createErrorResponse(error, requestId)
   ```

4. **Use structured logging with context**
   ```typescript
   logger.info('User logged in', { userId, method: 'email' })
   ```

5. **Wrap UI components in error boundaries**
   ```tsx
   <ErrorBoundary><MyComponent /></ErrorBoundary>
   ```

6. **Provide user-friendly error messages**
   ```typescript
   throw ErrorFactory.validation('Please provide a valid email address')
   ```

7. **Use asyncHandler for cleaner code**
   ```typescript
   export const GET = asyncHandler(async (request) => {
     // Errors automatically handled
   })
   ```

### DON'T ❌

1. **Don't expose internal error messages in production**
   ```typescript
   return NextResponse.json({ error: dbError.message }) // Bad
   throw ErrorFactory.database('Failed to save data') // Good
   ```

2. **Don't use console.log without context**
   ```typescript
   console.log('Error occurred') // Bad
   logger.error('Database connection failed', error, { host }) // Good
   ```

3. **Don't ignore errors**
   ```typescript
   try { await operation() } catch {} // Bad
   ```

4. **Don't return inconsistent error formats**
   ```typescript
   return NextResponse.json({ msg: 'Error' }) // Bad
   return createErrorResponse(error, requestId) // Good
   ```

5. **Don't forget correlation IDs**
   ```typescript
   return NextResponse.json({ error: 'Failed' }) // Bad
   return createErrorResponse(error, requestId) // Good
   ```

---

## Examples

### Complete API Route Example

```typescript
// src/app/api/blog-posts/[id]/route.ts
import { NextRequest } from 'next/server'
import { asyncHandler, ErrorFactory, createSuccessResponse, getRequestId } from '@/lib/error-handler'
import { createRequestLogger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const requestId = getRequestId(request)
  const log = createRequestLogger(request)

  log.info('Fetching blog post', { postId: params.id })

  // Get authenticated user
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    log.warn('Unauthorized access attempt')
    throw ErrorFactory.unauthorized()
  }

  // Fetch blog post
  const startTime = Date.now()
  const { data: post, error: dbError } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', params.id)
    .single()

  const duration = Date.now() - startTime
  log.database('SELECT', 'blog_posts', duration, { postId: params.id })

  if (dbError) {
    log.error('Database query failed', dbError)
    throw ErrorFactory.database('Failed to fetch blog post')
  }

  if (!post) {
    log.warn('Blog post not found', { postId: params.id })
    throw ErrorFactory.notFound('Blog post', { id: params.id })
  }

  log.info('Blog post fetched successfully', { postId: params.id })
  return createSuccessResponse(post, requestId)
})

export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const requestId = getRequestId(request)
  const log = createRequestLogger(request)

  log.info('Updating blog post', { postId: params.id })

  const body = await request.json()

  // Validate input
  if (!body.title || !body.content) {
    throw ErrorFactory.validation('Title and content are required', {
      fields: ['title', 'content']
    })
  }

  // Update logic here...
  const updatedPost = { ...body, id: params.id }

  log.info('Blog post updated successfully', { postId: params.id })
  return createSuccessResponse(updatedPost, requestId)
})
```

### Complete React Component Example

```tsx
// src/app/app/blog-posts/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { ErrorBoundary, ApiError } from '@/components/error-boundary'
import { Loader2 } from 'lucide-react'

function BlogPostContent({ postId }: { postId: string }) {
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPost = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/blog-posts/${postId}`)
      const data = await response.json()

      if (!data.success) {
        setError(data.error)
        return
      }

      setPost(data.data)
    } catch (err) {
      setError({
        message: 'Failed to load blog post. Please check your connection.',
        code: 'NETWORK_ERROR'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPost()
  }, [postId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return <ApiError error={error} onRetry={fetchPost} />
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  )
}

export default function BlogPostPage({ params }: { params: { id: string } }) {
  return (
    <ErrorBoundary>
      <BlogPostContent postId={params.id} />
    </ErrorBoundary>
  )
}
```

---

## Summary

BlogCanvas now has a production-ready error handling and monitoring system:

✅ **Consistent Error Responses** - All APIs use standard format
✅ **Correlation IDs** - Track requests end-to-end
✅ **Structured Logging** - Production-ready JSON logs
✅ **Error Boundaries** - Prevent UI crashes
✅ **User-Friendly Messages** - No internal details leaked
✅ **Performance Monitoring** - Slow request detection
✅ **Ready for Monitoring Services** - Sentry, Datadog, etc.

For questions or issues, refer to this guide or check the implementation in the files listed in the [Architecture](#architecture) section.
