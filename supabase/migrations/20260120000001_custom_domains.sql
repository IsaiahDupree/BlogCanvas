-- WL-001: Custom Domain Table
-- Database schema for custom domains with verification and SSL status

-- Create custom_domains table
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Domain information
  domain VARCHAR(255) NOT NULL UNIQUE,
  subdomain VARCHAR(100), -- Optional subdomain (e.g., 'shop' in shop.example.com)

  -- Verification
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  verification_token VARCHAR(255) NOT NULL,
  verification_method VARCHAR(50) NOT NULL DEFAULT 'txt', -- 'txt', 'cname', or 'meta'
  verified_at TIMESTAMPTZ,

  -- DNS records for verification
  txt_name VARCHAR(255), -- e.g., '_blogcanvas-verification'
  txt_value VARCHAR(255),
  cname_name VARCHAR(255), -- e.g., 'www'
  cname_value VARCHAR(255), -- e.g., 'cname.blogcanvas.com'

  -- SSL/TLS
  ssl_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  ssl_provider VARCHAR(50) DEFAULT 'lets_encrypt',
  ssl_issued_at TIMESTAMPTZ,
  ssl_expires_at TIMESTAMPTZ,

  -- Cloudflare integration (if using Cloudflare for SaaS)
  cloudflare_zone_id VARCHAR(100),
  cloudflare_custom_hostname_id VARCHAR(100),

  -- Branding settings
  logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(7), -- Hex color
  secondary_color VARCHAR(7),
  font_family VARCHAR(100),
  custom_css TEXT,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_primary BOOLEAN NOT NULL DEFAULT false, -- One domain can be marked as primary

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_custom_domains_vendor_id ON custom_domains(vendor_id);
CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX idx_custom_domains_verification_status ON custom_domains(verification_status);
CREATE INDEX idx_custom_domains_ssl_status ON custom_domains(ssl_status);
CREATE INDEX idx_custom_domains_active ON custom_domains(is_active);

-- Enable Row Level Security
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Vendors can view their own domains
CREATE POLICY "Vendors can view own custom domains"
  ON custom_domains
  FOR SELECT
  USING (auth.uid() = vendor_id);

-- Vendors can insert their own domains
CREATE POLICY "Vendors can create custom domains"
  ON custom_domains
  FOR INSERT
  WITH CHECK (auth.uid() = vendor_id);

-- Vendors can update their own domains
CREATE POLICY "Vendors can update own custom domains"
  ON custom_domains
  FOR UPDATE
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

-- Vendors can delete their own domains
CREATE POLICY "Vendors can delete own custom domains"
  ON custom_domains
  FOR DELETE
  USING (auth.uid() = vendor_id);

-- Public read access for active, verified domains (for routing)
CREATE POLICY "Public can view active verified domains"
  ON custom_domains
  FOR SELECT
  USING (
    is_active = true
    AND verification_status = 'verified'
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_custom_domains_updated_at
  BEFORE UPDATE ON custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_domains_updated_at();

-- Create function to ensure only one primary domain per vendor
CREATE OR REPLACE FUNCTION ensure_single_primary_domain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Unset is_primary for all other domains of this vendor
    UPDATE custom_domains
    SET is_primary = false
    WHERE vendor_id = NEW.vendor_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain single primary domain
CREATE TRIGGER ensure_single_primary_domain_trigger
  BEFORE INSERT OR UPDATE ON custom_domains
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_domain();

-- Create domain_verification_logs table for audit trail
CREATE TABLE IF NOT EXISTS domain_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_domain_id UUID NOT NULL REFERENCES custom_domains(id) ON DELETE CASCADE,

  -- Log details
  action VARCHAR(100) NOT NULL, -- 'verification_attempt', 'verification_success', 'ssl_issued', etc.
  status VARCHAR(50) NOT NULL,
  details JSONB,
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_domain_verification_logs_domain_id ON domain_verification_logs(custom_domain_id);
CREATE INDEX idx_domain_verification_logs_created_at ON domain_verification_logs(created_at DESC);

-- Enable RLS
ALTER TABLE domain_verification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy - vendors can view logs for their domains
CREATE POLICY "Vendors can view logs for their domains"
  ON domain_verification_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM custom_domains
      WHERE custom_domains.id = domain_verification_logs.custom_domain_id
      AND custom_domains.vendor_id = auth.uid()
    )
  );

-- Insert policy for system to create logs
CREATE POLICY "System can create verification logs"
  ON domain_verification_logs
  FOR INSERT
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE custom_domains IS 'Custom domains for vendor white-labeling';
COMMENT ON COLUMN custom_domains.verification_token IS 'Unique token for domain ownership verification';
COMMENT ON COLUMN custom_domains.verification_status IS 'pending, verifying, verified, failed';
COMMENT ON COLUMN custom_domains.ssl_status IS 'pending, provisioning, active, failed, expired';
COMMENT ON TABLE domain_verification_logs IS 'Audit trail for domain verification and SSL provisioning';
