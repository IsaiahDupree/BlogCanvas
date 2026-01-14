-- WordPress Integration Migration
-- Stores WordPress site connections and publish tracking

-- WordPress connections table
CREATE TABLE IF NOT EXISTS wordpress_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Connection details
    site_url TEXT NOT NULL,
    site_name TEXT,
    username TEXT NOT NULL,
    application_password_encrypted TEXT NOT NULL, -- Encrypted application password
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_connected_at TIMESTAMPTZ,
    connection_status TEXT DEFAULT 'pending', -- pending, connected, failed
    connection_error TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure one connection per client
    UNIQUE(client_id)
);

-- WordPress publish log
CREATE TABLE IF NOT EXISTS wordpress_publish_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    wordpress_connection_id UUID REFERENCES wordpress_connections(id) ON DELETE SET NULL,
    
    -- WordPress post details
    wp_post_id INTEGER,
    wp_post_url TEXT,
    wp_post_status TEXT, -- publish, draft, pending, scheduled
    
    -- Publish details
    published_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    
    -- Status tracking
    status TEXT DEFAULT 'pending', -- pending, publishing, published, failed, updated
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Content hash for change detection
    content_hash TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add wordpress fields to blog_posts if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'cms_post_id') THEN
        ALTER TABLE blog_posts ADD COLUMN cms_post_id INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'cms_url') THEN
        ALTER TABLE blog_posts ADD COLUMN cms_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'cms_published_at') THEN
        ALTER TABLE blog_posts ADD COLUMN cms_published_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'cms_status') THEN
        ALTER TABLE blog_posts ADD COLUMN cms_status TEXT;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wordpress_connections_vendor ON wordpress_connections(vendor_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_connections_client ON wordpress_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_publish_log_post ON wordpress_publish_log(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_publish_log_status ON wordpress_publish_log(status);

-- RLS Policies
ALTER TABLE wordpress_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_publish_log ENABLE ROW LEVEL SECURITY;

-- Vendors can manage their WordPress connections
CREATE POLICY "Vendors can view own WordPress connections"
    ON wordpress_connections FOR SELECT
    USING (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Vendors can insert WordPress connections"
    ON wordpress_connections FOR INSERT
    WITH CHECK (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Vendors can update own WordPress connections"
    ON wordpress_connections FOR UPDATE
    USING (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Vendors can delete own WordPress connections"
    ON wordpress_connections FOR DELETE
    USING (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Publish log policies
CREATE POLICY "Vendors can view own publish logs"
    ON wordpress_publish_log FOR SELECT
    USING (
        wordpress_connection_id IN (
            SELECT id FROM wordpress_connections 
            WHERE vendor_id IN (
                SELECT vendor_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Vendors can insert publish logs"
    ON wordpress_publish_log FOR INSERT
    WITH CHECK (
        wordpress_connection_id IN (
            SELECT id FROM wordpress_connections 
            WHERE vendor_id IN (
                SELECT vendor_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Vendors can update own publish logs"
    ON wordpress_publish_log FOR UPDATE
    USING (
        wordpress_connection_id IN (
            SELECT id FROM wordpress_connections 
            WHERE vendor_id IN (
                SELECT vendor_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_wordpress_connection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_wordpress_connections_timestamp ON wordpress_connections;
CREATE TRIGGER update_wordpress_connections_timestamp
    BEFORE UPDATE ON wordpress_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_wordpress_connection_timestamp();

DROP TRIGGER IF EXISTS update_wordpress_publish_log_timestamp ON wordpress_publish_log;
CREATE TRIGGER update_wordpress_publish_log_timestamp
    BEFORE UPDATE ON wordpress_publish_log
    FOR EACH ROW
    EXECUTE FUNCTION update_wordpress_connection_timestamp();
