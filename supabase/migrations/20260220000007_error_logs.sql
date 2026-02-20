-- Error Logs Table
-- Stores application errors for monitoring and analysis

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Error details
    endpoint TEXT NOT NULL,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    status_code INTEGER,
    stack_trace TEXT,

    -- Context
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_error_logs_endpoint ON error_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_status_code ON error_logs(status_code);

-- Composite indexes for analytics
CREATE INDEX IF NOT EXISTS idx_error_logs_endpoint_timestamp
    ON error_logs(endpoint, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_type_timestamp
    ON error_logs(error_type, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Only admins can view error logs
CREATE POLICY "Admins can view all error logs"
    ON error_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- System can insert error logs (service role)
CREATE POLICY "System can insert error logs"
    ON error_logs
    FOR INSERT
    WITH CHECK (true);

-- Function to get error rate for an endpoint
CREATE OR REPLACE FUNCTION get_endpoint_error_rate(
    p_endpoint TEXT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
    endpoint TEXT,
    total_errors BIGINT,
    error_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p_endpoint as endpoint,
        COUNT(*)::BIGINT as total_errors,
        ROUND((COUNT(*)::NUMERIC / NULLIF(
            (SELECT COUNT(*) FROM analytics_events
             WHERE timestamp BETWEEN p_start_time AND p_end_time),
            0
        ) * 100), 2) as error_rate
    FROM error_logs
    WHERE error_logs.endpoint = p_endpoint
        AND timestamp BETWEEN p_start_time AND p_end_time;
END;
$$;

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_error_statistics(
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
    total_errors BIGINT,
    unique_endpoints BIGINT,
    unique_error_types BIGINT,
    avg_errors_per_hour NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_errors,
        COUNT(DISTINCT endpoint)::BIGINT as unique_endpoints,
        COUNT(DISTINCT error_type)::BIGINT as unique_error_types,
        ROUND(
            COUNT(*)::NUMERIC /
            NULLIF(EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600, 0),
            2
        ) as avg_errors_per_hour
    FROM error_logs
    WHERE timestamp BETWEEN p_start_time AND p_end_time;
END;
$$;

-- Function to cleanup old error logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM error_logs
    WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Create a scheduled job to clean up old error logs (run weekly)
-- This requires pg_cron extension to be enabled
-- Uncomment the following lines if pg_cron is available:
-- SELECT cron.schedule(
--     'cleanup-old-error-logs',
--     '0 0 * * 0', -- Run at midnight every Sunday
--     $$SELECT cleanup_old_error_logs(90)$$
-- );

-- Comments for documentation
COMMENT ON TABLE error_logs IS 'Stores application errors for monitoring and analysis';
COMMENT ON COLUMN error_logs.endpoint IS 'API endpoint or page where the error occurred';
COMMENT ON COLUMN error_logs.error_type IS 'Type of error (e.g., ValidationError, DatabaseError)';
COMMENT ON COLUMN error_logs.error_message IS 'Error message';
COMMENT ON COLUMN error_logs.status_code IS 'HTTP status code if applicable';
COMMENT ON COLUMN error_logs.stack_trace IS 'Full error stack trace for debugging';
COMMENT ON COLUMN error_logs.metadata IS 'Additional context about the error';
