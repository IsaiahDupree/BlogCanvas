-- Performance Optimization: Database Indexes
-- Feature: VENDOR-WC-050 Database query optimization
-- Created: 2026-02-20

-- ============================================
-- INDEX STRATEGY
-- ============================================
-- 1. Foreign key columns (join optimization)
-- 2. Frequently filtered columns (WHERE clauses)
-- 3. Sort columns (ORDER BY clauses)
-- 4. Composite indexes for common query patterns
-- ============================================

-- Vendors table indexes
CREATE INDEX IF NOT EXISTS idx_vendors_handle ON vendors(handle) WHERE handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_created_at ON vendors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email) WHERE email IS NOT NULL;

-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_vendor_id ON clients(vendor_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status) WHERE status IS NOT NULL;
-- Composite index for vendor's client list queries
CREATE INDEX IF NOT EXISTS idx_clients_vendor_status ON clients(vendor_id, status, created_at DESC);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
-- Composite index for vendor's order list
CREATE INDEX IF NOT EXISTS idx_orders_vendor_status_date ON orders(vendor_id, status, created_at DESC);

-- Blog posts table indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_vendor_id ON blog_posts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_client_id ON blog_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC) WHERE published_at IS NOT NULL;
-- Composite index for vendor's content library
CREATE INDEX IF NOT EXISTS idx_blog_posts_vendor_status ON blog_posts(vendor_id, status, created_at DESC);

-- Pipeline jobs table indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_vendor_id ON pipeline_jobs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_status ON pipeline_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_created_at ON pipeline_jobs(created_at DESC);
-- Composite index for active jobs queries
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_vendor_status ON pipeline_jobs(vendor_id, status, created_at DESC);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
-- Composite index for user's unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read, created_at DESC);

-- Files table indexes
CREATE INDEX IF NOT EXISTS idx_files_client_id ON files(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);

-- Invoices table indexes
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
-- Composite index for vendor's invoice list
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_status ON invoices(vendor_id, status, created_at DESC);

-- Meetings table indexes
CREATE INDEX IF NOT EXISTS idx_meetings_vendor_id ON meetings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_meetings_client_id ON meetings(client_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
-- Composite index for upcoming meetings query
CREATE INDEX IF NOT EXISTS idx_meetings_vendor_upcoming ON meetings(vendor_id, scheduled_at) WHERE status != 'cancelled';

-- Comments table indexes (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'comments') THEN
        CREATE INDEX IF NOT EXISTS idx_comments_blog_post_id ON comments(blog_post_id);
        CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
    END IF;
END $$;

-- API keys table indexes (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys') THEN
        CREATE INDEX IF NOT EXISTS idx_api_keys_vendor_id ON api_keys(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(active) WHERE active = true;
    END IF;
END $$;

-- Activity feed indexes (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_feed') THEN
        CREATE INDEX IF NOT EXISTS idx_activity_feed_vendor_id ON activity_feed(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);
    END IF;
END $$;

-- Custom domains indexes (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'custom_domains') THEN
        CREATE INDEX IF NOT EXISTS idx_custom_domains_vendor_id ON custom_domains(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);
        CREATE INDEX IF NOT EXISTS idx_custom_domains_status ON custom_domains(status);
    END IF;
END $$;

-- ============================================
-- TEXT SEARCH OPTIMIZATION
-- ============================================

-- Full-text search index for blog posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_search ON blog_posts USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_blog_posts_content_search ON blog_posts USING gin(to_tsvector('english', content));

-- Full-text search index for clients
CREATE INDEX IF NOT EXISTS idx_clients_name_search ON clients USING gin(to_tsvector('english', name));

-- ============================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ============================================

-- Active orders only
CREATE INDEX IF NOT EXISTS idx_orders_active ON orders(vendor_id, created_at DESC)
    WHERE status IN ('pending', 'in_progress');

-- Unread notifications only
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at DESC)
    WHERE read = false;

-- Published blog posts only
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(vendor_id, published_at DESC)
    WHERE status = 'published';

-- Upcoming meetings only
CREATE INDEX IF NOT EXISTS idx_meetings_upcoming ON meetings(vendor_id, scheduled_at)
    WHERE scheduled_at > NOW() AND status != 'cancelled';

-- ============================================
-- CLEANUP
-- ============================================

-- Remove any redundant or unused indexes
-- (Add DROP INDEX statements here if needed after analysis)

-- ============================================
-- ANALYZE TABLES
-- ============================================
-- Update statistics for query planner
ANALYZE vendors;
ANALYZE clients;
ANALYZE orders;
ANALYZE blog_posts;
ANALYZE pipeline_jobs;
ANALYZE notifications;
ANALYZE files;
ANALYZE invoices;
ANALYZE meetings;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON INDEX idx_clients_vendor_status IS 'Optimizes vendor client list queries';
COMMENT ON INDEX idx_orders_vendor_status_date IS 'Optimizes vendor order dashboard';
COMMENT ON INDEX idx_notifications_user_unread IS 'Optimizes notification bell queries';
COMMENT ON INDEX idx_blog_posts_vendor_status IS 'Optimizes content library listing';
COMMENT ON INDEX idx_meetings_vendor_upcoming IS 'Optimizes upcoming meetings widget';
