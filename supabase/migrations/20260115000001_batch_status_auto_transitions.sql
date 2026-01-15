-- Batch Status Auto-Transitions (feat-086)
-- Auto-update batch status: planned → in_progress → completed

-- Function to increment batch counters
CREATE OR REPLACE FUNCTION increment_batch_counter(
    batch_id UUID,
    counter_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the specified counter
    IF counter_name = 'posts_completed' THEN
        UPDATE content_batches
        SET posts_completed = posts_completed + 1,
            updated_at = NOW()
        WHERE id = batch_id;
    ELSIF counter_name = 'posts_approved' THEN
        UPDATE content_batches
        SET posts_approved = posts_approved + 1,
            updated_at = NOW()
        WHERE id = batch_id;
    ELSIF counter_name = 'posts_published' THEN
        UPDATE content_batches
        SET posts_published = posts_published + 1,
            updated_at = NOW()
        WHERE id = batch_id;
    END IF;

    -- Auto-update batch status based on progress
    PERFORM update_batch_status(batch_id);
END;
$$;

-- Function to auto-update batch status based on post progress
CREATE OR REPLACE FUNCTION update_batch_status(batch_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_batch RECORD;
    v_post_counts RECORD;
BEGIN
    -- Get batch info
    SELECT * INTO v_batch
    FROM content_batches
    WHERE id = batch_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Get post status counts for this batch
    SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('ai_drafting', 'drafting', 'editor_review', 'client_review')) as in_progress,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'published') as published
    INTO v_post_counts
    FROM blog_posts
    WHERE content_batch_id = batch_id;

    -- Auto-transition logic
    IF v_batch.status = 'planned' AND v_post_counts.in_progress > 0 THEN
        -- First post started → transition to in_progress
        UPDATE content_batches
        SET status = 'in_progress',
            updated_at = NOW()
        WHERE id = batch_id;

    ELSIF v_batch.status = 'in_progress' AND v_post_counts.total > 0 THEN
        -- Check if all posts are published
        IF v_post_counts.published = v_post_counts.total THEN
            UPDATE content_batches
            SET status = 'completed',
                updated_at = NOW()
            WHERE id = batch_id;
        END IF;
    END IF;
END;
$$;

-- Trigger to auto-update batch status when blog post status changes
CREATE OR REPLACE FUNCTION trigger_update_batch_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only update if the post is part of a batch
    IF NEW.content_batch_id IS NOT NULL THEN
        -- If status changed to drafting/ai_drafting (first transition from planned)
        IF (OLD.status IS NULL OR OLD.status = 'planned') AND
           (NEW.status = 'ai_drafting' OR NEW.status = 'drafting' OR NEW.status = 'editor_review') THEN
            PERFORM update_batch_status(NEW.content_batch_id);

        -- If status changed to published (completion)
        ELSIF NEW.status = 'published' AND OLD.status != 'published' THEN
            PERFORM update_batch_status(NEW.content_batch_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger on blog_posts table
DROP TRIGGER IF EXISTS blog_posts_update_batch_status ON blog_posts;
CREATE TRIGGER blog_posts_update_batch_status
    AFTER INSERT OR UPDATE OF status
    ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_batch_status();

-- Add comment
COMMENT ON FUNCTION increment_batch_counter IS 'Increments batch counter (posts_completed, posts_approved, posts_published) and auto-updates batch status';
COMMENT ON FUNCTION update_batch_status IS 'Auto-transitions batch status: planned → in_progress (on first post start) → completed (when all posts published)';
COMMENT ON TRIGGER blog_posts_update_batch_status ON blog_posts IS 'Auto-updates batch status when post status changes (feat-086)';
