// Checkout event tracking utilities

import type { TrackEventInput } from '@/types/analytics';
import { getSessionId } from './page-events';

/**
 * Track checkout start event
 */
export async function trackCheckoutStart(
  vendorId: string,
  pageId: string,
  offerId: string,
  amount: number,
  currency: string = 'USD'
): Promise<void> {
  const sessionId = getSessionId();

  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'checkout_start',
      event_type: 'checkout',
      vendor_id: vendorId,
      page_id: pageId,
      session_id: sessionId,
      user_type: 'anonymous',
      properties: {
        offer_id: offerId,
        amount,
        currency,
        url: window.location.href
      }
    } as TrackEventInput)
  }).catch(err => console.error('Failed to track checkout start:', err));
}

/**
 * Track checkout complete event (called from webhook after successful payment)
 */
export async function trackCheckoutComplete(
  vendorId: string,
  pageId: string,
  clientId: string,
  orderId: string,
  offerId: string,
  amount: number,
  currency: string = 'USD',
  sessionId?: string
): Promise<void> {
  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'checkout_complete',
      event_type: 'checkout',
      vendor_id: vendorId,
      page_id: pageId,
      client_id: clientId,
      session_id: sessionId,
      user_type: 'client',
      properties: {
        order_id: orderId,
        offer_id: offerId,
        amount,
        currency
      }
    } as TrackEventInput)
  }).catch(err => console.error('Failed to track checkout complete:', err));
}

/**
 * Track checkout abandoned event
 */
export async function trackCheckoutAbandoned(
  vendorId: string,
  pageId: string,
  offerId: string,
  amount: number,
  currency: string = 'USD'
): Promise<void> {
  const sessionId = getSessionId();

  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'checkout_abandoned',
      event_type: 'checkout',
      vendor_id: vendorId,
      page_id: pageId,
      session_id: sessionId,
      user_type: 'anonymous',
      properties: {
        offer_id: offerId,
        amount,
        currency,
        url: window.location.href
      }
    } as TrackEventInput)
  }).catch(err => console.error('Failed to track checkout abandoned:', err));
}
