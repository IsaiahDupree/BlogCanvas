-- Data Retention Policies Migration
-- Automated cleanup with audit trail preservation

-- Create retention_logs table to track cleanup operations
CREATE TABLE IF NOT EXISTS retention_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  cutoff_date TIMESTAMPTZ NOT NULL,
  rows_archived INTEGER NOT NULL DEFAULT 0,
  rows_deleted INTEGER NOT NULL DEFAULT 0,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index on retention_logs
CREATE INDEX IF NOT EXISTS idx_retention_logs_table ON retention_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_retention_logs_executed_at ON retention_logs(executed_at);

-- Create archive tables for important data

-- Archive for analytics_events
CREATE TABLE IF NOT EXISTS analytics_events_archive (
  LIKE analytics_events INCLUDING ALL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Archive for funnel_events
CREATE TABLE IF NOT EXISTS funnel_events_archive (
  LIKE funnel_events INCLUDING ALL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Archive for login_history
CREATE TABLE IF NOT EXISTS login_history_archive (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  logged_in_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to clean up old analytics events
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS INTEGER AS $$
DECLARE
  v_cutoff_date TIMESTAMPTZ;
  v_deleted_count INTEGER;
BEGIN
  -- Keep analytics for 90 days
  v_cutoff_date := NOW() - INTERVAL '90 days';

  -- Archive before deleting
  INSERT INTO analytics_events_archive
  SELECT *, NOW() as archived_at
  FROM analytics_events
  WHERE created_at < v_cutoff_date;

  -- Delete old records
  WITH deleted AS (
    DELETE FROM analytics_events
    WHERE created_at < v_cutoff_date
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  -- Log the cleanup
  INSERT INTO retention_logs (
    table_name,
    retention_days,
    cutoff_date,
    rows_deleted,
    executed_at
  ) VALUES (
    'analytics_events',
    90,
    v_cutoff_date,
    v_deleted_count,
    NOW()
  );

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old funnel events
CREATE OR REPLACE FUNCTION cleanup_old_funnel_events()
RETURNS INTEGER AS $$
DECLARE
  v_cutoff_date TIMESTAMPTZ;
  v_deleted_count INTEGER;
BEGIN
  -- Keep funnel events for 180 days
  v_cutoff_date := NOW() - INTERVAL '180 days';

  -- Archive before deleting
  INSERT INTO funnel_events_archive
  SELECT *, NOW() as archived_at
  FROM funnel_events
  WHERE created_at < v_cutoff_date;

  -- Delete old records
  WITH deleted AS (
    DELETE FROM funnel_events
    WHERE created_at < v_cutoff_date
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  -- Log the cleanup
  INSERT INTO retention_logs (
    table_name,
    retention_days,
    cutoff_date,
    rows_deleted,
    executed_at
  ) VALUES (
    'funnel_events',
    180,
    v_cutoff_date,
    v_deleted_count,
    NOW()
  );

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old error logs
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS INTEGER AS $$
DECLARE
  v_cutoff_date TIMESTAMPTZ;
  v_deleted_count INTEGER;
BEGIN
  -- Keep error logs for 30 days
  v_cutoff_date := NOW() - INTERVAL '30 days';

  -- Delete old records (no archive needed)
  WITH deleted AS (
    DELETE FROM error_logs
    WHERE created_at < v_cutoff_date
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  -- Log the cleanup
  INSERT INTO retention_logs (
    table_name,
    retention_days,
    cutoff_date,
    rows_deleted,
    executed_at
  ) VALUES (
    'error_logs',
    30,
    v_cutoff_date,
    v_deleted_count,
    NOW()
  );

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old email logs
CREATE OR REPLACE FUNCTION cleanup_old_email_logs()
RETURNS INTEGER AS $$
DECLARE
  v_cutoff_date TIMESTAMPTZ;
  v_deleted_count INTEGER;
BEGIN
  -- Keep email logs for 90 days
  v_cutoff_date := NOW() - INTERVAL '90 days';

  -- Delete old records
  WITH deleted AS (
    DELETE FROM email_logs
    WHERE created_at < v_cutoff_date
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  -- Log the cleanup
  INSERT INTO retention_logs (
    table_name,
    retention_days,
    cutoff_date,
    rows_deleted,
    executed_at
  ) VALUES (
    'email_logs',
    90,
    v_cutoff_date,
    v_deleted_count,
    NOW()
  );

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Master function to run all retention policies
CREATE OR REPLACE FUNCTION run_all_retention_policies()
RETURNS TABLE (
  policy_name TEXT,
  rows_cleaned INTEGER
) AS $$
BEGIN
  -- Run all cleanup functions
  RETURN QUERY
  SELECT
    'analytics_events'::TEXT,
    cleanup_old_analytics_events();

  RETURN QUERY
  SELECT
    'funnel_events'::TEXT,
    cleanup_old_funnel_events();

  RETURN QUERY
  SELECT
    'error_logs'::TEXT,
    cleanup_old_error_logs();

  RETURN QUERY
  SELECT
    'email_logs'::TEXT,
    cleanup_old_email_logs();
END;
$$ LANGUAGE plpgsql;

-- Function to get retention statistics
CREATE OR REPLACE FUNCTION get_retention_stats()
RETURNS TABLE (
  table_name TEXT,
  total_rows BIGINT,
  rows_to_clean BIGINT,
  retention_days INTEGER,
  oldest_record TIMESTAMPTZ
) AS $$
BEGIN
  -- Analytics events
  RETURN QUERY
  SELECT
    'analytics_events'::TEXT,
    (SELECT COUNT(*) FROM analytics_events),
    (SELECT COUNT(*) FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days'),
    90,
    (SELECT MIN(created_at) FROM analytics_events);

  -- Funnel events
  RETURN QUERY
  SELECT
    'funnel_events'::TEXT,
    (SELECT COUNT(*) FROM funnel_events),
    (SELECT COUNT(*) FROM funnel_events WHERE created_at < NOW() - INTERVAL '180 days'),
    180,
    (SELECT MIN(created_at) FROM funnel_events);

  -- Error logs
  RETURN QUERY
  SELECT
    'error_logs'::TEXT,
    (SELECT COUNT(*) FROM error_logs),
    (SELECT COUNT(*) FROM error_logs WHERE created_at < NOW() - INTERVAL '30 days'),
    30,
    (SELECT MIN(created_at) FROM error_logs);
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on retention_logs
ALTER TABLE retention_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for retention_logs
CREATE POLICY "Admins can view retention logs"
  ON retention_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT ON retention_logs TO authenticated;
GRANT SELECT ON analytics_events_archive TO authenticated;
GRANT SELECT ON funnel_events_archive TO authenticated;

-- Comments
COMMENT ON TABLE retention_logs IS 'Audit trail for data retention cleanup operations';
COMMENT ON TABLE analytics_events_archive IS 'Archive of old analytics events before deletion';
COMMENT ON TABLE funnel_events_archive IS 'Archive of old funnel events before deletion';
COMMENT ON FUNCTION run_all_retention_policies IS 'Execute all data retention cleanup policies';
COMMENT ON FUNCTION get_retention_stats IS 'Get statistics on data retention across tables';
