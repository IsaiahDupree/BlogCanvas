-- Add PRD workflow statuses to blog_post_status enum
-- PRD defines: ai_drafting → editor_review → client_review → approved → published

-- Add new status values to the enum
ALTER TYPE blog_post_status ADD VALUE IF NOT EXISTS 'ai_drafting';
ALTER TYPE blog_post_status ADD VALUE IF NOT EXISTS 'editor_review';
ALTER TYPE blog_post_status ADD VALUE IF NOT EXISTS 'client_review';

-- Note: 'approved' and 'published' already exist in the enum

-- Add columns for tracking transitions
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS editor_reviewed_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS editor_reviewed_by UUID;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS client_reviewed_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS client_reviewed_by UUID;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS cms_url TEXT;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_editor_review ON blog_posts(editor_reviewed_at) WHERE editor_reviewed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_client_review ON blog_posts(client_reviewed_at) WHERE client_reviewed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at) WHERE published_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN blog_posts.editor_reviewed_at IS 'Timestamp when editor marked as ready for client review (PRD status transition)';
COMMENT ON COLUMN blog_posts.editor_reviewed_by IS 'User ID who performed editor review';
COMMENT ON COLUMN blog_posts.client_reviewed_at IS 'Timestamp when client reviewed/approved the post';
COMMENT ON COLUMN blog_posts.client_reviewed_by IS 'User ID who performed client review';
COMMENT ON COLUMN blog_posts.published_at IS 'Timestamp when post was published to CMS';
COMMENT ON COLUMN blog_posts.cms_url IS 'Live URL on the CMS after publishing';
