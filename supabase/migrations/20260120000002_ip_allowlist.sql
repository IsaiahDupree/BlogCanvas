-- Migration: IP Allowlist System
-- Description: IP-based access control for enhanced security
-- Author: BlogCanvas Team
-- Date: 2026-01-20

-- =====================================================
-- Table: ip_allowlists
-- Description: Stores IP allowlist rules per vendor
-- =====================================================

CREATE TABLE IF NOT EXISTS ip_allowlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who owns this allowlist rule
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- IP address or CIDR range
  ip_address INET NOT NULL,

  -- Description/label for this rule
  label TEXT,
  description TEXT,

  -- Is this rule active
  enabled BOOLEAN DEFAULT true NOT NULL,

  -- Metadata
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_matched_at TIMESTAMPTZ, -- Last time this rule matched a request
  match_count INTEGER DEFAULT 0, -- How many times this rule has matched

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX idx_ip_allowlists_vendor ON ip_allowlists(vendor_id);
CREATE INDEX idx_ip_allowlists_enabled ON ip_allowlists(enabled) WHERE enabled = true;
CREATE INDEX idx_ip_allowlists_ip ON ip_allowlists(ip_address);

-- Composite index for quick lookups
CREATE INDEX idx_ip_allowlists_vendor_enabled ON ip_allowlists(vendor_id, enabled) WHERE enabled = true;

-- =====================================================
-- Table: ip_block_log
-- Description: Logs blocked IP access attempts
-- =====================================================

CREATE TABLE IF NOT EXISTS ip_block_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vendor being accessed
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Request details
  ip_address INET NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  user_agent TEXT,

  -- Reason for blocking
  reason TEXT DEFAULT 'IP not in allowlist',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- Indexes for ip_block_log
-- =====================================================

CREATE INDEX idx_ip_block_log_vendor ON ip_block_log(vendor_id);
CREATE INDEX idx_ip_block_log_ip ON ip_block_log(ip_address);
CREATE INDEX idx_ip_block_log_created_at ON ip_block_log(created_at DESC);

-- Composite index for analytics
CREATE INDEX idx_ip_block_log_vendor_created ON ip_block_log(vendor_id, created_at DESC);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Check if an IP is allowed for a vendor
CREATE OR REPLACE FUNCTION is_ip_allowed(p_vendor_id UUID, p_ip_address INET)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_enabled BOOLEAN;
BEGIN
  -- Check if vendor has IP allowlist enabled
  SELECT ip_allowlist_enabled INTO v_enabled
  FROM vendors
  WHERE id = p_vendor_id;

  -- If allowlist is not enabled, allow all IPs
  IF v_enabled IS NULL OR v_enabled = false THEN
    RETURN true;
  END IF;

  -- Check if IP is in allowlist
  SELECT COUNT(*) INTO v_count
  FROM ip_allowlists
  WHERE vendor_id = p_vendor_id
    AND enabled = true
    AND p_ip_address <<= ip_address; -- Check if IP is within CIDR range

  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Log IP block attempt
CREATE OR REPLACE FUNCTION log_ip_block(
  p_vendor_id UUID,
  p_ip_address INET,
  p_endpoint TEXT,
  p_method TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT 'IP not in allowlist'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO ip_block_log (
    vendor_id,
    ip_address,
    endpoint,
    method,
    user_agent,
    reason
  ) VALUES (
    p_vendor_id,
    p_ip_address,
    p_endpoint,
    p_method,
    p_user_agent,
    p_reason
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Update match statistics for IP allowlist
CREATE OR REPLACE FUNCTION update_ip_match_stats(p_ip_address INET, p_vendor_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE ip_allowlists
  SET
    match_count = match_count + 1,
    last_matched_at = NOW()
  WHERE vendor_id = p_vendor_id
    AND enabled = true
    AND p_ip_address <<= ip_address;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Add allowlist flag to vendors table
-- =====================================================

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS ip_allowlist_enabled BOOLEAN DEFAULT false;

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE ip_allowlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_block_log ENABLE ROW LEVEL SECURITY;

-- Vendors can manage their own IP allowlists
CREATE POLICY "Vendors can view their own IP allowlists"
  ON ip_allowlists FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can create IP allowlist rules"
  ON ip_allowlists FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update their own IP allowlists"
  ON ip_allowlists FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can delete their own IP allowlists"
  ON ip_allowlists FOR DELETE
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- Vendors can view their own block logs
CREATE POLICY "Vendors can view their own block logs"
  ON ip_block_log FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- Service role can insert block logs
CREATE POLICY "Service role can insert block logs"
  ON ip_block_log FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- Cleanup Function
-- =====================================================

-- Delete old block logs (run via cron)
CREATE OR REPLACE FUNCTION cleanup_old_block_logs(p_retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM ip_block_log
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE ip_allowlists IS 'IP allowlist rules for vendor security';
COMMENT ON TABLE ip_block_log IS 'Log of blocked IP access attempts';

COMMENT ON COLUMN ip_allowlists.ip_address IS 'IP address or CIDR range (e.g., 192.168.1.0/24)';
COMMENT ON COLUMN ip_allowlists.match_count IS 'Number of successful matches for analytics';

COMMENT ON FUNCTION is_ip_allowed(UUID, INET) IS 'Check if an IP address is allowed for a vendor';
COMMENT ON FUNCTION log_ip_block(UUID, INET, TEXT, TEXT, TEXT, TEXT) IS 'Log a blocked IP access attempt';
