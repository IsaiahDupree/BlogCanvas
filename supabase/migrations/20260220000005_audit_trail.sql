-- Audit trail table to track all changes to important entities
-- Records who changed what and when

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was changed
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),

  -- Who made the change
  user_id uuid REFERENCES auth.users(id),
  user_email text,

  -- What changed
  old_values jsonb,
  new_values jsonb,
  changed_fields text[],

  -- When
  created_at timestamp with time zone DEFAULT now(),

  -- Additional context
  ip_address inet,
  user_agent text,
  metadata jsonb
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS audit_logs_table_record_idx ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS audit_logs_user_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins and service role can read audit logs
CREATE POLICY "Service role can view all audit logs"
  ON audit_logs FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT ALL ON audit_logs TO service_role;

-- Function to log an audit entry
CREATE OR REPLACE FUNCTION log_audit(
  p_table_name text,
  p_record_id uuid,
  p_action text,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_changed_fields text[];
  v_audit_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  END IF;

  -- Calculate changed fields for UPDATE actions
  IF p_action = 'UPDATE' AND p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    SELECT array_agg(key)
    INTO v_changed_fields
    FROM (
      SELECT key
      FROM jsonb_each(p_new_values)
      WHERE p_old_values->key IS DISTINCT FROM p_new_values->key
    ) AS changed;
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    user_id,
    user_email,
    old_values,
    new_values,
    changed_fields,
    metadata
  ) VALUES (
    p_table_name,
    p_record_id,
    p_action,
    v_user_id,
    v_user_email,
    p_old_values,
    p_new_values,
    v_changed_fields,
    p_metadata
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_audit TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit TO service_role;

-- Function to get audit history for a record
CREATE OR REPLACE FUNCTION get_audit_history(
  p_table_name text,
  p_record_id uuid,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  action text,
  user_email text,
  changed_fields text[],
  created_at timestamp with time zone,
  old_values jsonb,
  new_values jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.action,
    a.user_email,
    a.changed_fields,
    a.created_at,
    a.old_values,
    a.new_values
  FROM audit_logs a
  WHERE a.table_name = p_table_name
    AND a.record_id = p_record_id
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_audit_history TO authenticated;

-- Add comments
COMMENT ON TABLE audit_logs IS 'Audit trail of all changes to important entities';
COMMENT ON FUNCTION log_audit IS 'Log an audit entry for a change to a record';
COMMENT ON FUNCTION get_audit_history IS 'Get audit history for a specific record';
