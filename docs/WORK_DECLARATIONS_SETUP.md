# Work Declarations System - Setup Guide

## Overview

The Work Declarations system provides transparency between vendors and clients in BlogCanvas. Vendors can declare work items with clear descriptions, timelines, milestones, and progress tracking. Clients can view all declared work in their portal and receive email notifications about status changes.

**Feature ID**: feat-016
**Epic**: Project Transparency
**Dependencies**: feat-013 (Transactional Email System), feat-014 (Vendor Onboarding), feat-015 (Client Onboarding)

## Features

- **Work Declaration Creation**: Vendors can declare work items for clients with detailed descriptions
- **Progress Tracking**: Track progress with percentage completion, milestones, and deliverables
- **Status Workflow**: Planned → In Progress → Review → Completed (with On Hold and Cancelled states)
- **Client Portal View**: Clients see all work declarations with real-time progress
- **Email Notifications**: Automatic emails when work is declared, status changes, or completed
- **Activity Timeline**: Track all updates and comments on work declarations
- **Filtering**: Filter by status, type, priority, and client
- **Automatic Tracking**: Database triggers automatically log status and progress changes

## Database Tables

### `work_declarations`
Stores work items declared by vendors for clients.

**Columns**:
- `id` - UUID primary key
- `vendor_id` - Reference to vendors table
- `client_id` - Reference to clients table
- `content_batch_id` - Optional reference to content batches
- `created_by` - User who created the declaration
- `title` - Work item title
- `description` - Detailed description
- `type` - Work type: content_batch, seo_audit, publishing, analytics, reporting, custom
- `status` - Current status: planned, in_progress, review, completed, on_hold, cancelled
- `priority` - Priority level: low, medium, high, urgent
- `start_date` - Start date
- `due_date` - Due date
- `completed_at` - Auto-set when status becomes completed
- `progress_percentage` - 0-100 completion percentage
- `milestones` - JSONB array of milestones with completion status
- `deliverables` - JSONB array of deliverables with URLs
- `metadata` - JSONB for custom fields
- `notes` - Internal notes

### `work_declaration_updates`
Tracks all activity on work declarations.

**Columns**:
- `id` - UUID primary key
- `work_declaration_id` - Reference to work declaration
- `created_by` - User who created the update
- `update_type` - Type: status_change, progress_update, milestone_complete, deliverable_added, comment, due_date_change
- `old_value` - Previous value
- `new_value` - New value
- `comment` - Optional comment text
- `metadata` - JSONB for additional data

## Database Functions

### `get_client_work_progress(p_client_id UUID)`
Calculates overall work progress statistics for a client.

**Returns**:
- `total_declarations` - Total work items
- `planned_count` - Items in planned status
- `in_progress_count` - Items in progress
- `completed_count` - Completed items
- `on_hold_count` - On hold items
- `cancelled_count` - Cancelled items
- `avg_progress` - Average progress percentage

### `auto_set_completed_at()`
Trigger function that automatically sets `completed_at` when status changes to completed, and clears it when changed from completed.

### `track_work_declaration_changes()`
Trigger function that automatically creates update records when:
- Status changes
- Progress changes by more than 5%
- Due date changes

## Setup Instructions

### 1. Apply Database Migrations

```bash
# If using Supabase CLI (local development):
npx supabase db push

# Or apply migrations manually in Supabase Dashboard SQL Editor:
# Run the following migration files in order:
# 1. supabase/migrations/20260112000001_work_declarations.sql
# 2. supabase/migrations/20260112000002_work_declaration_email_templates.sql
```

### 2. Configure Environment Variables

Add to `.env.local`:

```bash
# Application URL for email links
NEXT_PUBLIC_APP_URL=http://localhost:4848  # Production: https://your-domain.com
```

### 3. Verify Transactional Email System

Ensure the transactional email system (feat-013) is configured:

```bash
# Required environment variables:
RESEND_API_KEY=re_your_api_key_here
CRON_SECRET=your_random_secret_here
```

### 4. Set up Email Queue Processor

The work declaration system queues emails using the transactional email system. Ensure you have a cron job processing the email queue:

**Vercel Cron** (vercel.json):
```json
{
  "crons": [
    {
      "path": "/api/emails/queue/process",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

See `docs/TRANSACTIONAL_EMAIL_SETUP.md` for detailed cron setup instructions.

## API Endpoints

### Vendor Endpoints

#### `GET /api/work-declarations`
List work declarations with filtering.

**Query Parameters**:
- `clientId` - Filter by client ID
- `status` - Filter by status
- `type` - Filter by type
- `limit` - Number of records (default: 50)
- `offset` - Pagination offset (default: 0)

**Response**:
```json
{
  "declarations": [
    {
      "id": "uuid",
      "title": "Q1 Content Batch - 10 Blog Posts",
      "description": "...",
      "type": "content_batch",
      "status": "in_progress",
      "priority": "high",
      "progress_percentage": 60,
      "client": { "id": "uuid", "name": "Acme Corp" },
      "vendor": { "id": "uuid", "name": "Content Agency" }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0
  }
}
```

#### `POST /api/work-declarations`
Create a new work declaration.

**Request Body**:
```json
{
  "client_id": "uuid",
  "title": "Q1 Content Batch - 10 Blog Posts",
  "description": "Create 10 SEO-optimized blog posts for Q1 campaign",
  "type": "content_batch",
  "status": "planned",
  "priority": "high",
  "start_date": "2026-01-15",
  "due_date": "2026-03-31",
  "notes": "Focus on long-tail keywords",
  "milestones": [
    {
      "title": "Research and outlines completed",
      "completed": false,
      "completed_at": null
    },
    {
      "title": "All posts drafted",
      "completed": false,
      "completed_at": null
    }
  ],
  "deliverables": [
    {
      "name": "10 Blog Posts",
      "description": "SEO-optimized articles",
      "status": "pending",
      "url": null
    }
  ]
}
```

**Response**:
```json
{
  "declaration": {
    "id": "uuid",
    "title": "Q1 Content Batch - 10 Blog Posts",
    ...
  }
}
```

**Side Effects**:
- Sends "work_declared" email to client
- Email is queued for delivery within 5 minutes

#### `GET /api/work-declarations/[id]`
Get a single work declaration with full details and update history.

**Response**:
```json
{
  "declaration": {
    "id": "uuid",
    "title": "...",
    "client": { "name": "Acme Corp", "email": "..." },
    "vendor": { "name": "Content Agency" }
  },
  "updates": [
    {
      "id": "uuid",
      "update_type": "status_change",
      "old_value": "planned",
      "new_value": "in_progress",
      "created_at": "2026-01-15T10:00:00Z",
      "created_by_user": { "full_name": "John Doe" }
    }
  ]
}
```

#### `PATCH /api/work-declarations/[id]`
Update a work declaration.

**Request Body** (all fields optional):
```json
{
  "title": "Updated title",
  "status": "in_progress",
  "progress_percentage": 75,
  "notes": "Making good progress"
}
```

**Side Effects**:
- If status changes to "completed": Sends "work_completed" email
- If status changes (but not to completed): Sends "work_status_changed" email
- Database triggers create update records automatically

#### `DELETE /api/work-declarations/[id]`
Delete a work declaration.

**Response**:
```json
{
  "success": true
}
```

#### `POST /api/work-declarations/[id]/updates`
Add a comment or manual update to a work declaration.

**Request Body**:
```json
{
  "update_type": "comment",
  "comment": "Client requested deadline extension"
}
```

### Client Portal Endpoints

#### `GET /api/portal/work-declarations`
Get work declarations for the current client (client portal view).

**Query Parameters**:
- `status` - Filter by status
- `type` - Filter by type

**Response**:
```json
{
  "declarations": [
    {
      "id": "uuid",
      "title": "Q1 Content Batch",
      "vendor": {
        "name": "Content Agency",
        "logo_url": "...",
        "brand_colors": { "primary": "#667eea" }
      }
    }
  ],
  "stats": {
    "total_declarations": 10,
    "planned_count": 2,
    "in_progress_count": 5,
    "completed_count": 3,
    "avg_progress": 65.5
  }
}
```

## Email Templates

The system uses three email templates (created by migration):

### 1. `work_declared`
Sent when vendor creates a new work declaration.

**Variables**:
- `client_name` - Client's name
- `vendor_name` - Vendor's name
- `work_title` - Work item title
- `work_description` - Description
- `work_type` - Type (formatted)
- `work_priority` - Priority level
- `due_date` - Due date (formatted, optional)
- `portal_url` - Link to client portal

### 2. `work_status_changed`
Sent when work declaration status changes (excluding to completed).

**Variables**:
- `client_name`
- `vendor_name`
- `work_title`
- `old_status` - Previous status (formatted)
- `new_status` - New status (formatted)
- `portal_url`
- `progress_percentage` - Current progress (optional)
- `update_comment` - Comment about the change (optional)

### 3. `work_completed`
Sent when work declaration is marked as completed.

**Variables**:
- `client_name`
- `vendor_name`
- `work_title`
- `portal_url`
- `completion_message` - Final message (optional)
- `deliverables_count` - Number of deliverables

## Usage Guide

### For Vendors

#### Creating a Work Declaration

1. Navigate to `/app/work-declarations`
2. Click "Declare Work" button
3. Fill out the form:
   - Select client
   - Enter title and description
   - Choose type (content_batch, seo_audit, publishing, etc.)
   - Set priority (low, medium, high, urgent)
   - Optional: Set start and due dates
   - Optional: Add milestones and deliverables
4. Click "Create Declaration"
5. Client receives email notification automatically

#### Updating Progress

1. Click on a work declaration card
2. Click "Edit" button
3. Update progress percentage using the slider
4. Change status if needed
5. Add notes about the progress
6. Click "Save Changes"
7. If status changed, client receives email notification

#### Adding Comments/Updates

1. On the work declaration detail page
2. Scroll to "Activity Timeline"
3. Type comment in the text area
4. Click "Add Comment"
5. Comment appears in the activity feed

### For Clients

#### Viewing Work Declarations

1. Log in to client portal
2. Navigate to "Your Declared Work" (or `/portal/work`)
3. View dashboard with statistics:
   - Total projects
   - In progress count
   - Completed count
   - Average progress
4. Browse work declarations with progress bars
5. Filter by status or type as needed

#### Understanding Work Items

Each work declaration card shows:
- Title and description
- Type badge (Content Batch, SEO Audit, etc.)
- Status badge (Planned, In Progress, etc.)
- Priority badge
- Progress bar with percentage
- Timeline (start date, due date)
- Assigned team member
- Milestones with checkmarks
- Deliverables with links

## Monitoring

### Check Work Declarations

```sql
-- View all work declarations with client and vendor info
SELECT
  wd.id,
  wd.title,
  wd.status,
  wd.progress_percentage,
  c.name AS client_name,
  v.name AS vendor_name,
  wd.created_at,
  wd.due_date
FROM work_declarations wd
JOIN clients c ON wd.client_id = c.id
JOIN vendors v ON wd.vendor_id = v.id
ORDER BY wd.created_at DESC
LIMIT 20;
```

### Check Work Progress by Client

```sql
-- Get progress statistics for a specific client
SELECT * FROM get_client_work_progress('client-uuid-here');
```

### View Recent Updates

```sql
-- View recent activity on work declarations
SELECT
  wdu.id,
  wd.title AS work_title,
  wdu.update_type,
  wdu.old_value,
  wdu.new_value,
  wdu.comment,
  p.full_name AS updated_by,
  wdu.created_at
FROM work_declaration_updates wdu
JOIN work_declarations wd ON wdu.work_declaration_id = wd.id
JOIN profiles p ON wdu.created_by = p.id
ORDER BY wdu.created_at DESC
LIMIT 50;
```

### Monitor Email Queue

```sql
-- Check queued work declaration emails
SELECT
  eq.id,
  eq.template_name,
  eq.to_email,
  eq.status,
  eq.scheduled_at,
  eq.sent_at,
  eq.error_message
FROM email_queue eq
WHERE eq.template_name IN ('work_declared', 'work_status_changed', 'work_completed')
ORDER BY eq.created_at DESC
LIMIT 20;
```

## Troubleshooting

### Emails Not Sending

**Issue**: Clients not receiving work declaration emails

**Solutions**:
1. Check email queue status:
   ```sql
   SELECT * FROM email_queue WHERE status = 'failed' ORDER BY created_at DESC;
   ```
2. Verify RESEND_API_KEY is configured in `.env.local`
3. Check cron job is running (process email queue every 5 minutes)
4. Verify client email address is valid in clients table
5. Check Resend dashboard for delivery issues

### Progress Not Updating

**Issue**: Progress percentage not updating when changed

**Solutions**:
1. Verify database triggers are active:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%work_declaration%';
   ```
2. Check for JavaScript errors in browser console
3. Verify API endpoint is accessible
4. Check RLS policies allow updates

### Clients Can't See Work Declarations

**Issue**: Client portal shows "No work declarations found"

**Solutions**:
1. Verify client is logged in (check authentication)
2. Check client_id is set in profiles table:
   ```sql
   SELECT id, email, role, client_id FROM profiles WHERE id = 'user-uuid';
   ```
3. Verify RLS policies allow client access:
   ```sql
   SELECT * FROM work_declarations WHERE client_id = 'client-uuid';
   ```
4. Check browser console for API errors

### Automatic Updates Not Created

**Issue**: Status changes not appearing in activity timeline

**Solutions**:
1. Check `track_work_declaration_changes` trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_track_work_declaration_changes';
   ```
2. Verify trigger function exists:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'track_work_declaration_changes';
   ```
3. Check update records table:
   ```sql
   SELECT COUNT(*) FROM work_declaration_updates;
   ```

## Security Considerations

### Row Level Security (RLS)

All work declaration tables use RLS policies to ensure data isolation:

**Vendors**:
- Can view, create, update, and delete their own work declarations
- Cannot access work declarations from other vendors

**Clients**:
- Can view work declarations for their account
- Cannot create, update, or delete work declarations
- Can only view updates for declarations they have access to

### Database Triggers

Database triggers run with `SECURITY DEFINER` to ensure proper access:
- Triggers create update records even if user doesn't have direct INSERT access
- Triggers bypass RLS to maintain audit trail integrity

### Email Security

- Email addresses are validated before queueing
- Emails are queued with priority 5 (medium priority)
- Email failures don't block work declaration creation
- Sensitive data (internal notes) not included in client emails

## Production Deployment Checklist

- [ ] Apply database migrations (20260112000001 and 20260112000002)
- [ ] Configure NEXT_PUBLIC_APP_URL in environment variables
- [ ] Verify RESEND_API_KEY is set and valid
- [ ] Set up cron job to process email queue (/api/emails/queue/process)
- [ ] Test work declaration creation flow end-to-end
- [ ] Verify emails are being sent (check Resend dashboard)
- [ ] Test client portal view as a client user
- [ ] Monitor RLS policies are active on all tables
- [ ] Test status change notifications
- [ ] Verify milestone and deliverable tracking
- [ ] Test progress percentage updates
- [ ] Check activity timeline records all changes
- [ ] Validate filtering works correctly
- [ ] Test on mobile devices (responsive design)
- [ ] Set up monitoring for failed emails
- [ ] Document any client-specific workflow customizations

## Future Enhancements

Potential improvements for future iterations:

- **Automation Integration**: Auto-create work declarations when content batches are created
- **Milestone Templates**: Pre-defined milestone sets for common work types
- **Time Tracking**: Log hours spent on work items
- **Budget Tracking**: Track cost vs. budget for work items
- **Client Feedback**: Allow clients to comment on work declarations
- **Slack Integration**: Send work declaration updates to Slack channels
- **Calendar Integration**: Sync due dates with Google Calendar
- **Recurring Work**: Support for recurring work declarations
- **Work Templates**: Save and reuse work declaration templates
- **Batch Operations**: Update status for multiple work items at once
- **Advanced Analytics**: Charts showing work completion rates over time
- **Custom Fields**: Allow vendors to add custom fields per work type
- **File Attachments**: Attach files to work declarations and deliverables
- **Approval Workflow**: Require client approval for work completion

## Additional Resources

- [Transactional Email Setup](./TRANSACTIONAL_EMAIL_SETUP.md)
- [Vendor Onboarding Setup](./VENDOR_ONBOARDING_SETUP.md)
- [Client Onboarding Setup](./CLIENT_ONBOARDING_SETUP.md)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Resend Email API](https://resend.com/docs)
