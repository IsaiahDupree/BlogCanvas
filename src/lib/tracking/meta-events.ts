import { trackMetaEvent } from '@/components/tracking/MetaPixel';
import { generateEventId } from './meta-capi';

/**
 * Unified Meta tracking that fires both Pixel (browser) and CAPI (server)
 * Uses event_id for deduplication between the two sources
 */

interface TrackingContext {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
  fbp?: string; // From _fbp cookie
  fbc?: string; // From _fbc cookie
}

/**
 * Get Facebook browser cookies for better attribution
 */
function getFBCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === 'undefined') return {};

  const fbp = document.cookie
    .split('; ')
    .find((row) => row.startsWith('_fbp='))
    ?.split('=')[1];

  const fbc = document.cookie
    .split('; ')
    .find((row) => row.startsWith('_fbc='))
    ?.split('=')[1];

  return { fbp, fbc };
}

/**
 * Track PageView (both Pixel and CAPI)
 */
export async function trackPageView(context?: TrackingContext) {
  const eventId = generateEventId();
  const cookies = getFBCookies();

  // Browser Pixel
  trackMetaEvent('PageView', {}, eventId);

  // Server CAPI
  if (context || cookies.fbp || cookies.fbc) {
    await fetch('/api/tracking/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: 'PageView',
        event_source_url: window.location.href,
        event_id: eventId,
        user_data: {
          ...context,
          ...cookies,
        },
      }),
    }).catch((err) => console.error('CAPI PageView failed:', err));
  }
}

/**
 * Track Lead (demo request, opt-in, etc.)
 */
export async function trackLead(
  contentName: string,
  context?: TrackingContext
) {
  const eventId = generateEventId();
  const cookies = getFBCookies();

  // Browser Pixel
  trackMetaEvent('Lead', { content_name: contentName }, eventId);

  // Server CAPI
  await fetch('/api/tracking/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'Lead',
      event_source_url: window.location.href,
      event_id: eventId,
      user_data: {
        ...context,
        ...cookies,
      },
      custom_data: {
        content_name: contentName,
      },
    }),
  }).catch((err) => console.error('CAPI Lead failed:', err));
}

/**
 * Track CompleteRegistration (signup)
 */
export async function trackCompleteRegistration(
  status: string,
  context?: TrackingContext
) {
  const eventId = generateEventId();
  const cookies = getFBCookies();

  // Browser Pixel
  trackMetaEvent('CompleteRegistration', { status }, eventId);

  // Server CAPI
  await fetch('/api/tracking/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'CompleteRegistration',
      event_source_url: window.location.href,
      event_id: eventId,
      user_data: {
        ...context,
        ...cookies,
      },
      custom_data: {
        status,
      },
    }),
  }).catch((err) => console.error('CAPI CompleteRegistration failed:', err));
}

/**
 * Track AddToCart (first client added)
 */
export async function trackAddToCart(
  contentType: string,
  value?: number,
  currency: string = 'USD',
  context?: TrackingContext
) {
  const eventId = generateEventId();
  const cookies = getFBCookies();

  // Browser Pixel
  trackMetaEvent(
    'AddToCart',
    { content_type: contentType, value, currency },
    eventId
  );

  // Server CAPI
  await fetch('/api/tracking/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'AddToCart',
      event_source_url: window.location.href,
      event_id: eventId,
      user_data: {
        ...context,
        ...cookies,
      },
      custom_data: {
        content_type: contentType,
        value,
        currency,
      },
    }),
  }).catch((err) => console.error('CAPI AddToCart failed:', err));
}

/**
 * Track ViewContent (blog published, content viewed)
 */
export async function trackViewContent(
  contentType: string,
  contentName?: string,
  context?: TrackingContext
) {
  const eventId = generateEventId();
  const cookies = getFBCookies();

  // Browser Pixel
  trackMetaEvent(
    'ViewContent',
    { content_type: contentType, content_name: contentName },
    eventId
  );

  // Server CAPI
  await fetch('/api/tracking/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'ViewContent',
      event_source_url: window.location.href,
      event_id: eventId,
      user_data: {
        ...context,
        ...cookies,
      },
      custom_data: {
        content_type: contentType,
        content_name: contentName,
      },
    }),
  }).catch((err) => console.error('CAPI ViewContent failed:', err));
}

/**
 * Track InitiateCheckout
 */
export async function trackInitiateCheckout(
  value: number,
  currency: string = 'USD',
  contentIds?: string[],
  context?: TrackingContext
) {
  const eventId = generateEventId();
  const cookies = getFBCookies();

  // Browser Pixel
  trackMetaEvent(
    'InitiateCheckout',
    { value, currency, content_ids: contentIds },
    eventId
  );

  // Server CAPI
  await fetch('/api/tracking/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'InitiateCheckout',
      event_source_url: window.location.href,
      event_id: eventId,
      user_data: {
        ...context,
        ...cookies,
      },
      custom_data: {
        value,
        currency,
        content_ids: contentIds,
      },
    }),
  }).catch((err) => console.error('CAPI InitiateCheckout failed:', err));
}

/**
 * Track Purchase
 */
export async function trackPurchase(
  value: number,
  currency: string = 'USD',
  contentIds?: string[],
  context?: TrackingContext
) {
  const eventId = generateEventId();
  const cookies = getFBCookies();

  // Browser Pixel
  trackMetaEvent(
    'Purchase',
    { value, currency, content_ids: contentIds },
    eventId
  );

  // Server CAPI
  await fetch('/api/tracking/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'Purchase',
      event_source_url: window.location.href,
      event_id: eventId,
      user_data: {
        ...context,
        ...cookies,
      },
      custom_data: {
        value,
        currency,
        content_ids: contentIds,
      },
    }),
  }).catch((err) => console.error('CAPI Purchase failed:', err));
}

/**
 * Server-side only tracking (e.g., from webhook handlers)
 * No browser pixel needed
 */
export async function trackServerSideEvent(
  eventName: string,
  eventSourceUrl: string,
  userData: any,
  customData?: any
) {
  const eventId = generateEventId();

  return fetch('/api/tracking/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: eventName,
      event_source_url: eventSourceUrl,
      event_id: eventId,
      user_data: userData,
      custom_data: customData,
    }),
  });
}
