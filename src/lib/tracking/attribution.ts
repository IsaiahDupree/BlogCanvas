// UTM Attribution Tracking Utilities

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface AttributionData extends UTMParams {
  referrer?: string;
  session_id: string;
  vendor_id: string;
  page_id?: string;
}

/**
 * Extract UTM parameters from URL search params
 */
export function extractUTMParams(searchParams: URLSearchParams): UTMParams {
  return {
    utm_source: searchParams.get('utm_source') || undefined,
    utm_medium: searchParams.get('utm_medium') || undefined,
    utm_campaign: searchParams.get('utm_campaign') || undefined,
    utm_content: searchParams.get('utm_content') || undefined,
    utm_term: searchParams.get('utm_term') || undefined
  };
}

/**
 * Get or create session ID for attribution tracking
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  const STORAGE_KEY = 'bc_session_id';
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

  // Check for existing session
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const { id, timestamp } = JSON.parse(stored);
      const now = Date.now();

      // Session is still valid
      if (now - timestamp < SESSION_DURATION) {
        // Update timestamp
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ id, timestamp: now })
        );
        return id;
      }
    } catch (e) {
      // Invalid stored data, create new session
    }
  }

  // Create new session
  const newSessionId = generateSessionId();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      id: newSessionId,
      timestamp: Date.now()
    })
  );

  return newSessionId;
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Store attribution data in session storage for first touch
 */
export function storeAttribution(data: UTMParams & { referrer?: string }): void {
  if (typeof window === 'undefined') return;

  const STORAGE_KEY = 'bc_attribution';

  // Only store if we don't have first touch data yet
  const existing = sessionStorage.getItem(STORAGE_KEY);
  if (!existing) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      timestamp: Date.now()
    }));
  }

  // Always update last touch
  localStorage.setItem('bc_last_attribution', JSON.stringify({
    ...data,
    timestamp: Date.now()
  }));
}

/**
 * Get stored attribution data
 */
export function getStoredAttribution(): {
  first: (UTMParams & { referrer?: string }) | null;
  last: (UTMParams & { referrer?: string }) | null;
} {
  if (typeof window === 'undefined') {
    return { first: null, last: null };
  }

  let first = null;
  let last = null;

  try {
    const firstData = sessionStorage.getItem('bc_attribution');
    if (firstData) {
      first = JSON.parse(firstData);
    }
  } catch (e) {
    // Ignore parse errors
  }

  try {
    const lastData = localStorage.getItem('bc_last_attribution');
    if (lastData) {
      last = JSON.parse(lastData);
    }
  } catch (e) {
    // Ignore parse errors
  }

  return { first, last };
}

/**
 * Track attribution for a page visit
 */
export async function trackAttribution(data: AttributionData): Promise<void> {
  try {
    await fetch('/api/tracking/attribution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error('Failed to track attribution:', error);
  }
}

/**
 * Get referrer URL (cross-browser compatible)
 */
export function getReferrer(): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const referrer = document.referrer;
  if (!referrer || referrer === '') return undefined;

  // Don't track same-domain referrers
  try {
    const referrerUrl = new URL(referrer);
    const currentUrl = new URL(window.location.href);

    if (referrerUrl.hostname === currentUrl.hostname) {
      return undefined;
    }

    return referrer;
  } catch (e) {
    return undefined;
  }
}
