-- Google Search Console Integration
-- Add support for GSC property connections and search performance data collection

-- GSC Connections table
CREATE TABLE IF NOT EXISTS gsc_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL, -- vendor who owns this connection
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,

  -- GSC Configuration
  site_url TEXT NOT NULL, -- Verified site URL in Search Console (e.g., "https://example.com")
  property_name TEXT,

  -- Authentication (OAuth 2.0)
  client_id_gsc TEXT NOT NULL, -- Google OAuth Client ID
  client_secret_gsc TEXT NOT NULL, -- Google OAuth Client Secret (encrypted)
  refresh_token TEXT NOT NULL, -- OAuth refresh token (encrypted)
  access_token TEXT, -- Temporary access token
  access_token_expires_at TIMESTAMPTZ, -- When access token expires

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

CREATE INDEX IF NOT EXISTS idx_gsc_connections_vendor ON gsc_connections(vendor_id);
CREATE INDEX IF NOT EXISTS idx_gsc_connections_client ON gsc_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_gsc_connections_website ON gsc_connections(website_id);
CREATE INDEX IF NOT EXISTS idx_gsc_connections_status ON gsc_connections(status);
CREATE INDEX IF NOT EXISTS idx_gsc_connections_site_url ON gsc_connections(site_url);

-- RLS Policies for gsc_connections
ALTER TABLE gsc_connections ENABLE ROW LEVEL SECURITY;

-- Vendors can manage their own GSC connections
CREATE POLICY "Vendors can view their GSC connections"
  ON gsc_connections FOR SELECT
  USING (
    vendor_id = auth.uid()
    OR vendor_id IN (
      SELECT vendor_id FROM client_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can manage their GSC connections"
  ON gsc_connections FOR ALL
  USING (
    vendor_id = auth.uid()
    OR vendor_id IN (
      SELECT vendor_id FROM client_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Clients can view GSC connections for their websites
CREATE POLICY "Clients can view their GSC connections"
  ON gsc_connections FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM client_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gsc_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gsc_connections_updated_at
  BEFORE UPDATE ON gsc_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_gsc_connections_updated_at();

-- Enhanced blog_post_metrics with GSC data
-- Add GSC-specific fields to existing table (if not already present)
DO $$
BEGIN
  -- Add GSC tracking fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_post_metrics' AND column_name = 'gsc_data'
  ) THEN
    ALTER TABLE blog_post_metrics ADD COLUMN gsc_data JSONB; -- Raw GSC response
  END IF;

  -- Ensure impressions field exists (should already be there from earlier migration)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_post_metrics' AND column_name = 'impressions'
  ) THEN
    ALTER TABLE blog_post_metrics ADD COLUMN impressions INTEGER DEFAULT 0;
  END IF;

  -- Ensure clicks field exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_post_metrics' AND column_name = 'clicks'
  ) THEN
    ALTER TABLE blog_post_metrics ADD COLUMN clicks INTEGER DEFAULT 0;
  END IF;

  -- Ensure ctr field exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_post_metrics' AND column_name = 'ctr'
  ) THEN
    ALTER TABLE blog_post_metrics ADD COLUMN ctr NUMERIC(5, 2); -- Percentage
  END IF;

  -- Ensure avg_position field exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_post_metrics' AND column_name = 'avg_position'
  ) THEN
    ALTER TABLE blog_post_metrics ADD COLUMN avg_position NUMERIC(6, 2); -- Position (e.g., 3.45)
  END IF;
END $$;

-- Add index for GSC queries
CREATE INDEX IF NOT EXISTS idx_blog_post_metrics_impressions ON blog_post_metrics(impressions DESC);
CREATE INDEX IF NOT EXISTS idx_blog_post_metrics_clicks ON blog_post_metrics(clicks DESC);
CREATE INDEX IF NOT EXISTS idx_blog_post_metrics_position ON blog_post_metrics(avg_position ASC);
