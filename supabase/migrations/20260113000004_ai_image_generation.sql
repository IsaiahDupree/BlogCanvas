-- AI Image Generation System
-- Stores AI-generated images for blog posts

-- Table for storing generated images
CREATE TABLE IF NOT EXISTS generated_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,

  -- Image generation details
  prompt text NOT NULL,                    -- Prompt used to generate the image
  model text NOT NULL DEFAULT 'dall-e-3',  -- AI model used (dall-e-3, dall-e-2, etc.)
  size text NOT NULL DEFAULT '1024x1024',  -- Image dimensions
  quality text DEFAULT 'standard',         -- Image quality (standard, hd)
  style text DEFAULT 'natural',            -- Image style (natural, vivid)

  -- Storage details
  storage_path text NOT NULL,              -- Path in Supabase Storage
  storage_bucket text NOT NULL DEFAULT 'blog-images', -- Supabase bucket name
  url text NOT NULL,                       -- Public URL of the image

  -- Image metadata
  file_size bigint,                        -- Size in bytes
  mime_type text DEFAULT 'image/png',      -- MIME type
  width int,                               -- Actual width in pixels
  height int,                              -- Actual height in pixels

  -- Selection and usage
  is_selected boolean DEFAULT false,       -- Whether this image is selected for the post
  is_featured boolean DEFAULT false,       -- Whether this is the featured image
  position text,                           -- Where in the post (header, section_1, etc.)
  alt_text text,                           -- Alt text for accessibility
  caption text,                            -- Optional caption

  -- AI metadata
  revised_prompt text,                     -- OpenAI sometimes revises prompts for safety
  generation_metadata jsonb,               -- Additional metadata from AI provider

  -- Lifecycle
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,                  -- Soft delete

  -- Indexes for common queries
  CONSTRAINT valid_position CHECK (position IS NULL OR position ~ '^[a-z_]+$')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_images_post_id ON generated_images(blog_post_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_generated_images_selected ON generated_images(blog_post_id, is_selected) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_generated_images_featured ON generated_images(blog_post_id, is_featured) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at DESC);

-- Enable Row Level Security
ALTER TABLE generated_images ENABLE ROW LEVEL security;

-- RLS Policies
-- Vendors can manage all generated images for their clients' posts
CREATE POLICY "Vendors can manage generated images for their posts"
  ON generated_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts bp
      JOIN clients c ON bp.client_id = c.id
      WHERE bp.id = generated_images.blog_post_id
      AND c.owner_id = auth.uid()
    )
  );

-- Clients can view generated images for their posts
CREATE POLICY "Clients can view their post images"
  ON generated_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts bp
      JOIN clients c ON bp.client_id = c.id
      JOIN client_users cu ON cu.client_id = c.id
      WHERE bp.id = generated_images.blog_post_id
      AND cu.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_generated_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_generated_images_updated_at
  BEFORE UPDATE ON generated_images
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_images_updated_at();

-- Function to ensure only one featured image per post
CREATE OR REPLACE FUNCTION ensure_single_featured_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_featured = true THEN
    -- Unset other featured images for the same post
    UPDATE generated_images
    SET is_featured = false
    WHERE blog_post_id = NEW.blog_post_id
    AND id != NEW.id
    AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure single featured image
CREATE TRIGGER ensure_single_featured_image
  BEFORE INSERT OR UPDATE ON generated_images
  FOR EACH ROW
  WHEN (NEW.is_featured = true)
  EXECUTE FUNCTION ensure_single_featured_image();

-- Add comment for documentation
COMMENT ON TABLE generated_images IS 'Stores AI-generated images for blog posts with generation metadata and selection status';
COMMENT ON COLUMN generated_images.prompt IS 'The text prompt used to generate the image';
COMMENT ON COLUMN generated_images.revised_prompt IS 'OpenAI may revise prompts for safety - this stores the actual prompt used';
COMMENT ON COLUMN generated_images.is_selected IS 'Whether this image option is selected for use in the post';
COMMENT ON COLUMN generated_images.is_featured IS 'Whether this is the featured/hero image for the post';
COMMENT ON COLUMN generated_images.position IS 'Where in the post this image appears (header, section_1, conclusion, etc.)';
