-- PRD Stage 1: Website URL(s) with target markets and platform detection
-- Feature: feat-067

-- Add target_market and platform fields to websites table
ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS target_market TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT, -- wordpress, webflow, shopify, squarespace, wix, custom, unknown
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false; -- Flag primary website for client

-- Create index for platform filtering
CREATE INDEX IF NOT EXISTS idx_websites_platform ON websites(platform) WHERE platform IS NOT NULL;

-- Create index for primary websites
CREATE INDEX IF NOT EXISTS idx_websites_primary ON websites(client_id, is_primary) WHERE is_primary = true;

-- Add comments
COMMENT ON COLUMN websites.target_market IS 'Geographic or demographic target market for this website (e.g., "United States - B2B SaaS", "United Kingdom - Enterprise")';
COMMENT ON COLUMN websites.platform IS 'Detected CMS/platform: wordpress, webflow, shopify, squarespace, wix, custom, unknown';
COMMENT ON COLUMN websites.is_primary IS 'Whether this is the primary website for the client';

-- Create function to auto-detect platform from URL and HTML
CREATE OR REPLACE FUNCTION detect_website_platform(website_url TEXT, html_content TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  detected_platform TEXT := 'unknown';
BEGIN
  -- Check URL patterns first
  IF website_url LIKE '%wordpress.com%' OR website_url LIKE '%wp.com%' THEN
    RETURN 'wordpress';
  ELSIF website_url LIKE '%webflow.io%' OR website_url LIKE '%webflow.com%' THEN
    RETURN 'webflow';
  ELSIF website_url LIKE '%shopify.com%' OR website_url LIKE '%myshopify.com%' THEN
    RETURN 'shopify';
  ELSIF website_url LIKE '%squarespace.com%' THEN
    RETURN 'squarespace';
  ELSIF website_url LIKE '%wixsite.com%' OR website_url LIKE '%wix.com%' THEN
    RETURN 'wix';
  END IF;

  -- If HTML content is provided, check for platform-specific signatures
  IF html_content IS NOT NULL THEN
    IF html_content ILIKE '%wp-content%' OR html_content ILIKE '%wordpress%' THEN
      RETURN 'wordpress';
    ELSIF html_content ILIKE '%webflow%' THEN
      RETURN 'webflow';
    ELSIF html_content ILIKE '%shopify%' OR html_content ILIKE '%cdn.shopify.com%' THEN
      RETURN 'shopify';
    ELSIF html_content ILIKE '%squarespace%' THEN
      RETURN 'squarespace';
    ELSIF html_content ILIKE '%wix.com%' OR html_content ILIKE '%wixstatic.com%' THEN
      RETURN 'wix';
    END IF;
  END IF;

  RETURN detected_platform;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to validate website URL format
CREATE OR REPLACE FUNCTION validate_website_url(website_url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if URL starts with http:// or https://
  IF website_url !~ '^https?://' THEN
    RETURN false;
  END IF;

  -- Check if URL has a valid domain structure (basic check)
  IF website_url !~ '^https?://[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*' THEN
    RETURN false;
  END IF;

  -- URL is valid
  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint to ensure URL is valid format
ALTER TABLE websites
  ADD CONSTRAINT websites_url_format_check
  CHECK (validate_website_url(url));

-- Add constraint to ensure only one primary website per client
CREATE UNIQUE INDEX IF NOT EXISTS idx_websites_one_primary_per_client
  ON websites(client_id)
  WHERE is_primary = true;

-- Comments on functions
COMMENT ON FUNCTION detect_website_platform(TEXT, TEXT) IS 'Auto-detects website platform (WordPress, Webflow, etc.) from URL and HTML content';
COMMENT ON FUNCTION validate_website_url(TEXT) IS 'Validates that a URL has proper format (http:// or https:// with valid domain)';
