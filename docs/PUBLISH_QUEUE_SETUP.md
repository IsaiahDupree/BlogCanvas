# Publish Queue System Setup Guide

## Overview

The Publish Queue System enables scheduled batch publishing of blog posts to WordPress with automatic retry logic, priority queuing, and comprehensive monitoring.

## Features

- **Scheduled Publishing**: Queue posts for future publishing dates
- **Batch Operations**: Publish multiple posts with optional staggering
- **Automatic Retry**: Failed publishes retry with exponential backoff (5min, 15min, 60min)
- **Priority Queue**: Posts processed by priority (1-10) and scheduled time
- **Calendar View**: Visual calendar showing all scheduled publishes
- **Status Dashboard**: Real-time monitoring of publish queue and status

## Database Schema

### publish_queue Table

Main table storing queued publish jobs:

```sql
- id: UUID (primary key)
- blog_post_id: UUID (foreign key to blog_posts)
- content_batch_id: UUID (optional, foreign key to content_batches)
- client_id: UUID (foreign key to clients)
- cms_connection_id: UUID (foreign key to cms_connections)
- website_url: TEXT
- publish_status: TEXT (draft/publish/pending/future)
- scheduled_for: TIMESTAMPTZ (when to publish)
- priority: INT (1-10, 1 = highest)
- status: TEXT (pending/processing/completed/failed/cancelled)
- attempts: INT (retry counter)
- max_attempts: INT (default 3)
- next_retry_at: TIMESTAMPTZ (exponential backoff)
- wordpress_post_id: TEXT (result from WordPress)
- published_url: TEXT
- error_message: TEXT
```

### Helper Views

- **publish_calendar**: Quick overview of scheduled publishes
- **publish_queue_stats**: Aggregated statistics per batch/client

### Database Functions

- `queue_post_for_publish()`: Queue a single post
- `get_pending_publish_jobs()`: Fetch pending jobs for cron
- `get_retry_publish_jobs()`: Fetch failed jobs ready for retry
- `calculate_next_retry()`: Exponential backoff calculation

## API Endpoints

### Queue Management

#### POST /api/publish-queue/queue
Queue posts for publishing.

**Single Post:**
```json
{
  "postId": "uuid",
  "scheduledFor": "2026-01-15T14:00:00Z",
  "priority": 5,
  "publishStatus": "publish"
}
```

**Batch of Posts:**
```json
{
  "postIds": ["uuid1", "uuid2", "uuid3"],
  "scheduledFor": "2026-01-15T14:00:00Z",
  "priority": 5,
  "staggerMinutes": 15
}
```

#### GET /api/publish-queue/stats
Get queue statistics.

**Query params:**
- `clientId` (optional): Filter by client
- `batchId` (optional): Filter by batch

**Response:**
```json
{
  "total": 50,
  "pending": 20,
  "processing": 2,
  "completed": 25,
  "failed": 3,
  "cancelled": 0
}
```

#### GET /api/publish-queue/schedule
Get scheduled publishes for calendar view.

**Query params:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `clientId` (optional): Filter by client
- `limit` (optional): Max results

#### PATCH /api/publish-queue/[jobId]
Retry a failed job.

**Body:**
```json
{
  "action": "retry"
}
```

#### DELETE /api/publish-queue/[jobId]
Cancel a pending or failed job.

### Cron Processor

#### POST /api/publish-queue/process
Process pending and retry jobs (called by cron).

**Headers:**
```
Authorization: Bearer <CRON_SECRET>
```

**Body (optional):**
```json
{
  "limit": 10,
  "includeRetries": true
}
```

**Response:**
```json
{
  "success": true,
  "total": 8,
  "succeeded": 7,
  "failed": 1,
  "errors": [
    { "jobId": "uuid", "error": "Connection timeout" }
  ],
  "timestamp": "2026-01-12T10:30:00Z"
}
```

## Environment Variables

Add to `.env.local`:

```bash
# Cron authentication secret
CRON_SECRET=your-secure-random-secret

# Supabase (required for queue processing)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# WordPress credentials stored in cms_connections table
```

## Cron Setup

The queue processor should run every 5 minutes. Choose one option:

### Option 1: Vercel Cron (Recommended for Production)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/publish-queue/process",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Set `CRON_SECRET` in Vercel environment variables.

### Option 2: GitHub Actions

Create `.github/workflows/publish-queue-processor.yml`:

```yaml
name: Publish Queue Processor

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  process-queue:
    runs-on: ubuntu-latest
    steps:
      - name: Process Publish Queue
        run: |
          curl -X POST https://your-domain.com/api/publish-queue/process \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            -d '{"limit": 10}'
```

### Option 3: External Cron Service (cron-job.org, EasyCron, etc.)

Configure a cron job to hit:
- URL: `https://your-domain.com/api/publish-queue/process`
- Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- Schedule: Every 5 minutes (`*/5 * * * *`)

### Option 4: Server Cron (Linux/Mac)

Add to crontab (`crontab -e`):

```bash
*/5 * * * * curl -X POST https://your-domain.com/api/publish-queue/process \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  >> /var/log/publish-queue.log 2>&1
```

## Usage Examples

### Queue a Single Post

```typescript
const response = await fetch('/api/publish-queue/queue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    postId: 'blog-post-uuid',
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    priority: 5
  })
})

const data = await response.json()
console.log(data.queueId)
```

### Queue a Batch with Staggering

```typescript
const response = await fetch('/api/publish-queue/queue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    postIds: ['uuid1', 'uuid2', 'uuid3', 'uuid4', 'uuid5'],
    scheduledFor: new Date('2026-01-15T09:00:00Z').toISOString(),
    priority: 5,
    staggerMinutes: 30, // Posts publish 30 minutes apart
    publishStatus: 'publish'
  })
})

const data = await response.json()
console.log(`Queued ${data.queued} of ${data.total} posts`)
```

### Get Queue Stats

```typescript
const response = await fetch('/api/publish-queue/stats?batchId=batch-uuid')
const stats = await response.json()

console.log(`Pending: ${stats.pending}, Failed: ${stats.failed}`)
```

### Retry a Failed Job

```typescript
const response = await fetch(`/api/publish-queue/${jobId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'retry' })
})

const data = await response.json()
console.log(data.message)
```

## Retry Logic

Failed publishes automatically retry with exponential backoff:

1. **First retry**: 5 minutes after failure
2. **Second retry**: 15 minutes after failure
3. **Third retry**: 60 minutes after failure
4. **After 3 attempts**: Job marked as permanently failed, no more auto-retries

Manual retry resets the job to pending status and clears retry timer.

## Dashboard Usage

### List View
1. Navigate to `/app/publishing`
2. View all posts with their publish status
3. Filter by: All, Published, Scheduled, Failed
4. Click "Retry" on failed posts to requeue

### Calendar View
1. Click "Calendar View" tab
2. See scheduled publishes grouped by date
3. View scheduled time, status, priority for each job
4. Retry failed jobs or cancel pending jobs

### Statistics
Monitor queue health with real-time stats:
- **Queue Pending**: Jobs waiting to be processed
- **Processing**: Jobs currently publishing
- **Queue Failed**: Jobs that failed (manual retry available)
- **Queue Completed**: Successfully published jobs

## Monitoring & Debugging

### Check Queue Status

```sql
-- View all pending jobs
SELECT * FROM publish_queue WHERE status = 'pending' ORDER BY scheduled_for;

-- View failed jobs with retry schedule
SELECT id, blog_post_id, attempts, max_attempts, next_retry_at, error_message
FROM publish_queue
WHERE status = 'failed' AND attempts < max_attempts;

-- View queue stats
SELECT * FROM publish_queue_stats;
```

### Manual Queue Processing (Testing)

```bash
# Trigger queue processor manually
curl -X POST http://localhost:4848/api/publish-queue/process \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'
```

### Logs

Check application logs for:
- `[Publish Queue Processor]` - Cron execution logs
- `[Queue API]` - Queue management API logs
- WordPress publishing errors with full stack traces

## Security

- **RLS Policies**: Vendors can only access their clients' queue jobs
- **Cron Authentication**: Bearer token required (CRON_SECRET)
- **CMS Credentials**: Stored encrypted in cms_connections table
- **Service Role**: Queue processor uses service role to bypass RLS

## Troubleshooting

### Jobs not processing
1. Verify cron is configured and running
2. Check `CRON_SECRET` is set correctly
3. Check dev server logs for errors
4. Manually trigger: `POST /api/publish-queue/process`

### High failure rate
1. Check WordPress connection (cms_connections table)
2. Verify WordPress REST API is accessible
3. Check Application Password is valid
4. Review error_message in failed jobs

### Jobs stuck in "processing"
1. This can happen if processor crashes mid-publish
2. Manually reset: `UPDATE publish_queue SET status = 'pending' WHERE status = 'processing'`

### Retry not working
1. Verify `next_retry_at` is set
2. Check `attempts < max_attempts`
3. Ensure cron is running and includeRetries = true

## Performance Considerations

- **Rate Limiting**: 1 second delay between sequential publishes
- **Batch Size**: Default 10 jobs per cron run (configurable)
- **Priority Queue**: Higher priority (lower number) jobs processed first
- **Staggering**: Spreads load when publishing many posts at once

## Migration

Apply the migration to enable the publish queue system:

```bash
npx supabase db push
```

Or manually run:
```bash
psql -h your-host -U postgres -d postgres -f supabase/migrations/20260112000008_publish_queue_system.sql
```

## Related Documentation

- `PRD_COMPLETE.md` - Epic 5: CMS Publishing
- `/src/lib/wordpress/publisher.ts` - WordPress publishing library
- `/docs/TRANSACTIONAL_EMAIL_SETUP.md` - Similar queue system for emails
