-- Feature Flags System
-- Enables remote feature flags with targeting and gradual rollout

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    targeting_rules JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Feature flag overrides (for specific users/vendors)
CREATE TABLE IF NOT EXISTS feature_flag_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'vendor', 'client')),
    entity_id UUID NOT NULL,
    enabled BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(feature_flag_id, entity_type, entity_id)
);

-- Feature flag usage logs (for analytics)
CREATE TABLE IF NOT EXISTS feature_flag_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'vendor', 'client')),
    entity_id UUID,
    enabled BOOLEAN NOT NULL,
    checked_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX idx_feature_flag_overrides_entity ON feature_flag_overrides(entity_type, entity_id);
CREATE INDEX idx_feature_flag_logs_feature_flag_id ON feature_flag_logs(feature_flag_id);
CREATE INDEX idx_feature_flag_logs_checked_at ON feature_flag_logs(checked_at);

-- RLS policies
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_logs ENABLE ROW LEVEL SECURITY;

-- Feature flags are readable by all authenticated users
CREATE POLICY "Feature flags are readable by authenticated users"
    ON feature_flags
    FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can modify feature flags
CREATE POLICY "Admins can manage feature flags"
    ON feature_flags
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM vendor_profiles
            WHERE vendor_profiles.id = auth.uid()
            AND vendor_profiles.role = 'admin'
        )
    );

-- Overrides are readable by entity owners
CREATE POLICY "Users can read their own feature flag overrides"
    ON feature_flag_overrides
    FOR SELECT
    TO authenticated
    USING (
        (entity_type = 'user' AND entity_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM vendor_profiles
            WHERE vendor_profiles.id = auth.uid()
            AND (
                (entity_type = 'vendor' AND entity_id = vendor_profiles.vendor_id)
                OR vendor_profiles.role = 'admin'
            )
        )
    );

-- Only admins can manage overrides
CREATE POLICY "Admins can manage feature flag overrides"
    ON feature_flag_overrides
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM vendor_profiles
            WHERE vendor_profiles.id = auth.uid()
            AND vendor_profiles.role = 'admin'
        )
    );

-- Feature flag logs are append-only for authenticated users
CREATE POLICY "Authenticated users can create feature flag logs"
    ON feature_flag_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Only admins can read logs
CREATE POLICY "Admins can read feature flag logs"
    ON feature_flag_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM vendor_profiles
            WHERE vendor_profiles.id = auth.uid()
            AND vendor_profiles.role = 'admin'
        )
    );

-- Insert some default feature flags
INSERT INTO feature_flags (key, name, description, enabled, rollout_percentage) VALUES
    ('ai_content_generation', 'AI Content Generation', 'Enable AI-powered content generation features', true, 100),
    ('advanced_analytics', 'Advanced Analytics', 'Enable advanced analytics and reporting features', true, 100),
    ('white_label_domains', 'White Label Domains', 'Enable custom domain support', false, 0),
    ('mobile_pwa', 'Mobile PWA', 'Enable progressive web app features', false, 0),
    ('referral_system', 'Referral System', 'Enable referral and affiliate program', false, 0),
    ('client_self_service', 'Client Self-Service Portal', 'Enable client self-service features', true, 50),
    ('video_uploads', 'Video Uploads', 'Enable video upload and management', false, 0),
    ('multi_language', 'Multi-Language Support', 'Enable internationalization features', false, 0);

-- Function to check if a feature is enabled for an entity
CREATE OR REPLACE FUNCTION is_feature_enabled(
    flag_key TEXT,
    entity_type_param TEXT DEFAULT NULL,
    entity_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    flag_record RECORD;
    override_enabled BOOLEAN;
    rollout_hash INTEGER;
BEGIN
    -- Get the feature flag
    SELECT * INTO flag_record
    FROM feature_flags
    WHERE key = flag_key;

    -- If flag doesn't exist, return false
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Check for entity-specific override
    IF entity_type_param IS NOT NULL AND entity_id_param IS NOT NULL THEN
        SELECT enabled INTO override_enabled
        FROM feature_flag_overrides
        WHERE feature_flag_id = flag_record.id
            AND entity_type = entity_type_param
            AND entity_id = entity_id_param;

        -- If override exists, use it
        IF FOUND THEN
            -- Log the check
            INSERT INTO feature_flag_logs (feature_flag_id, entity_type, entity_id, enabled)
            VALUES (flag_record.id, entity_type_param, entity_id_param, override_enabled);

            RETURN override_enabled;
        END IF;
    END IF;

    -- If flag is not globally enabled, return false
    IF NOT flag_record.enabled THEN
        -- Log the check
        IF entity_type_param IS NOT NULL AND entity_id_param IS NOT NULL THEN
            INSERT INTO feature_flag_logs (feature_flag_id, entity_type, entity_id, enabled)
            VALUES (flag_record.id, entity_type_param, entity_id_param, false);
        END IF;

        RETURN false;
    END IF;

    -- Check rollout percentage
    IF flag_record.rollout_percentage = 100 THEN
        -- Log the check
        IF entity_type_param IS NOT NULL AND entity_id_param IS NOT NULL THEN
            INSERT INTO feature_flag_logs (feature_flag_id, entity_type, entity_id, enabled)
            VALUES (flag_record.id, entity_type_param, entity_id_param, true);
        END IF;

        RETURN true;
    END IF;

    -- If entity_id provided, use deterministic hash for rollout
    IF entity_id_param IS NOT NULL THEN
        -- Hash the entity_id to get a number between 0-99
        rollout_hash := (('x' || substr(md5(entity_id_param::text), 1, 8))::bit(32)::bigint % 100);

        -- Check if hash falls within rollout percentage
        IF rollout_hash < flag_record.rollout_percentage THEN
            -- Log the check
            INSERT INTO feature_flag_logs (feature_flag_id, entity_type, entity_id, enabled)
            VALUES (flag_record.id, entity_type_param, entity_id_param, true);

            RETURN true;
        END IF;
    END IF;

    -- Log the check
    IF entity_type_param IS NOT NULL AND entity_id_param IS NOT NULL THEN
        INSERT INTO feature_flag_logs (feature_flag_id, entity_type, entity_id, enabled)
        VALUES (flag_record.id, entity_type_param, entity_id_param, false);
    END IF;

    RETURN false;
END;
$$;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_flags_updated_at();

CREATE TRIGGER update_feature_flag_overrides_updated_at
    BEFORE UPDATE ON feature_flag_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_flags_updated_at();
