-- User Feedback Collection System
-- Implements VENDOR-WC-135: User feedback collection

-- Table to store user feedback
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('bug', 'feature_request', 'improvement', 'content', 'performance', 'ui_ux', 'other')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    url TEXT,
    user_agent TEXT,
    screenshot_url TEXT,
    metadata JSONB,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_vendor_id ON user_feedback(vendor_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_category ON user_feedback(category);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_priority ON user_feedback(priority);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Vendors can view their own feedback"
    ON user_feedback FOR SELECT
    USING (
        vendor_id IN (
            SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can submit feedback"
    ON user_feedback FOR INSERT
    WITH CHECK (
        -- Users can only submit feedback for vendors they belong to
        vendor_id IN (
            SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
        )
        OR
        -- Or for vendors associated with their client account
        vendor_id IN (
            SELECT c.vendor_id
            FROM clients c
            JOIN client_users cu ON cu.client_id = c.id
            WHERE cu.user_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can update feedback status"
    ON user_feedback FOR UPDATE
    USING (
        vendor_id IN (
            SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_feedback_updated_at
    BEFORE UPDATE ON user_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_user_feedback_updated_at();
