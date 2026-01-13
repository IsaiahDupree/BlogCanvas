-- Migration: Audit Logging System
-- Description: Comprehensive audit trail for all data access and modifications
-- Author: BlogCanvas Team
-- Date: 2026-01-13

-- =====================================================
-- Table: audit_logs
-- Description: Tracks all API calls and data modifications
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who performed the action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,

  -- Action details
  action_type TEXT NOT NULL, -- 'read', 'create', 'update', 'delete', 'auth', 'export', 'import'
  resource_type TEXT NOT NULL, -- 'blog_post', 'client', 'content_batch', 'api_key', etc.
  resource_id UUID, -- ID of the affected resource

  -- Request context
  endpoint TEXT NOT NULL, -- API endpoint called
  method TEXT NOT NULL, -- HTTP method (GET, POST, PUT, DELETE, etc.)
  status_code INTEGER, -- HTTP response status

  -- Change tracking
  changes JSONB, -- Before/after values for updates: {before: {...}, after: {...}}
  metadata JSONB, -- Additional context (filters, search terms, etc.)

  -- Security context
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,

  -- Performance tracking
  duration_ms INTEGER, -- Request duration in milliseconds

  -- Result details
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for performance and search
-- =====================================================

-- Primary lookup indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_vendor_id ON audit_logs(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX idx_audit_logs_client_id ON audit_logs(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_audit_logs_api_key_id ON audit_logs(api_key_id) WHERE api_key_id IS NOT NULL;

-- Action and resource lookup
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id) WHERE resource_id IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action_type, created_at DESC);

-- Time-based queries
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Security and error tracking
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_audit_logs_errors ON audit_logs(success, created_at DESC) WHERE success = false;

-- Endpoint performance tracking
CREATE INDEX idx_audit_logs_endpoint_performance ON audit_logs(endpoint, created_at DESC);

-- Full-text search on changes and metadata
CREATE INDEX idx_audit_logs_changes ON audit_logs USING GIN(changes) WHERE changes IS NOT NULL;
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN(metadata) WHERE metadata IS NOT NULL;

-- =====================================================
-- Table: audit_log_exports
-- Description: Tracks audit log exports for compliance
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_log_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who exported
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,

  -- Export details
  export_type TEXT NOT NULL CHECK (export_type IN ('csv', 'json', 'pdf')),
  filters JSONB, -- What filters were applied
  record_count INTEGER NOT NULL, -- Number of records exported

  -- File details
  file_size_bytes BIGINT,
  file_path TEXT, -- Storage path if saved

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit_log_exports
CREATE INDEX idx_audit_log_exports_user ON audit_log_exports(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_log_exports_vendor ON audit_log_exports(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX idx_audit_log_exports_status ON audit_log_exports(status);
CREATE INDEX idx_audit_log_exports_created_at ON audit_log_exports(created_at DESC);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get vendor_id from user_id
CREATE OR REPLACE FUNCTION get_vendor_id_from_user(p_user_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM vendors WHERE user_id = p_user_id LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get client_id from user_id
CREATE OR REPLACE FUNCTION get_client_id_from_user(p_user_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM clients WHERE user_id = p_user_id LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to log an audit event (can be called from triggers or application code)
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_status_code INTEGER DEFAULT 200,
  p_duration_ms INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_audit_log_id UUID;
  v_vendor_id UUID;
  v_client_id UUID;
BEGIN
  -- Determine vendor/client context
  v_vendor_id := get_vendor_id_from_user(p_user_id);
  v_client_id := get_client_id_from_user(p_user_id);

  INSERT INTO audit_logs (
    user_id,
    vendor_id,
    client_id,
    action_type,
    resource_type,
    resource_id,
    endpoint,
    method,
    status_code,
    changes,
    metadata,
    ip_address,
    user_agent,
    duration_ms,
    success
  ) VALUES (
    p_user_id,
    v_vendor_id,
    v_client_id,
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_endpoint,
    p_method,
    p_status_code,
    p_changes,
    p_metadata,
    p_ip_address,
    p_user_agent,
    p_duration_ms,
    p_status_code >= 200 AND p_status_code < 400
  ) RETURNING id INTO v_audit_log_id;

  RETURN v_audit_log_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Retention Policy Function
-- =====================================================

-- Function to delete old audit logs (run via cron job)
-- Keeps logs for 90 days by default
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(p_retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_exports ENABLE ROW LEVEL SECURITY;

-- Audit Logs Policies
-- Only vendors can view audit logs for their own organization
CREATE POLICY "Vendors can view their own audit logs"
  ON audit_logs FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- Service role can insert audit logs (for system operations)
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- No updates or deletes allowed (audit logs are immutable)
-- Only cleanup function (as superuser) can delete old logs

-- Audit Log Exports Policies
CREATE POLICY "Vendors can view their own exports"
  ON audit_log_exports FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can create exports"
  ON audit_log_exports FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update their own exports"
  ON audit_log_exports FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- Comments and Documentation
-- =====================================================

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail of all system actions for compliance and security';
COMMENT ON TABLE audit_log_exports IS 'Tracks exports of audit logs for compliance reporting';

COMMENT ON COLUMN audit_logs.action_type IS 'Type of action: read, create, update, delete, auth, export, import';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (table name)';
COMMENT ON COLUMN audit_logs.changes IS 'JSON object with before/after values for updates';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context: filters, search terms, query params, etc.';
COMMENT ON COLUMN audit_logs.duration_ms IS 'Request processing time in milliseconds';
