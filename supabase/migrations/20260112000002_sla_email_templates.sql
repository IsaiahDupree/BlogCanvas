-- Migration: Add SLA Alert Email Templates
-- Created: 2026-01-12
-- Purpose: Create email templates for SLA breach alerts

-- Insert template for editor review SLA warning (approaching deadline)
INSERT INTO transactional_email_templates (
  template_key,
  name,
  subject_template,
  html_content,
  text_content,
  variables,
  is_active
) VALUES (
  'editor_review_sla_warning',
  'Editor Review SLA Warning',
  'Action Required: Review approaching deadline for "{{post_title}}"',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #ff9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .cta-button { display: inline-block; background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .warning-box { background-color: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .metrics { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .metric-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .metric-label { font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Review Deadline Approaching</h1>
    </div>
    <div class="content">
      <p>Hi {{reviewer_name}},</p>

      <div class="warning-box">
        <strong>Action Required:</strong> A blog post is approaching its review deadline and needs your attention.
      </div>

      <h2>Post Details</h2>
      <div class="metrics">
        <div class="metric-row">
          <span class="metric-label">Title:</span>
          <span>{{post_title}}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Client:</span>
          <span>{{client_name}}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Submitted:</span>
          <span>{{submitted_at}}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Time Pending:</span>
          <span>{{hours_pending}} hours</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">SLA Deadline:</span>
          <span>{{sla_deadline}}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Time Remaining:</span>
          <span style="color: #ff9800; font-weight: bold;">{{hours_remaining}} hours</span>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="{{post_url}}" class="cta-button">Review Post Now</a>
      </p>

      <p><strong>Why this matters:</strong> Timely reviews help maintain quality standards and keep clients satisfied. Please prioritize this review to meet the {{sla_hours}}-hour SLA.</p>

      <p>If you have any questions or need support, please reach out to your team lead.</p>

      <p>Best regards,<br>
      <strong>BlogCanvas Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated SLA alert from BlogCanvas.<br>
      You are receiving this because you are assigned to review posts.</p>
    </div>
  </div>
</body>
</html>',
  'Hi {{reviewer_name}},

⚠️ ACTION REQUIRED: A blog post is approaching its review deadline.

Post Details:
- Title: {{post_title}}
- Client: {{client_name}}
- Submitted: {{submitted_at}}
- Time Pending: {{hours_pending}} hours
- SLA Deadline: {{sla_deadline}}
- Time Remaining: {{hours_remaining}} hours

Please review the post as soon as possible to meet the {{sla_hours}}-hour SLA.

Review here: {{post_url}}

Best regards,
BlogCanvas Team',
  '["reviewer_name", "post_title", "client_name", "submitted_at", "hours_pending", "sla_deadline", "hours_remaining", "sla_hours", "post_url"]'::JSONB,
  true
) ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject_template = EXCLUDED.subject_template,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Insert template for editor review SLA breach (deadline passed)
INSERT INTO transactional_email_templates (
  template_key,
  name,
  subject_template,
  html_content,
  text_content,
  variables,
  is_active
) VALUES (
  'editor_review_sla_breach',
  'Editor Review SLA Breach',
  'URGENT: Review overdue for "{{post_title}}" - SLA breached',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .cta-button { display: inline-block; background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .critical-box { background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .metrics { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .metric-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .metric-label { font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 SLA BREACH - Immediate Action Required</h1>
    </div>
    <div class="content">
      <p>Hi {{reviewer_name}},</p>

      <div class="critical-box">
        <strong>⚠️ CRITICAL:</strong> A blog post review has exceeded its SLA deadline and requires immediate attention.
      </div>

      <h2>Post Details</h2>
      <div class="metrics">
        <div class="metric-row">
          <span class="metric-label">Title:</span>
          <span>{{post_title}}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Client:</span>
          <span>{{client_name}}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Submitted:</span>
          <span>{{submitted_at}}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Time Overdue:</span>
          <span style="color: #f44336; font-weight: bold;">{{hours_overdue}} hours</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">SLA Deadline (missed):</span>
          <span>{{sla_deadline}}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">SLA Target:</span>
          <span>{{sla_hours}} hours</span>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="{{post_url}}" class="cta-button">Complete Review Immediately</a>
      </p>

      <p><strong>Impact:</strong> This SLA breach affects our service commitments to the client and may impact client satisfaction. Please complete the review as soon as possible.</p>

      <p>If you are unable to complete this review, please escalate to your team lead immediately.</p>

      <p>Best regards,<br>
      <strong>BlogCanvas Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated SLA breach alert from BlogCanvas.<br>
      You are receiving this because you are assigned to review posts.</p>
    </div>
  </div>
</body>
</html>',
  'Hi {{reviewer_name}},

🚨 CRITICAL - SLA BREACH: A blog post review has exceeded its deadline.

Post Details:
- Title: {{post_title}}
- Client: {{client_name}}
- Submitted: {{submitted_at}}
- Time Overdue: {{hours_overdue}} hours
- SLA Deadline (missed): {{sla_deadline}}
- SLA Target: {{sla_hours}} hours

This breach affects our service commitments. Please complete the review immediately.

Review here: {{post_url}}

If you cannot complete this review, escalate to your team lead.

Best regards,
BlogCanvas Team',
  '["reviewer_name", "post_title", "client_name", "submitted_at", "hours_overdue", "sla_deadline", "sla_hours", "post_url"]'::JSONB,
  true
) ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject_template = EXCLUDED.subject_template,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Insert template for client review SLA warning
INSERT INTO transactional_email_templates (
  template_key,
  name,
  subject_template,
  html_content,
  text_content,
  variables,
  is_active
) VALUES (
  'client_review_sla_warning',
  'Client Review SLA Warning',
  'Reminder: Content approval needed for "{{post_title}}"',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .cta-button { display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .reminder-box { background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .metrics { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .metric-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .metric-label { font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📝 Content Ready for Your Review</h1>
    </div>
    <div class="content">
      <p>Hi {{client_name}},</p>

      <div class="reminder-box">
        <strong>Reminder:</strong> Your content is ready for review and approval. Please review it at your earliest convenience.
      </div>

      <h2>Content Details</h2>
      <div class="metrics">
        <div class="metric-row">
          <span class="metric-label">Title:</span>
          <span>{{post_title}}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Submitted for Review:</span>
          <span>{{submitted_at}}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Days Pending:</span>
          <span>{{days_pending}}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Please Review By:</span>
          <span style="color: #4CAF50; font-weight: bold;">{{sla_deadline}}</span>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="{{post_url}}" class="cta-button">Review Content</a>
      </p>

      <p>Your timely review helps us maintain the content schedule and publish on time. If you have any questions or need revisions, you can submit feedback directly through the portal.</p>

      <p>Thank you for your prompt attention!</p>

      <p>Best regards,<br>
      <strong>Your BlogCanvas Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated reminder from BlogCanvas.<br>
      Need help? Contact your account manager.</p>
    </div>
  </div>
</body>
</html>',
  'Hi {{client_name}},

📝 REMINDER: Your content is ready for review and approval.

Content Details:
- Title: {{post_title}}
- Submitted for Review: {{submitted_at}}
- Days Pending: {{days_pending}}
- Please Review By: {{sla_deadline}}

Your timely review helps us stay on schedule. If you need revisions, submit feedback through the portal.

Review here: {{post_url}}

Thank you!
Your BlogCanvas Team',
  '["client_name", "post_title", "submitted_at", "days_pending", "sla_deadline", "post_url"]'::JSONB,
  true
) ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject_template = EXCLUDED.subject_template,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  variables = EXCLUDED.variables,
  updated_at = NOW();

COMMENT ON TABLE transactional_email_templates IS 'Includes SLA alert templates: editor_review_sla_warning, editor_review_sla_breach, client_review_sla_warning';
