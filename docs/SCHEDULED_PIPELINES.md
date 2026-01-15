# Scheduled Pipeline Runs

This feature enables automated, recurring website analysis pipeline runs on a configurable schedule.

## Features

- **Flexible Scheduling**: Daily, Weekly, Biweekly, or Monthly execution
- **Full Pipeline Context**: Supports all pipeline parameters (target market, client goals, ICP)
- **Active/Pause Toggle**: Enable or disable schedules without deleting them
- **Execution Tracking**: Monitor total runs, successful runs, and failures
- **Next Run Prediction**: Automatically calculates and displays next execution time

## Database Schema

### scheduled_pipeline_runs Table

```sql
CREATE TABLE scheduled_pipeline_runs (
    id UUID PRIMARY KEY,
    vendor_id UUID REFERENCES vendors(id),
    client_id UUID REFERENCES clients(id),

    -- Configuration
    name TEXT NOT NULL,
    website_url TEXT NOT NULL,
    target_market TEXT,
    client_goals TEXT,
    ideal_customer_profile TEXT,

    -- Schedule
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
    time_of_day TIME DEFAULT '09:00:00',

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    last_job_id UUID REFERENCES pipeline_jobs(id),

    -- Stats
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### GET /api/scheduled-pipelines
List all scheduled pipeline runs for the authenticated vendor.

**Query Parameters:**
- `is_active` (optional): Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "schedules": [...]
}
```

### POST /api/scheduled-pipelines
Create a new scheduled pipeline run.

**Request Body:**
```json
{
  "name": "Weekly SEO Check - Acme Corp",
  "website_url": "https://example.com",
  "client_id": "uuid" (optional),
  "frequency": "weekly",
  "day_of_week": 1,
  "time_of_day": "09:00"
}
```

### PATCH /api/scheduled-pipelines/[scheduleId]
Update an existing schedule.

### DELETE /api/scheduled-pipelines/[scheduleId]
Delete a schedule.

### POST /api/scheduled-pipelines/execute
Execute all due scheduled pipelines (called by cron job).

**Authorization:** Requires `CRON_SECRET` in authorization header or authenticated user.

## Cron Job Setup

### Option 1: Vercel Cron Jobs (Recommended for Vercel Deployments)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/scheduled-pipelines/execute",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option 2: External Cron Service (cron-job.org, EasyCron, etc.)

Configure a cron job to call:

```bash
curl -X POST https://your-domain.com/api/scheduled-pipelines/execute \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Recommended Schedule:** Every 5-15 minutes

### Option 3: System Cron (Self-Hosted)

Add to crontab:

```bash
*/5 * * * * curl -X POST https://your-domain.com/api/scheduled-pipelines/execute -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Environment Variables

Add to `.env.local`:

```env
CRON_SECRET=your-random-secret-here
```

Generate a secure secret:

```bash
openssl rand -base64 32
```

## How It Works

1. **User Creates Schedule**: Via Pipeline page UI, users configure:
   - Schedule name and website URL
   - Frequency (daily, weekly, biweekly, monthly)
   - Execution time (in UTC)
   - Optional: Client, target market, goals, ICP

2. **Next Run Calculation**: Database trigger automatically calculates `next_run_at` based on:
   - Frequency type
   - Day of week/month (if applicable)
   - Time of day
   - Last run timestamp

3. **Cron Execution**: Every 5-15 minutes, the cron job:
   - Calls `/api/scheduled-pipelines/execute`
   - Finds schedules where `next_run_at <= NOW()` and `is_active = true`
   - Creates new pipeline jobs for each due schedule
   - Updates schedule stats (total_runs, successful_runs, etc.)
   - Recalculates next_run_at

4. **Pipeline Processing**: Normal pipeline execution:
   - Job is created with status 'pending'
   - Pipeline workers process the job
   - Results stored in pipeline_jobs table

## UI Features

### Schedule List View
- Shows all schedules with active/paused status
- Displays frequency, next run time, and run statistics
- Quick actions: Edit, Pause/Activate, Delete

### Create/Edit Modal
- Form fields for all schedule configuration
- Conditional fields based on frequency:
  - Weekly/Biweekly: Day of week selector
  - Monthly: Day of month input
- Collapsible "Additional Context" section for optional fields

### Active Status Toggle
- Pause schedules without deleting them
- Paused schedules remain in the list but won't execute

## Next Run Time Calculation

The `calculate_next_run_time()` database function handles smart scheduling:

- **Daily**: Next occurrence of specified time
- **Weekly**: Next occurrence of specified day + time
- **Biweekly**: Every 2 weeks on specified day + time
- **Monthly**: Specified day of month + time (handles month-end gracefully)

## Migration

Apply the migration:

```bash
# Using Supabase CLI
npx supabase db push

# Or apply manually
psql -d your_database < supabase/migrations/20260115200000_scheduled_pipeline_runs.sql
```

## Testing

### Manual Trigger

You can manually trigger the execution endpoint for testing:

```bash
# With CRON_SECRET
curl -X POST http://localhost:4848/api/scheduled-pipelines/execute \
  -H "Authorization: Bearer your-cron-secret"

# Or authenticate as a user
# (visit /api/scheduled-pipelines/execute in browser while logged in)
```

### Create Test Schedule

1. Go to Pipeline page → Scheduled tab
2. Click "New Schedule"
3. Fill in:
   - Name: "Test Schedule"
   - URL: "https://example.com"
   - Frequency: "Daily"
   - Time: (current time + 2 minutes in UTC)
4. Save and wait for execution

### Verify Execution

- Check Pipeline → History tab for new jobs
- Check scheduled pipeline's "Total Runs" count
- Verify `last_run_at` and `next_run_at` timestamps

## Troubleshooting

### Schedules Not Executing

1. **Check cron job is running**: Verify logs/monitoring
2. **Check CRON_SECRET**: Ensure it matches in cron config and `.env`
3. **Check next_run_at**: Should be in the past for overdue schedules
4. **Check is_active**: Should be `true`
5. **Check database connection**: Ensure Supabase is accessible

### Incorrect Next Run Time

- **Verify timezone**: All times are in UTC
- **Check database function**: Ensure `calculate_next_run_time()` is installed
- **Inspect triggers**: Ensure `auto_set_next_run_at_trigger` is active

### Failed Runs

- Check `pipeline_jobs` table for error messages
- Review `failed_runs` count in schedule
- Check API logs for execution errors

## Future Enhancements

- Email notifications on schedule execution
- Webhook callbacks on completion
- Schedule templates for common patterns
- Execution history view per schedule
- Pause schedules on repeated failures
- Time zone support (currently UTC only)
