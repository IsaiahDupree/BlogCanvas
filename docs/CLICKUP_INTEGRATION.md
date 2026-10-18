# ClickUp Integration Guide

## Overview

This integration allows ClickUp tags to trigger automated content creation workflows. When a tag is added to a ClickUp task, a webhook is sent to our backend, which then triggers the appropriate content generation workflow (blog, email campaign, brand guide, etc.) and saves the results to both ClickUp and Google Drive.

## Architecture

```
ClickUp Task (with tag) 
    ↓
ClickUp Webhook → /api/webhooks/clickup
    ↓
Webhook Processor → Extract tags & task data
    ↓
Automation Trigger → Match tag to workflow
    ↓
Content Generator (AI) → Generate content
    ↓
Google Drive → Save to Docs/Sheets
    ↓
ClickUp API → Update task with results
```

## Setup

### 1. Environment Variables

Add these to your `.env.local`:

```bash
# ClickUp Integration
CLICKUP_API_TOKEN=your_clickup_api_token
CLICKUP_WEBHOOK_SECRET=your_webhook_secret_optional

# Google Drive Integration
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_DRIVE_BLOGS_FOLDER_ID=folder_id_for_blogs
GOOGLE_DRIVE_EMAILS_FOLDER_ID=folder_id_for_emails
GOOGLE_DRIVE_BRAND_FOLDER_ID=folder_id_for_brand_guides
```

### 2. ClickUp Webhook Setup

1. Go to ClickUp Settings → Apps → Webhooks
2. Add new webhook with URL: `https://your-domain.com/api/webhooks/clickup`
3. Select events: `taskCreated`, `taskUpdated`, `taskTagAdded`
4. Copy webhook secret (optional, for verification)

### 3. Google Drive Setup

1. Create Google Cloud Project
2. Enable Google Drive API and Google Docs API
3. Create Service Account
4. Download JSON key and set as `GOOGLE_SERVICE_ACCOUNT_KEY`
5. Create folders in Google Drive for:
   - Blogs
   - Email Campaigns
   - Brand Guides
6. Share folders with service account email (Editor access)
7. Get folder IDs from URLs and set in environment variables

### 4. Database Migration

Run the migration to create required tables:

```bash
# Apply migration
supabase migration up 20241206_clickup_integration
```

## Usage

### Tag-Based Automation

Add tags to ClickUp tasks to trigger automations:

#### Blog Creation
- Tag: `automation:blog` or `automation:blog-post`
- Creates: Blog post in Google Docs
- Updates: ClickUp task with Google Drive link

#### Email Campaign
- Tag: `automation:email-campaign` or `automation:email`
- Creates: Email campaign doc + tracking sheet in Google Drive
- Updates: ClickUp task with both links

#### Brand Guide
- Tag: `automation:brand-guide` or `automation:brand-messaging`
- Creates: Brand messaging guide in Google Docs
- Updates: ClickUp task with Google Drive link

### Task Requirements

Add requirements to task description or custom fields:

**For Blogs:**
```
Keyword: wordpress optimization
Word Count: 2000
Tone: professional
Audience: developers
```

**For Email Campaigns:**
```
Audience: existing customers
Campaign Goal: product launch
Tone: exciting
```

**For Brand Guides:**
```
Industry: SaaS
Target Audience: small business owners
Brand Values: innovation, simplicity, customer-first
```

## API Endpoints

### POST /api/webhooks/clickup
Receives webhooks from ClickUp.

**Request:** ClickUp webhook payload

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed",
  "tags": ["automation:blog"],
  "automations_triggered": 1
}
```

## Database Tables

### webhook_events
Stores all incoming webhook events for debugging and auditing.

### automation_runs
Tracks automation execution status and results.

### generated_content
Stores generated content with metadata and Google Drive links.

## Workflow Details

### Blog Creation Workflow

1. Webhook received with `automation:blog` tag
2. Extract requirements from task (keyword, word count, tone, etc.)
3. Generate blog content using AI
4. Save to Google Drive as Google Doc
5. Update ClickUp task description with Drive link
6. Save to database with metadata

### Email Campaign Workflow

1. Webhook received with `automation:email-campaign` tag
2. Extract campaign requirements
3. Generate email content (subject, body, HTML)
4. Save campaign doc to Google Drive
5. Create tracking spreadsheet in Google Drive
6. Update ClickUp task with both links
7. Save to database

### Brand Guide Workflow

1. Webhook received with `automation:brand-guide` tag
2. Extract brand information
3. Generate brand messaging guide
4. Save to Google Drive as Google Doc
5. Update ClickUp task with Drive link
6. Save to database

## Monitoring

### View Webhook Events
```sql
SELECT * FROM webhook_events 
WHERE source = 'clickup' 
ORDER BY received_at DESC 
LIMIT 50;
```

### View Automation Runs
```sql
SELECT * FROM automation_runs 
WHERE trigger_source = 'clickup' 
ORDER BY started_at DESC 
LIMIT 50;
```

### View Generated Content
```sql
SELECT * FROM generated_content 
WHERE source = 'clickup' 
ORDER BY created_at DESC 
LIMIT 50;
```

## Troubleshooting

### Webhook Not Received
1. Check ClickUp webhook settings
2. Verify webhook URL is accessible
3. Check server logs for errors
4. Verify webhook secret matches (if configured)

### Automation Not Triggering
1. Check task tags match automation patterns
2. Verify tag format: `automation:blog`, `automation:email-campaign`, etc.
3. Check automation_runs table for errors
4. Review webhook_events payload

### Google Drive Errors
1. Verify service account key is valid
2. Check folder IDs are correct
3. Ensure service account has access to folders
4. Verify Google Drive API is enabled

### Content Generation Errors
1. Check OpenAI API key is set
2. Verify API quota/limits
3. Review error messages in automation_runs table
4. Check content generator logs

## Extending

### Add New Automation Type

1. Add tag mapping in `src/lib/integrations/clickup/automation-trigger.ts`:
```typescript
'new-automation': {
    name: 'New Automation',
    handler: createNewAutomationWorkflow
}
```

2. Create workflow file: `src/lib/integrations/clickup/workflows/new-automation-workflow.ts`

3. Implement workflow function following existing patterns

### Custom Requirements Extraction

Modify requirement extraction functions in workflow files to parse custom fields or task descriptions differently.

## Security

- Webhook signature verification (optional but recommended)
- Service account key stored securely in environment variables
- RLS policies on database tables
- API tokens stored securely

## Next Steps

- [ ] Add more automation types (social media posts, case studies, etc.)
- [ ] Implement webhook signature verification
- [ ] Add retry logic for failed automations
- [ ] Create dashboard for monitoring automations
- [ ] Add notification system (Slack, email) for completed automations



