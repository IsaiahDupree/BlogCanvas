-- Pipeline Jobs Table
-- Stores website analysis pipeline jobs with status, inputs, and results

CREATE TABLE IF NOT EXISTS pipeline_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Job inputs
    website_url TEXT NOT NULL,
    target_market TEXT,
    client_goals TEXT,
    ideal_customer_profile TEXT,
    
    -- Job status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    current_step TEXT,
    progress INTEGER DEFAULT 0, -- 0-100
    
    -- Step results (stored as JSONB)
    crawl_result JSONB,
    analyze_result JSONB,
    gaps_result JSONB,
    topics_result JSONB,
    
    -- Final aggregated results
    seo_score INTEGER,
    pages_indexed INTEGER,
    content_gaps INTEGER,
    topics_generated INTEGER,
    blogs_created INTEGER DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    error_step TEXT,
    
    -- Metadata
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_vendor_id ON pipeline_jobs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_client_id ON pipeline_jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_status ON pipeline_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_created_at ON pipeline_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE pipeline_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Vendors can view their own pipeline jobs"
    ON pipeline_jobs FOR SELECT
    TO authenticated
    USING (
        vendor_id IN (
            SELECT id FROM vendors WHERE id IN (
                SELECT vendor_id FROM profiles WHERE id = auth.uid()
            )
        )
        OR
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Vendors can create pipeline jobs"
    ON pipeline_jobs FOR INSERT
    TO authenticated
    WITH CHECK (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Vendors can update their own pipeline jobs"
    ON pipeline_jobs FOR UPDATE
    TO authenticated
    USING (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Vendors can delete their own pipeline jobs"
    ON pipeline_jobs FOR DELETE
    TO authenticated
    USING (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_pipeline_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pipeline_jobs_updated_at
    BEFORE UPDATE ON pipeline_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_pipeline_jobs_updated_at();
