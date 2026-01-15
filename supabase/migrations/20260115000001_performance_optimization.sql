-- Performance Optimization Migration
-- feat-053: Add comprehensive indexes for query performance

-- ============================================================================
-- SEO RETAINER SYSTEM INDEXES
-- ============================================================================

-- seo_audits indexes
CREATE INDEX IF NOT EXISTS idx_seo_audits_website_id ON seo_audits(website_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_audit_date ON seo_audits(audit_date DESC);
CREATE INDEX IF NOT EXISTS idx_seo_audits_baseline_score ON seo_audits(baseline_score DESC);

-- topic_clusters indexes
CREATE INDEX IF NOT EXISTS idx_topic_clusters_website_id ON topic_clusters(website_id);
CREATE INDEX IF NOT EXISTS idx_topic_clusters_currently_covered ON topic_clusters(currently_covered);
CREATE INDEX IF NOT EXISTS idx_topic_clusters_difficulty ON topic_clusters(difficulty);
CREATE INDEX IF NOT EXISTS idx_topic_clusters_estimated_traffic ON topic_clusters(estimated_traffic DESC);

-- content_batches indexes
CREATE INDEX IF NOT EXISTS idx_content_batches_website_id ON content_batches(website_id);
CREATE INDEX IF NOT EXISTS idx_content_batches_status ON content_batches(status);
CREATE INDEX IF NOT EXISTS idx_content_batches_start_date ON content_batches(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_content_batches_end_date ON content_batches(end_date);

-- blog_post_revisions indexes
CREATE INDEX IF NOT EXISTS idx_blog_post_revisions_blog_post_id ON blog_post_revisions(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_revisions_revision_type ON blog_post_revisions(revision_type);
CREATE INDEX IF NOT EXISTS idx_blog_post_revisions_created_at ON blog_post_revisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_post_revisions_created_by ON blog_post_revisions(created_by) WHERE created_by IS NOT NULL;

-- blog_post_metrics indexes
CREATE INDEX IF NOT EXISTS idx_blog_post_metrics_blog_post_id ON blog_post_metrics(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_metrics_snapshot_date ON blog_post_metrics(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_post_metrics_seo_score ON blog_post_metrics(seo_score DESC) WHERE seo_score IS NOT NULL;

-- reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_website_id ON reports(website_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_period_start ON reports(period_start DESC);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at DESC);

-- check_back_schedules indexes
CREATE INDEX IF NOT EXISTS idx_check_back_schedules_blog_post_id ON check_back_schedules(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_check_back_schedules_scheduled_date ON check_back_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_check_back_schedules_status ON check_back_schedules(status);
CREATE INDEX IF NOT EXISTS idx_check_back_schedules_check_back_type ON check_back_schedules(check_back_type);

-- ============================================================================
-- EXISTING TABLE ENHANCEMENTS
-- ============================================================================

-- blog_posts additional indexes for new columns
CREATE INDEX IF NOT EXISTS idx_blog_posts_content_batch_id ON blog_posts(content_batch_id) WHERE content_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_topic_cluster_id ON blog_posts(topic_cluster_id) WHERE topic_cluster_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_seo_quality_score ON blog_posts(seo_quality_score DESC) WHERE seo_quality_score IS NOT NULL;

-- ============================================================================
-- WORDPRESS INTEGRATION INDEXES
-- ============================================================================

-- wordpress_connections indexes
CREATE INDEX IF NOT EXISTS idx_wordpress_connections_client_id ON wordpress_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_connections_status ON wordpress_connections(status);

-- wordpress_posts indexes
CREATE INDEX IF NOT EXISTS idx_wordpress_posts_blog_post_id ON wordpress_posts(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_posts_wordpress_connection_id ON wordpress_posts(wordpress_connection_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_posts_status ON wordpress_posts(status);
CREATE INDEX IF NOT EXISTS idx_wordpress_posts_published_at ON wordpress_posts(published_at DESC) WHERE published_at IS NOT NULL;

-- wordpress_publish_log indexes
CREATE INDEX IF NOT EXISTS idx_wordpress_publish_log_wordpress_post_id ON wordpress_publish_log(wordpress_post_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_publish_log_created_at ON wordpress_publish_log(created_at DESC);

-- wordpress_sites indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_wordpress_sites_client_id ON wordpress_sites(client_id);

-- ============================================================================
-- BRAND GUIDES INDEXES
-- ============================================================================

-- brand_guides indexes
CREATE INDEX IF NOT EXISTS idx_brand_guides_client_id ON brand_guides(client_id);
CREATE INDEX IF NOT EXISTS idx_brand_guides_created_at ON brand_guides(created_at DESC);

-- products_services indexes
CREATE INDEX IF NOT EXISTS idx_products_services_brand_guide_id ON products_services(brand_guide_id);

-- faqs indexes
CREATE INDEX IF NOT EXISTS idx_faqs_brand_guide_id ON faqs(brand_guide_id);

-- comparison_tables indexes
CREATE INDEX IF NOT EXISTS idx_comparison_tables_brand_guide_id ON comparison_tables(brand_guide_id);

-- content_requirements indexes
CREATE INDEX IF NOT EXISTS idx_content_requirements_brand_guide_id ON content_requirements(brand_guide_id);

-- post_requirements indexes
CREATE INDEX IF NOT EXISTS idx_post_requirements_brand_guide_id ON post_requirements(brand_guide_id);

-- uploaded_documents indexes
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_brand_guide_id ON uploaded_documents(brand_guide_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_uploaded_at ON uploaded_documents(uploaded_at DESC);

-- ============================================================================
-- WEBSITE SCRAPER INDEXES
-- ============================================================================

-- websites indexes
CREATE INDEX IF NOT EXISTS idx_websites_client_id ON websites(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_websites_scrape_status ON websites(scrape_status);
CREATE INDEX IF NOT EXISTS idx_websites_created_at ON websites(created_at DESC);

-- scraped_pages indexes
CREATE INDEX IF NOT EXISTS idx_scraped_pages_website_id ON scraped_pages(website_id);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_scraped_at ON scraped_pages(scraped_at DESC);

-- content_gaps indexes
CREATE INDEX IF NOT EXISTS idx_content_gaps_website_id ON content_gaps(website_id);
CREATE INDEX IF NOT EXISTS idx_content_gaps_priority_score ON content_gaps(priority_score DESC) WHERE priority_score IS NOT NULL;

-- content_suggestions indexes
CREATE INDEX IF NOT EXISTS idx_content_suggestions_website_id ON content_suggestions(website_id);
CREATE INDEX IF NOT EXISTS idx_content_suggestions_status ON content_suggestions(status);

-- website_insights indexes
CREATE INDEX IF NOT EXISTS idx_website_insights_website_id ON website_insights(website_id);
CREATE INDEX IF NOT EXISTS idx_website_insights_created_at ON website_insights(created_at DESC);

-- ============================================================================
-- INTEGRATIONS INDEXES
-- ============================================================================

-- ga4_connections indexes
CREATE INDEX IF NOT EXISTS idx_ga4_connections_client_id ON ga4_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_ga4_connections_status ON ga4_connections(status);

-- email_queue indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_for ON email_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at DESC);

-- publish_queue indexes
CREATE INDEX IF NOT EXISTS idx_publish_queue_status ON publish_queue(status);
CREATE INDEX IF NOT EXISTS idx_publish_queue_scheduled_for ON publish_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_publish_queue_blog_post_id ON publish_queue(blog_post_id);

-- ============================================================================
-- AUDIT AND LOGGING INDEXES
-- ============================================================================

-- audit_logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Blog posts by batch and status
CREATE INDEX IF NOT EXISTS idx_blog_posts_batch_status ON blog_posts(content_batch_id, status) WHERE content_batch_id IS NOT NULL;

-- Blog posts by client and status (for client portal)
CREATE INDEX IF NOT EXISTS idx_blog_posts_client_status ON blog_posts(client_id, status);

-- Metrics by post and date range
CREATE INDEX IF NOT EXISTS idx_blog_post_metrics_post_date ON blog_post_metrics(blog_post_id, snapshot_date DESC);

-- Check-backs by status and scheduled date (for cron jobs)
CREATE INDEX IF NOT EXISTS idx_check_back_schedules_status_date ON check_back_schedules(status, scheduled_date) WHERE status = 'pending';

-- Email queue by status and scheduled time (for processing)
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON email_queue(status, scheduled_for) WHERE status = 'pending';

-- Comments by post and resolved status (for UI)
CREATE INDEX IF NOT EXISTS idx_comments_post_resolved ON comments(blog_post_id, resolved);

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

-- Update statistics for query planner optimization
ANALYZE blog_posts;
ANALYZE content_batches;
ANALYZE topic_clusters;
ANALYZE seo_audits;
ANALYZE blog_post_metrics;
ANALYZE blog_post_revisions;
ANALYZE websites;
ANALYZE clients;
