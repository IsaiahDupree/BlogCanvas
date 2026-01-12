-- Migration: Email templates for work declaration notifications
-- Feature: feat-016 enhancement
-- Description: Adds transactional email templates for work declaration system

-- ============================================================================
-- EMAIL TEMPLATES FOR WORK DECLARATIONS
-- ============================================================================

-- Template: work_declared
INSERT INTO transactional_email_templates (
  name,
  description,
  subject_template,
  html_template,
  text_template,
  required_variables,
  is_system_template
) VALUES (
  'work_declared',
  'Notification when vendor declares new work for a client',
  'New Work Declared: {{work_title}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .details { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">New Work Declared</h1>
    </div>
    <div class="content">
      <p>Hi {{client_name}},</p>

      <p>{{vendor_name}} has declared new work on your account:</p>

      <div class="details">
        <h2 style="margin-top: 0; color: #667eea;">{{work_title}}</h2>
        <p><strong>Description:</strong> {{work_description}}</p>
        <p><strong>Type:</strong> {{work_type}}</p>
        <p><strong>Priority:</strong> {{work_priority}}</p>
        {{#if due_date}}<p><strong>Expected Completion:</strong> {{due_date}}</p>{{/if}}
      </div>

      <p>You can track the progress of this work in your client portal:</p>

      <div style="text-align: center;">
        <a href="{{portal_url}}" class="cta-button">View Work Progress</a>
      </div>

      <p>If you have any questions about this work, please contact {{vendor_name}} directly.</p>

      <p>Best regards,<br>The BlogCanvas Team</p>
    </div>
    <div class="footer">
      <p>You received this email because {{vendor_name}} is managing your content on BlogCanvas.</p>
    </div>
  </div>
</body>
</html>',
  'Hi {{client_name}},

{{vendor_name}} has declared new work on your account:

{{work_title}}

Description: {{work_description}}
Type: {{work_type}}
Priority: {{work_priority}}
{{#if due_date}}Expected Completion: {{due_date}}{{/if}}

You can track the progress of this work in your client portal:
{{portal_url}}

If you have any questions about this work, please contact {{vendor_name}} directly.

Best regards,
The BlogCanvas Team',
  ARRAY['client_name', 'vendor_name', 'work_title', 'work_description', 'work_type', 'work_priority', 'portal_url'],
  true
);

-- Template: work_status_changed
INSERT INTO transactional_email_templates (
  name,
  description,
  subject_template,
  html_template,
  text_template,
  required_variables,
  is_system_template
) VALUES (
  'work_status_changed',
  'Notification when work declaration status changes',
  'Work Status Update: {{work_title}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 6px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">Work Status Update</h1>
    </div>
    <div class="content">
      <p>Hi {{client_name}},</p>

      <p>The status of your work item has been updated:</p>

      <h2 style="color: #3b82f6;">{{work_title}}</h2>

      <p>
        <strong>Previous Status:</strong> <span class="status-badge" style="background: #e5e7eb; color: #374151;">{{old_status}}</span><br>
        <strong>New Status:</strong> <span class="status-badge" style="background: #3b82f6; color: white;">{{new_status}}</span>
      </p>

      {{#if progress_percentage}}
      <p><strong>Progress:</strong> {{progress_percentage}}% complete</p>
      {{/if}}

      {{#if update_comment}}
      <p><strong>Update Note:</strong> {{update_comment}}</p>
      {{/if}}

      <div style="text-align: center;">
        <a href="{{portal_url}}" class="cta-button">View Full Details</a>
      </div>

      <p>Best regards,<br>{{vendor_name}}</p>
    </div>
    <div class="footer">
      <p>You received this email because {{vendor_name}} is managing your content on BlogCanvas.</p>
    </div>
  </div>
</body>
</html>',
  'Hi {{client_name}},

The status of your work item has been updated:

{{work_title}}

Previous Status: {{old_status}}
New Status: {{new_status}}

{{#if progress_percentage}}Progress: {{progress_percentage}}% complete{{/if}}

{{#if update_comment}}Update Note: {{update_comment}}{{/if}}

View full details: {{portal_url}}

Best regards,
{{vendor_name}}',
  ARRAY['client_name', 'vendor_name', 'work_title', 'old_status', 'new_status', 'portal_url'],
  true
);

-- Template: work_completed
INSERT INTO transactional_email_templates (
  name,
  description,
  subject_template,
  html_template,
  text_template,
  required_variables,
  is_system_template
) VALUES (
  'work_completed',
  'Notification when work declaration is marked as completed',
  'Work Completed: {{work_title}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .success-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 6px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">✅ Work Completed</h1>
    </div>
    <div class="content">
      <p>Hi {{client_name}},</p>

      <p>Great news! We've completed the following work item:</p>

      <h2 style="color: #10b981;">{{work_title}}</h2>

      <p class="success-badge">Completed</p>

      {{#if completion_message}}
      <p>{{completion_message}}</p>
      {{/if}}

      {{#if deliverables_count}}
      <p><strong>Deliverables:</strong> {{deliverables_count}} item(s) delivered</p>
      {{/if}}

      <div style="text-align: center;">
        <a href="{{portal_url}}" class="cta-button">View Completed Work</a>
      </div>

      <p>Thank you for your partnership!</p>

      <p>Best regards,<br>{{vendor_name}}</p>
    </div>
    <div class="footer">
      <p>You received this email because {{vendor_name}} is managing your content on BlogCanvas.</p>
    </div>
  </div>
</body>
</html>',
  'Hi {{client_name}},

Great news! We''ve completed the following work item:

{{work_title}}

Status: Completed

{{#if completion_message}}{{completion_message}}{{/if}}

{{#if deliverables_count}}Deliverables: {{deliverables_count}} item(s) delivered{{/if}}

View completed work: {{portal_url}}

Thank you for your partnership!

Best regards,
{{vendor_name}}',
  ARRAY['client_name', 'vendor_name', 'work_title', 'portal_url'],
  true
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN transactional_email_templates.name IS 'Unique template identifier (work_declared, work_status_changed, work_completed)';
