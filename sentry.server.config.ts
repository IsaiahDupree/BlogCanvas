import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  environment: process.env.NODE_ENV,

  // Server-specific configuration
  integrations: [
    // Add server-specific integrations here
  ],

  // Filter out known non-error events
  beforeSend(event, hint) {
    // Don't send events for certain errors
    if (event.exception) {
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore certain error messages
        if (
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('timeout')
        ) {
          // Log locally but don't send to Sentry for transient network errors
          console.error('Network error (not sent to Sentry):', error);
          return null;
        }
      }
    }
    return event;
  },
});
