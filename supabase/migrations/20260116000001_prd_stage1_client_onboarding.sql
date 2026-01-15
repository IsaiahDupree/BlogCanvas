-- PRD Stage 1: Client Brand Info, Niche, and Goals Input
-- feat-066: Comprehensive client onboarding data capture

-- Add structured fields for PRD Stage 1 requirements
ALTER TABLE clients ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS niche TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- Business goals and SEO objectives
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_goals JSONB DEFAULT '[]'::JSONB;
-- Example: ["Increase organic traffic by 50%", "Rank for 20 target keywords", "Generate 100 leads per month"]

ALTER TABLE clients ADD COLUMN IF NOT EXISTS seo_goals JSONB DEFAULT '{}'::JSONB;
-- Example: {"target_score": 75, "current_score": 45, "target_keywords": ["seo content", "blog writing"], "monthly_traffic_goal": 10000}

ALTER TABLE clients ADD COLUMN IF NOT EXISTS target_markets JSONB DEFAULT '[]'::JSONB;
-- Example: [{"country": "United States", "region": "Northeast", "demographic": "B2B Software Companies"}]

-- Enhanced brand information (complement existing brand_profile)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_values TEXT[];
-- Example: ["Innovation", "Customer-First", "Transparency"]

ALTER TABLE clients ADD COLUMN IF NOT EXISTS key_differentiators TEXT;
-- What makes this brand unique in their market

ALTER TABLE clients ADD COLUMN IF NOT EXISTS content_topics TEXT[];
-- Primary content topics/themes they want to cover

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_industry ON clients(industry);
CREATE INDEX IF NOT EXISTS idx_clients_niche ON clients(niche);
CREATE INDEX IF NOT EXISTS idx_clients_seo_goals ON clients USING GIN(seo_goals);
CREATE INDEX IF NOT EXISTS idx_clients_target_markets ON clients USING GIN(target_markets);

-- Add comments for documentation
COMMENT ON COLUMN clients.industry IS 'PRD Stage 1: Client industry category';
COMMENT ON COLUMN clients.niche IS 'PRD Stage 1: Specific niche within industry';
COMMENT ON COLUMN clients.business_goals IS 'PRD Stage 1: Array of business objectives';
COMMENT ON COLUMN clients.seo_goals IS 'PRD Stage 1: SEO targets (score, keywords, traffic)';
COMMENT ON COLUMN clients.target_markets IS 'PRD Stage 1: Geographic and demographic markets';
COMMENT ON COLUMN clients.brand_values IS 'Core brand values for content alignment';
COMMENT ON COLUMN clients.key_differentiators IS 'What makes this brand unique';
COMMENT ON COLUMN clients.content_topics IS 'Primary content themes to cover';
