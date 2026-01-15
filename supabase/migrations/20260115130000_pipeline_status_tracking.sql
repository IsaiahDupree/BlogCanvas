-- Migration: Pipeline Status Tracking Per Post
-- PRD feat-120: Track current pipeline stage and progress per blog post
-- Epic 3: AI Pipeline

-- Add pipeline tracking columns to blog_posts table
DO $$
BEGIN
    -- Current stage in the AI pipeline
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts'
        AND column_name = 'pipeline_stage'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN pipeline_stage TEXT;
    END IF;

    -- Progress within current stage (0-100)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts'
        AND column_name = 'pipeline_progress'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN pipeline_progress INTEGER DEFAULT 0 CHECK (pipeline_progress >= 0 AND pipeline_progress <= 100);
    END IF;

    -- Pipeline status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts'
        AND column_name = 'pipeline_status'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN pipeline_status TEXT DEFAULT 'idle';
    END IF;

    -- Estimated time remaining (in seconds)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts'
        AND column_name = 'pipeline_eta_seconds'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN pipeline_eta_seconds INTEGER;
    END IF;

    -- Last pipeline error message
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts'
        AND column_name = 'pipeline_error'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN pipeline_error TEXT;
    END IF;

    -- Pipeline started timestamp
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts'
        AND column_name = 'pipeline_started_at'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN pipeline_started_at TIMESTAMPTZ;
    END IF;

    -- Pipeline completed timestamp
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts'
        AND column_name = 'pipeline_completed_at'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN pipeline_completed_at TIMESTAMPTZ;
    END IF;

    -- Whether pipeline can be paused
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts'
        AND column_name = 'pipeline_paused'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN pipeline_paused BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add constraints for pipeline_stage
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_pipeline_stage_check;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_pipeline_stage_check
    CHECK (pipeline_stage IN (
        'idle',
        'research',
        'outline',
        'draft',
        'seo',
        'fact_check',
        'enhancement',
        'completed',
        'failed'
    ) OR pipeline_stage IS NULL);

-- Add constraints for pipeline_status
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_pipeline_status_check;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_pipeline_status_check
    CHECK (pipeline_status IN (
        'idle',
        'queued',
        'running',
        'paused',
        'completed',
        'failed'
    ));

-- Add index for pipeline status queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_pipeline_status
    ON blog_posts(pipeline_status, pipeline_stage);

-- Add index for pipeline timing
CREATE INDEX IF NOT EXISTS idx_blog_posts_pipeline_started
    ON blog_posts(pipeline_started_at);

COMMENT ON COLUMN blog_posts.pipeline_stage IS 'Current stage in the AI pipeline: research, outline, draft, seo, fact_check, enhancement';
COMMENT ON COLUMN blog_posts.pipeline_progress IS 'Progress percentage within current stage (0-100)';
COMMENT ON COLUMN blog_posts.pipeline_status IS 'Overall pipeline status: idle, queued, running, paused, completed, failed';
COMMENT ON COLUMN blog_posts.pipeline_eta_seconds IS 'Estimated time remaining in seconds';
COMMENT ON COLUMN blog_posts.pipeline_error IS 'Last error message if pipeline failed';
COMMENT ON COLUMN blog_posts.pipeline_started_at IS 'When the pipeline was started';
COMMENT ON COLUMN blog_posts.pipeline_completed_at IS 'When the pipeline completed';
COMMENT ON COLUMN blog_posts.pipeline_paused IS 'Whether the pipeline is currently paused';
