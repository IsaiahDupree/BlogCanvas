-- PRD Stage 2: Existing Blog Performance Analysis (feat-070)
-- Extends seo_audits to track existing blog posts detected during crawl

-- Add blog-specific fields to seo_audits table
ALTER TABLE seo_audits
ADD COLUMN IF NOT EXISTS blog_posts_detected INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS blog_posts_analyzed JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS blog_performance_summary JSONB DEFAULT '{}'::jsonb;

-- Create a function to detect if a URL is a blog post
CREATE OR REPLACE FUNCTION is_blog_post_url(url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Common blog URL patterns
  RETURN (
    url ~ '/blog/'
    OR url ~ '/post/'
    OR url ~ '/posts/'
    OR url ~ '/article/'
    OR url ~ '/articles/'
    OR url ~ '/news/'
    OR url ~ '/\d{4}/\d{2}/'  -- Date-based URLs like /2024/01/
    OR url ~ '/p/'             -- Medium-style
    OR url ~ '/insights/'
    OR url ~ '/resources/blog/'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to calculate blog post performance score
CREATE OR REPLACE FUNCTION calculate_blog_performance_score(
  p_word_count INTEGER,
  p_has_h1 BOOLEAN,
  p_has_meta_desc BOOLEAN,
  p_h2_count INTEGER,
  p_internal_links INTEGER,
  p_external_links INTEGER,
  p_has_images BOOLEAN
)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Word count scoring (0-30 points)
  IF p_word_count >= 2000 THEN
    score := score + 30;
  ELSIF p_word_count >= 1500 THEN
    score := score + 25;
  ELSIF p_word_count >= 1000 THEN
    score := score + 20;
  ELSIF p_word_count >= 500 THEN
    score := score + 10;
  END IF;

  -- H1 heading (0-15 points)
  IF p_has_h1 THEN
    score := score + 15;
  END IF;

  -- Meta description (0-10 points)
  IF p_has_meta_desc THEN
    score := score + 10;
  END IF;

  -- H2 subheadings (0-15 points)
  IF p_h2_count >= 5 THEN
    score := score + 15;
  ELSIF p_h2_count >= 3 THEN
    score := score + 10;
  ELSIF p_h2_count >= 1 THEN
    score := score + 5;
  END IF;

  -- Internal links (0-10 points)
  IF p_internal_links >= 5 THEN
    score := score + 10;
  ELSIF p_internal_links >= 3 THEN
    score := score + 7;
  ELSIF p_internal_links >= 1 THEN
    score := score + 4;
  END IF;

  -- External links (0-10 points)
  IF p_external_links >= 3 THEN
    score := score + 10;
  ELSIF p_external_links >= 1 THEN
    score := score + 5;
  END IF;

  -- Images (0-10 points)
  IF p_has_images THEN
    score := score + 10;
  END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment explaining the new fields
COMMENT ON COLUMN seo_audits.blog_posts_detected IS 'Number of blog posts found during website crawl';
COMMENT ON COLUMN seo_audits.blog_posts_analyzed IS 'Array of blog post analysis objects: [{url, title, wordCount, seoScore, issues, publishedDate}]';
COMMENT ON COLUMN seo_audits.blog_performance_summary IS 'Summary statistics: {avgScore, avgWordCount, postsWithMeta, postsWithImages, topPerformers, poorPerformers, gaps}';
