-- ClickUp Integration Tables
-- Supports webhook events, automation runs, and generated content tracking

-- Webhook Events Table
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL, -- 'clickup', 'make', etc.
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_source ON webhook_events(source);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_received_at ON webhook_events(received_at DESC);

-- Automation Runs Table
CREATE TABLE IF NOT EXISTS automation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_source TEXT NOT NULL, -- 'clickup', 'manual', etc.
    trigger_type TEXT NOT NULL, -- 'tag', 'status', 'custom_field', etc.
    trigger_value TEXT NOT NULL, -- The tag name, status value, etc.
    task_id TEXT, -- ClickUp task ID or other external ID
    status TEXT NOT NULL DEFAULT 'started', -- 'started', 'running', 'completed', 'failed'
    workflow_type TEXT, -- 'blog-creation', 'email-campaign', 'brand-guide', etc.
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    output JSONB, -- Results from the automation
    error TEXT, -- Error message if failed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_automation_runs_trigger_source ON automation_runs(trigger_source);
CREATE INDEX idx_automation_runs_status ON automation_runs(status);
CREATE INDEX idx_automation_runs_task_id ON automation_runs(task_id);
CREATE INDEX idx_automation_runs_started_at ON automation_runs(started_at DESC);

-- Generated Content Table
CREATE TABLE IF NOT EXISTS generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL, -- 'clickup', 'manual', 'api', etc.
    source_id TEXT, -- ClickUp task ID, batch ID, etc.
    content_type TEXT NOT NULL, -- 'blog', 'email-campaign', 'brand-guide', etc.
    title TEXT NOT NULL,
    content TEXT, -- Full content (can be large)
    metadata JSONB, -- Additional data (drive URLs, file IDs, etc.)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_generated_content_source ON generated_content(source);
CREATE INDEX idx_generated_content_source_id ON generated_content(source_id);
CREATE INDEX idx_generated_content_content_type ON generated_content(content_type);
CREATE INDEX idx_generated_content_created_at ON generated_content(created_at DESC);

-- RLS Policies
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- Webhook Events: Only service role can insert, users can read their own
CREATE POLICY "Service role can manage webhook_events"
    ON webhook_events FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view webhook_events"
    ON webhook_events FOR SELECT
    USING (auth.role() = 'authenticated');

-- Automation Runs: Service role can manage, users can view
CREATE POLICY "Service role can manage automation_runs"
    ON automation_runs FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view automation_runs"
    ON automation_runs FOR SELECT
    USING (auth.role() = 'authenticated');

-- Generated Content: Service role can manage, users can view their own
CREATE POLICY "Service role can manage generated_content"
    ON generated_content FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view generated_content"
    ON generated_content FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own generated_content"
    ON generated_content FOR INSERT
    WITH CHECK (auth.uid() = created_by);



