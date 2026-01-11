# Newsletter Automation & Scheduling Setup Guide

This guide explains how to set up newsletter automation, scheduling, and tracking for BlogCanvas.

## Overview

The newsletter system (feat-011) includes:
- **Recipient Management**: Add, remove, import recipients via CSV
- **Analytics Tracking**: Open rates, click rates, bounce rates via Resend webhooks
- **Automation Engine**: Monthly, weekly, and milestone-based triggers
- **Scheduling**: Schedule campaigns for future delivery
- **Unsubscribe Handling**: Compliant unsubscribe links and preference center

---

## 1. Environment Variables

Add these variables to your `.env.local` file:

```bash
# Resend Email Service (required for sending)
RESEND_API_KEY=re_xxx...

# Resend Webhook Secret (optional, for webhook signature verification)
RESEND_WEBHOOK_SECRET=whsec_xxx...

# Cron Secret (for securing automation processor endpoint)
CRON_SECRET=your-secure-random-string

# App URL (for unsubscribe links and webhook callbacks)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 2. Database Setup

Apply the newsletter automation migration:

```bash
# If using Supabase CLI
npx supabase db push

# Or manually execute the migration SQL
# File: supabase/migrations/20260111000002_newsletter_automations.sql
```

This creates:
- `newsletter_automations` table (automation rules)
- `newsletter_automation_executions` table (execution logs)
- Helper functions for calculating next execution times
- RLS policies for security

---

## 3. Resend Webhook Setup

### Step 1: Configure Webhook in Resend Dashboard

1. Go to [Resend Webhooks Dashboard](https://resend.com/webhooks)
2. Click "Add Webhook"
3. Set webhook URL: `https://your-domain.com/api/newsletters/webhooks/resend`
4. Select events to subscribe to:
   - `email.sent` - Email accepted by receiving server
   - `email.delivered` - Email successfully delivered
   - `email.opened` - Email opened by recipient
   - `email.clicked` - Link clicked in email
   - `email.bounced` - Email bounced
   - `email.complained` - Marked as spam
5. Copy the "Webhook Signing Secret"
6. Add to `.env.local` as `RESEND_WEBHOOK_SECRET`

### Step 2: Test Webhook Endpoint

```bash
# Test that webhook endpoint is accessible
curl https://your-domain.com/api/newsletters/webhooks/resend

# Expected response:
{
  "message": "Resend webhook endpoint",
  "status": "active"
}
```

### Step 3: Verify Webhook Events

Send a test newsletter and check logs to confirm webhook events are being received and processed.

---

## 4. Automation Processor Cron Setup

The automation processor checks for due automations and executes them. You need to set up a cron job or scheduled task to call the processor endpoint periodically.

### Option 1: Vercel Cron (Recommended for Vercel deployments)

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/newsletters/automations/process",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs the processor **every hour** (at minute 0).

**Cron schedule format**: `minute hour day month dayOfWeek`
- `0 * * * *` - Every hour at minute 0
- `0 0 * * *` - Every day at midnight
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1` - Every Monday at 9 AM

### Option 2: External Cron Service (EasyCron, cron-job.org)

1. Go to [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com)
2. Create a new cron job
3. Set URL: `https://your-domain.com/api/newsletters/automations/process`
4. Set method: `POST`
5. Add header: `Authorization: Bearer YOUR_CRON_SECRET`
6. Set schedule: Every 1 hour (or as desired)

### Option 3: GitHub Actions (Free)

Create `.github/workflows/newsletter-automation.yml`:

```yaml
name: Newsletter Automation Processor

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Allow manual trigger

jobs:
  process-automations:
    runs-on: ubuntu-latest
    steps:
      - name: Call automation processor
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/newsletters/automations/process
```

Add `CRON_SECRET` to your GitHub repository secrets.

### Option 4: Server Cron (Linux/Unix)

If self-hosting, add to your server's crontab:

```bash
# Edit crontab
crontab -e

# Add this line (runs every hour)
0 * * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/newsletters/automations/process
```

---

## 5. Testing the Automation System

### Test 1: Check Due Automations

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/newsletters/automations/process

# Expected response:
{
  "message": "Automation status check",
  "due_count": 2,
  "due_automations": [...]
}
```

### Test 2: Create a Test Automation

Use the BlogCanvas UI or API:

```bash
POST /api/newsletters/automations
{
  "name": "Monthly Newsletter",
  "description": "Sent on the 1st of every month",
  "trigger_type": "monthly",
  "trigger_config": { "day_of_month": 1 },
  "template_id": "uuid-of-template",
  "subject": "Monthly Update from BlogCanvas",
  "recipient_selection": "all_clients",
  "recipient_config": {},
  "enabled": true
}
```

### Test 3: Manual Execution

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/newsletters/automations/process

# Check execution logs in database:
# SELECT * FROM newsletter_automation_executions ORDER BY executed_at DESC;
```

---

## 6. Automation Types

### Monthly Automation

Sends newsletter on a specific day each month:

```json
{
  "trigger_type": "monthly",
  "trigger_config": {
    "day_of_month": 1  // 1-31
  }
}
```

### Weekly Automation

Sends newsletter on a specific day each week:

```json
{
  "trigger_type": "weekly",
  "trigger_config": {
    "day_of_week": 1  // 0=Sunday, 1=Monday, ..., 6=Saturday
  }
}
```

### Milestone Automation

Triggered by events (requires custom integration):

```json
{
  "trigger_type": "milestone",
  "trigger_config": {
    "event": "post_published",
    "threshold": 10  // e.g., every 10 posts published
  }
}
```

Note: Milestone automations require custom event triggers to be implemented in your application logic.

---

## 7. Recipient Selection Strategies

### All Clients

Sends to all clients of the vendor:

```json
{
  "recipient_selection": "all_clients",
  "recipient_config": {}
}
```

### Custom Email List

Sends to specific email addresses:

```json
{
  "recipient_selection": "custom_list",
  "recipient_config": {
    "emails": ["email1@example.com", "email2@example.com"]
  }
}
```

### Specific Clients

Sends to selected clients by ID:

```json
{
  "recipient_selection": "client_ids",
  "recipient_config": {
    "client_ids": ["client-uuid-1", "client-uuid-2"]
  }
}
```

---

## 8. Monitoring & Logs

### Check Automation Status

```sql
-- View all automations with next execution time
SELECT
  id,
  name,
  trigger_type,
  enabled,
  next_execution_at,
  last_executed_at,
  execution_count
FROM newsletter_automations
WHERE enabled = true
ORDER BY next_execution_at;
```

### View Execution Logs

```sql
-- Recent automation executions
SELECT
  ae.id,
  ae.executed_at,
  ae.status,
  ae.recipients_count,
  ae.emails_sent,
  ae.emails_failed,
  ae.error_message,
  na.name as automation_name,
  nc.subject as campaign_subject
FROM newsletter_automation_executions ae
JOIN newsletter_automations na ON ae.automation_id = na.id
LEFT JOIN newsletter_campaigns nc ON ae.campaign_id = nc.id
ORDER BY ae.executed_at DESC
LIMIT 20;
```

### View Campaign Analytics

```sql
-- Campaign performance
SELECT
  nc.id,
  nc.subject,
  nc.status,
  nc.sent_at,
  COUNT(*) FILTER (WHERE nr.status = 'sent') as sent_count,
  COUNT(*) FILTER (WHERE nr.status = 'delivered') as delivered_count,
  COUNT(*) FILTER (WHERE nr.status = 'opened') as opened_count,
  COUNT(*) FILTER (WHERE nr.status = 'clicked') as clicked_count,
  COUNT(*) FILTER (WHERE nr.status = 'bounced') as bounced_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE nr.status = 'opened') /
    NULLIF(COUNT(*) FILTER (WHERE nr.status IN ('delivered', 'opened', 'clicked')), 0),
    2
  ) as open_rate
FROM newsletter_campaigns nc
LEFT JOIN newsletter_recipients nr ON nc.id = nr.campaign_id
WHERE nc.status = 'sent'
GROUP BY nc.id
ORDER BY nc.sent_at DESC;
```

---

## 9. Troubleshooting

### Automations Not Running

1. Check `next_execution_at` is in the past:
   ```sql
   SELECT * FROM newsletter_automations
   WHERE enabled = true
   AND next_execution_at < NOW();
   ```

2. Verify cron job is running (check cron service logs)

3. Test processor endpoint manually:
   ```bash
   curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-domain.com/api/newsletters/automations/process
   ```

4. Check execution logs for errors:
   ```sql
   SELECT * FROM newsletter_automation_executions
   WHERE status = 'failed'
   ORDER BY executed_at DESC;
   ```

### Webhooks Not Working

1. Verify webhook URL is accessible publicly
2. Check Resend dashboard for webhook delivery failures
3. Review application logs for webhook processing errors
4. Test webhook endpoint:
   ```bash
   curl -X POST https://your-domain.com/api/newsletters/webhooks/resend \
     -H "Content-Type: application/json" \
     -d '{"type":"email.opened","data":{"to":"test@example.com","email_id":"test"}}'
   ```

### Emails Not Sending

1. Verify `RESEND_API_KEY` is set correctly
2. Check Resend dashboard for sending errors
3. Verify campaign has recipients with `status='pending'`
4. Check campaign status is not already 'sent' or 'sending'

---

## 10. Production Deployment Checklist

- [ ] Environment variables set in production
- [ ] Database migration applied
- [ ] Resend webhook configured and tested
- [ ] Cron job set up and verified (hourly execution)
- [ ] Test automation created and executed successfully
- [ ] Unsubscribe links working
- [ ] Analytics tracking verified (opens, clicks)
- [ ] Error monitoring configured (Sentry, etc.)
- [ ] Logs being collected and reviewed

---

## 11. Security Considerations

1. **Cron Secret**: Use a strong, randomly generated secret for `CRON_SECRET`
2. **Webhook Secret**: Store `RESEND_WEBHOOK_SECRET` securely
3. **Unsubscribe Tokens**: Expire after 30 days automatically
4. **Rate Limiting**: Consider adding rate limits to webhook endpoint
5. **RLS Policies**: Ensure all newsletter tables have proper RLS policies

---

## 12. Cost Optimization

- **Resend**: Free tier includes 3,000 emails/month; paid plans start at $20/month
- **Cron Jobs**: Vercel cron is free; GitHub Actions free tier sufficient
- **Database**: Supabase free tier handles automations for small to medium usage

---

## Support

For issues or questions:
- Check [Resend Documentation](https://resend.com/docs)
- Review application logs
- Check Supabase database logs
- Contact BlogCanvas support

---

**Last Updated**: 2026-01-11
