-- Asset CDN Integration Migration
-- Track uploaded assets with CDN URLs and metadata

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'document', 'audio', 'other')),
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- For video/audio in seconds
  storage_bucket TEXT NOT NULL DEFAULT 'assets',
  public_url TEXT NOT NULL,
  cdn_url TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assets_path ON assets(path);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_bucket ON assets(storage_bucket);
CREATE INDEX IF NOT EXISTS idx_assets_uploaded_by ON assets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at);

-- Create asset_transformations table for tracking image transformations
CREATE TABLE IF NOT EXISTS asset_transformations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  transformation_params JSONB NOT NULL,
  transformed_url TEXT NOT NULL,
  cache_key TEXT NOT NULL UNIQUE,
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes on asset_transformations
CREATE INDEX IF NOT EXISTS idx_transformations_asset_id ON asset_transformations(asset_id);
CREATE INDEX IF NOT EXISTS idx_transformations_cache_key ON asset_transformations(cache_key);
CREATE INDEX IF NOT EXISTS idx_transformations_last_accessed ON asset_transformations(last_accessed_at);

-- Function to update asset metadata
CREATE OR REPLACE FUNCTION update_asset_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating asset metadata
CREATE TRIGGER update_asset_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_metadata();

-- Function to track transformation access
CREATE OR REPLACE FUNCTION track_transformation_access(p_cache_key TEXT)
RETURNS void AS $$
BEGIN
  UPDATE asset_transformations
  SET
    hit_count = hit_count + 1,
    last_accessed_at = NOW()
  WHERE cache_key = p_cache_key;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up unused transformations
CREATE OR REPLACE FUNCTION cleanup_unused_transformations()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete transformations not accessed in 30 days
  WITH deleted AS (
    DELETE FROM asset_transformations
    WHERE last_accessed_at < NOW() - INTERVAL '30 days'
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get storage statistics
CREATE OR REPLACE FUNCTION get_storage_statistics()
RETURNS TABLE (
  asset_type TEXT,
  total_count BIGINT,
  total_size_bytes BIGINT,
  total_size_mb DECIMAL,
  avg_size_bytes DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.asset_type,
    COUNT(*) as total_count,
    SUM(a.size_bytes) as total_size_bytes,
    ROUND(SUM(a.size_bytes)::DECIMAL / 1024 / 1024, 2) as total_size_mb,
    ROUND(AVG(a.size_bytes)::DECIMAL, 2) as avg_size_bytes
  FROM assets a
  GROUP BY a.asset_type
  ORDER BY total_size_bytes DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user storage usage
CREATE OR REPLACE FUNCTION get_user_storage_usage(p_user_id UUID)
RETURNS TABLE (
  total_files BIGINT,
  total_size_bytes BIGINT,
  total_size_mb DECIMAL,
  by_type JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*),
    SUM(size_bytes),
    ROUND(SUM(size_bytes)::DECIMAL / 1024 / 1024, 2),
    JSONB_OBJECT_AGG(
      asset_type,
      JSONB_BUILD_OBJECT(
        'count', type_count,
        'size_bytes', type_size
      )
    )
  FROM (
    SELECT
      asset_type,
      COUNT(*) as type_count,
      SUM(size_bytes) as type_size
    FROM assets
    WHERE uploaded_by = p_user_id
    GROUP BY asset_type
  ) type_stats;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_transformations ENABLE ROW LEVEL SECURITY;

-- RLS policies for assets
CREATE POLICY "Users can view all assets"
  ON assets
  FOR SELECT
  USING (true); -- Assets are public

CREATE POLICY "Authenticated users can upload assets"
  ON assets
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own assets"
  ON assets
  FOR UPDATE
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own assets"
  ON assets
  FOR DELETE
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Admins can manage all assets"
  ON assets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- RLS policies for asset_transformations
CREATE POLICY "Anyone can view transformations"
  ON asset_transformations
  FOR SELECT
  USING (true);

CREATE POLICY "System can manage transformations"
  ON asset_transformations
  FOR ALL
  USING (true); -- Transformations are managed by system

-- Create storage buckets (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT ON assets TO authenticated;
GRANT SELECT, INSERT ON assets TO anon;
GRANT SELECT ON asset_transformations TO authenticated, anon;

-- Comments
COMMENT ON TABLE assets IS 'Metadata for uploaded assets with CDN URLs';
COMMENT ON TABLE asset_transformations IS 'Track image transformations and cache hits';
COMMENT ON FUNCTION get_storage_statistics IS 'Get storage usage statistics by asset type';
COMMENT ON FUNCTION get_user_storage_usage IS 'Get storage usage for a specific user';
COMMENT ON FUNCTION cleanup_unused_transformations IS 'Remove transformation cache entries not accessed in 30 days';
