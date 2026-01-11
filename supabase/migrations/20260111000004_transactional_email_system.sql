-- Transactional Email System Migration
-- Creates tables for transactional email templates, queue, and tracking

-- Transactional email templates (system templates for automated emails)
CREATE TABLE IF NOT EXISTS transactional_email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT UNIQUE NOT NULL, -- e.g., 'user_invitation', 'content_approved'
    name TEXT NOT NULL,
    description TEXT,
    subject_template TEXT NOT NULL, -- Template with variables: "Welcome {{user_name}} to BlogCanvas"
    html_content TEXT NOT NULL, -- HTML template with variables
    text_content TEXT, -- Plain text fallback
    variables JSONB DEFAULT '[]'::JSONB, -- Array of required variables: ["user_name", "invite_url"]
    is_system_template BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email queue for reliable delivery (retry on failure)
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT REFERENCES transactional_email_templates(template_key) ON DELETE SET NULL,
    to_email TEXT NOT NULL,
    to_name TEXT,
    from_email TEXT DEFAULT 'BlogCanvas <noreply@blogcanvas.app>',
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '{}'::JSONB, -- Variables used to render the template
    status TEXT CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')) DEFAULT 'pending',
    priority INT DEFAULT 5, -- 1 = highest, 10 = lowest
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    resend_id TEXT, -- Resend email ID for tracking
    metadata JSONB DEFAULT '{}'::JSONB, -- Additional data (user_id, client_id, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email delivery tracking (webhooks from Resend)
CREATE TABLE IF NOT EXISTS email_delivery_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_queue_id UUID REFERENCES email_queue(id) ON DELETE CASCADE,
    resend_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- sent, delivered, opened, clicked, bounced, complained
    event_data JSONB DEFAULT '{}'::JSONB,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactional_templates_key ON transactional_email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_transactional_templates_active ON transactional_email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_template ON email_queue(template_key);
CREATE INDEX IF NOT EXISTS idx_email_delivery_tracking_queue ON email_delivery_tracking(email_queue_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_tracking_resend ON email_delivery_tracking(resend_id);

-- Enable RLS (transactional emails are system-managed, no user access needed)
ALTER TABLE transactional_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_delivery_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Service role only (transactional emails are system-managed)
-- Admins can view templates for management
CREATE POLICY "Service role can manage transactional templates"
    ON transactional_email_templates
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage email queue"
    ON email_queue
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage delivery tracking"
    ON email_delivery_tracking
    USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_transactional_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactional_email_templates_updated_at
    BEFORE UPDATE ON transactional_email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_transactional_email_updated_at();

CREATE TRIGGER update_email_queue_updated_at
    BEFORE UPDATE ON email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_transactional_email_updated_at();

-- Insert system email templates
INSERT INTO transactional_email_templates (template_key, name, description, subject_template, html_content, text_content, variables) VALUES

-- 1. User Invitation (Vendor inviting team member)
('user_invitation', 'User Invitation', 'Invitation email for vendors to join their team',
'You''re invited to join {{vendor_name}} on BlogCanvas',
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 40px 30px; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
    </style>
</head>
<body>
    <div class="header"><h1 style="margin: 0;">You''re Invited! 🎉</h1></div>
    <div class="content">
        <p>Hi {{user_name}},</p>
        <p><strong>{{inviter_name}}</strong> has invited you to join <strong>{{vendor_name}}</strong> on BlogCanvas.</p>
        <p>BlogCanvas is a powerful content management platform that helps teams create, review, and publish high-quality blog content.</p>
        <p style="text-align: center;">
            <a href="{{invite_url}}" class="button">Accept Invitation</a>
        </p>
        <p style="font-size: 14px; color: #6b7280;">This invitation expires in 7 days. If you didn''t expect this invitation, you can safely ignore this email.</p>
    </div>
    <div class="footer">
        <p>Powered by BlogCanvas | <a href="https://blogcanvas.app">Visit Website</a></p>
    </div>
</body>
</html>',
'Hi {{user_name}},

{{inviter_name}} has invited you to join {{vendor_name}} on BlogCanvas.

Accept your invitation here: {{invite_url}}

This invitation expires in 7 days.

Powered by BlogCanvas
https://blogcanvas.app',
'["user_name", "vendor_name", "inviter_name", "invite_url"]'::JSONB),

-- 2. Client Invitation
('client_invitation', 'Client Invitation', 'Invitation email for clients to join their portal',
'Welcome to your {{vendor_name}} Content Portal',
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 40px 30px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
    </style>
</head>
<body>
    <div class="header"><h1 style="margin: 0;">Welcome to Your Content Portal! ✨</h1></div>
    <div class="content">
        <p>Hi {{client_name}},</p>
        <p>Great news! <strong>{{vendor_name}}</strong> has set up a private content portal just for you.</p>
        <p>Your portal gives you real-time visibility into:</p>
        <ul>
            <li>📊 Content projects and progress</li>
            <li>✍️ Draft reviews and approvals</li>
            <li>📈 Performance analytics</li>
            <li>📝 Publishing schedule</li>
        </ul>
        <p style="text-align: center;">
            <a href="{{portal_url}}" class="button">Access Your Portal</a>
        </p>
    </div>
    <div class="footer">
        <p>Powered by BlogCanvas | <a href="https://blogcanvas.app">Learn More</a></p>
    </div>
</body>
</html>',
'Hi {{client_name}},

{{vendor_name}} has set up a private content portal just for you.

Access your portal here: {{portal_url}}

Your portal includes:
- Content projects and progress
- Draft reviews and approvals
- Performance analytics
- Publishing schedule

Powered by BlogCanvas',
'["client_name", "vendor_name", "portal_url"]'::JSONB),

-- 3. Project Started (Work Declaration Created)
('project_started', 'Project Started', 'Notification when new project/work declaration is created',
'New Project Started: {{project_name}}',
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 40px 30px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .info-box { background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
    </style>
</head>
<body>
    <div class="header"><h1 style="margin: 0;">🚀 New Project Started</h1></div>
    <div class="content">
        <p>Hi {{client_name}},</p>
        <p>Exciting news! Your new project <strong>{{project_name}}</strong> has just been started.</p>
        <div class="info-box">
            <p><strong>Project Details:</strong></p>
            <p>{{project_description}}</p>
            <p><strong>Timeline:</strong> {{start_date}} - {{end_date}}</p>
        </div>
        <p>You can track progress and view deliverables in your client portal.</p>
        <p style="text-align: center;">
            <a href="{{project_url}}" class="button">View Project</a>
        </p>
    </div>
    <div class="footer">
        <p>Powered by BlogCanvas</p>
    </div>
</body>
</html>',
'Hi {{client_name}},

Your new project "{{project_name}}" has been started!

Project Details:
{{project_description}}

Timeline: {{start_date}} - {{end_date}}

View project: {{project_url}}

Powered by BlogCanvas',
'["client_name", "project_name", "project_description", "start_date", "end_date", "project_url"]'::JSONB),

-- 4. Content Ready for Review
('content_ready_for_review', 'Content Ready for Review', 'Notification when content is ready for client review',
'Content Ready for Your Review: {{post_title}}',
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 40px 30px; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .highlight { background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
    </style>
</head>
<body>
    <div class="header"><h1 style="margin: 0;">✍️ Content Ready for Review</h1></div>
    <div class="content">
        <p>Hi {{client_name}},</p>
        <p>Good news! Your content is ready for review.</p>
        <div class="highlight">
            <h2 style="margin-top: 0; color: #f59e0b;">{{post_title}}</h2>
            <p><strong>Target Keyword:</strong> {{target_keyword}}</p>
            <p><strong>Word Count:</strong> {{word_count}} words</p>
            <p><strong>SEO Score:</strong> {{seo_score}}/100</p>
        </div>
        <p>Please review and let us know if you''d like any changes.</p>
        <p style="text-align: center;">
            <a href="{{review_url}}" class="button">Review Content</a>
        </p>
    </div>
    <div class="footer">
        <p>Powered by BlogCanvas</p>
    </div>
</body>
</html>',
'Hi {{client_name}},

Your content is ready for review!

Title: {{post_title}}
Target Keyword: {{target_keyword}}
Word Count: {{word_count}} words
SEO Score: {{seo_score}}/100

Review here: {{review_url}}

Powered by BlogCanvas',
'["client_name", "post_title", "target_keyword", "word_count", "seo_score", "review_url"]'::JSONB),

-- 5. Content Approved
('content_approved', 'Content Approved', 'Notification when client approves content',
'Content Approved: {{post_title}}',
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 40px 30px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .success-box { background: #d1fae5; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
    </style>
</head>
<body>
    <div class="header"><h1 style="margin: 0;">✅ Content Approved!</h1></div>
    <div class="content">
        <p>Hi {{vendor_name}},</p>
        <p>Great news! <strong>{{client_name}}</strong> has approved the following content:</p>
        <div class="success-box">
            <h2 style="margin-top: 0; color: #059669;">{{post_title}}</h2>
            <p>{{approval_message}}</p>
        </div>
        <p>The content is now ready for publishing.</p>
        <p style="text-align: center;">
            <a href="{{post_url}}" class="button">View Content</a>
        </p>
    </div>
    <div class="footer">
        <p>Powered by BlogCanvas</p>
    </div>
</body>
</html>',
'Hi {{vendor_name}},

{{client_name}} has approved: "{{post_title}}"

{{approval_message}}

The content is now ready for publishing.

View content: {{post_url}}

Powered by BlogCanvas',
'["vendor_name", "client_name", "post_title", "approval_message", "post_url"]'::JSONB),

-- 6. Content Published
('content_published', 'Content Published', 'Notification when content is published to CMS',
'Your Content is Live: {{post_title}}',
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 40px 30px; }
        .button { display: inline-block; background: #8b5cf6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .live-box { background: #ede9fe; padding: 20px; border-radius: 6px; border-left: 4px solid #8b5cf6; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
    </style>
</head>
<body>
    <div class="header"><h1 style="margin: 0;">🎉 Your Content is Live!</h1></div>
    <div class="content">
        <p>Hi {{client_name}},</p>
        <p>Your content has been successfully published!</p>
        <div class="live-box">
            <h2 style="margin-top: 0; color: #7c3aed;">{{post_title}}</h2>
            <p><strong>Published:</strong> {{published_date}}</p>
            <p><strong>Platform:</strong> {{platform}}</p>
        </div>
        <p>Check it out on your website!</p>
        <p style="text-align: center;">
            <a href="{{published_url}}" class="button">View Published Content</a>
        </p>
        <p style="font-size: 14px; color: #6b7280;">We''ll start tracking performance metrics for this post. Check your analytics dashboard in 24-48 hours.</p>
    </div>
    <div class="footer">
        <p>Powered by BlogCanvas</p>
    </div>
</body>
</html>',
'Hi {{client_name}},

Your content has been successfully published!

Title: {{post_title}}
Published: {{published_date}}
Platform: {{platform}}

View it here: {{published_url}}

We''ll start tracking performance metrics for this post.

Powered by BlogCanvas',
'["client_name", "post_title", "published_date", "platform", "published_url"]'::JSONB),

-- 7. Password Reset
('password_reset', 'Password Reset', 'Password reset request email',
'Reset Your BlogCanvas Password',
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 40px 30px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .warning-box { background: #fee2e2; padding: 15px; border-radius: 6px; border-left: 4px solid #dc2626; margin: 20px 0; font-size: 14px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
    </style>
</head>
<body>
    <div class="header"><h1 style="margin: 0;">🔐 Password Reset Request</h1></div>
    <div class="content">
        <p>Hi {{user_name}},</p>
        <p>We received a request to reset your password for your BlogCanvas account.</p>
        <p style="text-align: center;">
            <a href="{{reset_url}}" class="button">Reset Password</a>
        </p>
        <div class="warning-box">
            <p><strong>⚠️ Security Notice:</strong></p>
            <p>This link expires in 1 hour. If you didn''t request this reset, please ignore this email and your password will remain unchanged.</p>
        </div>
    </div>
    <div class="footer">
        <p>Powered by BlogCanvas | <a href="https://blogcanvas.app">Visit Website</a></p>
    </div>
</body>
</html>',
'Hi {{user_name}},

We received a request to reset your password for your BlogCanvas account.

Reset your password here: {{reset_url}}

This link expires in 1 hour. If you didn''t request this reset, please ignore this email.

Powered by BlogCanvas',
'["user_name", "reset_url"]'::JSONB);
