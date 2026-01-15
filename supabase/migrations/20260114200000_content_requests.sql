-- Migration: Content Requests System
-- Feature: Allow clients to request content from vendors

-- Create content_requests table
CREATE TABLE IF NOT EXISTS content_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Request Details
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('blog_post', 'batch', 'newsletter', 'other')),
    title VARCHAR(255),
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'declined')),
    
    -- Response
    vendor_response TEXT,
    responded_at TIMESTAMPTZ,
    responded_by UUID REFERENCES profiles(id),
    
    -- Result (if content was created)
    result_blog_post_id UUID REFERENCES blog_posts(id),
    result_batch_id UUID REFERENCES content_batches(id),
    
    -- Attachments (stored as JSON array of file objects)
    attachments JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add avatar_url to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_requests_client ON content_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_content_requests_vendor ON content_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_content_requests_status ON content_requests(status);
CREATE INDEX IF NOT EXISTS idx_content_requests_created ON content_requests(created_at DESC);

-- Enable RLS
ALTER TABLE content_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Clients can view their own requests
CREATE POLICY "Clients can view own requests"
ON content_requests FOR SELECT
TO authenticated
USING (
    requested_by = auth.uid()
    OR client_id IN (
        SELECT client_id FROM profiles WHERE id = auth.uid()
    )
);

-- Clients can create requests for their client
CREATE POLICY "Clients can create requests"
ON content_requests FOR INSERT
TO authenticated
WITH CHECK (
    requested_by = auth.uid()
    AND client_id IN (
        SELECT client_id FROM profiles WHERE id = auth.uid()
    )
);

-- Vendors can view requests from their clients
CREATE POLICY "Vendors can view client requests"
ON content_requests FOR SELECT
TO authenticated
USING (
    vendor_id IN (
        SELECT vendor_id FROM profiles WHERE id = auth.uid()
    )
);

-- Vendors can update requests from their clients
CREATE POLICY "Vendors can update requests"
ON content_requests FOR UPDATE
TO authenticated
USING (
    vendor_id IN (
        SELECT vendor_id FROM profiles WHERE id = auth.uid()
    )
)
WITH CHECK (
    vendor_id IN (
        SELECT vendor_id FROM profiles WHERE id = auth.uid()
    )
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_content_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS content_requests_updated_at ON content_requests;
CREATE TRIGGER content_requests_updated_at
    BEFORE UPDATE ON content_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_content_requests_updated_at();

-- Comment
COMMENT ON TABLE content_requests IS 'Stores client requests for new content (blogs, batches, etc.)';
