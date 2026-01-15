-- Migration: Add due_date and search_intent to blog_posts table
-- Feature: feat-060 - Content batch with full topic parameters

-- Add due_date for deadline tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN due_date DATE;
    CREATE INDEX IF NOT EXISTS idx_blog_posts_due_date ON blog_posts(due_date) WHERE due_date IS NOT NULL;
    COMMENT ON COLUMN blog_posts.due_date IS 'Target completion/publication date for the blog post';
  END IF;
END $$;

-- Add search_intent for easier querying (can override cluster intent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'search_intent'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN search_intent TEXT CHECK (
      search_intent IS NULL OR
      search_intent IN ('informational', 'commercial', 'transactional', 'navigational')
    );
    CREATE INDEX IF NOT EXISTS idx_blog_posts_search_intent ON blog_posts(search_intent) WHERE search_intent IS NOT NULL;
    COMMENT ON COLUMN blog_posts.search_intent IS 'Primary search intent for the post - overrides topic_cluster intent if set';
  END IF;
END $$;

-- Create a view that combines blog_posts with cluster intent
CREATE OR REPLACE VIEW blog_posts_with_intent AS
SELECT
  bp.*,
  COALESCE(bp.search_intent, tc.search_intent) as effective_search_intent,
  tc.name as cluster_name,
  tc.estimated_traffic as cluster_traffic,
  tc.difficulty as cluster_difficulty
FROM blog_posts bp
LEFT JOIN topic_clusters tc ON bp.topic_cluster_id = tc.id;

COMMENT ON VIEW blog_posts_with_intent IS 'Blog posts with search intent from either post or cluster';
