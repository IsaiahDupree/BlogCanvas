/**
 * API Key Authentication Middleware
 * Validates API keys and enforces rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateApiKey,
  checkRateLimit,
  incrementRateLimit,
  logApiKeyUsage,
} from './api-key-service';

export interface ApiKeyContext {
  apiKey: {
    id: string;
    vendor_id: string;
    scopes: string[];
  };
}

/**
 * Middleware to authenticate API key from Authorization header
 * Usage in API routes:
 *
 * const result = await withApiKey(request, ['posts:read']);
 * if (result.error) {
 *   return result.error;
 * }
 * const { apiKey } = result.context;
 */
export async function withApiKey(
  request: NextRequest,
  requiredScopes: string[] = []
): Promise<
  | { context: ApiKeyContext; error: null }
  | { context: null; error: NextResponse }
> {
  const startTime = Date.now();

  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return {
        context: null,
        error: NextResponse.json(
          { error: 'Missing Authorization header' },
          { status: 401 }
        ),
      };
    }

    // Expected format: "Bearer bc_live_..."
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return {
        context: null,
        error: NextResponse.json(
          { error: 'Invalid Authorization header format. Expected: Bearer <api_key>' },
          { status: 401 }
        ),
      };
    }

    const apiKeyString = parts[1];

    // Validate the API key
    const apiKey = await validateApiKey(apiKeyString);
    if (!apiKey) {
      // Log failed attempt
      await logApiKeyUsage(
        'unknown',
        request.nextUrl.pathname,
        request.method,
        401,
        Date.now() - startTime,
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined
      );

      return {
        context: null,
        error: NextResponse.json(
          { error: 'Invalid or expired API key' },
          { status: 401 }
        ),
      };
    }

    // Check rate limits
    const rateLimitStatus = await checkRateLimit(apiKey.id);
    if (!rateLimitStatus.is_allowed) {
      // Log rate limit exceeded
      await logApiKeyUsage(
        apiKey.id,
        request.nextUrl.pathname,
        request.method,
        429,
        Date.now() - startTime,
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined
      );

      const resetTime = getRateLimitResetTime(rateLimitStatus.exceeded_window!);
      return {
        context: null,
        error: NextResponse.json(
          {
            error: 'Rate limit exceeded',
            exceeded_window: rateLimitStatus.exceeded_window,
            reset_at: resetTime.toISOString(),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': getRateLimitValue(
                apiKey,
                rateLimitStatus.exceeded_window!
              ).toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.floor(resetTime.getTime() / 1000).toString(),
            },
          }
        ),
      };
    }

    // Check scopes
    if (requiredScopes.length > 0) {
      const missingScopes = requiredScopes.filter(
        (scope) => !apiKey.scopes.includes(scope)
      );
      if (missingScopes.length > 0) {
        // Log insufficient permissions
        await logApiKeyUsage(
          apiKey.id,
          request.nextUrl.pathname,
          request.method,
          403,
          Date.now() - startTime,
          request.headers.get('x-forwarded-for') || undefined,
          request.headers.get('user-agent') || undefined
        );

        return {
          context: null,
          error: NextResponse.json(
            {
              error: 'Insufficient permissions',
              required_scopes: requiredScopes,
              missing_scopes: missingScopes,
            },
            { status: 403 }
          ),
        };
      }
    }

    // Increment rate limit counters
    await incrementRateLimit(apiKey.id);

    // Return context for use in API route
    return {
      context: {
        apiKey: {
          id: apiKey.id,
          vendor_id: apiKey.vendor_id,
          scopes: apiKey.scopes,
        },
      },
      error: null,
    };
  } catch (error: any) {
    console.error('API key middleware error:', error);
    return {
      context: null,
      error: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Helper to log successful API call after response
 */
export async function logApiCall(
  apiKeyId: string,
  request: NextRequest,
  statusCode: number,
  startTime: number
): Promise<void> {
  const responseTime = Date.now() - startTime;
  await logApiKeyUsage(
    apiKeyId,
    request.nextUrl.pathname,
    request.method,
    statusCode,
    responseTime,
    request.headers.get('x-forwarded-for') || undefined,
    request.headers.get('user-agent') || undefined
  );
}

/**
 * Get the reset time for a rate limit window
 */
function getRateLimitResetTime(window: 'minute' | 'hour' | 'day'): Date {
  const now = new Date();
  if (window === 'minute') {
    return new Date(now.getTime() + (60 - now.getSeconds()) * 1000);
  } else if (window === 'hour') {
    return new Date(
      now.getTime() +
        (60 - now.getMinutes()) * 60 * 1000 +
        (60 - now.getSeconds()) * 1000
    );
  } else {
    // day
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }
}

/**
 * Get the rate limit value for a specific window
 */
function getRateLimitValue(
  apiKey: { rate_limit_per_minute: number; rate_limit_per_hour: number; rate_limit_per_day: number },
  window: 'minute' | 'hour' | 'day'
): number {
  if (window === 'minute') return apiKey.rate_limit_per_minute;
  if (window === 'hour') return apiKey.rate_limit_per_hour;
  return apiKey.rate_limit_per_day;
}
