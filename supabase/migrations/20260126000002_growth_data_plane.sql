-- =============================================
-- Growth Data Plane for BlogCanvas
-- =============================================
-- Unified event tracking, identity resolution, and segmentation
-- for agency onboarding, client management, and content approval funnels

-- =============================================
-- 1. PERSON (Canonical identity)
-- =============================================
CREATE TABLE IF NOT EXISTS person (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Core identity
  email TEXT UNIQUE,
  phone TEXT,
  name TEXT,

  -- Profile
  company TEXT,
  role TEXT,
  avatar_url TEXT,

  -- Behavioral features (computed from events)
  first_seen_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  active_days INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,

  -- Engagement scores
  engagement_score INTEGER DEFAULT 0, -- 0-100
  lifecycle_stage TEXT DEFAULT 'visitor', -- visitor, lead, signup, activated, paying, churned

  -- Metadata
  source TEXT, -- organic, paid, referral, etc.
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,

  -- RLS
  tenant_id UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_person_email ON person(email);
CREATE INDEX IF NOT EXISTS idx_person_lifecycle_stage ON person(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_person_tenant_id ON person(tenant_id);
CREATE INDEX IF NOT EXISTS idx_person_updated_at ON person(updated_at);

-- RLS
ALTER TABLE person ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own person records"
  ON person FOR SELECT
  USING (auth.uid() = tenant_id);

CREATE POLICY "Users can manage their own person records"
  ON person FOR ALL
  USING (auth.uid() = tenant_id);

-- =============================================
-- 2. IDENTITY_LINK (Cross-system identity mapping)
-- =============================================
CREATE TABLE IF NOT EXISTS identity_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Identity source
  source TEXT NOT NULL, -- 'posthog', 'stripe', 'meta', 'google', 'email', 'supabase'
  external_id TEXT NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  UNIQUE(source, external_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_identity_link_person_id ON identity_link(person_id);
CREATE INDEX IF NOT EXISTS idx_identity_link_source ON identity_link(source);
CREATE INDEX IF NOT EXISTS idx_identity_link_external_id ON identity_link(external_id);

-- RLS
ALTER TABLE identity_link ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own identity links"
  ON identity_link FOR SELECT
  USING (
    person_id IN (
      SELECT id FROM person WHERE tenant_id = auth.uid()
    )
  );

-- =============================================
-- 3. EVENT (Unified event stream)
-- =============================================
CREATE TABLE IF NOT EXISTS event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES person(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Event identity
  event_name TEXT NOT NULL, -- landing_view, demo_requested, signup_completed, etc.
  event_source TEXT NOT NULL, -- web, app, email, stripe, booking, meta
  event_id TEXT, -- For deduplication (esp. Meta Pixel + CAPI)

  -- Context
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,

  -- Event properties (flexible)
  properties JSONB DEFAULT '{}'::jsonb,

  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,

  -- RLS
  tenant_id UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_person_id ON event(person_id);
CREATE INDEX IF NOT EXISTS idx_event_name ON event(event_name);
CREATE INDEX IF NOT EXISTS idx_event_source ON event(event_source);
CREATE INDEX IF NOT EXISTS idx_event_created_at ON event(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_event_id ON event(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_session_id ON event(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_tenant_id ON event(tenant_id);

-- Unique constraint for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_dedup ON event(event_id) WHERE event_id IS NOT NULL;

-- RLS
ALTER TABLE event ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
  ON event FOR SELECT
  USING (auth.uid() = tenant_id);

CREATE POLICY "Users can insert events"
  ON event FOR INSERT
  WITH CHECK (auth.uid() = tenant_id OR tenant_id IS NULL);

-- =============================================
-- 4. EMAIL_MESSAGE (Sent emails log)
-- =============================================
CREATE TABLE IF NOT EXISTS email_message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES person(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Email identity
  message_id TEXT UNIQUE NOT NULL, -- From Resend
  email_to TEXT NOT NULL,
  email_from TEXT NOT NULL,
  subject TEXT,

  -- Campaign info
  template_name TEXT,
  campaign_name TEXT,
  tags JSONB DEFAULT '[]'::jsonb,

  -- Status
  status TEXT DEFAULT 'sent', -- sent, delivered, bounced, complained
  delivered_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  complained_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- RLS
  tenant_id UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_message_person_id ON email_message(person_id);
CREATE INDEX IF NOT EXISTS idx_email_message_message_id ON email_message(message_id);
CREATE INDEX IF NOT EXISTS idx_email_message_created_at ON email_message(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_message_tenant_id ON email_message(tenant_id);

-- RLS
ALTER TABLE email_message ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email messages"
  ON email_message FOR SELECT
  USING (auth.uid() = tenant_id);

-- =============================================
-- 5. EMAIL_EVENT (Email engagement events)
-- =============================================
CREATE TABLE IF NOT EXISTS email_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES email_message(id) ON DELETE CASCADE,
  person_id UUID REFERENCES person(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Event type
  event_type TEXT NOT NULL, -- opened, clicked, bounced, complained, delivered

  -- Click details (if clicked)
  link_url TEXT,
  link_text TEXT,

  -- Metadata
  user_agent TEXT,
  ip_address INET,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- RLS
  tenant_id UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_event_message_id ON email_event(message_id);
CREATE INDEX IF NOT EXISTS idx_email_event_person_id ON email_event(person_id);
CREATE INDEX IF NOT EXISTS idx_email_event_type ON email_event(event_type);
CREATE INDEX IF NOT EXISTS idx_email_event_created_at ON email_event(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_event_tenant_id ON email_event(tenant_id);

-- RLS
ALTER TABLE email_event ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email events"
  ON email_event FOR SELECT
  USING (auth.uid() = tenant_id);

-- =============================================
-- 6. SUBSCRIPTION (Subscription snapshot)
-- =============================================
CREATE TABLE IF NOT EXISTS subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES person(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Stripe identity
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,

  -- Subscription details
  status TEXT NOT NULL, -- active, canceled, past_due, trialing, etc.
  plan_id TEXT,
  plan_name TEXT,
  billing_interval TEXT, -- month, year

  -- Pricing
  amount INTEGER, -- in cents
  currency TEXT DEFAULT 'usd',
  mrr INTEGER, -- Monthly Recurring Revenue in cents

  -- Dates
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- RLS
  tenant_id UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_person_id ON subscription(person_id);
CREATE INDEX IF NOT EXISTS idx_subscription_stripe_subscription_id ON subscription(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON subscription(status);
CREATE INDEX IF NOT EXISTS idx_subscription_tenant_id ON subscription(tenant_id);

-- RLS
ALTER TABLE subscription ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON subscription FOR SELECT
  USING (auth.uid() = tenant_id);

-- =============================================
-- 7. DEAL (Sales pipeline)
-- =============================================
CREATE TABLE IF NOT EXISTS deal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES person(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Deal details
  title TEXT NOT NULL,
  stage TEXT NOT NULL, -- lead, demo_scheduled, proposal, negotiation, closed_won, closed_lost
  value INTEGER, -- in cents
  currency TEXT DEFAULT 'usd',

  -- Dates
  expected_close_date DATE,
  closed_at TIMESTAMP WITH TIME ZONE,

  -- Owner
  owner_id UUID REFERENCES auth.users(id),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- RLS
  tenant_id UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deal_person_id ON deal(person_id);
CREATE INDEX IF NOT EXISTS idx_deal_stage ON deal(stage);
CREATE INDEX IF NOT EXISTS idx_deal_owner_id ON deal(owner_id);
CREATE INDEX IF NOT EXISTS idx_deal_tenant_id ON deal(tenant_id);

-- RLS
ALTER TABLE deal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deals"
  ON deal FOR SELECT
  USING (auth.uid() = tenant_id);

-- =============================================
-- 8. PERSON_FEATURES (Computed behavioral features)
-- =============================================
CREATE TABLE IF NOT EXISTS person_features (
  person_id UUID PRIMARY KEY REFERENCES person(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Engagement metrics (computed from events)
  total_page_views INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  active_days INTEGER DEFAULT 0,
  avg_session_duration_seconds INTEGER,

  -- BlogCanvas-specific actions
  demo_requested BOOLEAN DEFAULT FALSE,
  signup_completed BOOLEAN DEFAULT FALSE,
  first_client_added BOOLEAN DEFAULT FALSE,
  blog_created BOOLEAN DEFAULT FALSE,
  blog_approved BOOLEAN DEFAULT FALSE,
  blog_published BOOLEAN DEFAULT FALSE,
  checkout_started BOOLEAN DEFAULT FALSE,
  purchase_completed BOOLEAN DEFAULT FALSE,

  -- Counts
  clients_added_count INTEGER DEFAULT 0,
  blogs_created_count INTEGER DEFAULT 0,
  blogs_published_count INTEGER DEFAULT 0,

  -- Email engagement
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  email_open_rate NUMERIC(5,2), -- percentage
  email_click_rate NUMERIC(5,2), -- percentage

  -- Last activity dates
  last_page_view_at TIMESTAMP WITH TIME ZONE,
  last_email_opened_at TIMESTAMP WITH TIME ZONE,
  last_email_clicked_at TIMESTAMP WITH TIME ZONE,

  -- Computed scores
  engagement_score INTEGER DEFAULT 0, -- 0-100
  conversion_probability NUMERIC(5,2), -- 0-100

  -- RLS
  tenant_id UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_person_features_signup_completed ON person_features(signup_completed);
CREATE INDEX IF NOT EXISTS idx_person_features_engagement_score ON person_features(engagement_score);
CREATE INDEX IF NOT EXISTS idx_person_features_tenant_id ON person_features(tenant_id);

-- RLS
ALTER TABLE person_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own person features"
  ON person_features FOR SELECT
  USING (auth.uid() = tenant_id);

-- =============================================
-- 9. SEGMENT (Segment definitions)
-- =============================================
CREATE TABLE IF NOT EXISTS segment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Segment identity
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Segment criteria (SQL WHERE clause or JSON rules)
  criteria JSONB NOT NULL,

  -- Automation triggers
  trigger_email_campaign TEXT, -- Campaign to send when entering segment
  trigger_webhook_url TEXT, -- Webhook to call when entering segment

  -- Stats
  member_count INTEGER DEFAULT 0,

  -- Ownership
  created_by UUID REFERENCES auth.users(id),
  is_system BOOLEAN DEFAULT FALSE, -- System-defined vs user-defined

  -- RLS
  tenant_id UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_segment_slug ON segment(slug);
CREATE INDEX IF NOT EXISTS idx_segment_tenant_id ON segment(tenant_id);

-- RLS
ALTER TABLE segment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own segments"
  ON segment FOR SELECT
  USING (auth.uid() = tenant_id OR is_system = TRUE);

-- =============================================
-- 10. SEGMENT_MEMBERSHIP (Person <> Segment mapping)
-- =============================================
CREATE TABLE IF NOT EXISTS segment_membership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES segment(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exited_at TIMESTAMP WITH TIME ZONE,

  -- RLS
  tenant_id UUID REFERENCES auth.users(id),

  UNIQUE(segment_id, person_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_segment_membership_segment_id ON segment_membership(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_membership_person_id ON segment_membership(person_id);
CREATE INDEX IF NOT EXISTS idx_segment_membership_tenant_id ON segment_membership(tenant_id);

-- RLS
ALTER TABLE segment_membership ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own segment memberships"
  ON segment_membership FOR SELECT
  USING (auth.uid() = tenant_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update person.updated_at on change
CREATE OR REPLACE FUNCTION update_person_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_person_updated_at
BEFORE UPDATE ON person
FOR EACH ROW
EXECUTE FUNCTION update_person_updated_at();

-- Update subscription.updated_at on change
CREATE TRIGGER trigger_update_subscription_updated_at
BEFORE UPDATE ON subscription
FOR EACH ROW
EXECUTE FUNCTION update_person_updated_at();

-- =============================================
-- SEED DATA: System Segments
-- =============================================
INSERT INTO segment (slug, name, description, is_system, criteria) VALUES
('warm_lead', 'Warm Leads', 'Users who requested a demo', TRUE, '{"demo_requested": true}'::jsonb),
('new_signup', 'New Signups', 'Users who completed signup', TRUE, '{"signup_completed": true}'::jsonb),
('activated', 'Activated Users', 'Users who added their first client', TRUE, '{"first_client_added": true}'::jsonb),
('aha_moment', 'Aha Moment', 'Users who had their first blog approved', TRUE, '{"blog_approved": true}'::jsonb),
('first_value', 'First Value', 'Users who published their first blog', TRUE, '{"blog_published": true}'::jsonb),
('checkout_started', 'Checkout Started', 'Users who started checkout', TRUE, '{"checkout_started": true}'::jsonb),
('newsletter_clicker', 'Newsletter Clickers', 'High email engagement users', TRUE, '{"email_click_rate": {"$gte": 10}}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SUCCESS
-- =============================================
-- Migration complete!
