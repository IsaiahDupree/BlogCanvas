-- Conversion Goals Table
-- PRD Epic 6: Track conversions per published post (feat-108)
--
-- This table allows websites to define custom conversion goals
-- that are tracked via GA4 or other analytics platforms.
-- Examples: form submissions, newsletter signups, purchases, downloads

CREATE TABLE IF NOT EXISTS conversion_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE NOT NULL,

  -- Goal Details
  name TEXT NOT NULL, -- e.g., "Newsletter Signup", "Contact Form", "Purchase"
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('event', 'pageview', 'custom')),

  -- GA4 Configuration
  ga4_event_name TEXT, -- GA4 event name (e.g., "form_submit", "purchase")
  ga4_event_parameters JSONB, -- Additional event parameters for filtering

  -- Target/Goal Values
  target_value NUMERIC(10, 2), -- Optional monetary value per conversion
  target_count INTEGER, -- Optional target number of conversions

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversion_goals_website ON conversion_goals(website_id);
CREATE INDEX IF NOT EXISTS idx_conversion_goals_active ON conversion_goals(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE conversion_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Vendors can manage conversion goals for their websites
CREATE POLICY "Vendors can view their conversion goals"
  ON conversion_goals
  FOR SELECT
  USING (
    website_id IN (
      SELECT id FROM websites WHERE vendor_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can create conversion goals"
  ON conversion_goals
  FOR INSERT
  WITH CHECK (
    website_id IN (
      SELECT id FROM websites WHERE vendor_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update their conversion goals"
  ON conversion_goals
  FOR UPDATE
  USING (
    website_id IN (
      SELECT id FROM websites WHERE vendor_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can delete their conversion goals"
  ON conversion_goals
  FOR DELETE
  USING (
    website_id IN (
      SELECT id FROM websites WHERE vendor_id = auth.uid()
    )
  );

-- Clients can view conversion goals for their websites
CREATE POLICY "Clients can view conversion goals for their websites"
  ON conversion_goals
  FOR SELECT
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      JOIN clients c ON c.id = w.client_id
      WHERE c.user_id = auth.uid()
    )
  );

-- Add goal_conversions JSONB column to blog_post_metrics
-- This will store per-goal conversion data like:
-- { "goal_id_1": 5, "goal_id_2": 12, ... }
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_post_metrics' AND column_name = 'goal_conversions'
  ) THEN
    ALTER TABLE blog_post_metrics ADD COLUMN goal_conversions JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add index for goal_conversions JSONB queries
CREATE INDEX IF NOT EXISTS idx_blog_post_metrics_goal_conversions
  ON blog_post_metrics USING gin(goal_conversions);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversion_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversion_goals_updated_at_trigger
  BEFORE UPDATE ON conversion_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_conversion_goals_updated_at();
