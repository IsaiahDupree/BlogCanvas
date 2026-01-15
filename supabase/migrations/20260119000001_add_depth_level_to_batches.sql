-- Add depth_level column to content_batches
-- Supports feat-099: Content depth level selection (basic/advanced/technical)

-- Add depth_level column with default 'standard'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_batches' AND column_name = 'depth_level'
  ) THEN
    ALTER TABLE content_batches
    ADD COLUMN depth_level TEXT DEFAULT 'standard'
    CHECK (depth_level IN ('basic', 'standard', 'advanced', 'technical'));

    -- Create index for filtering by depth level
    CREATE INDEX IF NOT EXISTS idx_content_batches_depth_level ON content_batches(depth_level);

    -- Add comment explaining the column
    COMMENT ON COLUMN content_batches.depth_level IS 'Content depth level: basic (1000-1500 words), standard (1500-2500 words), advanced (2500-3500 words), technical (3500+ words)';
  END IF;
END $$;
