-- Performance Indexes
-- Add indexes to improve query performance

-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Client profiles indexes
CREATE INDEX IF NOT EXISTS idx_client_profiles_client_id ON client_profiles(client_id);

-- Website pages indexes
CREATE INDEX IF NOT EXISTS idx_website_pages_client_id ON website_pages(client_id);
CREATE INDEX IF NOT EXISTS idx_website_pages_url ON website_pages(url);
CREATE INDEX IF NOT EXISTS idx_website_pages_created_at ON website_pages(created_at DESC);

-- Blog posts indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_client_id ON blog_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_updated_at ON blog_posts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_target_keyword ON blog_posts(target_keyword) WHERE target_keyword IS NOT NULL;

-- Blog post sections indexes
CREATE INDEX IF NOT EXISTS idx_blog_post_sections_blog_post_id ON blog_post_sections(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_sections_order_index ON blog_post_sections(blog_post_id, order_index);
CREATE INDEX IF NOT EXISTS idx_blog_post_sections_needs_human ON blog_post_sections(needs_human) WHERE needs_human = true;

-- Agent runs indexes
CREATE INDEX IF NOT EXISTS idx_agent_runs_blog_post_id ON agent_runs(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_name ON agent_runs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started_at ON agent_runs(started_at DESC);

-- Review tasks indexes
CREATE INDEX IF NOT EXISTS idx_review_tasks_blog_post_id ON review_tasks(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_review_tasks_section_id ON review_tasks(section_id);
CREATE INDEX IF NOT EXISTS idx_review_tasks_status ON review_tasks(status);
CREATE INDEX IF NOT EXISTS idx_review_tasks_assigned_to ON review_tasks(assigned_to) WHERE assigned_to IS NOT NULL;

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_blog_post_id ON comments(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_comments_section_id ON comments(section_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_resolved ON comments(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- CMS connections indexes
CREATE INDEX IF NOT EXISTS idx_cms_connections_client_id ON cms_connections(client_id);

