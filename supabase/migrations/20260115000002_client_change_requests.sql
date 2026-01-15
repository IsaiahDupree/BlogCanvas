-- Client Change Requests (feat-087)
-- Allow clients to request changes on posts during review

CREATE TABLE IF NOT EXISTS blog_post_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL, -- client user_id
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    feedback TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'cancelled')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID, -- editor user_id
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_change_requests_post ON blog_post_change_requests(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_requested_by ON blog_post_change_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON blog_post_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_change_requests_created ON blog_post_change_requests(created_at DESC);

-- RLS Policies
ALTER TABLE blog_post_change_requests ENABLE ROW LEVEL SECURITY;

-- Clients can view and create change requests for their own posts
CREATE POLICY "Clients can view their change requests"
    ON blog_post_change_requests FOR SELECT
    USING (
        requested_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM blog_posts bp
            WHERE bp.id = blog_post_change_requests.blog_post_id
            AND bp.client_id IN (
                SELECT client_id FROM client_profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Clients can create change requests"
    ON blog_post_change_requests FOR INSERT
    WITH CHECK (
        requested_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM blog_posts bp
            WHERE bp.id = blog_post_id
            AND bp.client_id IN (
                SELECT client_id FROM client_profiles WHERE user_id = auth.uid()
            )
            AND bp.status = 'client_review'
        )
    );

-- Vendors can view and update all change requests
CREATE POLICY "Vendors can view all change requests"
    ON blog_post_change_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM clients c
            WHERE c.vendor_user_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can update change requests"
    ON blog_post_change_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM blog_posts bp
            JOIN clients c ON bp.client_id = c.id
            WHERE bp.id = blog_post_change_requests.blog_post_id
            AND c.vendor_user_id = auth.uid()
        )
    );

-- Function to update post status when changes requested
CREATE OR REPLACE FUNCTION trigger_post_changes_requested()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- When a change request is created, update post status back to editor_review
    IF (TG_OP = 'INSERT') THEN
        UPDATE blog_posts
        SET status = 'editor_review',
            updated_at = NOW()
        WHERE id = NEW.blog_post_id;
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger to auto-update post status when changes requested
DROP TRIGGER IF EXISTS blog_post_change_request_created ON blog_post_change_requests;
CREATE TRIGGER blog_post_change_request_created
    AFTER INSERT
    ON blog_post_change_requests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_post_changes_requested();

-- Comments
COMMENT ON TABLE blog_post_change_requests IS 'Tracks client change requests for blog posts during review (feat-087)';
COMMENT ON COLUMN blog_post_change_requests.feedback IS 'Client feedback describing what needs to be changed';
COMMENT ON COLUMN blog_post_change_requests.status IS 'pending: awaiting editor, in_progress: editor working, resolved: changes made, cancelled: no longer needed';
COMMENT ON TRIGGER blog_post_change_request_created ON blog_post_change_requests IS 'Auto-returns post to editor_review when client requests changes';
