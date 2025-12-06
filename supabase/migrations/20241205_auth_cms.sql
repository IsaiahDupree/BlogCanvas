-- Migration: Add profiles table for user roles
-- This stores user profile information and roles

CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'staff', 'admin', 'owner')),
    full_name TEXT,
    company TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('staff', 'admin', 'owner')
        )
    );

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migration: Add cms_connections table
-- This stores WordPress and other CMS connection credentials per client

CREATE TABLE IF NOT EXISTS cms_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    cms_type TEXT NOT NULL CHECK (cms_type IN ('wordpress', 'shopify', 'webflow', 'custom')),
    base_url TEXT NOT NULL,
    auth_payload JSONB NOT NULL, -- Stores username, password, API keys, etc.
    connection_status TEXT DEFAULT 'active' CHECK (connection_status IN ('active', 'inactive', 'error')),
    last_tested_at TIMESTAMP WITH TIME ZONE,
    test_result JSONB, -- Stores last connection test results
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE cms_connections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Staff can manage CMS connections"
    ON cms_connections FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('staff', 'admin', 'owner')
        )
    );

CREATE POLICY "Clients can view own CMS connections"
    ON cms_connections FOR SELECT
    USING (
        client_id IN (
            SELECT client_id FROM profiles
            WHERE id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX idx_cms_connections_client ON cms_connections(client_id);
CREATE INDEX idx_cms_connections_type ON cms_connections(cms_type);

-- Update blog_posts table to add new fields
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS final_html TEXT,
ADD COLUMN IF NOT EXISTS seo_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cms_publish_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS seo_notes TEXT;

-- Add client_id to blog_posts for direct client association
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_client ON blog_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);

-- Add posts_published to content_batches
ALTER TABLE content_batches
ADD COLUMN IF NOT EXISTS posts_published INTEGER DEFAULT 0;

-- Comments and documentation
COMMENT ON TABLE profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE cms_connections IS 'CMS connection credentials and settings per client';
COMMENT ON COLUMN blog_posts.final_html IS 'Final HTML version ready for publishing';
COMMENT ON COLUMN blog_posts.seo_metadata IS 'SEO metadata including title tags, meta descriptions, slugs';
COMMENT ON COLUMN blog_posts.cms_publish_info IS 'Publishing information including CMS post ID, URL, status';
COMMENT ON COLUMN cms_connections.auth_payload IS 'Encrypted credentials - username, password, API keys';
