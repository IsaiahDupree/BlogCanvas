-- Full-text search implementation for BlogCanvas
-- Adds tsvector columns and search functions

-- Add tsvector column to blog_posts for full-text search
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(topic, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(target_keyword, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(draft, '')), 'C')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS blog_posts_search_idx
ON blog_posts USING GIN (search_vector);

-- Add tsvector column to clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(notes, '')), 'C')
) STORED;

-- Create GIN index for clients
CREATE INDEX IF NOT EXISTS clients_search_idx
ON clients USING GIN (search_vector);

-- Create search function for blog posts
CREATE OR REPLACE FUNCTION search_blog_posts(
  search_query text,
  vendor_id_filter uuid,
  result_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  topic text,
  draft text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bp.id,
    bp.topic,
    bp.draft,
    ts_rank(bp.search_vector, websearch_to_tsquery('english', search_query)) AS rank
  FROM blog_posts bp
  WHERE
    bp.vendor_id = vendor_id_filter
    AND bp.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Create search function for clients
CREATE OR REPLACE FUNCTION search_clients(
  search_query text,
  vendor_id_filter uuid,
  result_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  name text,
  notes text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.notes,
    ts_rank(c.search_vector, websearch_to_tsquery('english', search_query)) AS rank
  FROM clients c
  WHERE
    c.vendor_id = vendor_id_filter
    AND c.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_blog_posts TO authenticated;
GRANT EXECUTE ON FUNCTION search_clients TO authenticated;

-- Add comment
COMMENT ON COLUMN blog_posts.search_vector IS 'Full-text search vector combining topic, keyword, and draft content';
COMMENT ON COLUMN clients.search_vector IS 'Full-text search vector for client name and notes';
