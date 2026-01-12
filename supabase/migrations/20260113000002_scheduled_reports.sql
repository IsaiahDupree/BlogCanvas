-- Migration: Scheduled Reports System
-- Description: Add scheduled report functionality for automated periodic reporting
-- Author: BlogCanvas Team
-- Date: 2026-01-13

-- =====================================================
-- Table: scheduled_reports
-- Description: Stores recurring report schedules
-- =====================================================

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Report Configuration
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  content_batch_id UUID REFERENCES content_batches(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('email', 'pdf', 'slide_deck')),

  -- Schedule Configuration
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
  -- For weekly: 0 = Sunday, 1 = Monday, etc.
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  -- For monthly: 1-31
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  -- For quarterly: 1 = Jan/Apr/Jul/Oct, 2 = Feb/May/Aug/Nov, 3 = Mar/Jun/Sep/Dec
  quarter_month INTEGER CHECK (quarter_month >= 1 AND quarter_month <= 3),

  -- Report period settings
  -- How many days/weeks/months to include in each report
  period_length INTEGER NOT NULL DEFAULT 30, -- days for monthly, 7 for weekly, etc.
  period_unit TEXT NOT NULL DEFAULT 'days' CHECK (period_unit IN ('days', 'weeks', 'months')),

  -- Delivery Configuration
  recipient_emails TEXT[] NOT NULL, -- Array of email addresses
  include_pdf_attachment BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_vendor ON scheduled_reports(vendor_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_website ON scheduled_reports(website_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_batch ON scheduled_reports(content_batch_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at) WHERE is_active = true;

-- =====================================================
-- Table: scheduled_report_executions
-- Description: Tracks execution history of scheduled reports
-- =====================================================

CREATE TABLE IF NOT EXISTS scheduled_report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id UUID REFERENCES scheduled_reports(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,

  -- Execution details
  execution_status TEXT NOT NULL CHECK (execution_status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Report period for this execution
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Email delivery
  emails_sent_to TEXT[],
  email_sent_at TIMESTAMPTZ,
  email_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_report_executions_schedule ON scheduled_report_executions(scheduled_report_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_report_executions_report ON scheduled_report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_report_executions_status ON scheduled_report_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_scheduled_report_executions_date ON scheduled_report_executions(started_at DESC);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_report_executions ENABLE ROW LEVEL SECURITY;

-- Scheduled Reports Policies
CREATE POLICY "Vendors can view their own scheduled reports"
  ON scheduled_reports FOR SELECT
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can create their own scheduled reports"
  ON scheduled_reports FOR INSERT
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update their own scheduled reports"
  ON scheduled_reports FOR UPDATE
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can delete their own scheduled reports"
  ON scheduled_reports FOR DELETE
  USING (vendor_id = auth.uid());

-- Service role can access all scheduled reports (for cron processing)
CREATE POLICY "Service role can access all scheduled reports"
  ON scheduled_reports FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Scheduled Report Executions Policies
CREATE POLICY "Vendors can view executions of their scheduled reports"
  ON scheduled_report_executions FOR SELECT
  USING (
    scheduled_report_id IN (
      SELECT id FROM scheduled_reports WHERE vendor_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can create executions of their scheduled reports"
  ON scheduled_report_executions FOR INSERT
  WITH CHECK (
    scheduled_report_id IN (
      SELECT id FROM scheduled_reports WHERE vendor_id = auth.uid()
    )
  );

-- Service role can access all executions (for cron processing)
CREATE POLICY "Service role can access all executions"
  ON scheduled_report_executions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- Triggers
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scheduled_reports_updated_at
  BEFORE UPDATE ON scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_reports_updated_at();

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to calculate next run time based on frequency
CREATE OR REPLACE FUNCTION calculate_next_run_time(
  p_frequency TEXT,
  p_day_of_week INTEGER,
  p_day_of_month INTEGER,
  p_quarter_month INTEGER,
  p_last_run_at TIMESTAMPTZ
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next_run TIMESTAMPTZ;
  v_base_time TIMESTAMPTZ;
BEGIN
  -- Start from last run or now
  v_base_time := COALESCE(p_last_run_at, NOW());

  CASE p_frequency
    WHEN 'daily' THEN
      v_next_run := v_base_time + INTERVAL '1 day';

    WHEN 'weekly' THEN
      -- Find next occurrence of the specified day of week
      v_next_run := v_base_time + INTERVAL '1 week';
      -- Adjust to the correct day of week
      v_next_run := v_next_run - (EXTRACT(DOW FROM v_next_run)::INTEGER - p_day_of_week) * INTERVAL '1 day';
      IF v_next_run <= v_base_time THEN
        v_next_run := v_next_run + INTERVAL '1 week';
      END IF;

    WHEN 'monthly' THEN
      -- Add one month and set to specified day
      v_next_run := (DATE_TRUNC('month', v_base_time) + INTERVAL '1 month' + (p_day_of_month - 1) * INTERVAL '1 day');
      IF v_next_run <= v_base_time THEN
        v_next_run := v_next_run + INTERVAL '1 month';
      END IF;

    WHEN 'quarterly' THEN
      -- Add 3 months
      v_next_run := v_base_time + INTERVAL '3 months';

    ELSE
      v_next_run := v_base_time + INTERVAL '1 day';
  END CASE;

  RETURN v_next_run;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE scheduled_reports IS 'Stores recurring report schedules for automated generation and delivery';
COMMENT ON TABLE scheduled_report_executions IS 'Tracks execution history and status of scheduled reports';
COMMENT ON COLUMN scheduled_reports.frequency IS 'How often the report runs: daily, weekly, monthly, quarterly';
COMMENT ON COLUMN scheduled_reports.day_of_week IS 'For weekly reports: 0=Sunday, 1=Monday, etc.';
COMMENT ON COLUMN scheduled_reports.day_of_month IS 'For monthly reports: 1-31';
COMMENT ON COLUMN scheduled_reports.period_length IS 'How many units of time to include in each report';
COMMENT ON COLUMN scheduled_reports.recipient_emails IS 'Array of email addresses to send reports to';
COMMENT ON COLUMN scheduled_reports.is_active IS 'Whether the schedule is currently active';
COMMENT ON COLUMN scheduled_reports.next_run_at IS 'When this schedule should next execute';
