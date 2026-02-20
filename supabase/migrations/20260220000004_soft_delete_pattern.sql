-- Implement soft delete pattern across key tables
-- Adds deleted_at columns and helper functions

-- Add deleted_at columns to key tables
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE websites ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE topic_clusters ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS blog_posts_deleted_at_idx ON blog_posts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS clients_deleted_at_idx ON clients(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS websites_deleted_at_idx ON websites(deleted_at) WHERE deleted_at IS NULL;

-- Function to soft delete a record
CREATE OR REPLACE FUNCTION soft_delete(
  table_name text,
  record_id uuid
)
RETURNS boolean AS $$
BEGIN
  EXECUTE format('UPDATE %I SET deleted_at = NOW() WHERE id = $1', table_name)
  USING record_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to restore a soft-deleted record
CREATE OR REPLACE FUNCTION restore_deleted(
  table_name text,
  record_id uuid
)
RETURNS boolean AS $$
BEGIN
  EXECUTE format('UPDATE %I SET deleted_at = NULL WHERE id = $1', table_name)
  USING record_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to permanently delete soft-deleted records older than X days
CREATE OR REPLACE FUNCTION purge_old_deleted(
  table_name text,
  days_old int DEFAULT 30
)
RETURNS int AS $$
DECLARE
  deleted_count int;
BEGIN
  EXECUTE format('
    DELETE FROM %I
    WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL ''%s days''
  ', table_name, days_old);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION soft_delete TO authenticated;
GRANT EXECUTE ON FUNCTION restore_deleted TO authenticated;
GRANT EXECUTE ON FUNCTION purge_old_deleted TO service_role;

-- Add comments
COMMENT ON COLUMN blog_posts.deleted_at IS 'Soft delete timestamp - NULL means not deleted';
COMMENT ON FUNCTION soft_delete IS 'Soft delete a record by setting deleted_at timestamp';
COMMENT ON FUNCTION restore_deleted IS 'Restore a soft-deleted record by clearing deleted_at';
COMMENT ON FUNCTION purge_old_deleted IS 'Permanently delete soft-deleted records older than specified days';
