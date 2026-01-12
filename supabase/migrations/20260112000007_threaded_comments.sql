-- =====================================================
-- Migration: Threaded Comments System
-- Description: Add threading support, mentions, and resolution status to comments
-- Date: 2026-01-12
-- Feature: feat-022 - Threaded comments on blog posts
-- =====================================================

-- Add new columns to comments table for threading
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS mentioned_user_ids uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_resolved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- Create index for parent comment lookups (improves thread query performance)
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);

-- Create index for blog post + parent comment (for fetching top-level comments)
CREATE INDEX IF NOT EXISTS idx_comments_blog_post_parent ON comments(blog_post_id, parent_comment_id);

-- Create index for mentioned users (for notification queries)
CREATE INDEX IF NOT EXISTS idx_comments_mentioned_users ON comments USING GIN(mentioned_user_ids);

-- Create a function to get comment thread depth
CREATE OR REPLACE FUNCTION get_comment_depth(comment_id uuid)
RETURNS integer AS $$
DECLARE
    depth integer := 0;
    current_id uuid := comment_id;
    parent_id uuid;
BEGIN
    -- Traverse up the comment tree
    LOOP
        SELECT parent_comment_id INTO parent_id
        FROM comments
        WHERE id = current_id;

        EXIT WHEN parent_id IS NULL;

        depth := depth + 1;
        current_id := parent_id;

        -- Safety check to prevent infinite loops
        EXIT WHEN depth > 10;
    END LOOP;

    RETURN depth;
END;
$$ LANGUAGE plpgsql;

-- Create a table to track comment mentions (for notification history)
CREATE TABLE IF NOT EXISTS comment_mentions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    mentioned_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_sent boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    UNIQUE(comment_id, mentioned_user_id)
);

-- Create index for mention lookups
CREATE INDEX IF NOT EXISTS idx_comment_mentions_user ON comment_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_comment_mentions_comment ON comment_mentions(comment_id);

-- Enable RLS on comment_mentions
ALTER TABLE comment_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view mentions for their own user_id or if they're in the same organization
CREATE POLICY "Users can view their own mentions"
ON comment_mentions
FOR SELECT
USING (
    auth.uid() = mentioned_user_id
    OR
    EXISTS (
        SELECT 1 FROM profiles p1
        JOIN profiles p2 ON p1.organization_id = p2.organization_id
        WHERE p1.user_id = auth.uid()
        AND p2.user_id = mentioned_user_id
    )
);

-- RLS Policy: Anyone can insert mentions (will be created by comment author)
CREATE POLICY "Anyone can create mentions"
ON comment_mentions
FOR INSERT
WITH CHECK (true);

-- Update existing comments RLS policies to handle threading
-- (These may already exist, so we'll drop and recreate)

DROP POLICY IF EXISTS "Users can view comments for their posts" ON comments;
DROP POLICY IF EXISTS "Users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;

-- Allow users to view comments on posts they have access to
CREATE POLICY "Users can view comments for accessible posts"
ON comments
FOR SELECT
USING (
    -- Vendor can see all comments on their organization's posts
    EXISTS (
        SELECT 1 FROM blog_posts bp
        JOIN clients c ON bp.client_id = c.id
        JOIN profiles p ON c.owner_id = p.user_id
        WHERE bp.id = blog_post_id
        AND p.user_id = auth.uid()
    )
    OR
    -- Client can see comments on their posts
    EXISTS (
        SELECT 1 FROM blog_posts bp
        WHERE bp.id = blog_post_id
        AND bp.client_id IN (
            SELECT client_id FROM client_users WHERE user_id = auth.uid()
        )
    )
);

-- Allow authenticated users to insert comments
CREATE POLICY "Authenticated users can insert comments"
ON comments
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own comments (for editing)
CREATE POLICY "Users can update their own comments"
ON comments
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own comments
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Users can delete their own comments"
ON comments
FOR DELETE
USING (user_id = auth.uid());

-- Create a view for comments with reply counts
CREATE OR REPLACE VIEW comments_with_metadata AS
SELECT
    c.*,
    COUNT(replies.id) as reply_count,
    get_comment_depth(c.id) as depth
FROM comments c
LEFT JOIN comments replies ON replies.parent_comment_id = c.id
GROUP BY c.id;

-- Grant access to the view
GRANT SELECT ON comments_with_metadata TO authenticated;
GRANT SELECT ON comments_with_metadata TO anon;

COMMENT ON TABLE comments IS 'Stores comments on blog posts with threading support, mentions, and resolution tracking';
COMMENT ON COLUMN comments.parent_comment_id IS 'Reference to parent comment for threading (NULL for top-level comments)';
COMMENT ON COLUMN comments.mentioned_user_ids IS 'Array of user IDs mentioned in this comment (e.g., via @username)';
COMMENT ON COLUMN comments.is_resolved IS 'Whether this comment thread has been marked as resolved';
COMMENT ON COLUMN comments.resolved_by IS 'User who marked the comment as resolved';
COMMENT ON COLUMN comments.resolved_at IS 'Timestamp when comment was resolved';
COMMENT ON TABLE comment_mentions IS 'Tracks @mentions in comments for notification purposes';
