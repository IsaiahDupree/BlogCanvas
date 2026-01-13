-- Migration: Add SLA Tracking System
-- Created: 2026-01-12
-- Purpose: Track review SLAs for editor and client reviews, send alerts for breaches

-- Add timestamp tracking to blog_posts for SLA monitoring
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Create vendor SLA settings table
CREATE TABLE IF NOT EXISTS vendor_sla_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) UNIQUE NOT NULL,

  -- Editor review SLA (internal team review)
  editor_sla_hours INTEGER DEFAULT 24,
  editor_alert_threshold_hours INTEGER DEFAULT 20,

  -- Client review SLA (client approval)
  client_sla_hours INTEGER DEFAULT 72,
  client_alert_threshold_hours INTEGER DEFAULT 60,

  -- Alert configuration
  enable_alerts BOOLEAN DEFAULT true,
  alert_recipients JSONB DEFAULT '[]'::JSONB, -- Array of email addresses

  -- Escalation configuration (optional)
  escalation_enabled BOOLEAN DEFAULT false,
  escalation_hours INTEGER DEFAULT 48,
  escalation_recipients JSONB DEFAULT '[]'::JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vendor lookups
CREATE INDEX IF NOT EXISTS idx_vendor_sla_settings_vendor ON vendor_sla_settings(vendor_id);

-- Create SLA tracking table
CREATE TABLE IF NOT EXISTS review_sla_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  client_id UUID REFERENCES clients(id),

  -- SLA type: 'editor_review' or 'client_review'
  sla_type TEXT NOT NULL CHECK (sla_type IN ('editor_review', 'client_review')),

  -- Timestamps
  submitted_at TIMESTAMPTZ NOT NULL,
  sla_deadline_at TIMESTAMPTZ NOT NULL,
  alert_threshold_at TIMESTAMPTZ NOT NULL,

  -- Alert tracking
  alert_sent_at TIMESTAMPTZ,
  escalation_sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'alerted', 'escalated', 'completed', 'cancelled')),

  -- Metrics
  review_duration_hours NUMERIC(10, 2),
  breached BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_review_sla_status ON review_sla_tracking(status, sla_deadline_at);
CREATE INDEX IF NOT EXISTS idx_review_sla_vendor ON review_sla_tracking(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_review_sla_blog_post ON review_sla_tracking(blog_post_id, sla_type);
CREATE INDEX IF NOT EXISTS idx_review_sla_pending ON review_sla_tracking(status) WHERE status IN ('pending', 'alerted');

-- Create function to calculate SLA deadlines
CREATE OR REPLACE FUNCTION calculate_sla_deadline(
  p_submitted_at TIMESTAMPTZ,
  p_sla_hours INTEGER
) RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN p_submitted_at + (p_sla_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to start SLA tracking when post moves to review
CREATE OR REPLACE FUNCTION start_sla_tracking()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor_id UUID;
  v_sla_settings RECORD;
  v_sla_type TEXT;
  v_sla_hours INTEGER;
  v_alert_threshold_hours INTEGER;
BEGIN
  -- Only track specific status transitions
  IF NEW.status IN ('ready_for_review', 'client_review') AND OLD.status != NEW.status THEN

    -- Get vendor_id from blog post
    SELECT vendor_id INTO v_vendor_id FROM blog_posts WHERE id = NEW.id;

    -- Determine SLA type based on status
    IF NEW.status = 'ready_for_review' THEN
      v_sla_type := 'editor_review';
      NEW.submitted_for_review_at := NOW();
    ELSIF NEW.status = 'client_review' THEN
      v_sla_type := 'client_review';
    END IF;

    -- Get SLA settings for this vendor (with defaults if not configured)
    SELECT
      COALESCE(editor_sla_hours, 24) as editor_sla_hours,
      COALESCE(editor_alert_threshold_hours, 20) as editor_alert_threshold_hours,
      COALESCE(client_sla_hours, 72) as client_sla_hours,
      COALESCE(client_alert_threshold_hours, 60) as client_alert_threshold_hours,
      COALESCE(enable_alerts, true) as enable_alerts
    INTO v_sla_settings
    FROM vendor_sla_settings
    WHERE vendor_id = v_vendor_id;

    -- Use defaults if no settings found
    IF NOT FOUND THEN
      v_sla_settings.editor_sla_hours := 24;
      v_sla_settings.editor_alert_threshold_hours := 20;
      v_sla_settings.client_sla_hours := 72;
      v_sla_settings.client_alert_threshold_hours := 60;
      v_sla_settings.enable_alerts := true;
    END IF;

    -- Set SLA hours based on type
    IF v_sla_type = 'editor_review' THEN
      v_sla_hours := v_sla_settings.editor_sla_hours;
      v_alert_threshold_hours := v_sla_settings.editor_alert_threshold_hours;
    ELSE
      v_sla_hours := v_sla_settings.client_sla_hours;
      v_alert_threshold_hours := v_sla_settings.client_alert_threshold_hours;
    END IF;

    -- Create SLA tracking record
    INSERT INTO review_sla_tracking (
      blog_post_id,
      vendor_id,
      client_id,
      sla_type,
      submitted_at,
      sla_deadline_at,
      alert_threshold_at,
      status,
      metadata
    ) VALUES (
      NEW.id,
      v_vendor_id,
      NEW.client_id,
      v_sla_type,
      NOW(),
      calculate_sla_deadline(NOW(), v_sla_hours),
      calculate_sla_deadline(NOW(), v_alert_threshold_hours),
      'pending',
      jsonb_build_object(
        'status_changed_from', OLD.status,
        'status_changed_to', NEW.status,
        'sla_hours', v_sla_hours,
        'alert_threshold_hours', v_alert_threshold_hours
      )
    );
  END IF;

  -- Mark SLA as completed when review is done
  IF NEW.status IN ('approved', 'rejected', 'editing') AND OLD.status IN ('ready_for_review', 'client_review') THEN
    NEW.reviewed_at := NOW();

    IF NEW.status = 'rejected' THEN
      NEW.rejected_at := NOW();
    END IF;

    -- Update SLA tracking record
    UPDATE review_sla_tracking
    SET
      status = 'completed',
      completed_at = NOW(),
      review_duration_hours = EXTRACT(EPOCH FROM (NOW() - submitted_at)) / 3600,
      breached = (NOW() > sla_deadline_at),
      updated_at = NOW()
    WHERE blog_post_id = NEW.id
      AND status IN ('pending', 'alerted')
      AND sla_type = CASE
        WHEN OLD.status = 'ready_for_review' THEN 'editor_review'
        WHEN OLD.status = 'client_review' THEN 'client_review'
      END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on blog_posts status changes
DROP TRIGGER IF EXISTS trigger_sla_tracking ON blog_posts;
CREATE TRIGGER trigger_sla_tracking
  BEFORE UPDATE OF status ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION start_sla_tracking();

-- Insert default SLA settings for all existing vendors
INSERT INTO vendor_sla_settings (vendor_id, editor_sla_hours, client_sla_hours, enable_alerts)
SELECT
  id,
  24, -- 24 hours for editor review
  72, -- 72 hours for client review
  true
FROM vendors
WHERE id NOT IN (SELECT vendor_id FROM vendor_sla_settings)
ON CONFLICT (vendor_id) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE vendor_sla_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sla_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_sla_settings
CREATE POLICY "Vendors can view own SLA settings"
  ON vendor_sla_settings
  FOR SELECT
  USING (vendor_id IN (
    SELECT vendor_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Vendors can update own SLA settings"
  ON vendor_sla_settings
  FOR UPDATE
  USING (vendor_id IN (
    SELECT vendor_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Vendors can insert own SLA settings"
  ON vendor_sla_settings
  FOR INSERT
  WITH CHECK (vendor_id IN (
    SELECT vendor_id FROM profiles WHERE id = auth.uid()
  ));

-- RLS Policies for review_sla_tracking
CREATE POLICY "Vendors can view own SLA tracking"
  ON review_sla_tracking
  FOR SELECT
  USING (vendor_id IN (
    SELECT vendor_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "System can manage SLA tracking"
  ON review_sla_tracking
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions to service role for background jobs
GRANT ALL ON vendor_sla_settings TO service_role;
GRANT ALL ON review_sla_tracking TO service_role;

-- Create view for SLA compliance metrics
CREATE OR REPLACE VIEW sla_compliance_metrics AS
SELECT
  vendor_id,
  sla_type,
  COUNT(*) as total_reviews,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_reviews,
  COUNT(*) FILTER (WHERE breached = true) as breached_reviews,
  COUNT(*) FILTER (WHERE breached = false AND completed_at IS NOT NULL) as compliant_reviews,
  ROUND(
    (COUNT(*) FILTER (WHERE breached = false AND completed_at IS NOT NULL)::NUMERIC /
     NULLIF(COUNT(*) FILTER (WHERE completed_at IS NOT NULL), 0)) * 100,
    2
  ) as compliance_rate,
  AVG(review_duration_hours) FILTER (WHERE completed_at IS NOT NULL) as avg_review_duration_hours,
  COUNT(*) FILTER (WHERE status = 'pending' AND NOW() > sla_deadline_at) as current_breaches,
  COUNT(*) FILTER (WHERE status = 'pending' AND NOW() > alert_threshold_at AND NOW() < sla_deadline_at) as approaching_deadline
FROM review_sla_tracking
GROUP BY vendor_id, sla_type;

-- Grant SELECT on view
GRANT SELECT ON sla_compliance_metrics TO authenticated;

COMMENT ON TABLE vendor_sla_settings IS 'SLA configuration per vendor for editor and client reviews';
COMMENT ON TABLE review_sla_tracking IS 'Tracks SLA compliance for each review cycle';
COMMENT ON VIEW sla_compliance_metrics IS 'Real-time SLA compliance metrics by vendor and type';
