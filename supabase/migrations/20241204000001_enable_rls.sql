-- Enable Row Level Security on all tables
-- This is a security best practice for Supabase

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_connections ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies: Users can only access their own data
-- These are placeholder policies - you should customize them based on your auth setup

-- Clients: Users can only see/modify clients they own
CREATE POLICY "Users can view their own clients"
  ON clients FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own clients"
  ON clients FOR DELETE
  USING (auth.uid() = owner_id);

-- Client Profiles: Users can access profiles for their clients
CREATE POLICY "Users can view profiles for their clients"
  ON client_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_profiles.client_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage profiles for their clients"
  ON client_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_profiles.client_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Website Pages: Users can access pages for their clients
CREATE POLICY "Users can view pages for their clients"
  ON website_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = website_pages.client_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage pages for their clients"
  ON website_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = website_pages.client_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Blog Posts: Users can access posts for their clients
CREATE POLICY "Users can view posts for their clients"
  ON blog_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = blog_posts.client_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage posts for their clients"
  ON blog_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = blog_posts.client_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Blog Post Sections: Users can access sections for their posts
CREATE POLICY "Users can view sections for their posts"
  ON blog_post_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = blog_post_sections.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage sections for their posts"
  ON blog_post_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = blog_post_sections.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Agent Runs: Users can access runs for their posts
CREATE POLICY "Users can view runs for their posts"
  ON agent_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = agent_runs.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage runs for their posts"
  ON agent_runs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = agent_runs.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Review Tasks: Users can access tasks for their posts
CREATE POLICY "Users can view tasks for their posts"
  ON review_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = review_tasks.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage tasks for their posts"
  ON review_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = review_tasks.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Comments: Users can access comments for their posts
CREATE POLICY "Users can view comments for their posts"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = comments.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage comments for their posts"
  ON comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = comments.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

-- CMS Connections: Users can access connections for their clients
CREATE POLICY "Users can view connections for their clients"
  ON cms_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = cms_connections.client_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage connections for their clients"
  ON cms_connections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = cms_connections.client_id
      AND clients.owner_id = auth.uid()
    )
  );

