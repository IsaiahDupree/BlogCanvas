-- RLS Policies for SEO Retainer System Tables

-- SEO Audits
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audits for their websites"
  ON seo_audits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM websites
      JOIN clients ON clients.website_url = websites.url
      WHERE websites.id = seo_audits.website_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage audits for their websites"
  ON seo_audits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM websites
      JOIN clients ON clients.website_url = websites.url
      WHERE websites.id = seo_audits.website_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Topic Clusters
ALTER TABLE topic_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view topic clusters for their websites"
  ON topic_clusters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM websites
      JOIN clients ON clients.website_url = websites.url
      WHERE websites.id = topic_clusters.website_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage topic clusters for their websites"
  ON topic_clusters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM websites
      JOIN clients ON clients.website_url = websites.url
      WHERE websites.id = topic_clusters.website_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Content Batches
ALTER TABLE content_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view batches for their clients"
  ON content_batches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = content_batches.client_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage batches for their clients"
  ON content_batches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = content_batches.client_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Blog Post Revisions
ALTER TABLE blog_post_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view revisions for their posts"
  ON blog_post_revisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = blog_post_revisions.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage revisions for their posts"
  ON blog_post_revisions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = blog_post_revisions.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Blog Post Metrics
ALTER TABLE blog_post_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metrics for their posts"
  ON blog_post_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = blog_post_metrics.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage metrics for their posts"
  ON blog_post_metrics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = blog_post_metrics.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports for their websites"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM websites
      JOIN clients ON clients.website_url = websites.url
      WHERE websites.id = reports.website_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage reports for their websites"
  ON reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM websites
      JOIN clients ON clients.website_url = websites.url
      WHERE websites.id = reports.website_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Check-back Schedules
ALTER TABLE check_back_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view check-backs for their posts"
  ON check_back_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = check_back_schedules.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage check-backs for their posts"
  ON check_back_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = check_back_schedules.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

