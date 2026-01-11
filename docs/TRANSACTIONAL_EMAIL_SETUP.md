# Transactional Email System Setup Guide

Complete guide for setting up and using the BlogCanvas transactional email system.

## Table of Contents

1. [Overview](#overview)
2. [Environment Configuration](#environment-configuration)
3. [Database Migration](#database-migration)
4. [Resend Configuration](#resend-configuration)
5. [Cron Job Setup](#cron-job-setup)
6. [Usage Guide](#usage-guide)
7. [Email Templates](#email-templates)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)
10. [Production Checklist](#production-checklist)

---

## Overview

The BlogCanvas transactional email system provides reliable, template-based email delivery for:

- **User Invitations**: Vendor and client onboarding
- **Password Resets**: Account recovery
- **Project Notifications**: Work declarations and milestones
- **Content Approval Workflows**: Review requests and approvals
- **Publishing Notifications**: Content goes live
- **Report Deliveries**: Monthly reports and analytics

### Key Features

- ✅ **Template System**: HTML templates with variable substitution
- ✅ **Email Queue**: Reliable delivery with retry logic
- ✅ **Delivery Tracking**: Webhooks from Resend for opens/clicks
- ✅ **Priority Support**: Send urgent emails first
- ✅ **Scheduled Sending**: Queue emails for future delivery
- ✅ **Failure Handling**: Auto-retry up to 3 times

---

## Environment Configuration

### Required Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend API (for email sending)
RESEND_API_KEY=re_your_resend_api_key

# Cron Secret (for queue processor authentication)
CRON_SECRET=your_random_secret_here
```

### Getting Your Resend API Key

1. Sign up at [https://resend.com](https://resend.com)
2. Verify your domain (or use Resend's test domain for development)
3. Navigate to **API Keys** in the dashboard
4. Click **Create API Key**
5. Copy the key (starts with `re_`)
6. Add to `.env.local` as `RESEND_API_KEY`

### Generating a Cron Secret

```bash
# Generate a random secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add the generated secret to `.env.local` as `CRON_SECRET`.

---

## Database Migration

### Apply the Migration

The transactional email system requires database tables for templates, queue, and tracking.

**Option 1: Using Supabase CLI (Recommended)**

```bash
cd /path/to/BlogCanvas
npx supabase db push
```

This applies the migration file:
- `supabase/migrations/20260111000004_transactional_email_system.sql`

**Option 2: Manual SQL Execution**

If you don't have the Supabase CLI:

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/20260111000004_transactional_email_system.sql`
3. Paste and execute in the SQL Editor

### Verify Migration

Check that the following tables exist:

```sql
-- Run in Supabase SQL Editor
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('transactional_email_templates', 'email_queue', 'email_delivery_tracking');
```

You should see all 3 tables listed.

### Check System Templates

Verify that 7 system templates were inserted:

```sql
SELECT template_key, name FROM transactional_email_templates ORDER BY name;
```

Expected templates:
- `client_invitation`
- `content_approved`
- `content_published`
- `content_ready_for_review`
- `password_reset`
- `project_started`
- `user_invitation`

---

## Resend Configuration

### Domain Verification (Production)

For production use, verify your sending domain:

1. Go to [Resend Dashboard → Domains](https://resend.com/domains)
2. Click **Add Domain**
3. Enter your domain (e.g., `blogcanvas.app`)
4. Add the provided DNS records to your domain registrar:
   - **TXT record** for domain verification
   - **MX record** for bounce handling
   - **DKIM records** for authentication
5. Wait for DNS propagation (5-30 minutes)
6. Click **Verify** in Resend dashboard

### Email Addresses

Configure the "from" addresses in your templates or code:

- **Transactional**: `noreply@yourdomain.com`
- **Notifications**: `notifications@yourdomain.com`
- **Reports**: `reports@yourdomain.com`

Update the default in `/src/lib/emails/transactional-email-service.ts` (line 96):

```typescript
from: 'BlogCanvas <noreply@yourdomain.com>',
```

### Test Domain (Development)

For development/testing, Resend provides a test domain:

- **From**: `onboarding@resend.dev`
- **Limitation**: Can only send to your verified email address

This is fine for testing but not for production.

---

## Cron Job Setup

The email queue requires a cron job to process pending emails every 1-5 minutes.

### Option 1: Vercel Cron (Recommended for Vercel Deployments)

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/emails/queue/process",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

This runs every 2 minutes.

**Authentication**: Vercel Cron includes `x-vercel-cron` header. Update the processor to check this:

```typescript
// In src/app/api/emails/queue/process/route.ts
const isVercelCron = request.headers.get('x-vercel-cron');
if (!isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Deploy**: Push to Vercel. Cron jobs are automatically configured.

### Option 2: External Cron Service (Platform-Agnostic)

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

1. Sign up for a cron service
2. Create a new cron job:
   - **URL**: `https://yourdomain.com/api/emails/queue/process`
   - **Method**: POST
   - **Schedule**: Every 2 minutes (`*/2 * * * *`)
   - **Headers**: `Authorization: Bearer YOUR_CRON_SECRET`
3. Save and enable

### Option 3: GitHub Actions (Free for Public Repos)

Create `.github/workflows/email-queue.yml`:

```yaml
name: Process Email Queue

on:
  schedule:
    - cron: '*/2 * * * *'  # Every 2 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  process-queue:
    runs-on: ubuntu-latest
    steps:
      - name: Process Email Queue
        run: |
          curl -X POST https://yourdomain.com/api/emails/queue/process \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

Add `CRON_SECRET` to your GitHub repository secrets.

### Option 4: Self-Hosted Server Cron

On a Linux server with cron:

```bash
# Edit crontab
crontab -e

# Add this line (runs every 2 minutes)
*/2 * * * * curl -X POST https://yourdomain.com/api/emails/queue/process -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Testing the Processor

Manually trigger the processor:

```bash
curl -X POST http://localhost:4848/api/emails/queue/process \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

Expected response:

```json
{
  "success": true,
  "processed": 5,
  "sent": 5,
  "failed": 0
}
```

---

## Usage Guide

### Sending a Transactional Email

**From Server-Side Code (Recommended)**

```typescript
import { queueTransactionalEmail } from '@/lib/emails/transactional-email-service';

// Example: Send user invitation
const result = await queueTransactionalEmail({
    templateKey: 'user_invitation',
    to: 'newuser@example.com',
    toName: 'John Doe',
    variables: {
        user_name: 'John Doe',
        vendor_name: 'Acme Blog Co.',
        inviter_name: 'Jane Smith',
        invite_url: 'https://blogcanvas.app/auth/accept?token=abc123'
    },
    priority: 1,  // 1 = highest, 10 = lowest (default: 5)
    metadata: {
        user_id: 'uuid-here',
        vendor_id: 'uuid-here'
    }
});

if (result.success) {
    console.log('Email queued:', result.queueId);
} else {
    console.error('Failed to queue:', result.error);
}
```

**From API Endpoint**

```typescript
// POST /api/emails/send
const response = await fetch('/api/emails/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        templateKey: 'content_ready_for_review',
        to: 'client@example.com',
        toName: 'Client Name',
        variables: {
            client_name: 'Client Name',
            post_title: 'How to Optimize Your Blog for SEO',
            target_keyword: 'blog SEO optimization',
            word_count: '2500',
            seo_score: '85',
            review_url: 'https://blogcanvas.app/app/posts/123/review'
        }
    })
});
```

### Scheduled Emails

Queue an email for future delivery:

```typescript
const result = await queueTransactionalEmail({
    templateKey: 'project_started',
    to: 'client@example.com',
    variables: { /* ... */ },
    scheduledAt: new Date('2026-01-15T09:00:00Z')  // Send at specific time
});
```

### Immediate Sending (Bypass Queue)

For critical, time-sensitive emails (not recommended):

```typescript
import { sendTransactionalEmailImmediate } from '@/lib/emails/transactional-email-service';

const result = await sendTransactionalEmailImmediate({
    templateKey: 'password_reset',
    to: 'user@example.com',
    variables: {
        user_name: 'John Doe',
        reset_url: 'https://blogcanvas.app/auth/reset?token=xyz789'
    }
});
```

**Warning**: Immediate sending bypasses the queue, so failed emails won't be retried.

---

## Email Templates

### Available System Templates

| Template Key | Use Case | Required Variables |
|--------------|----------|-------------------|
| `user_invitation` | Vendor team member invites | `user_name`, `vendor_name`, `inviter_name`, `invite_url` |
| `client_invitation` | Client portal invites | `client_name`, `vendor_name`, `portal_url` |
| `project_started` | New work declaration | `client_name`, `project_name`, `project_description`, `start_date`, `end_date`, `project_url` |
| `content_ready_for_review` | Content awaiting approval | `client_name`, `post_title`, `target_keyword`, `word_count`, `seo_score`, `review_url` |
| `content_approved` | Client approved content | `vendor_name`, `client_name`, `post_title`, `approval_message`, `post_url` |
| `content_published` | Content goes live | `client_name`, `post_title`, `published_date`, `platform`, `published_url` |
| `password_reset` | Account recovery | `user_name`, `reset_url` |

### Viewing Templates

Visit the email management page:

```
http://localhost:4848/app/emails
```

This page displays:
- All available templates
- Queue statistics
- Test email sender

### Template Customization (Future Feature)

System templates are read-only. To customize:

1. Create a copy of the template in the database
2. Set `is_system_template = false`
3. Modify HTML content
4. Use your custom template key

---

## Monitoring

### Queue Statistics API

Get real-time queue stats:

```bash
curl http://localhost:4848/api/emails/queue/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:

```json
{
  "pending": 12,
  "sending": 2,
  "sent": 1543,
  "failed": 5
}
```

### Database Queries

**Check pending emails**:

```sql
SELECT * FROM email_queue
WHERE status = 'pending'
ORDER BY priority, scheduled_at
LIMIT 20;
```

**Check failed emails**:

```sql
SELECT to_email, subject, error_message, attempts, failed_at
FROM email_queue
WHERE status = 'failed'
ORDER BY failed_at DESC
LIMIT 20;
```

**Email delivery tracking**:

```sql
SELECT
    eq.to_email,
    eq.subject,
    eq.sent_at,
    edt.event_type,
    edt.occurred_at
FROM email_queue eq
LEFT JOIN email_delivery_tracking edt ON edt.email_queue_id = eq.id
WHERE eq.status = 'sent'
ORDER BY eq.sent_at DESC
LIMIT 50;
```

**Queue performance stats**:

```sql
SELECT
    status,
    COUNT(*) as count,
    AVG(attempts) as avg_attempts
FROM email_queue
GROUP BY status;
```

### Resend Dashboard

Monitor email delivery in the [Resend Dashboard](https://resend.com/emails):

- **Sent**: Total emails sent
- **Delivered**: Emails that reached inbox
- **Opened**: Recipient opened email
- **Clicked**: Recipient clicked link
- **Bounced**: Email was rejected
- **Complained**: Marked as spam

---

## Troubleshooting

### Emails Not Sending

**Check 1: Resend API Key**

```bash
# Test Resend API
curl https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "your@email.com",
    "subject": "Test Email",
    "html": "<p>Test email from BlogCanvas</p>"
  }'
```

**Check 2: Queue Processor Running**

```sql
SELECT * FROM email_queue WHERE status = 'pending' AND scheduled_at <= NOW();
```

If there are pending emails but none are being sent, the cron job may not be running.

**Check 3: Database Connection**

Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly. The queue processor needs service role access to bypass RLS.

### Failed Emails

**Retry a Failed Email**:

```typescript
import { retryFailedEmail } from '@/lib/emails/transactional-email-service';

const result = await retryFailedEmail('queue-id-here');
```

**Cancel a Stuck Email**:

```typescript
import { cancelEmail } from '@/lib/emails/transactional-email-service';

const result = await cancelEmail('queue-id-here');
```

### Template Not Found

Error: `Email template 'xyz' not found or inactive`

**Solution**:

```sql
-- Check if template exists
SELECT template_key, is_active FROM transactional_email_templates;

-- Activate a template
UPDATE transactional_email_templates SET is_active = true WHERE template_key = 'xyz';
```

### Missing Variables

Error: `Missing required variables: user_name, invite_url`

**Solution**: Ensure all required variables are provided:

```typescript
const result = await queueTransactionalEmail({
    templateKey: 'user_invitation',
    to: 'user@example.com',
    variables: {
        user_name: 'John Doe',        // ✓ Required
        vendor_name: 'Acme Co.',      // ✓ Required
        inviter_name: 'Jane Smith',   // ✓ Required
        invite_url: 'https://...'     // ✓ Required
    }
});
```

---

## Production Checklist

Before going live:

- [ ] Verify domain in Resend dashboard
- [ ] Update "from" email addresses to your domain
- [ ] Set `RESEND_API_KEY` to production API key (not test key)
- [ ] Configure `CRON_SECRET` with a strong random value
- [ ] Set up cron job (Vercel Cron, external service, or GitHub Actions)
- [ ] Test all email templates with real data
- [ ] Monitor Resend dashboard for delivery issues
- [ ] Set up email bounce handling
- [ ] Configure SPF, DKIM, and DMARC DNS records
- [ ] Test unsubscribe links (if applicable)
- [ ] Set up alerts for failed emails (>10% failure rate)
- [ ] Document email sending limits (Resend: 100 emails/day on free plan)
- [ ] Consider upgrading Resend plan for production volume

---

## Security Considerations

- **Never expose API keys**: Keep `RESEND_API_KEY` in environment variables only
- **Authenticate cron endpoint**: Always require `CRON_SECRET` for queue processor
- **Rate limiting**: Consider rate limiting `/api/emails/send` to prevent abuse
- **Variable sanitization**: All template variables are automatically escaped in HTML
- **Sensitive data**: Don't store passwords or sensitive data in email queue metadata
- **Access control**: Email queue tables use RLS with service role access only

---

## Cost Optimization

### Resend Pricing

- **Free Plan**: 100 emails/day, 3,000/month
- **Pro Plan**: $20/month for 50,000 emails
- **Business Plan**: Custom pricing

### Optimization Tips

1. **Batch digest emails** instead of sending individual notifications
2. **Use priority levels** to ensure critical emails are sent first
3. **Clean up old sent emails** from the queue (after 30 days):

```sql
DELETE FROM email_queue WHERE status = 'sent' AND sent_at < NOW() - INTERVAL '30 days';
```

4. **Monitor bounce rates** and remove invalid email addresses
5. **Implement unsubscribe functionality** for marketing emails

---

## Additional Resources

- **Resend Documentation**: [https://resend.com/docs](https://resend.com/docs)
- **Resend Node.js SDK**: [https://github.com/resendlabs/resend-node](https://github.com/resendlabs/resend-node)
- **Email Best Practices**: [https://resend.com/docs/best-practices](https://resend.com/docs/best-practices)
- **BlogCanvas Email System**: `/app/emails` (management UI)
- **Cron Expression Syntax**: [https://crontab.guru](https://crontab.guru)

---

## Support

If you encounter issues:

1. Check this documentation first
2. Review the Resend dashboard for delivery errors
3. Check Supabase logs for API errors
4. Inspect the `email_queue` table for failed emails
5. Open an issue on the BlogCanvas GitHub repository

---

**Happy Emailing! 📧**
