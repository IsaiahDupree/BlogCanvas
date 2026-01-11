# Analytics Cron Job Setup

## Overview

The BlogCanvas analytics system collects performance metrics for published blog posts through scheduled "check-backs" at specific intervals after publication (1 day, 7 days, 30 days, 90 days, and 180 days).

The check-back processing requires a cron job to run periodically and process any due check-backs.

## API Endpoint

**Endpoint:** `POST /api/check-backs/process`

**What it does:**
- Fetches all due check-backs from the database
- Processes each check-back by collecting metrics from Google Search Console
- Saves metrics to the `blog_post_metrics` table
- Marks check-backs as completed or failed

**Response:**
```json
{
  "success": true,
  "processed": 5,
  "failed": 1
}
```

## Setup Options

### Option 1: Vercel Cron (Recommended for Vercel deployments)

Add a `vercel.json` file to the project root:

```json
{
  "crons": [
    {
      "path": "/api/check-backs/process",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Schedule:** `0 9 * * *` = Daily at 9:00 AM UTC

### Option 2: External Cron Service

Use an external service like:
- **Cron-Job.org** (https://cron-job.org)
- **EasyCron** (https://www.easycron.com)
- **GitHub Actions** (using scheduled workflows)

**Configuration:**
- **URL:** `https://your-domain.com/api/check-backs/process`
- **Method:** POST
- **Schedule:** Daily (recommended: once per day)
- **Headers:** None required (authentication handled by endpoint)

### Option 3: GitHub Actions

Create `.github/workflows/analytics-checkback.yml`:

```yaml
name: Analytics Check-Back Processing
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9:00 AM UTC
  workflow_dispatch:  # Allow manual triggers

jobs:
  process-checkbacks:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Check-Back Processing
        run: |
          curl -X POST https://your-domain.com/api/check-backs/process
```

### Option 4: Server-Side Cron (VPS/Dedicated Server)

If self-hosting, add to your server's crontab:

```bash
# Open crontab editor
crontab -e

# Add this line (runs daily at 9:00 AM)
0 9 * * * curl -X POST https://your-domain.com/api/check-backs/process
```

## Recommended Schedule

**Daily execution is recommended** because:
- Check-backs are scheduled at specific intervals (1, 7, 30, 90, 180 days)
- Running daily ensures timely processing when check-backs become due
- The endpoint only processes due check-backs, so extra runs are harmless
- Daily runs provide better reliability (retry failed check-backs next day)

## Monitoring

To monitor check-back status, you can:

1. **Check pending check-backs:**
   ```bash
   GET /api/check-backs/process
   ```
   Returns list of due check-backs without processing them.

2. **View metrics in the dashboard:**
   - Navigate to `/app/analytics`
   - View individual post metrics at `/app/posts/[postId]`

3. **Database queries:**
   ```sql
   -- Check pending check-backs
   SELECT * FROM check_back_schedules WHERE status = 'pending' AND due_date <= NOW();

   -- Check recent metrics collection
   SELECT * FROM blog_post_metrics ORDER BY snapshot_date DESC LIMIT 10;
   ```

## Google Search Console Setup

For production use, you need to configure Google Search Console API access:

1. **Create a Google Cloud Project**
2. **Enable the Google Search Console API**
3. **Create OAuth 2.0 credentials**
4. **Generate a refresh token**

**Environment Variables:**
```env
GOOGLE_SEARCH_CONSOLE_CLIENT_ID=your-client-id
GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET=your-client-secret
GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN=your-refresh-token
```

**Note:** Without these credentials, the system uses mock data for development/testing.

## Testing

To manually trigger check-back processing:

```bash
curl -X POST http://localhost:4848/api/check-backs/process
```

Or use the Vercel deployment:

```bash
curl -X POST https://your-domain.vercel.app/api/check-backs/process
```

## Troubleshooting

### Check-backs not processing
- Verify the cron job is running (check service logs)
- Test the endpoint manually with curl
- Check database for pending check-backs: `SELECT * FROM check_back_schedules WHERE status = 'pending'`

### Metrics not appearing
- Ensure Google Search Console is configured (or mock data is enabled)
- Check for errors in the endpoint logs
- Verify posts are actually published (status = 'published')

### Failed check-backs
- Check the `check_back_schedules` table for `status = 'failed'`
- Review error logs for the specific failure
- Failed check-backs can be retried by updating status to 'pending'

## Architecture

```
Published Post
    ↓
WordPress Publisher
    ↓
Schedule Check-Backs (1d, 7d, 30d, 90d, 180d)
    ↓
Cron Job (Daily) → Process Due Check-Backs
    ↓
Collect Metrics from GSC
    ↓
Save to blog_post_metrics
    ↓
Display in Analytics Dashboard
```

## Support

For issues or questions:
- Review the analytics collector code: `src/lib/analytics/analytics-collector.ts`
- Check the check-back scheduler: `src/lib/analytics/check-back-scheduler.ts`
- Inspect API endpoint: `src/app/api/check-backs/process/route.ts`
