-- Migration: Pipeline Job Completion Email Notifications (feat-155)
-- Adds email notification support for when pipeline jobs complete

-- 1. Add pipeline completion notification template
INSERT INTO transactional_email_templates (
    template_key,
    name,
    description,
    subject_template,
    html_content,
    text_content,
    variables,
    from_email,
    is_active
) VALUES (
    'pipeline_job_completed',
    'Pipeline Job Completed',
    'Sent when a website analysis pipeline job completes successfully',
    'Pipeline Analysis Complete - {{website_url}}',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .stats { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .stat-label { font-weight: 600; color: #6b7280; }
        .stat-value { font-weight: 700; color: #1f2937; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✨ Pipeline Analysis Complete!</h1>
        </div>
        <div class="content">
            <p>Hi there,</p>
            <p>Your website analysis pipeline for <strong>{{website_url}}</strong> has completed successfully.</p>

            <div class="stats">
                <h3>Analysis Results:</h3>
                <div class="stat-row">
                    <span class="stat-label">SEO Score</span>
                    <span class="stat-value">{{seo_score}}/100</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Pages Indexed</span>
                    <span class="stat-value">{{pages_indexed}}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Content Gaps Identified</span>
                    <span class="stat-value">{{content_gaps}}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Topics Generated</span>
                    <span class="stat-value">{{topics_generated}}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Blog Posts Created</span>
                    <span class="stat-value">{{blogs_created}}</span>
                </div>
            </div>

            <p>The analysis took {{duration}} and was completed at {{completed_at}}.</p>

            <a href="{{job_url}}" class="button">View Full Results</a>

            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                You can disable these notifications in your account settings.
            </p>
        </div>
        <div class="footer">
            <p>&copy; 2026 BlogCanvas. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Pipeline Analysis Complete - {{website_url}}

Your website analysis pipeline for {{website_url}} has completed successfully.

Analysis Results:
- SEO Score: {{seo_score}}/100
- Pages Indexed: {{pages_indexed}}
- Content Gaps Identified: {{content_gaps}}
- Topics Generated: {{topics_generated}}
- Blog Posts Created: {{blogs_created}}

Duration: {{duration}}
Completed at: {{completed_at}}

View full results: {{job_url}}

---
You can disable these notifications in your account settings.

© 2026 BlogCanvas. All rights reserved.',
    ARRAY['website_url', 'seo_score', 'pages_indexed', 'content_gaps', 'topics_generated', 'blogs_created', 'duration', 'completed_at', 'job_url'],
    'BlogCanvas <noreply@blogcanvas.app>',
    true
) ON CONFLICT (template_key) DO UPDATE SET
    subject_template = EXCLUDED.subject_template,
    html_content = EXCLUDED.html_content,
    text_content = EXCLUDED.text_content,
    variables = EXCLUDED.variables,
    updated_at = NOW();

-- 2. Add comment about vendor notification settings
COMMENT ON COLUMN vendors.notification_settings IS 'JSON object with notification preferences: {"email_enabled": true, "slack_enabled": false, "pipeline_completion": true}';
