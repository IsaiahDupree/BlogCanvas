-- Vendor Offer Platform - Analytics & Event Tracking
-- This migration creates tables for event tracking, attribution, and analytics

-- ============================================================================
-- EVENT LOG
-- ============================================================================

-- Event log: Track all user events for analytics
CREATE TABLE IF NOT EXISTS vendor_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event details
  event_name TEXT NOT NULL, -- 'page_view', 'scroll_depth', 'cta_click', etc.
  event_type TEXT NOT NULL CHECK (event_type IN ('page', 'checkout', 'portal', 'meeting', 'custom')),

  -- Context
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  page_id UUID REFERENCES offer_pages(id) ON DELETE SET NULL,
  client_id UUID REFERENCES vendor_clients(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES vendor_workspaces(id) ON DELETE SET NULL,
  session_id TEXT, -- Anonymous session tracking

  -- User
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_type TEXT CHECK (user_type IN ('anonymous', 'client', 'vendor', NULL)),

  -- Event properties
  properties JSONB DEFAULT '{}'::jsonb, -- Custom event properties

  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,

  -- Browser/Device
  user_agent TEXT,
  ip_address INET,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', NULL)),
  browser TEXT,
  os TEXT,

  -- Location
  country TEXT,
  city TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_event_log_vendor ON vendor_event_log(vendor_id);
CREATE INDEX idx_vendor_event_log_page ON vendor_event_log(page_id);
CREATE INDEX idx_vendor_event_log_client ON vendor_event_log(client_id);
CREATE INDEX idx_vendor_event_log_workspace ON vendor_event_log(workspace_id);
CREATE INDEX idx_vendor_event_log_session ON vendor_event_log(session_id);
CREATE INDEX idx_vendor_event_log_event_name ON vendor_event_log(event_name);
CREATE INDEX idx_vendor_event_log_event_type ON vendor_event_log(event_type);
CREATE INDEX idx_vendor_event_log_created ON vendor_event_log(created_at DESC);
CREATE INDEX idx_vendor_event_log_vendor_created ON vendor_event_log(vendor_id, created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_vendor_event_log_vendor_page ON vendor_event_log(vendor_id, page_id, created_at DESC);
CREATE INDEX idx_vendor_event_log_funnel ON vendor_event_log(vendor_id, event_name, created_at DESC);

-- ============================================================================
-- ATTRIBUTION
-- ============================================================================

-- Attribution: Track attribution data for sessions/conversions
CREATE TABLE IF NOT EXISTS vendor_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session
  session_id TEXT UNIQUE NOT NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,

  -- First touch
  first_page_id UUID REFERENCES offer_pages(id) ON DELETE SET NULL,
  first_utm_source TEXT,
  first_utm_medium TEXT,
  first_utm_campaign TEXT,
  first_utm_content TEXT,
  first_utm_term TEXT,
  first_referrer TEXT,

  -- Last touch (before conversion)
  last_page_id UUID REFERENCES offer_pages(id) ON DELETE SET NULL,
  last_utm_source TEXT,
  last_utm_medium TEXT,
  last_utm_campaign TEXT,
  last_utm_content TEXT,
  last_utm_term TEXT,
  last_referrer TEXT,

  -- Conversion
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  client_id UUID REFERENCES vendor_clients(id) ON DELETE SET NULL,
  order_id UUID REFERENCES vendor_orders(id) ON DELETE SET NULL,

  -- Timestamps
  first_visit_at TIMESTAMPTZ DEFAULT NOW(),
  last_visit_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_attribution_session ON vendor_attribution(session_id);
CREATE INDEX idx_vendor_attribution_vendor ON vendor_attribution(vendor_id);
CREATE INDEX idx_vendor_attribution_client ON vendor_attribution(client_id);
CREATE INDEX idx_vendor_attribution_converted ON vendor_attribution(converted, converted_at);
CREATE INDEX idx_vendor_attribution_first_page ON vendor_attribution(first_page_id);

-- ============================================================================
-- DAILY ROLLUPS (Pre-aggregated analytics)
-- ============================================================================

-- Daily rollups: Pre-aggregated daily stats per vendor
CREATE TABLE IF NOT EXISTS vendor_daily_rollups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Date
  date DATE NOT NULL,

  -- Page views
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,

  -- Engagement
  avg_time_on_page INTEGER DEFAULT 0, -- Seconds
  avg_scroll_depth INTEGER DEFAULT 0, -- Percentage

  -- CTA clicks
  cta_clicks INTEGER DEFAULT 0,
  cta_click_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage

  -- Checkout
  checkout_starts INTEGER DEFAULT 0,
  checkout_completes INTEGER DEFAULT 0,
  checkout_conversion_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage

  -- Calls
  call_bookings INTEGER DEFAULT 0,

  -- Revenue
  revenue DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, date)
);

CREATE INDEX idx_vendor_daily_rollups_vendor ON vendor_daily_rollups(vendor_id);
CREATE INDEX idx_vendor_daily_rollups_date ON vendor_daily_rollups(date DESC);
CREATE INDEX idx_vendor_daily_rollups_vendor_date ON vendor_daily_rollups(vendor_id, date DESC);

-- ============================================================================
-- PAGE DAILY ROLLUPS
-- ============================================================================

-- Page daily rollups: Pre-aggregated daily stats per page
CREATE TABLE IF NOT EXISTS vendor_page_daily_rollups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES offer_pages(id) ON DELETE CASCADE,

  -- Date
  date DATE NOT NULL,

  -- Page views
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,

  -- Engagement
  avg_time_on_page INTEGER DEFAULT 0, -- Seconds
  avg_scroll_depth INTEGER DEFAULT 0, -- Percentage

  -- VSL
  vsl_plays INTEGER DEFAULT 0,
  vsl_completion_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage

  -- CTA clicks
  cta_clicks INTEGER DEFAULT 0,
  cta_click_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage

  -- Checkout
  checkout_starts INTEGER DEFAULT 0,
  checkout_completes INTEGER DEFAULT 0,
  checkout_conversion_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage

  -- Calls
  call_bookings INTEGER DEFAULT 0,

  -- Revenue
  revenue DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, page_id, date)
);

CREATE INDEX idx_vendor_page_daily_rollups_vendor ON vendor_page_daily_rollups(vendor_id);
CREATE INDEX idx_vendor_page_daily_rollups_page ON vendor_page_daily_rollups(page_id);
CREATE INDEX idx_vendor_page_daily_rollups_date ON vendor_page_daily_rollups(date DESC);
CREATE INDEX idx_vendor_page_daily_rollups_page_date ON vendor_page_daily_rollups(page_id, date DESC);

-- ============================================================================
-- CLIENT ENGAGEMENT ROLLUPS
-- ============================================================================

-- Client engagement rollups: Weekly engagement metrics per client
CREATE TABLE IF NOT EXISTS vendor_client_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES vendor_clients(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES vendor_workspaces(id) ON DELETE CASCADE,

  -- Week
  week_start DATE NOT NULL, -- Monday of the week

  -- Portal activity
  portal_visits INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  forms_submitted INTEGER DEFAULT 0,
  deliverables_viewed INTEGER DEFAULT 0,

  -- Engagement score (0-100)
  engagement_score INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, client_id, week_start)
);

CREATE INDEX idx_vendor_client_engagement_vendor ON vendor_client_engagement(vendor_id);
CREATE INDEX idx_vendor_client_engagement_client ON vendor_client_engagement(client_id);
CREATE INDEX idx_vendor_client_engagement_workspace ON vendor_client_engagement(workspace_id);
CREATE INDEX idx_vendor_client_engagement_week ON vendor_client_engagement(week_start DESC);

-- ============================================================================
-- FUNNEL STATS (Real-time funnel metrics)
-- ============================================================================

-- Funnel stats: Track conversion funnel in real-time
CREATE TABLE IF NOT EXISTS vendor_funnel_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  page_id UUID REFERENCES offer_pages(id) ON DELETE SET NULL,

  -- Session
  session_id TEXT NOT NULL,

  -- Funnel steps (boolean flags)
  viewed_page BOOLEAN DEFAULT false,
  scrolled_50 BOOLEAN DEFAULT false,
  played_vsl BOOLEAN DEFAULT false,
  clicked_cta BOOLEAN DEFAULT false,
  started_checkout BOOLEAN DEFAULT false,
  completed_checkout BOOLEAN DEFAULT false,

  -- Timestamps
  viewed_page_at TIMESTAMPTZ,
  scrolled_50_at TIMESTAMPTZ,
  played_vsl_at TIMESTAMPTZ,
  clicked_cta_at TIMESTAMPTZ,
  started_checkout_at TIMESTAMPTZ,
  completed_checkout_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, page_id)
);

CREATE INDEX idx_vendor_funnel_stats_vendor ON vendor_funnel_stats(vendor_id);
CREATE INDEX idx_vendor_funnel_stats_page ON vendor_funnel_stats(page_id);
CREATE INDEX idx_vendor_funnel_stats_session ON vendor_funnel_stats(session_id);
CREATE INDEX idx_vendor_funnel_stats_completed ON vendor_funnel_stats(completed_checkout, completed_checkout_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Event log: Vendors can view their own events, insert is public for tracking
ALTER TABLE vendor_event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_event_log_vendor_select ON vendor_event_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_event_log.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY vendor_event_log_insert_public ON vendor_event_log
  FOR INSERT WITH CHECK (true); -- Allow anonymous event tracking

-- Attribution: Vendors can view their own attribution data
ALTER TABLE vendor_attribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_attribution_vendor_all ON vendor_attribution
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_attribution.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY vendor_attribution_insert_public ON vendor_attribution
  FOR INSERT WITH CHECK (true); -- Allow anonymous attribution tracking

-- Daily rollups: Vendors can view their own rollups
ALTER TABLE vendor_daily_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_daily_rollups_vendor_all ON vendor_daily_rollups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_daily_rollups.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Page daily rollups: Vendors can view their own rollups
ALTER TABLE vendor_page_daily_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_page_daily_rollups_vendor_all ON vendor_page_daily_rollups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_page_daily_rollups.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Client engagement: Vendors can view their own client engagement
ALTER TABLE vendor_client_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_client_engagement_vendor_all ON vendor_client_engagement
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_client_engagement.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Funnel stats: Vendors can view their own funnel stats
ALTER TABLE vendor_funnel_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_funnel_stats_vendor_all ON vendor_funnel_stats
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_funnel_stats.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY vendor_funnel_stats_insert_public ON vendor_funnel_stats
  FOR INSERT WITH CHECK (true); -- Allow anonymous funnel tracking

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER vendor_attribution_updated_at BEFORE UPDATE ON vendor_attribution
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_daily_rollups_updated_at BEFORE UPDATE ON vendor_daily_rollups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_page_daily_rollups_updated_at BEFORE UPDATE ON vendor_page_daily_rollups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_client_engagement_updated_at BEFORE UPDATE ON vendor_client_engagement
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_funnel_stats_updated_at BEFORE UPDATE ON vendor_funnel_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to compute engagement score
CREATE OR REPLACE FUNCTION compute_engagement_score(
  p_portal_visits INTEGER,
  p_messages_sent INTEGER,
  p_forms_submitted INTEGER,
  p_deliverables_viewed INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Portal visits: 2 points each, max 20
  score := score + LEAST(p_portal_visits * 2, 20);

  -- Messages sent: 10 points each, max 30
  score := score + LEAST(p_messages_sent * 10, 30);

  -- Forms submitted: 20 points each, max 40
  score := score + LEAST(p_forms_submitted * 20, 40);

  -- Deliverables viewed: 2 points each, max 10
  score := score + LEAST(p_deliverables_viewed * 2, 10);

  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
