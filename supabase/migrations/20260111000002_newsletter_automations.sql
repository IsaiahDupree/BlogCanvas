-- Newsletter Automations Table
-- Stores automation rules for recurring newsletters

CREATE TABLE IF NOT EXISTS newsletter_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    template_id UUID REFERENCES newsletter_templates(id) ON DELETE SET NULL,

    -- Basic configuration
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Trigger configuration
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('monthly', 'weekly', 'milestone', 'custom')),
    trigger_config JSONB DEFAULT '{}'::jsonb,
    -- Examples of trigger_config:
    -- Monthly: { "day_of_month": 1 }
    -- Weekly: { "day_of_week": 1 } (0=Sunday, 6=Saturday)
    -- Milestone: { "event": "post_published", "threshold": 10 }
    -- Custom: { "cron": "0 0 * * 1" }

    -- Newsletter content (overrides template if provided)
    subject VARCHAR(255),
    preview_text TEXT,
    html_content TEXT,
    json_content JSONB,

    -- Recipient selection
    recipient_selection VARCHAR(50) NOT NULL CHECK (recipient_selection IN ('all_clients', 'custom_list', 'client_ids')),
    recipient_config JSONB DEFAULT '{}'::jsonb,
    -- Examples of recipient_config:
    -- all_clients: {}
    -- custom_list: { "emails": ["email1@example.com", "email2@example.com"] }
    -- client_ids: { "client_ids": ["uuid1", "uuid2"] }

    -- Status and execution tracking
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_executed_at TIMESTAMPTZ,
    next_execution_at TIMESTAMPTZ,
    execution_count INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_newsletter_automations_vendor ON newsletter_automations(vendor_id);
CREATE INDEX idx_newsletter_automations_enabled ON newsletter_automations(enabled);
CREATE INDEX idx_newsletter_automations_next_execution ON newsletter_automations(next_execution_at) WHERE enabled = true;

-- Automation Execution Log
-- Tracks each execution of an automation
CREATE TABLE IF NOT EXISTS newsletter_automation_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID NOT NULL REFERENCES newsletter_automations(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE SET NULL,

    -- Execution metadata
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
    error_message TEXT,

    -- Stats
    recipients_count INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_failed INTEGER DEFAULT 0
);

-- Index for execution log
CREATE INDEX idx_automation_executions_automation ON newsletter_automation_executions(automation_id);
CREATE INDEX idx_automation_executions_executed_at ON newsletter_automation_executions(executed_at DESC);

-- RLS Policies for newsletter_automations
ALTER TABLE newsletter_automations ENABLE ROW LEVEL SECURITY;

-- Vendors can view their own automations
CREATE POLICY "Vendors can view own automations"
    ON newsletter_automations
    FOR SELECT
    USING (vendor_id IN (
        SELECT vendor_id FROM users WHERE id = auth.uid()
    ));

-- Vendors can create their own automations
CREATE POLICY "Vendors can create own automations"
    ON newsletter_automations
    FOR INSERT
    WITH CHECK (vendor_id IN (
        SELECT vendor_id FROM users WHERE id = auth.uid()
    ));

-- Vendors can update their own automations
CREATE POLICY "Vendors can update own automations"
    ON newsletter_automations
    FOR UPDATE
    USING (vendor_id IN (
        SELECT vendor_id FROM users WHERE id = auth.uid()
    ));

-- Vendors can delete their own automations
CREATE POLICY "Vendors can delete own automations"
    ON newsletter_automations
    FOR DELETE
    USING (vendor_id IN (
        SELECT vendor_id FROM users WHERE id = auth.uid()
    ));

-- RLS Policies for newsletter_automation_executions
ALTER TABLE newsletter_automation_executions ENABLE ROW LEVEL SECURITY;

-- Vendors can view execution logs for their automations
CREATE POLICY "Vendors can view own automation executions"
    ON newsletter_automation_executions
    FOR SELECT
    USING (automation_id IN (
        SELECT id FROM newsletter_automations
        WHERE vendor_id IN (
            SELECT vendor_id FROM users WHERE id = auth.uid()
        )
    ));

-- Function to calculate next execution time for an automation
CREATE OR REPLACE FUNCTION calculate_next_execution(
    p_trigger_type VARCHAR,
    p_trigger_config JSONB,
    p_last_executed_at TIMESTAMPTZ
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_execution TIMESTAMPTZ;
    v_day_of_month INTEGER;
    v_day_of_week INTEGER;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    CASE p_trigger_type
        WHEN 'monthly' THEN
            -- Get day of month from config (default to 1st)
            v_day_of_month := COALESCE((p_trigger_config->>'day_of_month')::INTEGER, 1);

            -- Calculate next month on the specified day
            v_next_execution := date_trunc('month', v_now) + INTERVAL '1 month' + (v_day_of_month - 1 || ' days')::INTERVAL;

            -- If that day has already passed this month, move to next month
            IF v_next_execution <= v_now THEN
                v_next_execution := v_next_execution + INTERVAL '1 month';
            END IF;

        WHEN 'weekly' THEN
            -- Get day of week from config (0=Sunday, 6=Saturday, default to Monday=1)
            v_day_of_week := COALESCE((p_trigger_config->>'day_of_week')::INTEGER, 1);

            -- Calculate next occurrence of that day of week
            v_next_execution := date_trunc('week', v_now) + (v_day_of_week || ' days')::INTERVAL;

            -- If that day has already passed this week, move to next week
            IF v_next_execution <= v_now THEN
                v_next_execution := v_next_execution + INTERVAL '1 week';
            END IF;

        WHEN 'milestone' THEN
            -- Milestones are event-driven, not time-based
            -- Return NULL to indicate manual triggering
            v_next_execution := NULL;

        WHEN 'custom' THEN
            -- For custom cron, return 1 hour from now as placeholder
            -- (actual cron parsing would require additional library)
            v_next_execution := v_now + INTERVAL '1 hour';

        ELSE
            v_next_execution := NULL;
    END CASE;

    RETURN v_next_execution;
END;
$$;

-- Trigger to update next_execution_at when automation is created or updated
CREATE OR REPLACE FUNCTION update_automation_next_execution()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.next_execution_at := calculate_next_execution(
        NEW.trigger_type,
        NEW.trigger_config,
        NEW.last_executed_at
    );
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_automation_next_execution
    BEFORE INSERT OR UPDATE ON newsletter_automations
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_next_execution();
