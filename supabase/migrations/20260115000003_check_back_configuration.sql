-- Migration: Add check-back schedule configuration
-- Feature: feat-057 - PRD: Check-back schedule configuration (Day 7, 30, 60, 90)
-- Date: 2026-01-15

-- Create check_back_configurations table
-- Stores customizable check-back schedules per website
CREATE TABLE IF NOT EXISTS check_back_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  intervals JSONB NOT NULL DEFAULT '[7, 30, 60, 90]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_check_back_configurations_website
  ON check_back_configurations(website_id);

-- Add RLS policies
ALTER TABLE check_back_configurations ENABLE ROW LEVEL SECURITY;

-- Allow vendors to read their clients' configurations
CREATE POLICY check_back_configurations_select
  ON check_back_configurations FOR SELECT
  USING (
    website_id IN (
      SELECT websites.id FROM websites
      INNER JOIN clients ON clients.id = websites.client_id
      WHERE clients.vendor_user_id = auth.uid()
    )
  );

-- Allow vendors to manage their clients' configurations
CREATE POLICY check_back_configurations_all
  ON check_back_configurations FOR ALL
  USING (
    website_id IN (
      SELECT websites.id FROM websites
      INNER JOIN clients ON clients.id = websites.client_id
      WHERE clients.vendor_user_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_check_back_configurations_updated_at
  BEFORE UPDATE ON check_back_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add check_type column to check_back_schedules for better tracking
ALTER TABLE check_back_schedules
  ADD COLUMN IF NOT EXISTS check_type TEXT;

-- Add days_after_publish for better tracking
ALTER TABLE check_back_schedules
  ADD COLUMN IF NOT EXISTS days_after_publish INTEGER;

-- Add metrics_snapshot for storing collected metrics
ALTER TABLE check_back_schedules
  ADD COLUMN IF NOT EXISTS metrics_snapshot JSONB;

-- Create index on check_type
CREATE INDEX IF NOT EXISTS idx_check_back_schedules_check_type
  ON check_back_schedules(check_type);

-- Insert default configurations for existing websites
INSERT INTO check_back_configurations (website_id, intervals, enabled)
SELECT
  id as website_id,
  '[7, 30, 60, 90]'::jsonb as intervals,
  true as enabled
FROM websites
WHERE id NOT IN (SELECT website_id FROM check_back_configurations)
ON CONFLICT (website_id) DO NOTHING;

COMMENT ON TABLE check_back_configurations IS 'Stores customizable check-back schedules per website (e.g., Day 7, 30, 60, 90)';
COMMENT ON COLUMN check_back_configurations.intervals IS 'Array of days after publish to schedule check-backs (e.g., [7, 30, 60, 90])';
COMMENT ON COLUMN check_back_configurations.enabled IS 'Whether automatic check-backs are enabled for this website';
