-- Migration: Client Approval Workflow System
-- Feature: FEAT-050
-- Date: 2026-01-14

-- ============================================
-- 1. Update blog_posts table with approval fields
-- ============================================

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS showcased_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS showcased_by UUID REFERENCES profiles(id);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS showcased_message TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES profiles(id);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS public_expires_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS wordpress_post_id INTEGER;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS wordpress_url TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS published_to_wordpress_at TIMESTAMPTZ;

-- Add constraint for approval_status
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_approval_status_check;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_approval_status_check 
    CHECK (approval_status IN ('draft', 'pending_review', 'approved', 'revision_requested', 'rejected', 'published'));

-- ============================================
-- 2. Update content_batches table with approval fields
-- ============================================

ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft';
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS showcased_at TIMESTAMPTZ;
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS showcased_by UUID REFERENCES profiles(id);
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS showcased_message TEXT;
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES profiles(id);
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS public_expires_at TIMESTAMPTZ;

-- Add constraint for approval_status
ALTER TABLE content_batches DROP CONSTRAINT IF EXISTS content_batches_approval_status_check;
ALTER TABLE content_batches ADD CONSTRAINT content_batches_approval_status_check 
    CHECK (approval_status IN ('draft', 'pending_review', 'approved', 'revision_requested', 'rejected', 'published'));

-- ============================================
-- 3. Create content_approvals table for audit history
-- ============================================

CREATE TABLE IF NOT EXISTS content_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES content_batches(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('showcased', 'approved', 'revision_requested', 'rejected', 'published', 'made_public', 'made_private')),
    actor_id UUID REFERENCES profiles(id),
    actor_type TEXT NOT NULL CHECK (actor_type IN ('vendor', 'client', 'system')),
    comment TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure at least one content reference
    CONSTRAINT content_approvals_content_check CHECK (blog_post_id IS NOT NULL OR batch_id IS NOT NULL)
);

-- Indexes for content_approvals
CREATE INDEX IF NOT EXISTS idx_content_approvals_blog_post ON content_approvals(blog_post_id) WHERE blog_post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_approvals_batch ON content_approvals(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_approvals_actor ON content_approvals(actor_id);
CREATE INDEX IF NOT EXISTS idx_content_approvals_action ON content_approvals(action);
CREATE INDEX IF NOT EXISTS idx_content_approvals_created ON content_approvals(created_at DESC);

-- ============================================
-- 4. Create revision_requests table
-- ============================================

CREATE TABLE IF NOT EXISTS revision_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES content_batches(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES profiles(id) NOT NULL,
    comment TEXT NOT NULL,
    specific_changes JSONB DEFAULT '[]',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'addressed', 'closed')),
    addressed_at TIMESTAMPTZ,
    addressed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure at least one content reference
    CONSTRAINT revision_requests_content_check CHECK (blog_post_id IS NOT NULL OR batch_id IS NOT NULL)
);

-- Indexes for revision_requests
CREATE INDEX IF NOT EXISTS idx_revision_requests_blog_post ON revision_requests(blog_post_id) WHERE blog_post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_revision_requests_batch ON revision_requests(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_revision_requests_status ON revision_requests(status);
CREATE INDEX IF NOT EXISTS idx_revision_requests_requested_by ON revision_requests(requested_by);

-- ============================================
-- 5. Create notifications table
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- 6. Create wordpress_sites table
-- ============================================

CREATE TABLE IF NOT EXISTS wordpress_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    website_id UUID REFERENCES websites(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    site_url TEXT NOT NULL,
    api_url TEXT, -- Usually site_url + /wp-json/wp/v2
    api_username TEXT,
    api_key_encrypted TEXT, -- Application password, encrypted
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    last_publish_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for wordpress_sites
CREATE INDEX IF NOT EXISTS idx_wordpress_sites_vendor ON wordpress_sites(vendor_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_sites_client ON wordpress_sites(client_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_sites_website ON wordpress_sites(website_id);

-- ============================================
-- 7. Create wordpress_posts tracking table
-- ============================================

CREATE TABLE IF NOT EXISTS wordpress_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
    wordpress_site_id UUID REFERENCES wordpress_sites(id) ON DELETE CASCADE NOT NULL,
    wordpress_post_id INTEGER NOT NULL,
    wordpress_url TEXT,
    wordpress_status TEXT, -- draft, publish, pending, private
    published_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    
    UNIQUE(blog_post_id, wordpress_site_id)
);

-- Indexes for wordpress_posts
CREATE INDEX IF NOT EXISTS idx_wordpress_posts_blog_post ON wordpress_posts(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_posts_site ON wordpress_posts(wordpress_site_id);

-- ============================================
-- 8. Add indexes for approval status queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_blog_posts_approval_status ON blog_posts(approval_status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_showcased_at ON blog_posts(showcased_at DESC) WHERE showcased_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_public_token ON blog_posts(public_token) WHERE public_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_public ON blog_posts(is_public) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_content_batches_approval_status ON content_batches(approval_status);
CREATE INDEX IF NOT EXISTS idx_content_batches_showcased_at ON content_batches(showcased_at DESC) WHERE showcased_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_batches_public_token ON content_batches(public_token) WHERE public_token IS NOT NULL;

-- ============================================
-- 9. RLS Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_posts ENABLE ROW LEVEL SECURITY;

-- Content Approvals Policies
CREATE POLICY "content_approvals_vendor_access" ON content_approvals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN blog_posts bp ON bp.id = content_approvals.blog_post_id
            WHERE p.id = auth.uid() AND bp.vendor_id = p.vendor_id
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            JOIN content_batches cb ON cb.id = content_approvals.batch_id
            WHERE p.id = auth.uid() AND cb.vendor_id = p.vendor_id
        )
    );

CREATE POLICY "content_approvals_client_access" ON content_approvals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN blog_posts bp ON bp.id = content_approvals.blog_post_id
            WHERE p.id = auth.uid() AND bp.client_id = p.client_id
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            JOIN content_batches cb ON cb.id = content_approvals.batch_id
            WHERE p.id = auth.uid() AND cb.client_id = p.client_id
        )
    );

-- Revision Requests Policies
CREATE POLICY "revision_requests_vendor_access" ON revision_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN blog_posts bp ON bp.id = revision_requests.blog_post_id
            WHERE p.id = auth.uid() AND bp.vendor_id = p.vendor_id
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            JOIN content_batches cb ON cb.id = revision_requests.batch_id
            WHERE p.id = auth.uid() AND cb.vendor_id = p.vendor_id
        )
    );

CREATE POLICY "revision_requests_client_access" ON revision_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN blog_posts bp ON bp.id = revision_requests.blog_post_id
            WHERE p.id = auth.uid() AND bp.client_id = p.client_id
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            JOIN content_batches cb ON cb.id = revision_requests.batch_id
            WHERE p.id = auth.uid() AND cb.client_id = p.client_id
        )
    );

-- Notifications Policies (users can only see their own)
CREATE POLICY "notifications_user_access" ON notifications
    FOR ALL USING (user_id = auth.uid());

-- WordPress Sites Policies
CREATE POLICY "wordpress_sites_vendor_access" ON wordpress_sites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.vendor_id = wordpress_sites.vendor_id
        )
    );

-- WordPress Posts Policies
CREATE POLICY "wordpress_posts_vendor_access" ON wordpress_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN blog_posts bp ON bp.id = wordpress_posts.blog_post_id
            WHERE p.id = auth.uid() AND bp.vendor_id = p.vendor_id
        )
    );

-- ============================================
-- 10. Trigger for updated_at timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_revision_requests_updated_at ON revision_requests;
CREATE TRIGGER update_revision_requests_updated_at
    BEFORE UPDATE ON revision_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wordpress_sites_updated_at ON wordpress_sites;
CREATE TRIGGER update_wordpress_sites_updated_at
    BEFORE UPDATE ON wordpress_sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. Helper function to generate public tokens
-- ============================================

CREATE OR REPLACE FUNCTION generate_public_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(24), 'base64');
END;
$$ LANGUAGE plpgsql;
