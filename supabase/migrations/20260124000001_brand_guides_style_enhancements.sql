-- Add style and content guideline columns to brand_guides
-- These columns support the PRD's brand context requirements for AI content generation

-- Add styles_to_avoid column
-- Stores patterns, words, and structural rules to avoid in content
ALTER TABLE brand_guides
ADD COLUMN IF NOT EXISTS styles_to_avoid JSONB DEFAULT '{
  "word_patterns": [],
  "structural_rules": {
    "max_passive_voice_percent": null,
    "max_sentence_length": null,
    "avoid_all_caps": true
  },
  "data_backing": []
}'::jsonb;

-- Add styles_to_keep column
-- Stores preferred patterns and successful content examples with engagement metrics
ALTER TABLE brand_guides
ADD COLUMN IF NOT EXISTS styles_to_keep JSONB DEFAULT '{
  "preferred_patterns": [],
  "successful_examples": [],
  "engagement_metrics": {},
  "auto_learned": []
}'::jsonb;

-- Add image_guidelines column
-- Stores featured image specs, AI generation settings, and alt text rules
ALTER TABLE brand_guides
ADD COLUMN IF NOT EXISTS image_guidelines JSONB DEFAULT '{
  "featured_image_specs": {
    "aspect_ratio": "16:9",
    "min_width": 1200,
    "min_height": 630,
    "preferred_format": "jpg"
  },
  "ai_generation_settings": {
    "provider": "dalle",
    "style": "photorealistic",
    "banned_elements": []
  },
  "alt_text_rules": {
    "max_length": 125,
    "include_keywords": true,
    "avoid_phrases": ["image of", "picture of"]
  }
}'::jsonb;

-- Add title_guidelines column
-- Stores preferred title formats, power words, and words to avoid
ALTER TABLE brand_guides
ADD COLUMN IF NOT EXISTS title_guidelines JSONB DEFAULT '{
  "preferred_formats": [
    "How to [X]",
    "[Number] Ways to [X]",
    "[X]: A Complete Guide"
  ],
  "power_words": [],
  "words_to_avoid": [],
  "high_performing_patterns": []
}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN brand_guides.styles_to_avoid IS 'JSONB containing word patterns to avoid, structural rules (passive voice %, sentence length), and data backing metrics';
COMMENT ON COLUMN brand_guides.styles_to_keep IS 'JSONB containing preferred patterns, successful examples with engagement metrics, and auto-learned styles from top-performing posts';
COMMENT ON COLUMN brand_guides.image_guidelines IS 'JSONB containing featured image specs (aspect ratio, dimensions), AI generation settings (provider, style, banned elements), and alt text rules';
COMMENT ON COLUMN brand_guides.title_guidelines IS 'JSONB containing preferred title formats, power words, words to avoid, and high-performing patterns from historical data';

-- Create indexes for JSONB columns to improve query performance
CREATE INDEX IF NOT EXISTS idx_brand_guides_styles_to_avoid ON brand_guides USING gin(styles_to_avoid);
CREATE INDEX IF NOT EXISTS idx_brand_guides_styles_to_keep ON brand_guides USING gin(styles_to_keep);
CREATE INDEX IF NOT EXISTS idx_brand_guides_image_guidelines ON brand_guides USING gin(image_guidelines);
CREATE INDEX IF NOT EXISTS idx_brand_guides_title_guidelines ON brand_guides USING gin(title_guidelines);
