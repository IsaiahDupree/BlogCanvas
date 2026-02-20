-- Funnel Analytics Migration
-- Track user behavior funnels for onboarding, purchase, and adoption

-- Create funnel_events table
CREATE TABLE IF NOT EXISTS funnel_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  funnel_type TEXT NOT NULL CHECK (funnel_type IN ('onboarding', 'purchase', 'adoption')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  page_url TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_funnel_events_user_id ON funnel_events(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_session_id ON funnel_events(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_funnel_type ON funnel_events(funnel_type);
CREATE INDEX IF NOT EXISTS idx_funnel_events_event_type ON funnel_events(event_type);
CREATE INDEX IF NOT EXISTS idx_funnel_events_timestamp ON funnel_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_funnel_events_composite ON funnel_events(funnel_type, timestamp, session_id);

-- Create funnel_summaries table for aggregated data
CREATE TABLE IF NOT EXISTS funnel_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funnel_type TEXT NOT NULL CHECK (funnel_type IN ('onboarding', 'purchase', 'adoption')),
  date DATE NOT NULL,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  completed_sessions INTEGER NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  avg_time_to_convert INTEGER, -- in seconds
  dropoff_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(funnel_type, date)
);

-- Create index on funnel_summaries
CREATE INDEX IF NOT EXISTS idx_funnel_summaries_funnel_date ON funnel_summaries(funnel_type, date);

-- Function to calculate funnel metrics
CREATE OR REPLACE FUNCTION calculate_funnel_metrics(
  p_funnel_type TEXT,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  total_sessions BIGINT,
  completed_sessions BIGINT,
  conversion_rate DECIMAL,
  avg_time_seconds DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH session_events AS (
    SELECT
      session_id,
      MIN(timestamp) as start_time,
      MAX(timestamp) as end_time,
      ARRAY_AGG(event_type ORDER BY timestamp) as events
    FROM funnel_events
    WHERE funnel_type = p_funnel_type
      AND timestamp >= p_start_date
      AND timestamp <= p_end_date
    GROUP BY session_id
  ),
  completed AS (
    SELECT
      session_id,
      EXTRACT(EPOCH FROM (end_time - start_time))::DECIMAL as duration
    FROM session_events
    WHERE
      CASE
        WHEN p_funnel_type = 'onboarding' THEN 'onboarding_completed' = ANY(events)
        WHEN p_funnel_type = 'purchase' THEN 'purchase_completed' = ANY(events)
        WHEN p_funnel_type = 'adoption' THEN 'recurring_user' = ANY(events)
      END
  )
  SELECT
    (SELECT COUNT(DISTINCT session_id) FROM session_events),
    (SELECT COUNT(*) FROM completed),
    CASE
      WHEN (SELECT COUNT(DISTINCT session_id) FROM session_events) > 0
      THEN ((SELECT COUNT(*) FROM completed)::DECIMAL / (SELECT COUNT(DISTINCT session_id) FROM session_events)::DECIMAL * 100)
      ELSE 0
    END,
    COALESCE((SELECT AVG(duration) FROM completed), 0);
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate funnel data daily
CREATE OR REPLACE FUNCTION aggregate_funnel_data()
RETURNS void AS $$
DECLARE
  v_funnel_type TEXT;
  v_date DATE;
  v_metrics RECORD;
BEGIN
  -- Aggregate for each funnel type and yesterday's date
  FOR v_funnel_type IN SELECT UNNEST(ARRAY['onboarding', 'purchase', 'adoption']) LOOP
    v_date := CURRENT_DATE - INTERVAL '1 day';

    SELECT * INTO v_metrics
    FROM calculate_funnel_metrics(
      v_funnel_type,
      v_date::TIMESTAMPTZ,
      (v_date + INTERVAL '1 day')::TIMESTAMPTZ
    );

    INSERT INTO funnel_summaries (
      funnel_type,
      date,
      total_sessions,
      completed_sessions,
      conversion_rate,
      avg_time_to_convert
    ) VALUES (
      v_funnel_type,
      v_date,
      v_metrics.total_sessions,
      v_metrics.completed_sessions,
      v_metrics.conversion_rate,
      v_metrics.avg_time_seconds
    )
    ON CONFLICT (funnel_type, date)
    DO UPDATE SET
      total_sessions = EXCLUDED.total_sessions,
      completed_sessions = EXCLUDED.completed_sessions,
      conversion_rate = EXCLUDED.conversion_rate,
      avg_time_to_convert = EXCLUDED.avg_time_to_convert,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_summaries ENABLE ROW LEVEL SECURITY;

-- RLS policies for funnel_events
CREATE POLICY "Users can insert their own funnel events"
  ON funnel_events
  FOR INSERT
  WITH CHECK (true); -- Allow anonymous events for tracking

CREATE POLICY "Users can view their own funnel events"
  ON funnel_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all funnel events"
  ON funnel_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- RLS policies for funnel_summaries
CREATE POLICY "Authenticated users can view funnel summaries"
  ON funnel_summaries
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT, INSERT ON funnel_events TO authenticated;
GRANT SELECT, INSERT ON funnel_events TO anon; -- For anonymous tracking
GRANT SELECT ON funnel_summaries TO authenticated;

-- Comments
COMMENT ON TABLE funnel_events IS 'Tracks individual funnel events for conversion analysis';
COMMENT ON TABLE funnel_summaries IS 'Aggregated funnel metrics by date';
COMMENT ON FUNCTION calculate_funnel_metrics IS 'Calculate funnel conversion metrics for a date range';
COMMENT ON FUNCTION aggregate_funnel_data IS 'Daily aggregation job for funnel metrics';
