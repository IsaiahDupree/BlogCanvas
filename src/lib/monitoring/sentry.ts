import * as Sentry from '@sentry/nextjs';

/**
 * Capture an exception with Sentry
 * @param error - The error to capture
 * @param context - Additional context for the error
 */
export function captureException(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  }
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // If Sentry is not configured, just log to console
    console.error('Error (Sentry not configured):', error);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture a message with Sentry
 * @param message - The message to capture
 * @param level - The severity level (default: 'info')
 * @param context - Additional context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}] ${message}`);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureMessage(message, level);
  });
}

/**
 * Set user context for Sentry
 * @param user - User information
 */
export function setUser(user: {
  id?: string;
  email?: string;
  username?: string;
  role?: string;
}) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  Sentry.setUser(user);
}

/**
 * Clear user context in Sentry
 */
export function clearUser() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 * @param breadcrumb - Breadcrumb information
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, unknown>;
}) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Start a new span for performance monitoring
 * @param name - Span name
 * @param op - Operation type
 */
export function startSpan(name: string, op: string, callback?: () => void) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return null;

  // Sentry v8 uses startSpan instead of startTransaction
  return Sentry.startSpan({ name, op }, callback || (() => {}));
}
