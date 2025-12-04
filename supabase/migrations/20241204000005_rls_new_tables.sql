-- Row Level Security for new tables
-- Enable RLS and create policies for website scraper and brand guide tables

-- Websites: Users can access websites for their clients
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view websites for their clients"
  ON websites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = websites.id
      AND clients.owner_id = auth.uid()
    )
    OR
    -- Allow if website is linked to a client they own
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.website_url = websites.url
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage websites for their clients"
  ON websites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = websites.id
      AND clients.owner_id = auth.uid()
    )
  );

-- Scraped Pages: Users can access pages for their websites
ALTER TABLE scraped_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scraped pages for their websites"
  ON scraped_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM websites
      JOIN clients ON clients.website_url = websites.url
      WHERE websites.id = scraped_pages.website_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage scraped pages for their websites"
  ON scraped_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM websites
      JOIN clients ON clients.website_url = websites.url
      WHERE websites.id = scraped_pages.website_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Content Gaps: Users can access gaps for their websites
ALTER TABLE content_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content gaps for their websites"
  ON content_gaps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM websites
      JOIN clients ON clients.website_url = websites.url
      WHERE websites.id = content_gaps.website_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage content gaps for their websites"
  ON content_gaps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM websites
      JOIN clients ON clients.website_url = websites.url
      WHERE websites.id = content_gaps.website_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Content Suggestions: Users can access suggestions for their websites
ALTER TABLE content_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content suggestions for their websites"
  ON content_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM websites
      JOIN clients ON clients.website_url = websites.url
      WHERE websites.id = content_suggestions.website_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage content suggestions for their websites"
  ON content_suggestions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM websites
      JOIN clients ON clients.website_url = websites.url
      WHERE websites.id = content_suggestions.website_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Website Insights: Users can access insights for their websites
ALTER TABLE website_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view website insights for their websites"
  ON website_insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM websites
      JOIN clients ON clients.website_url = websites.url
      WHERE websites.id = website_insights.website_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Brand Guides: Users can access brand guides for their clients
ALTER TABLE brand_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view brand guides for their clients"
  ON brand_guides FOR SELECT
  USING (
    -- Allow if brand guide name matches client name or is linked
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.name = brand_guides.brand_name
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage brand guides for their clients"
  ON brand_guides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.name = brand_guides.brand_name
      AND clients.owner_id = auth.uid()
    )
  );

-- Products Services: Users can access products for their brand guides
ALTER TABLE products_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products for their brand guides"
  ON products_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_guides
      JOIN clients ON clients.name = brand_guides.brand_name
      WHERE brand_guides.id = products_services.brand_guide_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage products for their brand guides"
  ON products_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM brand_guides
      JOIN clients ON clients.name = brand_guides.brand_name
      WHERE brand_guides.id = products_services.brand_guide_id
      AND clients.owner_id = auth.uid()
    )
  );

-- FAQs: Users can access FAQs for their brand guides
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view FAQs for their brand guides"
  ON faqs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_guides
      JOIN clients ON clients.name = brand_guides.brand_name
      WHERE brand_guides.id = faqs.brand_guide_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage FAQs for their brand guides"
  ON faqs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM brand_guides
      JOIN clients ON clients.name = brand_guides.brand_name
      WHERE brand_guides.id = faqs.brand_guide_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Comparison Tables: Users can access comparison tables for their brand guides
ALTER TABLE comparison_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comparison tables for their brand guides"
  ON comparison_tables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_guides
      JOIN clients ON clients.name = brand_guides.brand_name
      WHERE brand_guides.id = comparison_tables.brand_guide_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage comparison tables for their brand guides"
  ON comparison_tables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM brand_guides
      JOIN clients ON clients.name = brand_guides.brand_name
      WHERE brand_guides.id = comparison_tables.brand_guide_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Content Requirements: Users can view all, manage their own
ALTER TABLE content_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content requirements"
  ON content_requirements FOR SELECT
  USING (true); -- Public read for templates

CREATE POLICY "Users can manage content requirements"
  ON content_requirements FOR ALL
  USING (true); -- Allow all for now, restrict later if needed

-- Post Requirements: Users can access requirements for their posts
ALTER TABLE post_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view post requirements for their posts"
  ON post_requirements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = post_requirements.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage post requirements for their posts"
  ON post_requirements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      JOIN clients ON clients.id = blog_posts.client_id
      WHERE blog_posts.id = post_requirements.blog_post_id
      AND clients.owner_id = auth.uid()
    )
  );

-- Uploaded Documents: Users can access their own documents
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own uploaded documents"
  ON uploaded_documents FOR SELECT
  USING (true); -- Simplified for now, add user_id column later if needed

CREATE POLICY "Users can manage their own uploaded documents"
  ON uploaded_documents FOR ALL
  USING (true); -- Simplified for now

