-- Newsletter System Migration
-- Creates tables for newsletter templates, campaigns, and recipients

-- Newsletter templates
CREATE TABLE IF NOT EXISTS newsletter_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    html_content TEXT NOT NULL,
    json_content JSONB,
    thumbnail_url TEXT,
    is_system_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter campaigns
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    template_id UUID REFERENCES newsletter_templates(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    preview_text TEXT,
    html_content TEXT NOT NULL,
    json_content JSONB,
    status TEXT CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')) DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    recipient_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter recipients
CREATE TABLE IF NOT EXISTS newsletter_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')) DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_templates_vendor ON newsletter_templates(vendor_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_vendor ON newsletter_campaigns(vendor_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_recipients_campaign ON newsletter_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_recipients_client ON newsletter_recipients(client_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_recipients_status ON newsletter_recipients(status);

-- Enable RLS
ALTER TABLE newsletter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for newsletter_templates
CREATE POLICY "Vendors can view their own newsletter templates"
    ON newsletter_templates FOR SELECT
    USING (
        vendor_id IN (
            SELECT id FROM vendors
            WHERE id = (
                SELECT vendor_id FROM users WHERE id = auth.uid()
            )
        )
        OR is_system_template = TRUE
    );

CREATE POLICY "Vendors can create their own newsletter templates"
    ON newsletter_templates FOR INSERT
    WITH CHECK (
        vendor_id IN (
            SELECT id FROM vendors
            WHERE id = (
                SELECT vendor_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Vendors can update their own newsletter templates"
    ON newsletter_templates FOR UPDATE
    USING (
        vendor_id IN (
            SELECT id FROM vendors
            WHERE id = (
                SELECT vendor_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Vendors can delete their own newsletter templates"
    ON newsletter_templates FOR DELETE
    USING (
        vendor_id IN (
            SELECT id FROM vendors
            WHERE id = (
                SELECT vendor_id FROM users WHERE id = auth.uid()
            )
        )
        AND is_system_template = FALSE
    );

-- RLS Policies for newsletter_campaigns
CREATE POLICY "Vendors can view their own newsletter campaigns"
    ON newsletter_campaigns FOR SELECT
    USING (
        vendor_id IN (
            SELECT id FROM vendors
            WHERE id = (
                SELECT vendor_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Vendors can create their own newsletter campaigns"
    ON newsletter_campaigns FOR INSERT
    WITH CHECK (
        vendor_id IN (
            SELECT id FROM vendors
            WHERE id = (
                SELECT vendor_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Vendors can update their own newsletter campaigns"
    ON newsletter_campaigns FOR UPDATE
    USING (
        vendor_id IN (
            SELECT id FROM vendors
            WHERE id = (
                SELECT vendor_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Vendors can delete their own newsletter campaigns"
    ON newsletter_campaigns FOR DELETE
    USING (
        vendor_id IN (
            SELECT id FROM vendors
            WHERE id = (
                SELECT vendor_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- RLS Policies for newsletter_recipients
CREATE POLICY "Vendors can view recipients for their campaigns"
    ON newsletter_recipients FOR SELECT
    USING (
        campaign_id IN (
            SELECT id FROM newsletter_campaigns
            WHERE vendor_id IN (
                SELECT id FROM vendors
                WHERE id = (
                    SELECT vendor_id FROM users WHERE id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Vendors can create recipients for their campaigns"
    ON newsletter_recipients FOR INSERT
    WITH CHECK (
        campaign_id IN (
            SELECT id FROM newsletter_campaigns
            WHERE vendor_id IN (
                SELECT id FROM vendors
                WHERE id = (
                    SELECT vendor_id FROM users WHERE id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Vendors can update recipients for their campaigns"
    ON newsletter_recipients FOR UPDATE
    USING (
        campaign_id IN (
            SELECT id FROM newsletter_campaigns
            WHERE vendor_id IN (
                SELECT id FROM vendors
                WHERE id = (
                    SELECT vendor_id FROM users WHERE id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Vendors can delete recipients for their campaigns"
    ON newsletter_recipients FOR DELETE
    USING (
        campaign_id IN (
            SELECT id FROM newsletter_campaigns
            WHERE vendor_id IN (
                SELECT id FROM vendors
                WHERE id = (
                    SELECT vendor_id FROM users WHERE id = auth.uid()
                )
            )
        )
    );

-- Create a few system templates (basic starter templates)
INSERT INTO newsletter_templates (name, description, html_content, json_content, is_system_template)
VALUES
(
    'Monthly Progress Report',
    'A professional monthly progress report template',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0;">Monthly Progress Report</h1>
        </div>
        <div style="padding: 40px 20px; background: #f9fafb;">
            <div contenteditable="true" data-block-type="header">
                <h2 style="color: #1f2937;">Hello {{client_name}},</h2>
            </div>
            <div contenteditable="true" data-block-type="text">
                <p style="color: #4b5563; line-height: 1.6;">Here''s your monthly progress update. We''ve been hard at work creating quality content for your blog.</p>
            </div>
            <div data-block-type="posts-grid" style="margin: 30px 0;">
                <!-- Posts will be inserted here -->
            </div>
            <div contenteditable="true" data-block-type="text">
                <p style="color: #4b5563; line-height: 1.6;">Thank you for your continued partnership!</p>
            </div>
            <div data-block-type="cta" style="text-align: center; margin: 30px 0;">
                <a href="{{portal_url}}" style="background: #6366f1; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block;">View in Portal</a>
            </div>
        </div>
        <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px; background: #e5e7eb;">
            <p>Powered by BlogCanvas</p>
            <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a>
        </div>
    </div>',
    '{"blocks": [{"type": "header", "content": "Monthly Progress Report"}, {"type": "text", "content": "Hello {{client_name}},"}, {"type": "text", "content": "Here''s your monthly progress update."}, {"type": "posts-grid"}, {"type": "text", "content": "Thank you for your continued partnership!"}, {"type": "cta", "text": "View in Portal", "url": "{{portal_url}}"}, {"type": "footer"}]}',
    true
),
(
    'New Content Announcement',
    'Announce newly published content',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0;">New Content Published!</h1>
        </div>
        <div style="padding: 40px 20px; background: #f9fafb;">
            <div contenteditable="true" data-block-type="text">
                <p style="color: #4b5563; line-height: 1.6;">Great news! We''ve just published new content on your blog.</p>
            </div>
            <div data-block-type="posts-list" style="margin: 30px 0;">
                <!-- Posts will be inserted here -->
            </div>
            <div data-block-type="cta" style="text-align: center; margin: 30px 0;">
                <a href="{{portal_url}}" style="background: #10b981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block;">View All Content</a>
            </div>
        </div>
        <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px; background: #e5e7eb;">
            <p>Powered by BlogCanvas</p>
            <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a>
        </div>
    </div>',
    '{"blocks": [{"type": "header", "content": "New Content Published!"}, {"type": "text", "content": "Great news! We''ve just published new content."}, {"type": "posts-list"}, {"type": "cta", "text": "View All Content", "url": "{{portal_url}}"}, {"type": "footer"}]}',
    true
);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_newsletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_newsletter_templates_updated_at
    BEFORE UPDATE ON newsletter_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_newsletter_updated_at();

CREATE TRIGGER update_newsletter_campaigns_updated_at
    BEFORE UPDATE ON newsletter_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_newsletter_updated_at();
