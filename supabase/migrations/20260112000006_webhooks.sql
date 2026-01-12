-- Webhook System Migration
-- Allows vendors to register webhook endpoints for event notifications
-- Includes delivery tracking, retry logic, and signature verification

-- ====================================
-- Table: webhooks
-- ====================================
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}', -- Array of event names to subscribe to
  secret TEXT NOT NULL, -- HMAC secret for signature verification
  is_active BOOLEAN NOT NULL DEFAULT true,
  retry_count INTEGER NOT NULL DEFAULT 3,
  retry_delay_seconds INTEGER NOT NULL DEFAULT 60, -- Initial retry delay in seconds
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  headers JSONB DEFAULT '{}'::jsonb, -- Custom headers to include in webhook requests
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  last_triggered_at TIMESTAMPTZ
);

-- Indexes for webhooks
CREATE INDEX idx_webhooks_vendor_id ON webhooks(vendor_id);
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX idx_webhooks_events ON webhooks USING GIN(events);

-- ====================================
-- Table: webhook_deliveries
-- ====================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  response_headers JSONB,
  error_message TEXT,
  delivered_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ, -- When delivery finally succeeded or permanently failed
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for webhook_deliveries
CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries(event);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);
CREATE INDEX idx_webhook_deliveries_next_retry_at ON webhook_deliveries(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- ====================================
-- Table: webhook_events_log
-- ====================================
-- Tracks all events that are triggered in the system
CREATE TABLE IF NOT EXISTS webhook_events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  event VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  webhook_count INTEGER NOT NULL DEFAULT 0, -- Number of webhooks triggered for this event
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for webhook_events_log
CREATE INDEX idx_webhook_events_log_vendor_id ON webhook_events_log(vendor_id);
CREATE INDEX idx_webhook_events_log_event ON webhook_events_log(event);
CREATE INDEX idx_webhook_events_log_created_at ON webhook_events_log(created_at);

-- ====================================
-- Enable Row Level Security
-- ====================================
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events_log ENABLE ROW LEVEL SECURITY;

-- ====================================
-- RLS Policies: webhooks
-- ====================================
-- Vendors can view their own webhooks
CREATE POLICY webhooks_select_own ON webhooks
  FOR SELECT
  USING (
    vendor_id IN (
      SELECT vendor_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Vendors can create webhooks
CREATE POLICY webhooks_insert_own ON webhooks
  FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT vendor_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Vendors can update their own webhooks
CREATE POLICY webhooks_update_own ON webhooks
  FOR UPDATE
  USING (
    vendor_id IN (
      SELECT vendor_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Vendors can delete their own webhooks
CREATE POLICY webhooks_delete_own ON webhooks
  FOR DELETE
  USING (
    vendor_id IN (
      SELECT vendor_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- ====================================
-- RLS Policies: webhook_deliveries
-- ====================================
-- Vendors can view deliveries for their webhooks
CREATE POLICY webhook_deliveries_select_own ON webhook_deliveries
  FOR SELECT
  USING (
    webhook_id IN (
      SELECT w.id
      FROM webhooks w
      INNER JOIN profiles p ON w.vendor_id = p.vendor_id
      WHERE p.id = auth.uid()
    )
  );

-- System can insert deliveries (no user authentication required for background jobs)
CREATE POLICY webhook_deliveries_insert_system ON webhook_deliveries
  FOR INSERT
  WITH CHECK (true);

-- System can update deliveries (for retry logic)
CREATE POLICY webhook_deliveries_update_system ON webhook_deliveries
  FOR UPDATE
  USING (true);

-- ====================================
-- RLS Policies: webhook_events_log
-- ====================================
-- Vendors can view their own event logs
CREATE POLICY webhook_events_log_select_own ON webhook_events_log
  FOR SELECT
  USING (
    vendor_id IN (
      SELECT vendor_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- System can insert event logs
CREATE POLICY webhook_events_log_insert_system ON webhook_events_log
  FOR INSERT
  WITH CHECK (true);

-- ====================================
-- Triggers
-- ====================================

-- Update updated_at timestamp on webhooks
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhooks_updated_at_trigger
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhooks_updated_at();

-- ====================================
-- Helper Functions
-- ====================================

-- Function to get webhook delivery statistics
CREATE OR REPLACE FUNCTION get_webhook_delivery_stats(webhook_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_deliveries BIGINT,
  successful_deliveries BIGINT,
  failed_deliveries BIGINT,
  pending_deliveries BIGINT,
  avg_attempts NUMERIC,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_deliveries,
    COUNT(*) FILTER (WHERE status = 'delivered')::BIGINT as successful_deliveries,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_deliveries,
    COUNT(*) FILTER (WHERE status IN ('pending', 'retrying'))::BIGINT as pending_deliveries,
    ROUND(AVG(attempts), 2) as avg_attempts,
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0)) * 100,
      2
    ) as success_rate
  FROM webhook_deliveries
  WHERE webhook_id = webhook_uuid
    AND created_at >= now() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending webhook deliveries for retry
CREATE OR REPLACE FUNCTION get_pending_webhook_deliveries(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  webhook_id UUID,
  webhook_url TEXT,
  webhook_secret TEXT,
  webhook_timeout INTEGER,
  webhook_headers JSONB,
  event VARCHAR(100),
  payload JSONB,
  attempts INTEGER,
  retry_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wd.id,
    wd.webhook_id,
    w.url as webhook_url,
    w.secret as webhook_secret,
    w.timeout_seconds as webhook_timeout,
    w.headers as webhook_headers,
    wd.event,
    wd.payload,
    wd.attempts,
    w.retry_count
  FROM webhook_deliveries wd
  INNER JOIN webhooks w ON wd.webhook_id = w.id
  WHERE w.is_active = true
    AND wd.status IN ('pending', 'retrying')
    AND (wd.next_retry_at IS NULL OR wd.next_retry_at <= now())
    AND wd.attempts < w.retry_count
  ORDER BY wd.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old webhook deliveries (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_deliveries()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_deliveries
  WHERE created_at < now() - INTERVAL '90 days'
    AND status IN ('delivered', 'failed');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================
-- Comments
-- ====================================
COMMENT ON TABLE webhooks IS 'Vendor-configured webhook endpoints for receiving event notifications';
COMMENT ON TABLE webhook_deliveries IS 'Tracks individual webhook delivery attempts with retry logic';
COMMENT ON TABLE webhook_events_log IS 'Audit log of all webhook events triggered in the system';
COMMENT ON COLUMN webhooks.secret IS 'HMAC secret used to sign webhook payloads for verification';
COMMENT ON COLUMN webhooks.retry_count IS 'Maximum number of delivery attempts before marking as failed';
COMMENT ON COLUMN webhooks.retry_delay_seconds IS 'Initial delay between retry attempts (increases exponentially)';
COMMENT ON COLUMN webhook_deliveries.status IS 'Current delivery status: pending, delivered, failed, retrying';
