-- Webhook Integrations for Slack/Discord
-- Implements VENDOR-WC-149: Slack/Discord notifications

-- Table to store vendor webhook integrations
CREATE TABLE IF NOT EXISTS vendor_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('slack', 'discord')),
    webhook_url TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Event subscriptions (which events should trigger this webhook)
    events JSONB NOT NULL DEFAULT '[]'::JSONB,

    -- Webhook configuration
    settings JSONB DEFAULT '{}'::JSONB,

    -- Usage tracking
    last_triggered_at TIMESTAMPTZ,
    total_triggers INTEGER NOT NULL DEFAULT 0,
    failed_triggers INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table to track webhook delivery logs
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES vendor_webhooks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    response_code INTEGER,
    error_message TEXT,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_webhooks_vendor_id ON vendor_webhooks(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_webhooks_platform ON vendor_webhooks(platform);
CREATE INDEX IF NOT EXISTS idx_vendor_webhooks_is_active ON vendor_webhooks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_delivered_at ON webhook_logs(delivered_at DESC);

-- Enable RLS
ALTER TABLE vendor_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_webhooks
CREATE POLICY "Vendors can view their own webhooks"
    ON vendor_webhooks FOR SELECT
    USING (
        vendor_id IN (
            SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can create their own webhooks"
    ON vendor_webhooks FOR INSERT
    WITH CHECK (
        vendor_id IN (
            SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can update their own webhooks"
    ON vendor_webhooks FOR UPDATE
    USING (
        vendor_id IN (
            SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can delete their own webhooks"
    ON vendor_webhooks FOR DELETE
    USING (
        vendor_id IN (
            SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for webhook_logs
CREATE POLICY "Vendors can view their own webhook logs"
    ON webhook_logs FOR SELECT
    USING (
        webhook_id IN (
            SELECT id FROM vendor_webhooks
            WHERE vendor_id IN (
                SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "System can insert webhook logs"
    ON webhook_logs FOR INSERT
    WITH CHECK (true);

-- Function to update webhook statistics
CREATE OR REPLACE FUNCTION update_webhook_stats(
    webhook_id_param UUID,
    success BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    UPDATE vendor_webhooks
    SET
        last_triggered_at = NOW(),
        total_triggers = total_triggers + 1,
        failed_triggers = CASE WHEN success = false THEN failed_triggers + 1 ELSE failed_triggers END,
        updated_at = NOW()
    WHERE id = webhook_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old webhook logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS VOID AS $$
BEGIN
    DELETE FROM webhook_logs
    WHERE delivered_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
