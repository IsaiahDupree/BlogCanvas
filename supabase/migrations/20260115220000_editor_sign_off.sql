-- Migration: Editor Sign-Off for Blog Posts
-- Adds fields to track editor approval/sign-off for PRD feat-061

-- Add editor sign-off fields to blog_posts table
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS editor_signed_off BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS editor_signed_off_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS editor_signed_off_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS editor_sign_off_notes TEXT;

-- Create index for quick filtering of signed-off posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_editor_signed_off
  ON blog_posts(editor_signed_off, editor_signed_off_at);

-- Comment on columns
COMMENT ON COLUMN blog_posts.editor_signed_off IS 'Whether editor has signed off on this post for client approval';
COMMENT ON COLUMN blog_posts.editor_signed_off_by IS 'User ID of editor who signed off';
COMMENT ON COLUMN blog_posts.editor_signed_off_at IS 'Timestamp when editor signed off';
COMMENT ON COLUMN blog_posts.editor_sign_off_notes IS 'Optional notes from editor during sign-off';
