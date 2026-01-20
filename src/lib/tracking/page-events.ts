// Client-side page event tracking utilities

import type { TrackEventInput } from '@/types/analytics';

// Session ID management (stored in sessionStorage)
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('bc_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('bc_session_id', sessionId);
  }
  return sessionId;
}

// UTM parameters extraction
export function getUTMParams(): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
} {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_content: params.get('utm_content') || undefined,
    utm_term: params.get('utm_term') || undefined
  };
}

// Get referrer
export function getReferrer(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return document.referrer || undefined;
}

// Track page view
export async function trackPageView(vendorId: string, pageId: string): Promise<void> {
  const sessionId = getSessionId();
  const utmParams = getUTMParams();
  const referrer = getReferrer();

  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'page_view',
      event_type: 'page',
      vendor_id: vendorId,
      page_id: pageId,
      session_id: sessionId,
      user_type: 'anonymous',
      properties: {
        url: window.location.href,
        pathname: window.location.pathname
      },
      ...utmParams,
      referrer
    } as TrackEventInput)
  }).catch(err => console.error('Failed to track page view:', err));
}

// Track scroll depth
let scrollDepthTracked = new Set<number>();

export function trackScrollDepth(vendorId: string, pageId: string): void {
  if (typeof window === 'undefined') return;

  const sessionId = getSessionId();

  const handleScroll = () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercent = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);

    // Track at 25%, 50%, 75%, 100%
    const milestones = [25, 50, 75, 100];
    for (const milestone of milestones) {
      if (scrollPercent >= milestone && !scrollDepthTracked.has(milestone)) {
        scrollDepthTracked.add(milestone);

        fetch('/api/events/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_name: 'scroll_depth',
            event_type: 'page',
            vendor_id: vendorId,
            page_id: pageId,
            session_id: sessionId,
            user_type: 'anonymous',
            properties: {
              depth_percent: milestone,
              url: window.location.href
            }
          } as TrackEventInput)
        }).catch(err => console.error('Failed to track scroll depth:', err));
      }
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  // Cleanup function
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}

// Track VSL play
export async function trackVSLPlay(vendorId: string, pageId: string, videoUrl: string): Promise<void> {
  const sessionId = getSessionId();

  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'vsl_play',
      event_type: 'page',
      vendor_id: vendorId,
      page_id: pageId,
      session_id: sessionId,
      user_type: 'anonymous',
      properties: {
        video_url: videoUrl,
        url: window.location.href
      }
    } as TrackEventInput)
  }).catch(err => console.error('Failed to track VSL play:', err));
}

// Track VSL complete
export async function trackVSLComplete(vendorId: string, pageId: string, videoUrl: string, watchPercent: number): Promise<void> {
  const sessionId = getSessionId();

  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'vsl_complete',
      event_type: 'page',
      vendor_id: vendorId,
      page_id: pageId,
      session_id: sessionId,
      user_type: 'anonymous',
      properties: {
        video_url: videoUrl,
        watch_percent: watchPercent,
        url: window.location.href
      }
    } as TrackEventInput)
  }).catch(err => console.error('Failed to track VSL complete:', err));
}

// Track CTA click
export async function trackCTAClick(
  vendorId: string,
  pageId: string,
  ctaType: 'primary' | 'secondary',
  ctaText: string,
  ctaLocation: string
): Promise<void> {
  const sessionId = getSessionId();

  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: ctaType === 'primary' ? 'cta_click_primary' : 'cta_click_secondary',
      event_type: 'page',
      vendor_id: vendorId,
      page_id: pageId,
      session_id: sessionId,
      user_type: 'anonymous',
      properties: {
        cta_text: ctaText,
        cta_location: ctaLocation,
        url: window.location.href
      }
    } as TrackEventInput)
  }).catch(err => console.error('Failed to track CTA click:', err));
}

// Track lead submit (opt-in form)
export async function trackLeadSubmit(
  vendorId: string,
  pageId: string,
  email: string,
  formType: string
): Promise<void> {
  const sessionId = getSessionId();

  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'lead_submit',
      event_type: 'page',
      vendor_id: vendorId,
      page_id: pageId,
      session_id: sessionId,
      user_type: 'anonymous',
      properties: {
        email,
        form_type: formType,
        url: window.location.href
      }
    } as TrackEventInput)
  }).catch(err => console.error('Failed to track lead submit:', err));
}

// Time on page tracking
let pageLoadTime: number;
let isPageVisible = true;
let totalVisibleTime = 0;
let lastVisibilityChange = Date.now();

export function trackTimeOnPage(vendorId: string, pageId: string): () => void {
  if (typeof window === 'undefined') return () => {};

  pageLoadTime = Date.now();
  const sessionId = getSessionId();

  // Track visibility changes
  const handleVisibilityChange = () => {
    const now = Date.now();
    if (document.hidden) {
      // Page became hidden
      if (isPageVisible) {
        totalVisibleTime += now - lastVisibilityChange;
        isPageVisible = false;
      }
    } else {
      // Page became visible
      if (!isPageVisible) {
        lastVisibilityChange = now;
        isPageVisible = true;
      }
    }
  };

  // Send time on page when user leaves
  const sendTimeOnPage = () => {
    const now = Date.now();
    if (isPageVisible) {
      totalVisibleTime += now - lastVisibilityChange;
    }

    const timeOnPageSeconds = Math.round(totalVisibleTime / 1000);

    // Use sendBeacon for reliable tracking on page unload
    const data = JSON.stringify({
      event_name: 'time_on_page',
      event_type: 'page',
      vendor_id: vendorId,
      page_id: pageId,
      session_id: sessionId,
      user_type: 'anonymous',
      properties: {
        time_on_page_seconds: timeOnPageSeconds,
        url: window.location.href
      }
    } as TrackEventInput);

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/events/track', data);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', sendTimeOnPage);

  // Cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', sendTimeOnPage);
  };
}
