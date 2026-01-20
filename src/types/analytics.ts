// Analytics and Event Tracking Types

export type EventType = 'page' | 'checkout' | 'portal' | 'meeting' | 'custom';
export type UserType = 'anonymous' | 'client' | 'vendor';
export type DeviceType = 'desktop' | 'mobile' | 'tablet';

// ============================================================================
// EVENT LOG
// ============================================================================

export interface VendorEvent {
  id: string;

  // Event details
  event_name: string;
  event_type: EventType;

  // Context
  vendor_id?: string;
  page_id?: string;
  client_id?: string;
  workspace_id?: string;
  session_id?: string;

  // User
  user_id?: string;
  user_type?: UserType;

  // Event properties
  properties: Record<string, any>;

  // Attribution
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;

  // Browser/Device
  user_agent?: string;
  ip_address?: string;
  device_type?: DeviceType;
  browser?: string;
  os?: string;

  // Location
  country?: string;
  city?: string;

  created_at: string;
}

export interface TrackEventInput {
  event_name: string;
  event_type: EventType;
  vendor_id?: string;
  page_id?: string;
  client_id?: string;
  workspace_id?: string;
  session_id?: string;
  user_id?: string;
  user_type?: UserType;
  properties?: Record<string, any>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
}

// ============================================================================
// ATTRIBUTION
// ============================================================================

export interface VendorAttribution {
  id: string;
  session_id: string;
  vendor_id: string;

  // First touch
  first_page_id?: string;
  first_utm_source?: string;
  first_utm_medium?: string;
  first_utm_campaign?: string;
  first_utm_content?: string;
  first_utm_term?: string;
  first_referrer?: string;

  // Last touch
  last_page_id?: string;
  last_utm_source?: string;
  last_utm_medium?: string;
  last_utm_campaign?: string;
  last_utm_content?: string;
  last_utm_term?: string;
  last_referrer?: string;

  // Conversion
  converted: boolean;
  converted_at?: string;
  client_id?: string;
  order_id?: string;

  // Timestamps
  first_visit_at: string;
  last_visit_at: string;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// ANALYTICS ROLLUPS
// ============================================================================

export interface VendorDailyRollup {
  id: string;
  vendor_id: string;
  date: string;

  // Page views
  page_views: number;
  unique_visitors: number;

  // Engagement
  avg_time_on_page: number; // Seconds
  avg_scroll_depth: number; // Percentage

  // CTA clicks
  cta_clicks: number;
  cta_click_rate: number; // Percentage

  // Checkout
  checkout_starts: number;
  checkout_completes: number;
  checkout_conversion_rate: number; // Percentage

  // Calls
  call_bookings: number;

  // Revenue
  revenue: number;
  currency: string;

  created_at: string;
  updated_at: string;
}

export interface VendorPageDailyRollup {
  id: string;
  vendor_id: string;
  page_id: string;
  date: string;

  // Page views
  page_views: number;
  unique_visitors: number;

  // Engagement
  avg_time_on_page: number;
  avg_scroll_depth: number;

  // VSL
  vsl_plays: number;
  vsl_completion_rate: number;

  // CTA clicks
  cta_clicks: number;
  cta_click_rate: number;

  // Checkout
  checkout_starts: number;
  checkout_completes: number;
  checkout_conversion_rate: number;

  // Calls
  call_bookings: number;

  // Revenue
  revenue: number;
  currency: string;

  created_at: string;
  updated_at: string;
}

export interface VendorClientEngagement {
  id: string;
  vendor_id: string;
  client_id: string;
  workspace_id?: string;
  week_start: string;

  // Portal activity
  portal_visits: number;
  messages_sent: number;
  forms_submitted: number;
  deliverables_viewed: number;

  // Engagement score (0-100)
  engagement_score: number;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// FUNNEL STATS
// ============================================================================

export interface VendorFunnelStats {
  id: string;
  vendor_id: string;
  page_id?: string;
  session_id: string;

  // Funnel steps
  viewed_page: boolean;
  scrolled_50: boolean;
  played_vsl: boolean;
  clicked_cta: boolean;
  started_checkout: boolean;
  completed_checkout: boolean;

  // Timestamps
  viewed_page_at?: string;
  scrolled_50_at?: string;
  played_vsl_at?: string;
  clicked_cta_at?: string;
  started_checkout_at?: string;
  completed_checkout_at?: string;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// ANALYTICS RESPONSES
// ============================================================================

export interface FunnelMetrics {
  total_visitors: number;
  scrolled_50_percent: number;
  played_vsl: number;
  clicked_cta: number;
  started_checkout: number;
  completed_checkout: number;
  conversion_rate: number;
}

export interface PagePerformance {
  page_id: string;
  page_title: string;
  page_slug: string;
  views: number;
  unique_visitors: number;
  avg_time_on_page: number;
  conversion_rate: number;
  revenue: number;
}

export interface TrafficSource {
  source: string;
  medium?: string;
  campaign?: string;
  visitors: number;
  conversions: number;
  conversion_rate: number;
  revenue: number;
}
