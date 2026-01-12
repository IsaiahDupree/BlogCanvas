# Client Onboarding System Setup Guide

## Overview

The BlogCanvas client onboarding system provides a complete guided setup flow for new clients, including:

- **Client Invitation System**: Vendors can invite clients via email with secure tokens
- **Profile Completion Wizard**: Multi-step onboarding flow for clients to provide business details
- **Brand Guide Quick-Start**: Automatic brand guide creation from onboarding data
- **Relationship Health Dashboard**: Visual health score tracking based on engagement metrics

## Features

### For Vendors (Content Agencies)

1. **Create Clients**: Add new clients through `/app/clients/new`
2. **Send Invitations**: Automatically sends email invitations with portal access
3. **Health Monitoring**: Track relationship health with automated scoring
4. **Quick Insights**: View client overview with key metrics and status

### For Clients

1. **Email Invitation**: Receive secure invitation link via email
2. **Account Setup**: Click invitation link to create account
3. **Guided Onboarding**: Complete 4-step profile setup wizard
4. **Portal Access**: Access personalized client portal after completion

## Database Tables

### Enhanced Tables

#### clients
```sql
- industry TEXT                 -- Client's industry
- company_size TEXT             -- Company size range
- onboarding_data JSONB         -- Survey responses and preferences
  {
    brand_voice: string,
    tone_preferences: string[],
    primary_goals: string[],
    content_topics: string,
    competitors: string,
    key_differentiators: string,
    completed_at: timestamp
  }
```

### Database Functions

#### get_client_post_stats(client_id)
Calculates comprehensive statistics for a client's blog posts:
- Total, draft, in-review, approved, published counts
- Average SEO quality score
- Posts created this month

## Setup Instructions

### Step 1: Apply Database Migration

```bash
# If using Supabase CLI
npx supabase db push

# Or manually execute
psql -d your_database -f supabase/migrations/20260111000006_client_onboarding_enhancements.sql
```

### Step 2: Configure Environment Variables

Ensure the following are set in `.env.local`:

```bash
# Supabase (required for database and auth)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend (required for invitation emails)
RESEND_API_KEY=your_resend_api_key

# Application URL (required for invitation links)
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # or http://localhost:4848 for dev
```

### Step 3: Ensure Transactional Email System is Configured

The onboarding system depends on feat-013 (Transactional Email System).

1. Apply the transactional email migration (20260111000004)
2. Verify `client_invitation` template exists in `transactional_email_templates` table
3. Set up email queue processor cron job (see `docs/TRANSACTIONAL_EMAIL_SETUP.md`)

### Step 4: Test the Flow

1. **Create a client**:
   - Navigate to `/app/clients/new`
   - Fill out client details
   - Submit form

2. **Verify invitation email**:
   - Check email queue: `SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 5;`
   - Process queue: `POST /api/emails/queue/process` (with CRON_SECRET header)
   - Check Resend dashboard for delivery

3. **Accept invitation**:
   - Copy invitation URL from email or API response
   - Open in incognito/private window
   - Create account with invitation token

4. **Complete onboarding**:
   - Should redirect to `/portal/onboarding`
   - Complete all 4 steps of wizard
   - Submit final step

5. **Verify completion**:
   - Client status should change from 'onboarding' to 'active'
   - Brand guide should be created automatically
   - Client should redirect to `/portal/dashboard`

## API Endpoints

### Vendor Endpoints (Staff/Owner Only)

#### POST /api/clients
Create new client and send invitation email.

**Request**:
```json
{
  "name": "Acme Software Inc",
  "website": "https://acme.com",
  "contact_email": "marketing@acme.com",
  "contact_name": "John Smith",
  "onboarding_method": "manual_intake",
  "send_invitation": true,
  "client_role": "client_admin"
}
```

**Response**:
```json
{
  "success": true,
  "client": { ... },
  "invitation": {
    "sent": true,
    "invitationUrl": "https://app.com/auth/client?token=...",
    "expiresAt": "2026-01-18T..."
  },
  "message": "Client created and invitation sent successfully"
}
```

#### GET /api/clients/[clientId]/overview
Get client overview with relationship health metrics.

**Response**:
```json
{
  "success": true,
  "client": { ... },
  "stats": {
    "total_count": 42,
    "in_review_count": 2,
    "published_count": 36,
    "avg_seo_score": 78
  },
  "health": {
    "score": 85,
    "status": "good",
    "statusColor": "blue",
    "recommendation": "Relationship is healthy with minor areas for improvement.",
    "factors": [
      { "factor": "Low Activity", "impact": -10, "description": "..." }
    ],
    "metrics": { ... }
  }
}
```

### Client Portal Endpoints

#### GET /api/portal/client-profile
Get current client's profile information.

**Response**:
```json
{
  "success": true,
  "client": { ... },
  "profile": {
    "role": "client_admin",
    "client_role": "admin"
  }
}
```

#### POST /api/portal/complete-onboarding
Complete onboarding and mark client as active.

**Request**:
```json
{
  "industry": "Technology",
  "company_size": "51-200 employees",
  "target_audience": "B2B sales managers",
  "brand_voice": "Professional yet approachable...",
  "tone_preferences": ["Professional", "Friendly", "Educational"],
  "primary_goals": ["Generate Leads", "Improve SEO Rankings"],
  "content_topics": "Sales automation, CRM best practices...",
  "competitors": "Salesforce, HubSpot",
  "key_differentiators": "AI-powered insights..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "client": { ... }
}
```

## Onboarding Wizard Steps

### Step 1: Company Information
- Industry (required)
- Company Size (required)
- Target Audience (required)

### Step 2: Brand Voice & Tone
- Brand Voice Description (required)
- Tone Preferences (multi-select): Professional, Friendly, Casual, Technical, etc.

### Step 3: Content Goals
- Primary Goals (multi-select, required): Lead Generation, Brand Awareness, SEO, etc.
- Content Topics & Themes (optional)

### Step 4: Final Details
- Main Competitors (optional)
- Key Differentiators (optional)

## Relationship Health Scoring

The health score is calculated based on 7 factors (0-100 scale):

### Scoring Factors

1. **Onboarding Completion** (20 points)
   - Client status is 'active'

2. **Recent Content Activity** (20 points)
   - Number of posts in last 30 days
   - 0 posts: -20 | 1-2 posts: -10 | 3+ posts: Full points

3. **Posts in Review** (15 points)
   - Backlog indicator
   - 0-2 posts: Full points | 3-5 posts: -5 | 6+ posts: -15

4. **Content Quality** (15 points)
   - Average SEO score of recent posts
   - <60: -15 | 60-74: -5 | 75+: Full points

5. **Publishing Consistency** (15 points)
   - Whether client has published content
   - 0 published: -15 | 1+ published: Full points

6. **Active Batches** (10 points)
   - At least one active content batch
   - 0 batches: -10 | 1+ batches: Full points

7. **Brand Guide Completion** (5 points)
   - Brand guide exists
   - No guide: -5 | Has guide: Full points

### Health Status Levels

- **Excellent** (90-100): Green - Thriving relationship
- **Good** (75-89): Blue - Healthy with minor improvements
- **Fair** (60-74): Yellow - Needs attention
- **Needs Attention** (40-59): Orange - Immediate action required
- **Critical** (0-39): Red - Schedule meeting to address issues

## Monitoring

### Check Onboarding Status

```sql
-- Clients by onboarding status
SELECT status, COUNT(*) as count
FROM clients
GROUP BY status
ORDER BY count DESC;

-- Recently onboarded clients
SELECT id, name, status, created_at, onboarding_data->'completed_at' as completed_at
FROM clients
WHERE status = 'active'
  AND (onboarding_data->'completed_at') IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Check Brand Guide Creation

```sql
-- Clients with/without brand guides
SELECT c.id, c.name, c.status,
       CASE WHEN bg.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_brand_guide
FROM clients c
LEFT JOIN brand_guides bg ON bg.client_id = c.id
ORDER BY c.created_at DESC;
```

### Check Invitation Status

```sql
-- Pending invitations
SELECT ci.email, ci.status, ci.expires_at, c.name as client_name
FROM client_invitations ci
JOIN clients c ON c.id = ci.client_id
WHERE ci.status = 'pending'
  AND ci.expires_at > NOW()
ORDER BY ci.created_at DESC;

-- Expired invitations (cleanup candidates)
SELECT ci.email, ci.created_at, ci.expires_at, c.name as client_name
FROM client_invitations ci
JOIN clients c ON c.id = ci.client_id
WHERE ci.status = 'pending'
  AND ci.expires_at < NOW()
ORDER BY ci.expires_at DESC;
```

## Troubleshooting

### Issue: Invitation email not received

1. Check email queue status:
   ```sql
   SELECT * FROM email_queue
   WHERE to_email = 'client@example.com'
   ORDER BY created_at DESC LIMIT 5;
   ```

2. Verify email processor is running:
   - Cron job calling `/api/emails/queue/process`
   - Check cron logs for errors

3. Check Resend dashboard for delivery issues

### Issue: Onboarding wizard not appearing

1. Verify client status is 'onboarding':
   ```sql
   SELECT id, name, status FROM clients WHERE contact_email = 'client@example.com';
   ```

2. Check if invitation was accepted:
   ```sql
   SELECT * FROM client_invitations WHERE email = 'client@example.com';
   ```

3. Ensure user profile has client_id set:
   ```sql
   SELECT id, client_id, role FROM profiles
   WHERE id = (SELECT id FROM auth.users WHERE email = 'client@example.com');
   ```

### Issue: Health score seems incorrect

1. Verify post stats are being calculated:
   ```sql
   SELECT * FROM get_client_post_stats('[client-id]');
   ```

2. Check recent posts exist:
   ```sql
   SELECT COUNT(*) FROM blog_posts
   WHERE client_id = '[client-id]'
     AND updated_at > NOW() - INTERVAL '30 days';
   ```

3. Review health calculation factors in API response

## Production Deployment Checklist

- [ ] Database migration applied (20260111000006)
- [ ] Transactional email system configured (feat-013 dependencies)
- [ ] Email queue processor cron job running
- [ ] NEXT_PUBLIC_APP_URL set to production domain
- [ ] Resend domain verified and email sending tested
- [ ] Test end-to-end flow in production:
  - [ ] Create test client
  - [ ] Receive invitation email
  - [ ] Accept invitation
  - [ ] Complete onboarding
  - [ ] View relationship health dashboard
- [ ] Set up monitoring alerts for:
  - [ ] Failed invitation emails
  - [ ] Expired invitations (cleanup)
  - [ ] Clients stuck in 'onboarding' status > 7 days

## Future Enhancements

- **Automated Reminders**: Send reminder emails for incomplete onboardings
- **Onboarding Templates**: Pre-filled templates for common industries
- **Progress Tracking**: Show completion percentage in vendor dashboard
- **Health Alerts**: Notify vendors when relationship health drops below threshold
- **Custom Onboarding**: Allow vendors to customize onboarding questions
- **Client Insights**: AI-generated insights from onboarding responses

## Additional Resources

- [Transactional Email Setup](./TRANSACTIONAL_EMAIL_SETUP.md) - feat-013 documentation
- [Vendor Onboarding Setup](./VENDOR_ONBOARDING_SETUP.md) - feat-014 documentation
- [Client Authentication Enhancement](../supabase/migrations/20260110000001_client_auth_enhancement.sql) - feat-001 migration
