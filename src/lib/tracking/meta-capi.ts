import crypto from 'crypto';

/**
 * Meta Conversions API (CAPI) Integration
 * Sends server-side events to Facebook for attribution and deduplication
 */

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string; // Facebook browser ID (from _fbp cookie)
  fbc?: string; // Facebook click ID (from _fbc cookie)
}

interface CustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  status?: string;
  [key: string]: any;
}

interface CAPIEvent {
  event_name: string;
  event_time: number;
  event_id?: string;
  event_source_url: string;
  action_source: 'website' | 'email' | 'app';
  user_data: UserData;
  custom_data?: CustomData;
}

/**
 * Hash PII data with SHA256 for privacy
 * Meta requires email/phone to be hashed before sending
 */
export function hashPII(value: string | undefined): string | undefined {
  if (!value) return undefined;

  // Normalize: lowercase and trim whitespace
  const normalized = value.toLowerCase().trim();

  // SHA256 hash
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Send event to Meta Conversions API
 */
export async function sendMetaCAPIEvent(event: CAPIEvent): Promise<boolean> {
  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  const accessToken = process.env.FB_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('Meta CAPI: Missing FB_PIXEL_ID or FB_CAPI_ACCESS_TOKEN');
    return false;
  }

  // Hash PII in user_data
  const hashedUserData = {
    ...event.user_data,
    em: hashPII(event.user_data.email),
    ph: hashPII(event.user_data.phone),
    fn: hashPII(event.user_data.firstName),
    ln: hashPII(event.user_data.lastName),
    ct: hashPII(event.user_data.city),
    st: hashPII(event.user_data.state),
    zp: hashPII(event.user_data.zip),
    country: hashPII(event.user_data.country),
  };

  // Remove unhashed fields
  delete hashedUserData.email;
  delete hashedUserData.phone;
  delete hashedUserData.firstName;
  delete hashedUserData.lastName;
  delete hashedUserData.city;
  delete hashedUserData.state;
  delete hashedUserData.zip;

  const payload = {
    data: [
      {
        event_name: event.event_name,
        event_time: event.event_time,
        event_id: event.event_id,
        event_source_url: event.event_source_url,
        action_source: event.action_source,
        user_data: hashedUserData,
        custom_data: event.custom_data,
      },
    ],
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Meta CAPI error:', error);
      return false;
    }

    const result = await response.json();
    console.log('Meta CAPI success:', result);
    return true;
  } catch (error) {
    console.error('Failed to send Meta CAPI event:', error);
    return false;
  }
}

/**
 * Generate a unique event ID for deduplication between browser pixel and server CAPI
 */
export function generateEventId(): string {
  return `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Track PageView event via CAPI
 */
export async function trackPageViewCAPI(
  eventId: string,
  eventSourceUrl: string,
  userData: UserData
): Promise<boolean> {
  return sendMetaCAPIEvent({
    event_name: 'PageView',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: userData,
  });
}

/**
 * Track Lead event via CAPI
 */
export async function trackLeadCAPI(
  eventId: string,
  eventSourceUrl: string,
  userData: UserData,
  contentName?: string
): Promise<boolean> {
  return sendMetaCAPIEvent({
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: userData,
    custom_data: contentName ? { content_name: contentName } : undefined,
  });
}

/**
 * Track CompleteRegistration event via CAPI
 */
export async function trackRegistrationCAPI(
  eventId: string,
  eventSourceUrl: string,
  userData: UserData,
  status?: string
): Promise<boolean> {
  return sendMetaCAPIEvent({
    event_name: 'CompleteRegistration',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: userData,
    custom_data: status ? { status } : undefined,
  });
}

/**
 * Track InitiateCheckout event via CAPI
 */
export async function trackCheckoutCAPI(
  eventId: string,
  eventSourceUrl: string,
  userData: UserData,
  value: number,
  currency: string = 'USD',
  contentIds?: string[]
): Promise<boolean> {
  return sendMetaCAPIEvent({
    event_name: 'InitiateCheckout',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: userData,
    custom_data: {
      value,
      currency,
      content_ids: contentIds,
    },
  });
}

/**
 * Track Purchase event via CAPI
 */
export async function trackPurchaseCAPI(
  eventId: string,
  eventSourceUrl: string,
  userData: UserData,
  value: number,
  currency: string = 'USD',
  contentIds?: string[]
): Promise<boolean> {
  return sendMetaCAPIEvent({
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: userData,
    custom_data: {
      value,
      currency,
      content_ids: contentIds,
    },
  });
}

/**
 * Track ViewContent event via CAPI
 */
export async function trackViewContentCAPI(
  eventId: string,
  eventSourceUrl: string,
  userData: UserData,
  contentType: string,
  contentName?: string
): Promise<boolean> {
  return sendMetaCAPIEvent({
    event_name: 'ViewContent',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: userData,
    custom_data: {
      content_type: contentType,
      content_name: contentName,
    },
  });
}

/**
 * Track AddToCart event via CAPI
 */
export async function trackAddToCartCAPI(
  eventId: string,
  eventSourceUrl: string,
  userData: UserData,
  contentType: string,
  value?: number,
  currency: string = 'USD'
): Promise<boolean> {
  return sendMetaCAPIEvent({
    event_name: 'AddToCart',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: userData,
    custom_data: {
      content_type: contentType,
      value,
      currency,
    },
  });
}
