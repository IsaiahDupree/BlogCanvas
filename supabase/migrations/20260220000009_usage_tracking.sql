-- Usage Tracking Per Tier
-- Tracks feature usage with limits and enforcement per pricing tier

-- Add tier column to vendors table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'tier'
  ) THEN
    ALTER TABLE vendors ADD COLUMN tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'professional', 'enterprise'));
  END IF;
END $$;

-- Pricing tier limits configuration
CREATE TABLE IF NOT EXISTS tier_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier TEXT UNIQUE NOT NULL CHECK (tier IN ('free', 'starter', 'professional', 'enterprise')),
    name TEXT NOT NULL,
    description TEXT,

    -- Feature limits
    max_clients INTEGER DEFAULT -1, -- -1 = unlimited
    max_offers INTEGER DEFAULT -1,
    max_blog_posts INTEGER DEFAULT -1,
    max_storage_mb INTEGER DEFAULT -1,
    max_team_members INTEGER DEFAULT -1,
    max_ai_requests_per_month INTEGER DEFAULT -1,
    max_email_sends_per_month INTEGER DEFAULT -1,
    max_custom_domains INTEGER DEFAULT 0,

    -- Feature access flags
    custom_branding BOOLEAN DEFAULT false,
    white_label BOOLEAN DEFAULT false,
    api_access BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    advanced_analytics BOOLEAN DEFAULT false,

    -- Pricing
    monthly_price_usd DECIMAL(10, 2) DEFAULT 0,
    annual_price_usd DECIMAL(10, 2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,

    -- Usage period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Usage counters
    clients_count INTEGER DEFAULT 0,
    offers_count INTEGER DEFAULT 0,
    blog_posts_count INTEGER DEFAULT 0,
    storage_used_mb INTEGER DEFAULT 0,
    team_members_count INTEGER DEFAULT 0,
    ai_requests_count INTEGER DEFAULT 0,
    email_sends_count INTEGER DEFAULT 0,
    api_calls_count INTEGER DEFAULT 0,

    -- Metadata
    last_calculated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(vendor_id, period_start)
);

-- Usage events (for detailed tracking)
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,

    event_type TEXT NOT NULL CHECK (event_type IN (
        'client_created', 'offer_created', 'blog_post_created',
        'storage_added', 'team_member_added', 'ai_request',
        'email_sent', 'api_call'
    )),

    quantity INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_vendors_tier ON vendors(tier);
CREATE INDEX idx_usage_tracking_vendor ON usage_tracking(vendor_id);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);
CREATE INDEX idx_usage_events_vendor ON usage_events(vendor_id);
CREATE INDEX idx_usage_events_type ON usage_events(event_type);
CREATE INDEX idx_usage_events_created_at ON usage_events(created_at);

-- RLS
ALTER TABLE tier_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Tier limits are public (everyone can see pricing)
CREATE POLICY "Tier limits are publicly readable"
    ON tier_limits
    FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can modify tier limits
CREATE POLICY "Admins can manage tier limits"
    ON tier_limits
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM vendor_profiles
            WHERE vendor_profiles.id = auth.uid()
            AND vendor_profiles.role = 'admin'
        )
    );

-- Vendors can see their own usage
CREATE POLICY "Vendors can view their own usage"
    ON usage_tracking
    FOR SELECT
    TO authenticated
    USING (
        vendor_id IN (
            SELECT vendor_id FROM vendor_profiles
            WHERE vendor_profiles.id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM vendor_profiles
            WHERE vendor_profiles.id = auth.uid()
            AND vendor_profiles.role = 'admin'
        )
    );

-- Usage events are readable by vendor owners
CREATE POLICY "Vendors can view their own usage events"
    ON usage_events
    FOR SELECT
    TO authenticated
    USING (
        vendor_id IN (
            SELECT vendor_id FROM vendor_profiles
            WHERE vendor_profiles.id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM vendor_profiles
            WHERE vendor_profiles.id = auth.uid()
            AND vendor_profiles.role = 'admin'
        )
    );

-- Usage events can be created by the service
CREATE POLICY "Service can create usage events"
    ON usage_events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Insert default tier limits
INSERT INTO tier_limits (tier, name, description, max_clients, max_offers, max_blog_posts, max_storage_mb, max_team_members, max_ai_requests_per_month, max_email_sends_per_month, max_custom_domains, custom_branding, white_label, api_access, priority_support, advanced_analytics, monthly_price_usd, annual_price_usd)
VALUES
    ('free', 'Free', 'Get started with basic features', 3, 5, 10, 100, 1, 50, 100, 0, false, false, false, false, false, 0, 0),
    ('starter', 'Starter', 'Perfect for growing businesses', 10, 20, 50, 1000, 3, 500, 1000, 0, true, false, false, false, false, 29, 290),
    ('professional', 'Professional', 'Advanced features for professionals', 50, 100, 200, 10000, 10, 2000, 5000, 1, true, false, true, false, true, 99, 990),
    ('enterprise', 'Enterprise', 'Unlimited power for large teams', -1, -1, -1, -1, -1, -1, -1, 10, true, true, true, true, true, 299, 2990);

-- Function to record a usage event
CREATE OR REPLACE FUNCTION record_usage_event(
    vendor_id_param UUID,
    event_type_param TEXT,
    quantity_param INTEGER DEFAULT 1,
    metadata_param JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert usage event
    INSERT INTO usage_events (vendor_id, event_type, quantity, metadata)
    VALUES (vendor_id_param, event_type_param, quantity_param, metadata_param);

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error recording usage event: %', SQLERRM;
        RETURN false;
END;
$$;

-- Function to get current usage for a vendor
CREATE OR REPLACE FUNCTION get_current_usage(vendor_id_param UUID)
RETURNS TABLE (
    clients_count INTEGER,
    offers_count INTEGER,
    blog_posts_count INTEGER,
    storage_used_mb INTEGER,
    team_members_count INTEGER,
    ai_requests_count INTEGER,
    email_sends_count INTEGER,
    api_calls_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    period_start_date DATE;
BEGIN
    -- Current month period
    period_start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;

    -- Try to get existing usage record
    RETURN QUERY
    SELECT
        ut.clients_count,
        ut.offers_count,
        ut.blog_posts_count,
        ut.storage_used_mb,
        ut.team_members_count,
        ut.ai_requests_count,
        ut.email_sends_count,
        ut.api_calls_count
    FROM usage_tracking ut
    WHERE ut.vendor_id = vendor_id_param
        AND ut.period_start = period_start_date
    LIMIT 1;

    -- If no record exists, return zeros
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 0::INTEGER, 0::INTEGER, 0::INTEGER, 0::INTEGER, 0::INTEGER, 0::INTEGER, 0::INTEGER, 0::INTEGER;
    END IF;
END;
$$;

-- Function to check if vendor has exceeded limit
CREATE OR REPLACE FUNCTION check_usage_limit(
    vendor_id_param UUID,
    limit_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    vendor_tier TEXT;
    tier_limit_value INTEGER;
    current_usage_value INTEGER;
    result JSONB;
BEGIN
    -- Get vendor's tier
    SELECT tier INTO vendor_tier
    FROM vendors
    WHERE id = vendor_id_param;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'error', 'Vendor not found'
        );
    END IF;

    -- Get tier limit for the requested type
    CASE limit_type
        WHEN 'clients' THEN
            SELECT max_clients INTO tier_limit_value FROM tier_limits WHERE tier = vendor_tier;
            SELECT COUNT(*)::INTEGER INTO current_usage_value FROM vendor_clients WHERE vendor_id = vendor_id_param;
        WHEN 'offers' THEN
            SELECT max_offers INTO tier_limit_value FROM tier_limits WHERE tier = vendor_tier;
            SELECT COUNT(*)::INTEGER INTO current_usage_value FROM offers WHERE vendor_id = vendor_id_param;
        WHEN 'blog_posts' THEN
            SELECT max_blog_posts INTO tier_limit_value FROM tier_limits WHERE tier = vendor_tier;
            SELECT COUNT(*)::INTEGER INTO current_usage_value FROM blog_posts WHERE vendor_id = vendor_id_param;
        WHEN 'team_members' THEN
            SELECT max_team_members INTO tier_limit_value FROM tier_limits WHERE tier = vendor_tier;
            SELECT COUNT(*)::INTEGER INTO current_usage_value FROM vendor_profiles WHERE vendor_id = vendor_id_param;
        WHEN 'ai_requests' THEN
            SELECT max_ai_requests_per_month INTO tier_limit_value FROM tier_limits WHERE tier = vendor_tier;
            SELECT ai_requests_count INTO current_usage_value FROM get_current_usage(vendor_id_param);
        WHEN 'email_sends' THEN
            SELECT max_email_sends_per_month INTO tier_limit_value FROM tier_limits WHERE tier = vendor_tier;
            SELECT email_sends_count INTO current_usage_value FROM get_current_usage(vendor_id_param);
        WHEN 'custom_domains' THEN
            SELECT max_custom_domains INTO tier_limit_value FROM tier_limits WHERE tier = vendor_tier;
            current_usage_value := 0; -- TODO: Implement when custom domains table exists
        ELSE
            RETURN jsonb_build_object(
                'allowed', false,
                'error', 'Invalid limit type'
            );
    END CASE;

    -- Check if limit is unlimited (-1)
    IF tier_limit_value = -1 THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'unlimited', true,
            'current', current_usage_value,
            'tier', vendor_tier
        );
    END IF;

    -- Check if under limit
    IF current_usage_value < tier_limit_value THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'unlimited', false,
            'current', current_usage_value,
            'limit', tier_limit_value,
            'remaining', tier_limit_value - current_usage_value,
            'tier', vendor_tier
        );
    ELSE
        RETURN jsonb_build_object(
            'allowed', false,
            'unlimited', false,
            'current', current_usage_value,
            'limit', tier_limit_value,
            'remaining', 0,
            'tier', vendor_tier,
            'upgrade_required', true
        );
    END IF;
END;
$$;

-- Function to update usage tracking (run periodically)
CREATE OR REPLACE FUNCTION update_usage_tracking(vendor_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    period_start_date DATE;
    period_end_date DATE;
BEGIN
    period_start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    period_end_date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;

    -- Upsert usage tracking record
    INSERT INTO usage_tracking (
        vendor_id,
        period_start,
        period_end,
        clients_count,
        offers_count,
        blog_posts_count,
        team_members_count,
        ai_requests_count,
        email_sends_count,
        api_calls_count,
        last_calculated_at
    )
    SELECT
        vendor_id_param,
        period_start_date,
        period_end_date,
        (SELECT COUNT(*) FROM vendor_clients WHERE vendor_id = vendor_id_param)::INTEGER,
        (SELECT COUNT(*) FROM offers WHERE vendor_id = vendor_id_param)::INTEGER,
        (SELECT COUNT(*) FROM blog_posts WHERE vendor_id = vendor_id_param)::INTEGER,
        (SELECT COUNT(*) FROM vendor_profiles WHERE vendor_id = vendor_id_param)::INTEGER,
        (SELECT COALESCE(SUM(quantity), 0) FROM usage_events WHERE vendor_id = vendor_id_param AND event_type = 'ai_request' AND created_at >= period_start_date)::INTEGER,
        (SELECT COALESCE(SUM(quantity), 0) FROM usage_events WHERE vendor_id = vendor_id_param AND event_type = 'email_sent' AND created_at >= period_start_date)::INTEGER,
        (SELECT COALESCE(SUM(quantity), 0) FROM usage_events WHERE vendor_id = vendor_id_param AND event_type = 'api_call' AND created_at >= period_start_date)::INTEGER,
        NOW()
    ON CONFLICT (vendor_id, period_start)
    DO UPDATE SET
        clients_count = EXCLUDED.clients_count,
        offers_count = EXCLUDED.offers_count,
        blog_posts_count = EXCLUDED.blog_posts_count,
        team_members_count = EXCLUDED.team_members_count,
        ai_requests_count = EXCLUDED.ai_requests_count,
        email_sends_count = EXCLUDED.email_sends_count,
        api_calls_count = EXCLUDED.api_calls_count,
        last_calculated_at = NOW(),
        updated_at = NOW();

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error updating usage tracking: %', SQLERRM;
        RETURN false;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_tier_limits_updated_at
    BEFORE UPDATE ON tier_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_flags_updated_at();

CREATE TRIGGER update_usage_tracking_updated_at
    BEFORE UPDATE ON usage_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_flags_updated_at();
