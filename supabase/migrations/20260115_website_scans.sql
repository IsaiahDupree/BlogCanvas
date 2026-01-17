-- Website Scans table for storing Browserbase/Puppeteer scan results
-- Stores text content, schema markup, and images from client websites

CREATE TABLE IF NOT EXISTS website_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  scan_type VARCHAR(50) NOT NULL DEFAULT 'full', -- 'full', 'text_only', 'schema_only', 'images_only'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  
  -- Scan configuration
  url TEXT NOT NULL,
  max_pages INTEGER DEFAULT 50,
  max_depth INTEGER DEFAULT 3,
  
  -- Results
  pages_scanned INTEGER DEFAULT 0,
  
  -- Extracted content (stored as JSONB for flexibility)
  text_content JSONB DEFAULT '[]'::jsonb,        -- Array of {url, title, headings, paragraphs, word_count}
  schema_markup JSONB DEFAULT '[]'::jsonb,       -- Array of {url, type, data} for JSON-LD, microdata, etc.
  images JSONB DEFAULT '[]'::jsonb,              -- Array of {url, src, alt, width, height, context}
  
  -- Metadata extracted
  site_metadata JSONB DEFAULT '{}'::jsonb,       -- {title, description, keywords, og_tags, twitter_cards}
  internal_links JSONB DEFAULT '[]'::jsonb,      -- Array of internal link URLs found
  external_links JSONB DEFAULT '[]'::jsonb,      -- Array of external link URLs found
  
  -- Analysis results
  content_analysis JSONB DEFAULT '{}'::jsonb,   -- {total_words, avg_word_count, reading_level, topics}
  seo_elements JSONB DEFAULT '{}'::jsonb,       -- {meta_descriptions, h1_tags, h2_tags, alt_texts}
  
  -- Error tracking
  errors JSONB DEFAULT '[]'::jsonb,              -- Array of {url, error, timestamp}
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_website_scans_website_id ON website_scans(website_id);
CREATE INDEX idx_website_scans_status ON website_scans(status);
CREATE INDEX idx_website_scans_created_at ON website_scans(created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_website_scans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER website_scans_updated_at
  BEFORE UPDATE ON website_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_website_scans_updated_at();

-- RLS Policies
ALTER TABLE website_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scans for their websites"
  ON website_scans FOR SELECT
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      JOIN clients c ON w.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scans for their websites"
  ON website_scans FOR INSERT
  WITH CHECK (
    website_id IN (
      SELECT w.id FROM websites w
      JOIN clients c ON w.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their scans"
  ON website_scans FOR UPDATE
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      JOIN clients c ON w.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );
