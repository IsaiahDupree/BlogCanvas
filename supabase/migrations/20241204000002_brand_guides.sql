-- Brand messaging and content requirement tables

-- Brand messaging guides (from docs or website)
CREATE TABLE IF NOT EXISTS brand_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source TEXT, -- 'uploaded_doc', 'website_scrape', 'manual'
  source_url TEXT,
  brand_name TEXT,
  tagline TEXT,
  voice_traits JSONB, -- array of voice characteristics
  tone_guidelines JSONB,
  messaging_hierarchy JSONB,
  donts JSONB, -- array of things to avoid
  products_services JSONB, -- array of offerings
  target_audiences JSONB,
  value_propositions JSONB,
  full_content TEXT, -- raw content from document
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product/service catalog
CREATE TABLE IF NOT EXISTS products_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_guide_id UUID REFERENCES brand_guides(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  key_features JSONB,
  benefits JSONB,
  pricing_info TEXT,
  use_cases JSONB,
  target_audience TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products_services(brand_guide_id);

-- FAQ library
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_guide_id UUID REFERENCES brand_guides(id) ON DELETE CASCADE,
  category TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords JSONB,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_brand ON faqs(brand_guide_id);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);

-- Comparison tables/data
CREATE TABLE IF NOT EXISTS comparison_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_guide_id UUID REFERENCES brand_guides(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  columns JSONB, -- array of column definitions
  rows JSONB, -- array of row data
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comparison_brand ON comparison_tables(brand_guide_id);

-- Content requirements templates
CREATE TABLE IF NOT EXISTS content_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  content_type TEXT, -- 'how-to', 'listicle', 'comparison', etc.
  required_sections JSONB,
  optional_elements JSONB, -- tables, FAQs, images, etc.
  word_count_range JSONB, -- {min: 1000, max: 2000}
  seo_requirements JSONB,
  tone TEXT,
  target_audience TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog post requirements (per post)
CREATE TABLE IF NOT EXISTS post_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  brand_guide_id UUID REFERENCES brand_guides(id),
  include_faqs BOOLEAN DEFAULT false,
  include_table BOOLEAN DEFAULT false,
  include_comparison BOOLEAN DEFAULT false,
  include_statistics BOOLEAN DEFAULT false,
  custom_requirements JSONB,
  selected_products JSONB, -- product IDs to mention
  selected_faqs JSONB, -- FAQ IDs to include
  selected_tables JSONB, -- table IDs to include
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_requirements_blog ON post_requirements(blog_post_id);

-- Uploaded documents (Word docs, PDFs, etc.)
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_path TEXT,
  extracted_text TEXT,
  analysis_result JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
