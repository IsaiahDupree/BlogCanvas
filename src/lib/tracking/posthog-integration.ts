/**
 * PostHog Integration
 * Identity stitching and event tracking with PostHog
 */

import { linkIdentity, findPersonByExternalId } from '@/lib/db/growth-data-plane';

declare global {
  interface Window {
    posthog?: {
      identify: (personId: string, properties?: Record<string, any>) => void;
      capture: (event: string, properties?: Record<string, any>) => void;
      reset: () => void;
      get_distinct_id: () => string;
    };
  }
}

/**
 * Identify user in PostHog and link to person
 * Call this on login/signup
 */
export async function identifyUserInPostHog(
  personId: string,
  email: string,
  properties?: Record<string, any>
) {
  if (typeof window === 'undefined' || !window.posthog) {
    console.warn('PostHog not initialized');
    return;
  }

  // Get PostHog distinct ID (anonymous ID before identification)
  const posthogDistinctId = window.posthog.get_distinct_id();

  // Identify in PostHog
  window.posthog.identify(personId, {
    email,
    ...properties,
  });

  // Link PostHog ID to person in our database
  await linkIdentity(personId, 'posthog', posthogDistinctId, {
    email,
    identified_at: new Date().toISOString(),
  });

  console.log('PostHog identity stitched:', { personId, posthogDistinctId });
}

/**
 * Reset PostHog identity (on logout)
 */
export function resetPostHogIdentity() {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.reset();
  }
}

/**
 * Track custom event in PostHog
 */
export function trackPostHogEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(eventName, properties);
  }
}

/**
 * Find person by PostHog distinct ID
 */
export async function findPersonByPostHogId(
  posthogId: string
): Promise<string | null> {
  const person = await findPersonByExternalId('posthog', posthogId);
  return person?.id || null;
}

/**
 * Initialize PostHog with person context
 */
export async function initPostHogWithPerson(
  personId: string,
  email: string,
  properties?: Record<string, any>
) {
  // Wait for PostHog to be available
  if (typeof window === 'undefined') return;

  const maxAttempts = 10;
  let attempts = 0;

  const tryIdentify = () => {
    if (window.posthog) {
      identifyUserInPostHog(personId, email, properties);
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(tryIdentify, 500);
    } else {
      console.warn('PostHog not loaded after max attempts');
    }
  };

  tryIdentify();
}
