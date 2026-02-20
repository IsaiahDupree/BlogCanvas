-- Search Analytics Tables
-- Implements VENDOR-WC-133: Search analytics

-- Table to track search queries
CREATE TABLE IF NOT EXISTS search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    result_count INTEGER NOT NULL DEFAULT 0,
    entity_type TEXT, -- 'blog_post', 'client', 'website', 'universal'
    had_results BOOLEAN NOT NULL DEFAULT false,
    clicked_result_id TEXT,
    clicked_result_type TEXT,
    search_duration_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table to track search result clicks
CREATE TABLE IF NOT EXISTS search_result_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    result_id TEXT NOT NULL,
    result_type TEXT NOT NULL,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_analytics_vendor_id ON search_analytics(vendor_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_had_results ON search_analytics(had_results) WHERE had_results = false;
CREATE INDEX IF NOT EXISTS idx_search_result_clicks_vendor_id ON search_result_clicks(vendor_id);
CREATE INDEX IF NOT EXISTS idx_search_result_clicks_query ON search_result_clicks(query);

-- Enable RLS
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_result_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Vendors can view their own search analytics"
    ON search_analytics FOR SELECT
    USING (
        vendor_id IN (
            SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert search analytics"
    ON search_analytics FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Vendors can view their own search clicks"
    ON search_result_clicks FOR SELECT
    USING (
        vendor_id IN (
            SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert search clicks"
    ON search_result_clicks FOR INSERT
    WITH CHECK (true);

-- Function to get no-result searches
CREATE OR REPLACE FUNCTION get_no_result_searches(
    vendor_id_filter UUID,
    result_limit INT DEFAULT 50
)
RETURNS TABLE (
    query TEXT,
    count BIGINT,
    last_searched TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sa.query,
        COUNT(*) as count,
        MAX(sa.created_at) as last_searched
    FROM search_analytics sa
    WHERE sa.vendor_id = vendor_id_filter
        AND sa.had_results = false
    GROUP BY sa.query
    ORDER BY count DESC, last_searched DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular searches
CREATE OR REPLACE FUNCTION get_popular_searches(
    vendor_id_filter UUID,
    days_back INT DEFAULT 30,
    result_limit INT DEFAULT 50
)
RETURNS TABLE (
    query TEXT,
    search_count BIGINT,
    avg_results NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sa.query,
        COUNT(*) as search_count,
        AVG(sa.result_count)::NUMERIC(10,2) as avg_results
    FROM search_analytics sa
    WHERE sa.vendor_id = vendor_id_filter
        AND sa.created_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY sa.query
    ORDER BY search_count DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get search analytics summary
CREATE OR REPLACE FUNCTION get_search_analytics_summary(
    vendor_id_filter UUID,
    days_back INT DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    WITH stats AS (
        SELECT
            COUNT(*) as total_searches,
            COUNT(DISTINCT query) as unique_queries,
            COUNT(*) FILTER (WHERE had_results = false) as no_result_count,
            AVG(result_count) as avg_results
        FROM search_analytics
        WHERE vendor_id = vendor_id_filter
            AND created_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    top_queries AS (
        SELECT
            JSON_AGG(
                JSON_BUILD_OBJECT('query', query, 'count', count)
                ORDER BY count DESC
            ) as queries
        FROM (
            SELECT query, COUNT(*) as count
            FROM search_analytics
            WHERE vendor_id = vendor_id_filter
                AND created_at >= NOW() - (days_back || ' days')::INTERVAL
            GROUP BY query
            ORDER BY count DESC
            LIMIT 10
        ) t
    )
    SELECT JSON_BUILD_OBJECT(
        'total_searches', COALESCE(s.total_searches, 0),
        'unique_queries', COALESCE(s.unique_queries, 0),
        'no_result_count', COALESCE(s.no_result_count, 0),
        'no_result_rate', CASE
            WHEN s.total_searches > 0
            THEN ROUND((s.no_result_count::NUMERIC / s.total_searches) * 100, 2)
            ELSE 0
        END,
        'avg_results_per_search', ROUND(COALESCE(s.avg_results, 0), 2),
        'top_queries', COALESCE(tq.queries, '[]'::JSON)
    ) INTO result
    FROM stats s
    CROSS JOIN top_queries tq;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
