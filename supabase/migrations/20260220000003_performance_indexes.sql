-- Performance optimization: Add missing indexes and optimize queries
-- Based on common query patterns in the application

-- Blog posts indexes
CREATE INDEX IF NOT EXISTS blog_posts_vendor_status_idx ON blog_posts(vendor_id, status);
CREATE INDEX IF NOT EXISTS blog_posts_client_status_idx ON blog_posts(client_id, status) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS blog_posts_created_at_idx ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_due_date_idx ON blog_posts(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS blog_posts_batch_idx ON blog_posts(content_batch_id) WHERE content_batch_id IS NOT NULL;

-- Clients indexes
CREATE INDEX IF NOT EXISTS clients_vendor_created_idx ON clients(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS clients_status_idx ON clients(status) WHERE status IS NOT NULL;

-- Websites indexes
CREATE INDEX IF NOT EXISTS websites_vendor_idx ON websites(vendor_id);
CREATE INDEX IF NOT EXISTS websites_client_idx ON websites(client_id);
CREATE INDEX IF NOT EXISTS websites_domain_idx ON websites(domain);

-- Orders indexes
CREATE INDEX IF NOT EXISTS orders_vendor_status_idx ON orders(vendor_id, status);
CREATE INDEX IF NOT EXISTS orders_client_status_idx ON orders(client_id, status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, is_read, created_at DESC);

-- Topic clusters indexes
CREATE INDEX IF NOT EXISTS topic_clusters_vendor_idx ON topic_clusters(vendor_id);
CREATE INDEX IF NOT EXISTS topic_clusters_website_idx ON topic_clusters(website_id) WHERE website_id IS NOT NULL;

-- Content batches indexes
CREATE INDEX IF NOT EXISTS content_batches_vendor_status_idx ON content_batches(vendor_id, status);
CREATE INDEX IF NOT EXISTS content_batches_created_idx ON content_batches(created_at DESC);

-- Check-back schedules indexes
CREATE INDEX IF NOT EXISTS check_back_schedules_status_date_idx ON check_back_schedules(status, scheduled_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS check_back_schedules_post_idx ON check_back_schedules(blog_post_id);

-- Blog post metrics indexes
CREATE INDEX IF NOT EXISTS blog_post_metrics_post_date_idx ON blog_post_metrics(blog_post_id, check_date DESC);

-- Analyze tables to update query planner statistics
ANALYZE blog_posts;
ANALYZE clients;
ANALYZE websites;
ANALYZE orders;
ANALYZE notifications;
ANALYZE topic_clusters;
ANALYZE content_batches;
ANALYZE check_back_schedules;
ANALYZE blog_post_metrics;

-- Add comment
COMMENT ON INDEX blog_posts_vendor_status_idx IS 'Optimizes vendor dashboard queries filtering by status';
COMMENT ON INDEX blog_posts_due_date_idx IS 'Optimizes queries for upcoming due dates';
COMMENT ON INDEX notifications_user_read_idx IS 'Optimizes notification center queries';
