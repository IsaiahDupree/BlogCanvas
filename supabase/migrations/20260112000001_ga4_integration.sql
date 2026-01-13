-- Google Analytics 4 Integration
-- Add support for GA4 property connections and data collection

-- GA4 Connections table
CREATE TABLE IF NOT EXISTS ga4_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL, -- vendor who owns this connection
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,

  -- GA4 Configuration
  property_id TEXT NOT NULL, -- GA4 Property ID (e.g., "123456789")
  property_name TEXT,

  -- Authentication (Service Account JSON)
  service_account_email TEXT NOT NULL,
  service_account_credentials JSONB NOT NULL, -- Encrypted service account JSON key

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_error TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID -- user_id
);

CREATE INDEX IF NOT EXISTS idx_ga4_connections_vendor ON ga4_connections(vendor_id);
CREATE INDEX IF NOT EXISTS idx_ga4_connections_client ON ga4_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_ga4_connections_website ON ga4_connections(website_id);
CREATE INDEX IF NOT EXISTS idx_ga4_connections_status ON ga4_connections(status);

-- RLS Policies for ga4_connections
ALTER TABLE ga4_connections ENABLE ROW LEVEL SECURITY;

-- Vendors can manage their own GA4 connections
CREATE POLICY "Vendors can view their GA4 connections"
  ON ga4_connections FOR SELECT
  USING (
    vendor_id = auth.uid()
    OR vendor_id IN (
      SELECT vendor_id FROM client_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can manage their GA4 connections"
  ON ga4_connections FOR ALL
  USING (
    vendor_id = auth.uid()
    OR vendor_id IN (
      SELECT vendor_id FROM client_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Clients can view GA4 connections for their websites
CREATE POLICY "Clients can view their GA4 connections"
  ON ga4_connections FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM client_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ga4_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ga4_connections_updated_at
  BEFORE UPDATE ON ga4_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_ga4_connections_updated_at();

-- Enhanced blog_post_metrics with GA4 data
-- Add GA4-specific fields to existing table
DO $$
BEGIN
  -- Add GA4 tracking fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_post_metrics' AND column_name = 'page_views'
  ) THEN
    ALTER TABLE blog_post_metrics ADD COLUMN page_views INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_post_metrics' AND column_name = 'unique_users'
  ) THEN
    ALTER TABLE blog_post_metrics ADD COLUMN unique_users INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_post_metrics' AND column_name = 'bounce_rate'
  ) THEN
    ALTER TABLE blog_post_metrics ADD COLUMN bounce_rate NUMERIC(5, 2); -- Percentage
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_post_metrics' AND column_name = 'avg_engagement_time'
  ) THEN
    ALTER TABLE blog_post_metrics ADD COLUMN avg_engagement_time NUMERIC(10, 2); -- Seconds
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_post_metrics' AND column_name = 'scroll_depth'
  ) THEN
    ALTER TABLE blog_post_metrics ADD COLUMN scroll_depth NUMERIC(5, 2); -- Percentage
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_post_metrics' AND column_name = 'ga4_data'
  ) THEN
    ALTER TABLE blog_post_metrics ADD COLUMN ga4_data JSONB; -- Raw GA4 response
  END IF;
END $$;

-- Add index for GA4 queries
CREATE INDEX IF NOT EXISTS idx_blog_post_metrics_page_views ON blog_post_metrics(page_views DESC);
CREATE INDEX IF NOT EXISTS idx_blog_post_metrics_engagement ON blog_post_metrics(avg_engagement_time DESC);
