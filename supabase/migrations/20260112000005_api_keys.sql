-- API Keys System Migration
-- Allows vendors to create API keys for programmatic access
-- Includes rate limiting and usage tracking

-- ====================================
-- Table: api_keys
-- ====================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL,
  key_hash VARCHAR(255) NOT NULL, -- bcrypt hash of full key
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of scope strings
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 1000,
  rate_limit_per_day INTEGER NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for api_keys
CREATE INDEX idx_api_keys_vendor_id ON api_keys(vendor_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

-- ====================================
-- Table: api_key_usage
-- ====================================
CREATE TABLE IF NOT EXISTS api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for api_key_usage
CREATE INDEX idx_api_key_usage_api_key_id ON api_key_usage(api_key_id);
CREATE INDEX idx_api_key_usage_created_at ON api_key_usage(created_at);
CREATE INDEX idx_api_key_usage_endpoint ON api_key_usage(endpoint);

-- ====================================
-- Table: api_key_rate_limit_buckets
-- ====================================
-- Stores rate limit counters for each time window
CREATE TABLE IF NOT EXISTS api_key_rate_limit_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  window_type VARCHAR(20) NOT NULL, -- 'minute', 'hour', 'day'
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(api_key_id, window_type, window_start)
);

-- Indexes for api_key_rate_limit_buckets
CREATE INDEX idx_rate_limit_buckets_api_key_window ON api_key_rate_limit_buckets(api_key_id, window_type, window_start);
CREATE INDEX idx_rate_limit_buckets_window_start ON api_key_rate_limit_buckets(window_start);

-- ====================================
-- Enable Row Level Security
-- ====================================
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- ====================================
-- RLS Policies: api_keys
-- ====================================
-- Vendors can view their own API keys
CREATE POLICY api_keys_select_own ON api_keys
  FOR SELECT
  USING (
    vendor_id IN (
      SELECT vendor_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Vendors can create API keys
CREATE POLICY api_keys_insert_own ON api_keys
  FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT vendor_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Vendors can update their own API keys (name, scopes, is_active, rate limits)
CREATE POLICY api_keys_update_own ON api_keys
  FOR UPDATE
  USING (
    vendor_id IN (
      SELECT vendor_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    vendor_id IN (
      SELECT vendor_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Vendors can delete their own API keys
CREATE POLICY api_keys_delete_own ON api_keys
  FOR DELETE
  USING (
    vendor_id IN (
      SELECT vendor_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- ====================================
-- RLS Policies: api_key_usage
-- ====================================
-- Vendors can view usage for their API keys
CREATE POLICY api_key_usage_select_own ON api_key_usage
  FOR SELECT
  USING (
    api_key_id IN (
      SELECT id
      FROM api_keys
      WHERE vendor_id IN (
        SELECT vendor_id
        FROM profiles
        WHERE profiles.id = auth.uid()
      )
    )
  );

-- Service role can insert usage records (for API authentication middleware)
CREATE POLICY api_key_usage_insert_service ON api_key_usage
  FOR INSERT
  WITH CHECK (true);

-- ====================================
-- RLS Policies: api_key_rate_limit_buckets
-- ====================================
-- Service role has full access (for rate limiting middleware)
CREATE POLICY rate_limit_buckets_all_service ON api_key_rate_limit_buckets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ====================================
-- Functions
-- ====================================

-- Function to get current rate limit usage for an API key
CREATE OR REPLACE FUNCTION get_api_key_rate_limits(p_api_key_id UUID)
RETURNS TABLE(
  minute_count INTEGER,
  hour_count INTEGER,
  day_count INTEGER,
  minute_limit INTEGER,
  hour_limit INTEGER,
  day_limit INTEGER
) AS $$
DECLARE
  v_minute_start TIMESTAMPTZ := date_trunc('minute', now());
  v_hour_start TIMESTAMPTZ := date_trunc('hour', now());
  v_day_start TIMESTAMPTZ := date_trunc('day', now());
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT request_count FROM api_key_rate_limit_buckets
              WHERE api_key_id = p_api_key_id
              AND window_type = 'minute'
              AND window_start = v_minute_start), 0) AS minute_count,
    COALESCE((SELECT request_count FROM api_key_rate_limit_buckets
              WHERE api_key_id = p_api_key_id
              AND window_type = 'hour'
              AND window_start = v_hour_start), 0) AS hour_count,
    COALESCE((SELECT request_count FROM api_key_rate_limit_buckets
              WHERE api_key_id = p_api_key_id
              AND window_type = 'day'
              AND window_start = v_day_start), 0) AS day_count,
    ak.rate_limit_per_minute,
    ak.rate_limit_per_hour,
    ak.rate_limit_per_day
  FROM api_keys ak
  WHERE ak.id = p_api_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment rate limit bucket
CREATE OR REPLACE FUNCTION increment_rate_limit_bucket(
  p_api_key_id UUID,
  p_window_type VARCHAR,
  p_window_start TIMESTAMPTZ
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO api_key_rate_limit_buckets (api_key_id, window_type, window_start, request_count)
  VALUES (p_api_key_id, p_window_type, p_window_start, 1)
  ON CONFLICT (api_key_id, window_type, window_start)
  DO UPDATE SET
    request_count = api_key_rate_limit_buckets.request_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old rate limit buckets (run via cron)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_buckets()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM api_key_rate_limit_buckets
  WHERE window_start < now() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get API key usage stats
CREATE OR REPLACE FUNCTION get_api_key_usage_stats(
  p_api_key_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT now() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE(
  total_requests BIGINT,
  successful_requests BIGINT,
  failed_requests BIGINT,
  avg_response_time_ms NUMERIC,
  requests_by_endpoint JSONB,
  requests_by_day JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_requests,
    COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 400) AS successful_requests,
    COUNT(*) FILTER (WHERE status_code >= 400) AS failed_requests,
    ROUND(AVG(response_time_ms), 2) AS avg_response_time_ms,
    jsonb_object_agg(endpoint, endpoint_count) FILTER (WHERE endpoint IS NOT NULL) AS requests_by_endpoint,
    jsonb_object_agg(request_date, day_count) FILTER (WHERE request_date IS NOT NULL) AS requests_by_day
  FROM (
    SELECT
      status_code,
      response_time_ms,
      endpoint,
      COUNT(*) OVER (PARTITION BY endpoint) AS endpoint_count,
      date_trunc('day', created_at)::date AS request_date,
      COUNT(*) OVER (PARTITION BY date_trunc('day', created_at)) AS day_count
    FROM api_key_usage
    WHERE api_key_id = p_api_key_id
    AND created_at >= p_start_date
    AND created_at <= p_end_date
  ) subquery;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================
-- Triggers
-- ====================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limit_buckets_updated_at
  BEFORE UPDATE ON api_key_rate_limit_buckets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- Comments
-- ====================================
COMMENT ON TABLE api_keys IS 'API keys for programmatic access to the BlogCanvas API';
COMMENT ON TABLE api_key_usage IS 'Tracks API key usage for analytics and auditing';
COMMENT ON TABLE api_key_rate_limit_buckets IS 'Rate limiting counters for API keys';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 8 characters of the key for identification (e.g., bc_live_12345678...)';
COMMENT ON COLUMN api_keys.key_hash IS 'bcrypt hash of the full API key';
COMMENT ON COLUMN api_keys.scopes IS 'Array of permission scopes (e.g., ["posts:read", "posts:write", "analytics:read"])';
