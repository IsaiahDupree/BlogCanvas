-- Migration: Add WordPress category and tag assignment fields
-- This enables automatic and manual category/tag assignment for WordPress publishing

-- Add category and tag mapping fields to blog_posts
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS wordpress_categories JSONB DEFAULT '[]', -- Array of {id: number, name: string, slug: string}
ADD COLUMN IF NOT EXISTS wordpress_tags JSONB DEFAULT '[]',       -- Array of {id: number, name: string, slug: string}
ADD COLUMN IF NOT EXISTS wordpress_categories_auto_assigned BOOLEAN DEFAULT false, -- Track if categories were auto-assigned
ADD COLUMN IF NOT EXISTS wordpress_tags_auto_assigned BOOLEAN DEFAULT false;      -- Track if tags were auto-assigned

-- Add comment for documentation
COMMENT ON COLUMN blog_posts.wordpress_categories IS 'WordPress categories assigned to this post. Format: [{id: number, name: string, slug: string}]';
COMMENT ON COLUMN blog_posts.wordpress_tags IS 'WordPress tags assigned to this post. Format: [{id: number, name: string, slug: string}]';
COMMENT ON COLUMN blog_posts.wordpress_categories_auto_assigned IS 'True if categories were auto-assigned based on topic cluster, false if manually set';
COMMENT ON COLUMN blog_posts.wordpress_tags_auto_assigned IS 'True if tags were auto-assigned based on keywords, false if manually set';

-- Create a table to cache WordPress taxonomies per connection
CREATE TABLE IF NOT EXISTS wordpress_taxonomy_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wordpress_connection_id UUID NOT NULL,
  taxonomy_type TEXT NOT NULL CHECK (taxonomy_type IN ('category', 'tag')),
  taxonomy_id INTEGER NOT NULL, -- WordPress category/tag ID
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique taxonomy per connection
  UNIQUE(wordpress_connection_id, taxonomy_type, taxonomy_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_wordpress_taxonomy_cache_connection
  ON wordpress_taxonomy_cache(wordpress_connection_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_taxonomy_cache_type
  ON wordpress_taxonomy_cache(taxonomy_type);
CREATE INDEX IF NOT EXISTS idx_wordpress_taxonomy_cache_name
  ON wordpress_taxonomy_cache(name);

-- Enable RLS on taxonomy cache
ALTER TABLE wordpress_taxonomy_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies for taxonomy cache (staff can manage, clients can view their own)
CREATE POLICY "Staff can manage taxonomy cache"
  ON wordpress_taxonomy_cache FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('staff', 'admin', 'owner')
    )
  );

-- Add comment for documentation
COMMENT ON TABLE wordpress_taxonomy_cache IS 'Caches WordPress categories and tags fetched from WordPress sites to avoid repeated API calls';
