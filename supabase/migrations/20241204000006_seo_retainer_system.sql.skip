-- SEO Retainer System Tables
-- Implements the PRD data model for SEO content retainers

-- SEO Audits
CREATE TABLE IF NOT EXISTS seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  baseline_score INTEGER, -- SEO score 0-100
  pages_indexed INTEGER,
  audit_date TIMESTAMPTZ DEFAULT NOW(),
  raw_metrics JSONB, -- Full audit data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_audits_website ON seo_audits(website_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_date ON seo_audits(audit_date DESC);

-- Topic Clusters
CREATE TABLE IF NOT EXISTS topic_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  primary_keyword TEXT NOT NULL,
  estimated_traffic INTEGER, -- Monthly search volume
  difficulty INTEGER, -- 1-100 difficulty score
  currently_covered BOOLEAN DEFAULT false,
  search_intent TEXT, -- informational, commercial, transactional
  recommended_article_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topic_clusters_website ON topic_clusters(website_id);
CREATE INDEX IF NOT EXISTS idx_topic_clusters_covered ON topic_clusters(currently_covered);

-- Content Batches
CREATE TABLE IF NOT EXISTS content_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal_score_from INTEGER,
  goal_score_to INTEGER,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'paused', 'cancelled')),
  total_posts INTEGER DEFAULT 0,
  posts_completed INTEGER DEFAULT 0,
  posts_approved INTEGER DEFAULT 0,
  posts_published INTEGER DEFAULT 0,
  created_by UUID, -- user_id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_batches_website ON content_batches(website_id);
CREATE INDEX IF NOT EXISTS idx_content_batches_client ON content_batches(client_id);
CREATE INDEX IF NOT EXISTS idx_content_batches_status ON content_batches(status);

-- Link blog_posts to content_batches (add column if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_posts' AND column_name = 'content_batch_id'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN content_batch_id UUID REFERENCES content_batches(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_blog_posts_content_batch ON blog_posts(content_batch_id);
  END IF;
END $$;

-- Link blog_posts to topic_clusters
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_posts' AND column_name = 'topic_cluster_id'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN topic_cluster_id UUID REFERENCES topic_clusters(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_blog_posts_topic_cluster ON blog_posts(topic_cluster_id);
  END IF;
END $$;

-- Add SEO quality score to blog_posts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_posts' AND column_name = 'seo_quality_score'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN seo_quality_score INTEGER CHECK (seo_quality_score >= 0 AND seo_quality_score <= 100);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_seo_score ON blog_posts(seo_quality_score);
  END IF;
END $$;

-- Blog Post Revisions
CREATE TABLE IF NOT EXISTS blog_post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  revision_type TEXT NOT NULL CHECK (revision_type IN ('outline', 'draft', 'seo_pass', 'fact_check', 'human_edit', 'enhancement')),
  content JSONB, -- Revision content (can store outline, full content, or diff)
  content_text TEXT, -- Full text version for search
  created_by UUID, -- user_id or NULL for system
  created_by_type TEXT DEFAULT 'system' CHECK (created_by_type IN ('system', 'user')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_post_revisions_post ON blog_post_revisions(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_revisions_type ON blog_post_revisions(revision_type);
CREATE INDEX IF NOT EXISTS idx_blog_post_revisions_created ON blog_post_revisions(created_at DESC);

-- Blog Post Metrics (for check-backs)
CREATE TABLE IF NOT EXISTS blog_post_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  snapshot_date TIMESTAMPTZ NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC(5, 2), -- Click-through rate percentage
  avg_position NUMERIC(5, 1), -- Average search position
  sessions INTEGER DEFAULT 0,
  time_on_page NUMERIC(10, 2), -- Average time in seconds
  conversions INTEGER DEFAULT 0,
  seo_score INTEGER, -- Updated SEO score for this post
  raw_metrics JSONB, -- Full analytics data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_post_metrics_post ON blog_post_metrics(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_metrics_date ON blog_post_metrics(snapshot_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_post_metrics_unique ON blog_post_metrics(blog_post_id, snapshot_date);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  content_batch_id UUID REFERENCES content_batches(id) ON DELETE SET NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('email', 'slide_deck', 'pdf', 'dashboard')),
  generated_by UUID, -- user_id or NULL for system
  storage_url TEXT, -- URL to generated report file
  report_data JSONB, -- Report content/data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_website ON reports(website_id);
CREATE INDEX IF NOT EXISTS idx_reports_batch ON reports(content_batch_id);
CREATE INDEX IF NOT EXISTS idx_reports_period ON reports(period_start, period_end);

-- Check-back Schedule (for automated analytics collection)
CREATE TABLE IF NOT EXISTS check_back_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ NOT NULL,
  check_back_type TEXT DEFAULT 'standard' CHECK (check_back_type IN ('standard', 'custom')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'skipped')),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_check_back_schedules_post ON check_back_schedules(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_check_back_schedules_date ON check_back_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_check_back_schedules_status ON check_back_schedules(status) WHERE status = 'pending';

