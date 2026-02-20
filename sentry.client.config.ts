import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.1,

  integrations: [
    Sentry.replayIntegration({
      // Additional SDK configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out known non-error events
  beforeSend(event, hint) {
    // Don't send events for certain errors
    if (event.exception) {
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore certain error messages
        if (
          error.message.includes('ResizeObserver') ||
          error.message.includes('Non-Error promise rejection')
        ) {
          return null;
        }
      }
    }
    return event;
  },

  environment: process.env.NODE_ENV,
});
