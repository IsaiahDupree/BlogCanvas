-- Client Onboarding Enhancements
-- Epic 1: Vendor-Client Management - feat-015
-- Adds client onboarding fields and relationship health tracking

-- Step 1: Add onboarding fields to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::JSONB;

-- Add index for onboarding_data
CREATE INDEX IF NOT EXISTS idx_clients_onboarding_data ON clients USING gin(onboarding_data);

-- Step 2: Create database function to get client post stats
CREATE OR REPLACE FUNCTION get_client_post_stats(p_client_id UUID)
RETURNS TABLE (
    total_count BIGINT,
    draft_count BIGINT,
    in_review_count BIGINT,
    approved_count BIGINT,
    published_count BIGINT,
    avg_seo_score NUMERIC,
    this_month_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_count,
        COUNT(*) FILTER (WHERE status = 'draft')::BIGINT as draft_count,
        COUNT(*) FILTER (WHERE status IN ('ready_for_review', 'client_review'))::BIGINT as in_review_count,
        COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as approved_count,
        COUNT(*) FILTER (WHERE status = 'published')::BIGINT as published_count,
        COALESCE(AVG(seo_quality_score) FILTER (WHERE seo_quality_score IS NOT NULL), 0)::NUMERIC as avg_seo_score,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))::BIGINT as this_month_count
    FROM blog_posts
    WHERE client_id = p_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Add comments for documentation
COMMENT ON COLUMN clients.industry IS 'Client industry for categorization and insights';
COMMENT ON COLUMN clients.company_size IS 'Company size range for segmentation';
COMMENT ON COLUMN clients.onboarding_data IS 'Stores onboarding survey responses (brand voice, goals, etc.)';
COMMENT ON FUNCTION get_client_post_stats IS 'Calculates comprehensive stats for client blog posts';

-- Step 4: Grant execute permission on function to authenticated users
GRANT EXECUTE ON FUNCTION get_client_post_stats TO authenticated;
