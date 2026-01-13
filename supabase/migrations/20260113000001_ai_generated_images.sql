-- AI Generated Images for Blog Posts
-- PRD Epic 5: AI Pipeline - feat-039

-- Table to store AI-generated images
CREATE TABLE blog_post_generated_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,

  -- Generation details
  prompt text NOT NULL,
  revised_prompt text,

  -- Image data
  image_url text NOT NULL,
  storage_path text,  -- Path in Supabase Storage after upload

  -- Generation parameters
  model text DEFAULT 'dall-e-3',
  size text DEFAULT '1024x1024',
  quality text DEFAULT 'standard',
  style text DEFAULT 'natural',

  -- Status and metadata
  is_selected boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  generation_status text DEFAULT 'generated', -- 'generated', 'uploaded', 'selected', 'archived'

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_blog_post_generated_images_post_id ON blog_post_generated_images(blog_post_id);
CREATE INDEX idx_blog_post_generated_images_selected ON blog_post_generated_images(blog_post_id, is_selected);
CREATE INDEX idx_blog_post_generated_images_featured ON blog_post_generated_images(blog_post_id, is_featured);

-- RLS Policies
ALTER TABLE blog_post_generated_images ENABLE ROW LEVEL SECURITY;

-- Vendors can manage images for their posts
CREATE POLICY "Vendors can view their generated images"
  ON blog_post_generated_images
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts bp
      WHERE bp.id = blog_post_generated_images.blog_post_id
      AND bp.client_id IN (
        SELECT client_id FROM vendor_clients
        WHERE vendor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Vendors can insert generated images"
  ON blog_post_generated_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blog_posts bp
      WHERE bp.id = blog_post_generated_images.blog_post_id
      AND bp.client_id IN (
        SELECT client_id FROM vendor_clients
        WHERE vendor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Vendors can update their generated images"
  ON blog_post_generated_images
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts bp
      WHERE bp.id = blog_post_generated_images.blog_post_id
      AND bp.client_id IN (
        SELECT client_id FROM vendor_clients
        WHERE vendor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Vendors can delete their generated images"
  ON blog_post_generated_images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts bp
      WHERE bp.id = blog_post_generated_images.blog_post_id
      AND bp.client_id IN (
        SELECT client_id FROM vendor_clients
        WHERE vendor_id = auth.uid()
      )
    )
  );

-- Clients can view images for their posts
CREATE POLICY "Clients can view generated images for their posts"
  ON blog_post_generated_images
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts bp
      JOIN clients c ON c.id = bp.client_id
      WHERE bp.id = blog_post_generated_images.blog_post_id
      AND c.user_id = auth.uid()
    )
  );

-- Function to automatically set updated_at
CREATE OR REPLACE FUNCTION update_blog_post_generated_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_post_generated_images_updated_at
  BEFORE UPDATE ON blog_post_generated_images
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_generated_images_updated_at();

-- Add featured_image_id column to blog_posts (optional, for quick reference)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured_image_id uuid REFERENCES blog_post_generated_images(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured_image ON blog_posts(featured_image_id);
