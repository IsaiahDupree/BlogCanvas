# Feature Test Plan: feat-023 - Batch Publishing and Scheduling

## Feature Description
Batch publishing and scheduling system with calendar view, retry logic, and queue management.

## Acceptance Criteria

### 1. Multiple posts can be scheduled
**Test Steps:**
- [ ] Navigate to http://localhost:4848/app/publishing
- [ ] Verify page loads without errors
- [ ] Check that "Calendar View" tab exists
- [ ] Verify queue stats are displayed (Queue Pending, Processing, Queue Failed, Queue Completed)

### 2. Calendar shows scheduled posts
**Test Steps:**
- [ ] Click on "Calendar View" tab
- [ ] Verify scheduled publishes are grouped by date
- [ ] Verify each entry shows: time, post ID, status badge, priority
- [ ] Verify client name is displayed (if available)
- [ ] Verify error messages shown for failed jobs

### 3. Failed publishes retry automatically
**Test Steps:**
- [ ] Check that publish_queue table has retry logic (max_attempts = 3)
- [ ] Verify next_retry_at is calculated with exponential backoff (5min, 15min, 60min)
- [ ] Verify cron endpoint exists at /api/publish-queue/process
- [ ] Verify failed jobs can be manually retried via "Retry" button

### 4. Dashboard shows publish status
**Test Steps:**
- [ ] Verify "List View" tab shows published posts
- [ ] Verify stats cards display: Total, Published, Scheduled, Failed, Draft counts
- [ ] Verify queue stats cards display: Queue Pending, Processing, Queue Failed, Queue Completed
- [ ] Verify filter buttons work (All, Published, Scheduled, Failed)
- [ ] Verify "Retry" button appears for failed posts
- [ ] Verify "Cancel" button appears for pending scheduled jobs

## Implementation Files Created

### Database
- [x] `/supabase/migrations/20260112000008_publish_queue_system.sql`
  - publish_queue table with retry logic
  - Views: publish_calendar, publish_queue_stats
  - Triggers for status updates
  - Helper functions for queue processing

### Backend Services
- [x] `/src/lib/publishing/publish-queue-service.ts`
  - queuePostForPublish()
  - queueBatchForPublish()
  - processPendingPublishJobs()
  - getQueueStats()
  - getScheduledPublishes()
  - Retry and cancel functions

### API Endpoints
- [x] `/src/app/api/publish-queue/process/route.ts` - Cron processor
- [x] `/src/app/api/publish-queue/queue/route.ts` - Queue posts for publishing
- [x] `/src/app/api/publish-queue/stats/route.ts` - Get queue statistics
- [x] `/src/app/api/publish-queue/schedule/route.ts` - Get scheduled publishes
- [x] `/src/app/api/publish-queue/[jobId]/route.ts` - Retry/cancel jobs

### Frontend UI
- [x] `/src/app/app/publishing/page.tsx` - Enhanced with:
  - Calendar view tab
  - Queue statistics cards
  - Scheduled publishes grouped by date
  - Retry and cancel buttons
  - Real-time status updates

## Automated Testing with Puppeteer

The following tests should be run using browser automation:

1. **Page Load Test**: Verify publishing dashboard loads
2. **Tab Navigation Test**: Switch between List and Calendar views
3. **Stats Display Test**: Verify all stat cards render correctly
4. **Calendar View Test**: Verify scheduled posts display grouped by date
5. **Button Interaction Test**: Test Retry and Cancel buttons

## Manual Verification Steps

1. Start dev server: `npm run dev`
2. Navigate to http://localhost:4848/app/publishing
3. Verify page loads without TypeScript errors
4. Check both List and Calendar views render
5. Verify stats cards show correct data structure
6. Test filter buttons
7. Test tab switching

## Notes

- Migration needs to be applied: `npx supabase db push` (when connected)
- Cron job needs CRON_SECRET environment variable
- Queue processor should run every 5 minutes
- Retry logic uses exponential backoff
- All endpoints have proper authentication
- RLS policies protect publish queue data
