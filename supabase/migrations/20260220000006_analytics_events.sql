-- Analytics Events Table
-- Stores user interaction events for analytics and tracking

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event details
    category TEXT NOT NULL,
    action TEXT NOT NULL,
    label TEXT,
    value NUMERIC,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- User context
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,

    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_action ON analytics_events(action);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category_timestamp ON analytics_events(category, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_category_action_timestamp
    ON analytics_events(category, action, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Vendors can insert their own events
CREATE POLICY "Vendors can insert their own events"
    ON analytics_events
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('vendor', 'admin')
        )
    );

-- Vendors can view their own events
CREATE POLICY "Vendors can view their own events"
    ON analytics_events
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('vendor', 'admin')
        )
    );

-- Admins can view all events
CREATE POLICY "Admins can view all events"
    ON analytics_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Function to clean up old analytics events (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete events older than 1 year
    DELETE FROM analytics_events
    WHERE timestamp < NOW() - INTERVAL '1 year';
END;
$$;

-- Create a scheduled job to clean up old events (run monthly)
-- This requires pg_cron extension to be enabled
-- Uncomment the following lines if pg_cron is available:
-- SELECT cron.schedule(
--     'cleanup-old-analytics-events',
--     '0 0 1 * *', -- Run at midnight on the 1st of every month
--     $$SELECT cleanup_old_analytics_events()$$
-- );

-- Comments for documentation
COMMENT ON TABLE analytics_events IS 'Stores user interaction events for analytics and tracking';
COMMENT ON COLUMN analytics_events.category IS 'Event category (user, blog_post, client, order, etc.)';
COMMENT ON COLUMN analytics_events.action IS 'Event action (create, update, delete, view, etc.)';
COMMENT ON COLUMN analytics_events.label IS 'Optional label for the event (e.g., post ID, client ID)';
COMMENT ON COLUMN analytics_events.value IS 'Optional numeric value for the event (e.g., payment amount)';
COMMENT ON COLUMN analytics_events.metadata IS 'Additional metadata for the event';
COMMENT ON COLUMN analytics_events.session_id IS 'Session ID for grouping events';
