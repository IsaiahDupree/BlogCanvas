# Scheduled Reports Setup Guide

This guide explains how to set up automated report scheduling for BlogCanvas.

## Overview

The scheduled reports system allows vendors to automate periodic SEO performance reports that are automatically generated and emailed to clients on a recurring schedule (daily, weekly, monthly, or quarterly).

## Architecture

The system consists of:

1. **Database Tables**:
   - `scheduled_reports` - Stores recurring report schedules
   - `scheduled_report_executions` - Tracks execution history

2. **API Endpoints**:
   - `GET /api/scheduled-reports` - List all schedules
   - `POST /api/scheduled-reports` - Create a new schedule
   - `GET /api/scheduled-reports/[id]` - Get schedule details
   - `PATCH /api/scheduled-reports/[id]` - Update a schedule
   - `DELETE /api/scheduled-reports/[id]` - Delete a schedule
   - `POST /api/scheduled-reports/process` - Process due schedules (cron endpoint)

3. **UI Components**:
   - `/app/reports/schedules` - Schedule management page

## Database Migration

Apply the migration to create the required tables:

```bash
# If using Supabase CLI locally
npx supabase db push

# Or apply manually via Supabase Dashboard
# Copy the SQL from: supabase/migrations/20260113000002_scheduled_reports.sql
```

## Environment Variables

Add to your `.env.local`:

```env
# CRON_SECRET - Secret token to authenticate cron job requests
CRON_SECRET=your-secret-token-here

# Email service (Resend) - Required for sending reports
RESEND_API_KEY=re_your_resend_key_here
```

## Cron Job Setup

The system requires a cron job to check for and process scheduled reports. The processor endpoint should be called periodically (recommended: every hour).

### Option 1: Vercel Cron Jobs (Recommended for Production)

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/scheduled-reports/process",
      "schedule": "0 * * * *"
    }
  ]
}
```

Schedule syntax: `0 * * * *` = every hour at minute 0

Add the cron secret header in the processor:

```typescript
// The processor endpoint already checks for this
headers: {
  'x-cron-secret': process.env.CRON_SECRET
}
```

### Option 2: GitHub Actions

Create `.github/workflows/scheduled-reports.yml`:

```yaml
name: Process Scheduled Reports

on:
  schedule:
    # Run every hour
    - cron: '0 * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  process-reports:
    runs-on: ubuntu-latest
    steps:
      - name: Call processor endpoint
        run: |
          curl -X POST https://your-domain.com/api/scheduled-reports/process \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

Add `CRON_SECRET` to your GitHub repository secrets.

### Option 3: External Cron Service

Use services like:
- **cron-job.org** (free, reliable)
- **EasyCron** (paid, feature-rich)
- **Uptime Robot** (free for basic monitoring + cron)

Configuration:
- **URL**: `https://your-domain.com/api/scheduled-reports/process`
- **Method**: POST
- **Headers**: `x-cron-secret: your-secret-token`
- **Frequency**: Every hour (or adjust based on needs)

### Option 4: Self-Hosted Cron (Linux/Mac)

On your server, add to crontab:

```bash
# Edit crontab
crontab -e

# Add this line (runs every hour)
0 * * * * curl -X POST https://your-domain.com/api/scheduled-reports/process -H "x-cron-secret: your-secret-token"
```

## How It Works

### 1. Creating a Schedule

Users create a schedule via the UI at `/app/reports/schedules`:

```typescript
{
  name: "Monthly Performance Report",
  websiteId: "uuid",
  reportType: "email", // or "pdf", "slide_deck"
  frequency: "monthly", // or "daily", "weekly", "quarterly"
  dayOfMonth: 1, // For monthly reports
  periodLength: 30,
  periodUnit: "days",
  recipientEmails: ["client@example.com", "manager@example.com"],
  isActive: true
}
```

The system automatically calculates `next_run_at` based on the frequency.

### 2. Processing Schedules

When the cron job calls `/api/scheduled-reports/process`:

1. Finds all active schedules where `next_run_at <= NOW()`
2. For each schedule:
   - Creates an execution record
   - Calculates the report period (e.g., last 30 days)
   - Generates the report using existing report generation logic
   - Sends emails to all recipients
   - Updates execution status
   - Calculates and updates `next_run_at`
   - Updates `last_run_at`

### 3. Report Generation

The processor reuses the existing report generation logic from `/api/reports/generate`:

- Fetches published posts for the period
- Aggregates metrics (impressions, clicks, CTR, position, SEO score)
- Identifies top performing posts
- Calculates trends
- Generates report content (email text, PDF HTML, or slide JSON)
- Saves to `reports` table

### 4. Email Delivery

Emails are sent using the Resend API via `src/lib/reports/email-sender.ts`:

```typescript
await sendEmail({
  to: recipient@example.com,
  subject: "Monthly SEO Report - Dec 2025",
  body: reportContent.body,
  html: reportContent.html
});
```

## Frequency Types

### Daily
- Runs every day at the same time
- `next_run_at` = current time + 1 day

### Weekly
- Runs on a specific day of the week (0=Sunday, 6=Saturday)
- `day_of_week` field specifies the target day
- Example: Every Monday at the scheduled time

### Monthly
- Runs on a specific day of the month (1-31)
- `day_of_month` field specifies the target day
- Example: 1st of every month
- Note: If day > days in month (e.g., 31st in February), uses last day of month

### Quarterly
- Runs every 3 months
- `next_run_at` = current time + 3 months

## Period Configuration

Reports can cover different time periods:

- **Period Length**: How many units to include (e.g., 30)
- **Period Unit**: `days`, `weeks`, or `months`

Examples:
- Last 30 days: `periodLength: 30, periodUnit: 'days'`
- Last 4 weeks: `periodLength: 4, periodUnit: 'weeks'`
- Last 3 months: `periodLength: 3, periodUnit: 'months'`

The processor calculates:
```typescript
periodEnd = NOW()
periodStart = periodEnd - (periodLength * periodUnit)
```

## Monitoring

### Check Execution History

Query recent executions:

```sql
SELECT
  sr.name,
  sre.execution_status,
  sre.started_at,
  sre.completed_at,
  sre.error_message,
  sre.emails_sent_to
FROM scheduled_report_executions sre
JOIN scheduled_reports sr ON sr.id = sre.scheduled_report_id
WHERE sre.started_at > NOW() - INTERVAL '7 days'
ORDER BY sre.started_at DESC;
```

### Check Due Schedules

See what's due to run:

```sql
SELECT
  id,
  name,
  frequency,
  next_run_at,
  last_run_at,
  is_active
FROM scheduled_reports
WHERE is_active = true
  AND next_run_at <= NOW()
ORDER BY next_run_at;
```

### Check Schedule Health

Find schedules that haven't run recently:

```sql
SELECT
  id,
  name,
  frequency,
  last_run_at,
  next_run_at,
  is_active
FROM scheduled_reports
WHERE is_active = true
  AND (last_run_at IS NULL OR last_run_at < NOW() - INTERVAL '2 days')
ORDER BY last_run_at NULLS FIRST;
```

## Troubleshooting

### Schedules Not Running

1. **Check cron job is active**:
   - Verify cron job is configured and running
   - Check cron service logs

2. **Check processor endpoint**:
   ```bash
   curl -X POST https://your-domain.com/api/scheduled-reports/process \
     -H "x-cron-secret: your-secret-token" \
     -v
   ```

3. **Check authentication**:
   - Verify `CRON_SECRET` matches in both environment and cron job
   - Check processor endpoint logs for 401 errors

4. **Check next_run_at times**:
   ```sql
   SELECT id, name, next_run_at FROM scheduled_reports WHERE is_active = true;
   ```

### Emails Not Sending

1. **Check Resend API key**:
   - Verify `RESEND_API_KEY` is set correctly
   - Check Resend dashboard for failed sends

2. **Check email-sender logs**:
   - Look for errors in application logs
   - Verify email addresses are valid

3. **Check execution records**:
   ```sql
   SELECT
     email_sent_at,
     email_error,
     emails_sent_to
   FROM scheduled_report_executions
   WHERE email_error IS NOT NULL
   ORDER BY started_at DESC
   LIMIT 10;
   ```

### Failed Report Generation

1. **Check for posts in period**:
   - Verify there are published posts in the report period
   - Check `content_batches` linked to website

2. **Check metrics data**:
   - Verify `blog_post_metrics` table has data
   - Check if analytics collection is running

3. **Review execution errors**:
   ```sql
   SELECT
     sr.name,
     sre.error_message,
     sre.started_at
   FROM scheduled_report_executions sre
   JOIN scheduled_reports sr ON sr.id = sre.scheduled_report_id
   WHERE sre.execution_status = 'failed'
   ORDER BY sre.started_at DESC
   LIMIT 10;
   ```

## Testing

### Test Schedule Creation

1. Go to `/app/reports/schedules`
2. Click "Create Schedule"
3. Fill in the form:
   - Name: "Test Weekly Report"
   - Website: Select a website
   - Report Type: Email
   - Frequency: Weekly, Monday
   - Period: Last 7 days
   - Recipients: your-email@example.com
4. Submit and verify schedule appears in list

### Test Manual Processor Execution

```bash
# Call the processor endpoint directly
curl -X POST http://localhost:4848/api/scheduled-reports/process \
  -H "x-cron-secret: your-secret-token" \
  -H "Content-Type: application/json"

# Check response
{
  "success": true,
  "processed": 1,
  "successful": 1,
  "results": [...]
}
```

### Test with Immediate Schedule

For testing, create a schedule with `next_run_at` set to now:

```sql
-- Update a schedule to run immediately
UPDATE scheduled_reports
SET next_run_at = NOW()
WHERE id = 'your-schedule-id';
```

Then call the processor and check execution results.

## Performance Considerations

### Frequency Recommendations

- **Daily**: For high-volume clients or real-time monitoring
- **Weekly**: Standard frequency for most clients
- **Monthly**: For summary reports and client reviews
- **Quarterly**: For executive summaries and strategic planning

### Cron Frequency

- **Every hour**: Recommended for most setups
  - Catches schedules within 1 hour of due time
  - Reasonable resource usage

- **Every 15 minutes**: For time-sensitive reports
  - More precise execution timing
  - Higher resource usage

- **Every 6 hours**: For low-frequency needs
  - Reduced resource usage
  - Acceptable for monthly/quarterly reports only

### Scaling Considerations

For high-volume scenarios (100+ schedules):

1. **Batch Processing**:
   - Process in batches of 10-20 at a time
   - Add pagination to processor endpoint

2. **Queue System**:
   - Move to background job queue (Bull, BullMQ)
   - Process schedules asynchronously

3. **Database Optimization**:
   - Ensure indexes are in place (already created in migration)
   - Monitor query performance

4. **Rate Limiting**:
   - Respect email service rate limits
   - Add delays between email sends if needed

## Security

### Authentication

The processor endpoint uses two authentication methods:

1. **Cron Secret** (recommended):
   - Custom header: `x-cron-secret`
   - Shared secret between cron job and API

2. **Service Role** (alternative):
   - Supabase service role token
   - Authorization header with Bearer token

### RLS Policies

All database operations respect Row Level Security:
- Users can only view/manage their own schedules
- Service role can access all schedules (for processing)
- Execution records linked to schedule permissions

## Maintenance

### Cleanup Old Executions

Archive or delete old execution records to keep the table manageable:

```sql
-- Archive executions older than 90 days
DELETE FROM scheduled_report_executions
WHERE started_at < NOW() - INTERVAL '90 days'
  AND execution_status = 'completed';
```

### Pause All Schedules

For maintenance or debugging:

```sql
UPDATE scheduled_reports
SET is_active = false
WHERE is_active = true;
```

### Resume All Schedules

```sql
UPDATE scheduled_reports
SET is_active = true
WHERE is_active = false;
```

## Features

### ✅ Implemented

- Schedule creation and management
- Daily, weekly, monthly, quarterly frequencies
- Email report delivery
- Execution history tracking
- Pause/resume schedules
- Multiple recipients
- Flexible report periods
- Error handling and logging
- RLS security

### 🔄 Future Enhancements

- PDF attachment support (include_pdf_attachment flag exists but not implemented)
- Slack/Discord webhooks
- Custom templates per schedule
- A/B testing different report formats
- Client-specific branding
- Advanced filtering (batch-specific, tag-based)
- Notification preferences
- Execution retry logic
- Schedule cloning

## Summary

The scheduled reports system automates periodic SEO performance reporting by:

1. Storing recurring schedule configurations in the database
2. Running a cron job to check for due schedules
3. Generating reports using existing report generation logic
4. Sending emails to specified recipients
5. Tracking execution history and status
6. Automatically calculating next run times

This enables vendors to set up automated client reporting with minimal manual intervention while maintaining full control over report content, frequency, and recipients.
