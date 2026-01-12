-- =====================================================
-- Migration: Publish Queue System for Batch Publishing
-- Description: Adds publish queue, scheduling, and retry logic
-- Feature: feat-023 - Batch publishing and scheduling
-- Date: 2026-01-12
-- =====================================================

-- =====================================================
-- 1. Publish Queue Table
-- =====================================================
-- Stores scheduled and queued publish jobs with retry logic
CREATE TABLE IF NOT EXISTS publish_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  content_batch_id UUID REFERENCES content_batches(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Publishing details
  cms_connection_id UUID REFERENCES cms_connections(id) ON DELETE SET NULL,
  website_url TEXT NOT NULL,
  publish_status TEXT CHECK (publish_status IN ('draft', 'publish', 'pending', 'future')) DEFAULT 'publish',

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL, -- When to publish
  priority INT DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest, 10 = lowest

  -- Queue status
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',

  -- Retry logic
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  -- Results
  wordpress_post_id TEXT, -- ID from WordPress
  published_url TEXT,
  error_message TEXT,
  error_details JSONB,

  -- Metadata
  queued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Additional options
  options JSONB DEFAULT '{}', -- For future extensibility

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_publish_queue_blog_post ON publish_queue(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_publish_queue_batch ON publish_queue(content_batch_id);
CREATE INDEX IF NOT EXISTS idx_publish_queue_client ON publish_queue(client_id);
CREATE INDEX IF NOT EXISTS idx_publish_queue_status ON publish_queue(status);
CREATE INDEX IF NOT EXISTS idx_publish_queue_scheduled ON publish_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_publish_queue_next_retry ON publish_queue(next_retry_at) WHERE status = 'failed';

-- Composite index for queue processor (fetch pending/retry jobs)
CREATE INDEX IF NOT EXISTS idx_publish_queue_processor ON publish_queue(status, scheduled_for, priority)
  WHERE status IN ('pending', 'failed');

-- =====================================================
-- 3. Publish Schedule Calendar View (Materialized for performance)
-- =====================================================
-- For calendar UI - provides quick overview of scheduled publishes
CREATE OR REPLACE VIEW publish_calendar AS
SELECT
  pq.id,
  pq.blog_post_id,
  pq.scheduled_for,
  pq.status,
  pq.priority,
  bp.topic,
  bp.seo_quality_score,
  c.name as client_name,
  cb.name as batch_name,
  cc.cms_type,
  cc.base_url as website_url
FROM publish_queue pq
JOIN blog_posts bp ON pq.blog_post_id = bp.id
JOIN clients c ON pq.client_id = c.id
LEFT JOIN content_batches cb ON pq.content_batch_id = cb.id
LEFT JOIN cms_connections cc ON pq.cms_connection_id = cc.id
WHERE pq.status IN ('pending', 'processing', 'failed')
ORDER BY pq.scheduled_for ASC;

-- =====================================================
-- 4. Publish Statistics View
-- =====================================================
CREATE OR REPLACE VIEW publish_queue_stats AS
SELECT
  content_batch_id,
  client_id,
  COUNT(*) as total_queued,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'processing') as processing,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
  MIN(scheduled_for) FILTER (WHERE status = 'pending') as next_publish_date,
  MAX(completed_at) as last_publish_date
FROM publish_queue
GROUP BY content_batch_id, client_id;

-- =====================================================
-- 5. Row Level Security (RLS)
-- =====================================================
ALTER TABLE publish_queue ENABLE ROW LEVEL SECURITY;

-- Vendors can manage their clients' publish queue
CREATE POLICY "Vendors can view their clients' publish queue"
  ON publish_queue FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Vendors can insert publish jobs for their clients"
  ON publish_queue FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Vendors can update their clients' publish queue"
  ON publish_queue FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM clients WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Vendors can delete their clients' publish queue"
  ON publish_queue FOR DELETE
  USING (
    client_id IN (
      SELECT id FROM clients WHERE created_by = auth.uid()
    )
  );

-- Service role can access all (for cron processor)
-- This is handled by using service role client in the cron job

-- =====================================================
-- 6. Trigger: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_publish_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER publish_queue_updated_at
  BEFORE UPDATE ON publish_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_publish_queue_updated_at();

-- =====================================================
-- 7. Trigger: Update blog_post status when queued
-- =====================================================
CREATE OR REPLACE FUNCTION update_blog_post_on_queue()
RETURNS TRIGGER AS $$
BEGIN
  -- When a post is queued, update its status to 'scheduled'
  IF NEW.status = 'pending' AND NEW.scheduled_for > NOW() THEN
    UPDATE blog_posts
    SET status = 'scheduled'
    WHERE id = NEW.blog_post_id;
  END IF;

  -- When a post publish is completed, update status to 'published'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE blog_posts
    SET
      status = 'published',
      cms_publish_info = jsonb_build_object(
        'wordpress_id', NEW.wordpress_post_id,
        'url', NEW.published_url,
        'published_at', NEW.completed_at,
        'status', NEW.publish_status
      )
    WHERE id = NEW.blog_post_id;
  END IF;

  -- When a post publish fails after max attempts, update status to 'failed'
  IF NEW.status = 'failed' AND NEW.attempts >= NEW.max_attempts THEN
    UPDATE blog_posts
    SET status = 'failed'
    WHERE id = NEW.blog_post_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_post_status_on_queue
  AFTER INSERT OR UPDATE ON publish_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_on_queue();

-- =====================================================
-- 8. Trigger: Update batch publish stats
-- =====================================================
CREATE OR REPLACE FUNCTION update_batch_publish_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update content_batches.posts_published count when publish completes
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    UPDATE content_batches
    SET posts_published = COALESCE(posts_published, 0) + 1
    WHERE id = NEW.content_batch_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER batch_publish_stats
  AFTER INSERT OR UPDATE ON publish_queue
  FOR EACH ROW
  WHEN (NEW.content_batch_id IS NOT NULL)
  EXECUTE FUNCTION update_batch_publish_stats();

-- =====================================================
-- 9. Helper Functions
-- =====================================================

-- Function: Get next pending publish jobs (for cron processor)
CREATE OR REPLACE FUNCTION get_pending_publish_jobs(batch_limit INT DEFAULT 10)
RETURNS SETOF publish_queue AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM publish_queue
  WHERE
    status = 'pending'
    AND scheduled_for <= NOW()
  ORDER BY priority ASC, scheduled_for ASC
  LIMIT batch_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Get failed jobs ready for retry
CREATE OR REPLACE FUNCTION get_retry_publish_jobs(batch_limit INT DEFAULT 5)
RETURNS SETOF publish_queue AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM publish_queue
  WHERE
    status = 'failed'
    AND attempts < max_attempts
    AND (next_retry_at IS NULL OR next_retry_at <= NOW())
  ORDER BY priority ASC, next_retry_at ASC NULLS FIRST
  LIMIT batch_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate next retry time (exponential backoff)
CREATE OR REPLACE FUNCTION calculate_next_retry(attempts INT)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  backoff_minutes INT;
BEGIN
  -- Exponential backoff: 5 min, 15 min, 60 min
  backoff_minutes := CASE
    WHEN attempts = 0 THEN 5
    WHEN attempts = 1 THEN 15
    ELSE 60
  END;

  RETURN NOW() + (backoff_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function: Queue a single post for publishing
CREATE OR REPLACE FUNCTION queue_post_for_publish(
  p_blog_post_id UUID,
  p_scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  p_priority INT DEFAULT 5,
  p_cms_connection_id UUID DEFAULT NULL,
  p_publish_status TEXT DEFAULT 'publish'
)
RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
  v_client_id UUID;
  v_batch_id UUID;
  v_website_url TEXT;
BEGIN
  -- Get post details
  SELECT client_id, content_batch_id
  INTO v_client_id, v_batch_id
  FROM blog_posts
  WHERE id = p_blog_post_id;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Blog post not found or missing client_id';
  END IF;

  -- Get CMS connection details
  IF p_cms_connection_id IS NOT NULL THEN
    SELECT base_url INTO v_website_url
    FROM cms_connections
    WHERE id = p_cms_connection_id AND client_id = v_client_id;
  ELSE
    -- Get first active WordPress connection for this client
    SELECT id, base_url INTO p_cms_connection_id, v_website_url
    FROM cms_connections
    WHERE client_id = v_client_id
      AND cms_type = 'wordpress'
      AND connection_status = 'active'
    LIMIT 1;
  END IF;

  IF v_website_url IS NULL THEN
    RAISE EXCEPTION 'No CMS connection found for client';
  END IF;

  -- Insert into queue
  INSERT INTO publish_queue (
    blog_post_id,
    content_batch_id,
    client_id,
    cms_connection_id,
    website_url,
    publish_status,
    scheduled_for,
    priority,
    queued_by
  ) VALUES (
    p_blog_post_id,
    v_batch_id,
    v_client_id,
    p_cms_connection_id,
    v_website_url,
    p_publish_status,
    p_scheduled_for,
    p_priority,
    auth.uid()
  )
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. Comments
-- =====================================================
COMMENT ON TABLE publish_queue IS 'Queue system for scheduled and batch publishing to WordPress/CMS';
COMMENT ON COLUMN publish_queue.scheduled_for IS 'Date/time when this post should be published (or now for immediate)';
COMMENT ON COLUMN publish_queue.priority IS 'Priority level 1-10 (1 = highest priority)';
COMMENT ON COLUMN publish_queue.status IS 'Current status: pending (waiting), processing (publishing now), completed (success), failed (error), cancelled (user cancelled)';
COMMENT ON COLUMN publish_queue.attempts IS 'Number of publish attempts made';
COMMENT ON COLUMN publish_queue.max_attempts IS 'Maximum attempts before giving up (default 3)';
COMMENT ON COLUMN publish_queue.next_retry_at IS 'Scheduled time for next retry attempt (exponential backoff)';

-- =====================================================
-- 11. Sample Data for Testing (Optional - Remove in production)
-- =====================================================
-- Add sample queue entries for testing calendar UI
-- COMMENTED OUT - Uncomment only for local development testing
/*
INSERT INTO publish_queue (blog_post_id, client_id, website_url, scheduled_for, priority, status)
SELECT
  bp.id,
  bp.client_id,
  'https://example.com',
  NOW() + (random() * 14 || ' days')::INTERVAL,
  floor(random() * 5 + 1)::INT,
  CASE
    WHEN random() > 0.8 THEN 'failed'
    WHEN random() > 0.5 THEN 'completed'
    ELSE 'pending'
  END
FROM blog_posts bp
WHERE bp.status = 'approved'
LIMIT 20;
*/

-- =====================================================
-- END OF MIGRATION
-- =====================================================
