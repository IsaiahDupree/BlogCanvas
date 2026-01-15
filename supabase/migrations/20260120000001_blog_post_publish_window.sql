-- Migration: Add publish_window to blog_posts table
-- Feature: feat-102 - Topic list with publish window/due date
-- Description: Adds publish window (date range) for flexible scheduling

-- Add publish_window_start and publish_window_end to define a flexible publishing timeframe
DO $$
BEGIN
  -- Add publish_window_start
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'publish_window_start'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN publish_window_start DATE;
    CREATE INDEX IF NOT EXISTS idx_blog_posts_publish_window_start
      ON blog_posts(publish_window_start) WHERE publish_window_start IS NOT NULL;
    COMMENT ON COLUMN blog_posts.publish_window_start IS 'Start of the window when this post can be published (flexible scheduling)';
  END IF;

  -- Add publish_window_end
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'publish_window_end'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN publish_window_end DATE;
    CREATE INDEX IF NOT EXISTS idx_blog_posts_publish_window_end
      ON blog_posts(publish_window_end) WHERE publish_window_end IS NOT NULL;
    COMMENT ON COLUMN blog_posts.publish_window_end IS 'End of the window when this post can be published (flexible scheduling)';
  END IF;

  -- Add constraint to ensure window_end is after window_start
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'blog_posts_publish_window_valid'
  ) THEN
    ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_publish_window_valid
      CHECK (
        publish_window_end IS NULL OR
        publish_window_start IS NULL OR
        publish_window_end >= publish_window_start
      );
  END IF;
END $$;

-- Create a view to identify overdue posts
CREATE OR REPLACE VIEW overdue_blog_posts AS
SELECT
  bp.id,
  bp.topic,
  bp.status,
  bp.due_date,
  bp.publish_window_start,
  bp.publish_window_end,
  bp.client_id,
  c.name as client_name,
  bp.content_batch_id,
  cb.name as batch_name,
  CASE
    -- Overdue if past due_date and not published/scheduled
    WHEN bp.due_date IS NOT NULL
         AND bp.due_date < CURRENT_DATE
         AND bp.status NOT IN ('published', 'scheduled')
    THEN 'past_due'
    -- At risk if due within 3 days
    WHEN bp.due_date IS NOT NULL
         AND bp.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
         AND bp.status NOT IN ('published', 'scheduled', 'approved')
    THEN 'at_risk'
    -- Past publish window
    WHEN bp.publish_window_end IS NOT NULL
         AND bp.publish_window_end < CURRENT_DATE
         AND bp.status NOT IN ('published', 'scheduled')
    THEN 'missed_window'
    ELSE NULL
  END as overdue_status,
  CASE
    WHEN bp.due_date IS NOT NULL THEN CURRENT_DATE - bp.due_date
    WHEN bp.publish_window_end IS NOT NULL THEN CURRENT_DATE - bp.publish_window_end
    ELSE NULL
  END as days_overdue
FROM blog_posts bp
LEFT JOIN clients c ON bp.client_id = c.id
LEFT JOIN content_batches cb ON bp.content_batch_id = cb.id
WHERE (
  -- Has due_date that is passed or approaching
  (bp.due_date IS NOT NULL
   AND bp.due_date <= CURRENT_DATE + INTERVAL '3 days'
   AND bp.status NOT IN ('published', 'scheduled'))
  OR
  -- Has publish window that is passed or ending soon
  (bp.publish_window_end IS NOT NULL
   AND bp.publish_window_end <= CURRENT_DATE + INTERVAL '3 days'
   AND bp.status NOT IN ('published', 'scheduled'))
)
ORDER BY
  CASE
    WHEN bp.due_date IS NOT NULL THEN bp.due_date
    WHEN bp.publish_window_end IS NOT NULL THEN bp.publish_window_end
    ELSE CURRENT_DATE + INTERVAL '999 days'
  END ASC;

COMMENT ON VIEW overdue_blog_posts IS 'Shows blog posts that are overdue, at risk, or past their publish window';

-- Create a function to get overdue count for a client or batch
CREATE OR REPLACE FUNCTION get_overdue_count(
  p_client_id UUID DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  past_due_count BIGINT,
  at_risk_count BIGINT,
  missed_window_count BIGINT,
  total_alerts BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE overdue_status = 'past_due') as past_due_count,
    COUNT(*) FILTER (WHERE overdue_status = 'at_risk') as at_risk_count,
    COUNT(*) FILTER (WHERE overdue_status = 'missed_window') as missed_window_count,
    COUNT(*) as total_alerts
  FROM overdue_blog_posts
  WHERE
    (p_client_id IS NULL OR client_id = p_client_id)
    AND
    (p_batch_id IS NULL OR content_batch_id = p_batch_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_overdue_count IS 'Returns count of overdue posts by category for a client or batch';
