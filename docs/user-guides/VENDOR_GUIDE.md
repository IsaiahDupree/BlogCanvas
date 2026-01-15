# BlogCanvas Vendor Guide

**Welcome to BlogCanvas!** This guide will help you master BlogCanvas as a content agency vendor. You'll learn how to manage clients, run SEO audits, create content batches, and deliver high-quality blog content at scale.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Client Management](#client-management)
4. [Website Analysis & SEO Audits](#website-analysis--seo-audits)
5. [Content Planning & Batches](#content-planning--batches)
6. [AI Content Pipeline](#ai-content-pipeline)
7. [Review & Approval Workflow](#review--approval-workflow)
8. [Publishing Content](#publishing-content)
9. [Analytics & Reporting](#analytics--reporting)
10. [Team Collaboration](#team-collaboration)
11. [Settings & Integrations](#settings--integrations)
12. [Best Practices](#best-practices)

---

## Getting Started

### Your First Login

1. Navigate to `https://blogcanvas.io/app` (or `http://localhost:4848/app` for development)
2. Sign in with your vendor account credentials
3. Complete your vendor profile setup if prompted

### The Vendor Dashboard

The `/app` dashboard is your command center. Here you'll see:

- **Recent Activity** - Latest content updates, client approvals, and system events
- **Quick Stats** - Active clients, posts in review, published this month
- **Work Declarations** - Outstanding work items and deadlines
- **Shortcuts** - Quick access to common tasks

---

## Dashboard Overview

### Main Navigation

Your main navigation bar provides access to all core features:

| Section | Purpose | Quick Access |
|---------|---------|--------------|
| **Dashboard** | Overview and activity feed | `/app` |
| **Clients** | Manage all your clients | `/app/clients` |
| **Websites** | Website analysis and SEO audits | `/app/websites` |
| **Batches** | Content production batches | `/app/batches` |
| **Review** | Kanban board for content workflow | `/app/review` |
| **Publishing** | Schedule and publish content | `/app/publishing` |
| **Analytics** | Performance metrics | `/app/analytics` |
| **Reports** | Generate client reports | `/app/reports` |

---

## Client Management

### Adding a New Client

1. Navigate to **Clients** (`/app/clients`)
2. Click **"Add New Client"**
3. Fill in client details:
   - Company name
   - Primary contact name and email
   - Industry/niche
   - Target audience
   - Brand voice preferences
4. Click **"Create Client"**

**Pro Tip:** The more detailed your client profile, the better AI-generated content will align with their brand voice.

### Inviting Clients to the Portal

After creating a client:

1. Go to client detail page (`/app/clients/[id]/overview`)
2. Click **"Invite to Portal"**
3. Enter client's email address
4. Customize invitation message (optional)
5. Click **"Send Invitation"**

The client will receive an email with login instructions and a secure invitation token.

### Managing Client Information

Update client details anytime from their detail page:

- **Overview Tab** - Company info, contact details, subscription status
- **Brand Guide Tab** - Voice, tone, style guidelines, do's and don'ts
- **Websites Tab** - Associated websites and SEO scores
- **Content Tab** - All blog posts and batches for this client
- **Analytics Tab** - Performance metrics and reports

---

## Website Analysis & SEO Audits

### Adding a Client Website

1. Navigate to **Websites** (`/app/websites`)
2. Click **"Add Website"**
3. Enter:
   - Website URL (e.g., `https://example.com`)
   - Client (select from dropdown)
   - CMS platform (WordPress, Webflow, etc.)
4. Click **"Add Website"**

### Running an SEO Audit

The SEO audit is the foundation of your content strategy:

1. Go to website detail page (`/app/websites/[id]`)
2. Click **"Run Audit"** button
3. Wait for the audit to complete (typically 2-5 minutes)

The audit will analyze:
- Current SEO score (0-100)
- Pages indexed
- Topic coverage
- Content gaps
- Keyword opportunities

### Understanding Audit Results

#### Baseline SEO Score
- **0-40**: Needs significant improvement
- **41-60**: Fair, with room for growth
- **61-80**: Good, competitive
- **81-100**: Excellent, industry-leading

#### Topic Clusters Tab

View discovered topic clusters with:
- **Estimated Traffic** - Monthly search volume potential
- **Difficulty** - Easy/Medium/Hard ranking difficulty
- **Coverage Status** - Currently covered vs. opportunities
- **Recommended Articles** - Suggested content count

#### Gap Analysis Tab

See what your client is missing:
- **Content Gaps** - Topics competitors cover but client doesn't
- **Keyword Opportunities** - High-value keywords to target
- **Internal Linking Gaps** - Missing connections between posts

---

## Content Planning & Batches

### Understanding Content Batches

A **Content Batch** is a collection of blog posts with a unified goal (e.g., "Q1 2026 SEO Push").

**Benefits of batches:**
- Organize content by campaign or time period
- Track progress toward SEO goals
- Generate cohesive content themes
- Batch approve and publish content

### Creating a Content Batch

1. Navigate to **Batches** (`/app/batches`)
2. Click **"Create Batch"**
3. Fill in batch details:
   - **Name** - e.g., "Q1 2026 Content Campaign"
   - **Client** - Select client
   - **Website** - Select target website
   - **Goal Scores** - Current SEO score → Target SEO score
   - **Date Range** - Start and end dates
4. Click **"Create Batch"**

### Planning Batch Content

#### Option 1: Auto-Generate from Topic Clusters

1. Open your batch (`/app/batches/[id]`)
2. Go to **"Topic Clusters"** tab
3. Select topic clusters from the audit
4. Click **"Generate Posts"**
5. System creates blog posts for each cluster automatically

#### Option 2: Import from CSV

1. Open your batch
2. Click **"Import CSV"**
3. Upload CSV file with columns:
   - `topic` or `title` (required) - Post title/topic
   - `keywords` (optional) - Target keywords (comma-separated)
   - `target_audience` (optional) - Specific audience
   - `template` (optional) - Content template
4. Review validation preview:
   - ✅ Green rows = Valid
   - ⚠️ Yellow rows = Warnings (importable with issues)
   - ❌ Red rows = Errors (must fix)
5. Click **"Import Valid Rows"**

**CSV Template:** Download template from the import modal for correct format.

#### Option 3: Manual Post Creation

1. Open your batch
2. Click **"Add Post"**
3. Enter:
   - Title
   - Target keyword
   - Brief description
4. Click **"Create Post"**

### Managing Batch Progress

Track your batch on the detail page:

- **Progress Bar** - Visual completion status
- **Counters** - Total posts, in progress, client review, approved, published
- **Post List** - All posts with status and quality scores
- **Timeline** - Batch activity history

---

## AI Content Pipeline

BlogCanvas uses a **5-agent AI pipeline** to generate high-quality content:

### The 5 AI Agents

| Agent | Function | Output |
|-------|----------|--------|
| **Outline Agent** | Builds SEO-optimized structure | H2/H3 headings, FAQs, table ideas |
| **Drafting Agent** | Writes full article | Intro, body paragraphs, conclusion |
| **SEO Agent** | Optimizes for search | Meta tags, keywords, internal links |
| **Fact-Check Agent** | Verifies accuracy | Citations, source suggestions |
| **Enhancement Agent** | Improves readability | Tables, bullets, image prompts |

### Triggering the AI Pipeline

#### For a Single Post

1. Navigate to batch detail page
2. Find the post in the list
3. Click **"Generate Draft"**
4. Watch the pipeline progress in real-time

#### For Entire Batch

1. Open batch detail page
2. Click **"Generate All Drafts"**
3. System queues all posts for AI processing

### Monitoring Pipeline Progress

Each post shows its pipeline stage:

- 🟡 **ai_outline** - Outline Agent working
- 🟠 **ai_drafting** - Drafting Agent writing
- 🔵 **ai_seo** - SEO Agent optimizing
- 🟣 **ai_fact_check** - Fact-Check Agent reviewing
- 🟢 **editor_review** - Ready for human review

### Viewing AI Revisions

See what each AI agent did:

1. Open post detail page (`/app/posts/[postId]`)
2. Click **"View History"**
3. See all revisions with:
   - Revision type (outline, draft, seo_pass, fact_check, enhancement)
   - Timestamp and agent name
   - Full content diff (green = added, red = removed)

### Comparing Revisions

Compare any two versions:

1. Go to post history page (`/app/posts/[postId]/history`)
2. Select two revisions from dropdowns
3. View side-by-side or unified diff
4. See exactly what changed

### Restoring Previous Versions

Roll back to an earlier version:

1. Open revision history
2. Find the version you want
3. Click **"Restore This Version"**
4. Confirm restoration

System automatically creates a backup before restoring.

---

## Review & Approval Workflow

### The Review Board

The **Review Kanban** (`/app/review`) shows all posts in your workflow:

#### Workflow Columns

1. **AI Drafting** - AI agents working
2. **Editor Review** - Needs internal QA
3. **Ready for Client** - Approved internally, pending client
4. **Client Review** - Client reviewing
5. **Changes Requested** - Client asked for edits
6. **Approved** - Ready to publish

### Moving Posts Through Workflow

**Drag and Drop:**
- Drag post cards between columns
- Status updates automatically
- Triggers notifications to clients when moved to "Ready for Client"

**Using Action Buttons:**
1. Click on a post card
2. Use buttons: "Move to Review", "Send to Client", "Mark Approved"

### Editing Content

1. Open post detail page
2. Click **"Edit"**
3. Make changes in the editor
4. Click **"Save as Human Edit"**
5. Revision is tracked with your name

**Note:** All edits are tracked in revision history for accountability.

### Internal Review Checklist

Before sending to client, verify:

- ✅ Content matches brand voice
- ✅ Target keyword used appropriately (not stuffed)
- ✅ All facts are accurate and sourced
- ✅ Headings are SEO-optimized (H2/H3 structure)
- ✅ Meta description is compelling (155 chars)
- ✅ Internal links are relevant
- ✅ Images are appropriate (or prompts provided)
- ✅ CTA is clear and actionable
- ✅ No grammar or spelling errors

---

## Publishing Content

### Connecting to WordPress

Before publishing, connect the client's CMS:

1. Navigate to **Websites** → Select website
2. Go to **"CMS Connection"** tab
3. Enter:
   - WordPress URL (e.g., `https://example.com`)
   - Application Password (generate in WordPress)
4. Click **"Test Connection"**
5. If successful, click **"Save Connection"**

**WordPress Application Password Setup:**
1. In WordPress admin, go to Users → Profile
2. Scroll to "Application Passwords"
3. Enter name (e.g., "BlogCanvas")
4. Click "Add New Application Password"
5. Copy the generated password (shown once)

### Publishing a Single Post

1. Open approved post (`/app/posts/[id]`)
2. Ensure status is "Approved"
3. Click **"Publish to WordPress"**
4. Optionally schedule for future date
5. Click **"Publish"**

System will:
- Push content to WordPress
- Set appropriate categories and tags
- Upload featured image (if provided)
- Add meta description
- Store published URL

### Batch Publishing

Publish multiple posts at once:

1. Navigate to **Publishing Queue** (`/app/publishing`)
2. Select multiple approved posts
3. Click **"Publish Selected"**
4. Optionally schedule posts on different dates
5. Click **"Publish All"**

### Publishing Status

Monitor publish status:

- ✅ **Published** - Live on client's website
- 📅 **Scheduled** - Will publish on future date
- ⚠️ **Failed** - Publishing error (click to see details)
- 🔄 **Publishing** - In progress

### Troubleshooting Failed Publishes

If a post fails to publish:

1. Click on the failed post
2. Read error message
3. Common issues:
   - **Invalid credentials** - Reconnect WordPress
   - **Permission denied** - Check user role in WordPress
   - **Network timeout** - Try again
   - **Invalid content** - Check for special characters

---

## Analytics & Reporting

### Analytics Dashboard

View performance across all clients:

1. Navigate to **Analytics** (`/app/analytics`)
2. See overall stats:
   - Total impressions
   - Total clicks
   - Average CTR
   - Average position
   - Published posts

### Per-Client Analytics

See individual client performance:

1. Go to client detail page
2. Click **"Analytics"** tab
3. View:
   - SEO score over time
   - Top performing posts
   - Traffic growth
   - Keyword rankings

### Check-Back Schedules

BlogCanvas automatically collects metrics on scheduled days after publishing:

**Default Check-Backs:**
- Day 7 - Initial performance
- Day 30 - Early growth
- Day 60 - Momentum check
- Day 90 - Quarterly review

**Configure Check-Backs:**
1. Go to website detail page
2. Click **"Check-Backs"** tab
3. Add/remove custom intervals
4. Toggle on/off

### Generating Reports

Create professional client reports:

1. Navigate to **Reports** (`/app/reports`)
2. Click **"Generate Report"**
3. Select:
   - Client
   - Report type (monthly, quarterly, annual)
   - Date range
   - Format (PDF, Email, Slide Deck)
4. Click **"Generate"**

**Report Includes:**
- SEO score progress (baseline → current)
- Posts published in period
- Traffic metrics (impressions, clicks, CTR)
- Top performing posts
- Keyword rankings
- Recommendations for next period

### Sending Reports

**Via Email:**
1. Generate report
2. Click **"Send Email"**
3. Enter recipient email (or use client's email)
4. Customize message
5. Click **"Send"**

**Download PDF:**
1. Generate report
2. Click **"Download PDF"**
3. Save and share manually

### Scheduled Reports

Automate recurring reports:

1. Navigate to **Reports** → **Schedules** (`/app/reports/schedules`)
2. Click **"Create Schedule"**
3. Configure:
   - Client
   - Frequency (weekly, monthly, quarterly)
   - Format (email, PDF)
   - Recipients
4. Click **"Create Schedule"**

Reports will generate and send automatically on schedule.

---

## Team Collaboration

### Inviting Team Members

Add editors and account managers:

1. Go to **Settings** → **Team** (`/app/vendor/team`)
2. Click **"Invite Team Member"**
3. Enter:
   - Email address
   - Role (Admin, Editor, Viewer)
   - Assigned clients (optional)
4. Click **"Send Invitation"**

### Team Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access, billing, team management |
| **Editor** | Create/edit content, manage clients |
| **Viewer** | Read-only access, no editing |

### Assigning Work

Use comments to assign work:

1. Open post detail page
2. Add comment: `@username please review this`
3. Team member receives notification

### Activity Logs

Track team activity:

1. Navigate to **Audit Logs** (`/app/audit-logs`)
2. See all actions:
   - Who edited what
   - When posts were approved
   - Publishing events
   - Settings changes

---

## Settings & Integrations

### Gmail Integration

Sync client emails:

1. Go to **Settings** → **Gmail** (`/app/settings/gmail`)
2. Click **"Connect Gmail"**
3. Authorize BlogCanvas
4. Select which emails to sync
5. Access inbox at `/app/inbox`

### Google Analytics 4

Track website performance:

1. Go to **Settings** → **GA4** (`/app/settings/ga4`)
2. Enter GA4 Measurement ID
3. Click **"Connect"**
4. Verify connection

### Stripe Billing

Manage subscriptions:

1. Go to **Billing** (`/app/billing`)
2. View current plan and usage
3. Update payment method
4. Download invoices

### Two-Factor Authentication

Secure your account:

1. Go to **Settings** → **2FA** (`/app/settings/2fa`)
2. Click **"Enable 2FA"**
3. Scan QR code with authenticator app
4. Enter verification code
5. Save backup codes

### API Keys

For custom integrations:

1. Go to **Developer** → **API Keys** (`/app/api-keys`)
2. Click **"Create API Key"**
3. Name your key
4. Copy and store securely (shown once)
5. Use in API requests

### Webhooks

Receive real-time notifications:

1. Go to **Developer** → **Webhooks** (`/app/webhooks`)
2. Click **"Create Webhook"**
3. Enter:
   - Endpoint URL
   - Events to subscribe to
   - Secret (for verification)
4. Click **"Create"**

**Available Events:**
- `post.created`, `post.approved`, `post.published`
- `client.invited`, `client.approved_post`
- `batch.created`, `batch.completed`

---

## Best Practices

### SEO Content Strategy

1. **Start with Audit** - Always run SEO audit before planning content
2. **Target Topic Clusters** - Focus on clusters, not random keywords
3. **Fill Gaps First** - Address content gaps identified in audit
4. **Internal Linking** - Connect new posts to existing content
5. **Update Old Content** - Refresh underperforming posts quarterly

### Content Batch Planning

1. **Set Clear Goals** - Define target SEO score increase
2. **Batch by Theme** - Group related topics together
3. **Realistic Timelines** - Plan 2-4 posts per week max
4. **Buffer Time** - Account for client review delays
5. **Quality Over Quantity** - Better to publish 4 great posts than 10 mediocre ones

### AI Content Usage

1. **Always Review** - Never publish AI content without human review
2. **Add Personality** - Inject client's unique voice
3. **Fact-Check Everything** - Verify all claims and statistics
4. **Update Examples** - Replace generic examples with client-specific ones
5. **Add Original Insights** - Contribute expertise AI can't provide

### Client Communication

1. **Set Expectations** - Explain review process upfront
2. **Batch Approvals** - Ask clients to review 3-5 posts at once
3. **Provide Context** - Explain SEO recommendations
4. **Track Feedback** - Document client preferences for future content
5. **Show Results** - Share analytics monthly

### Workflow Efficiency

1. **Use Templates** - Create reusable outlines for common post types
2. **Batch Similar Tasks** - Generate all outlines at once, then all drafts
3. **Leverage AI** - Let AI handle first draft, focus on enhancement
4. **Schedule Publishing** - Plan publishing calendar in advance
5. **Automate Reports** - Set up scheduled reports, don't generate manually

---

## Keyboard Shortcuts

Speed up your workflow:

| Action | Shortcut |
|--------|----------|
| Navigate to Dashboard | `g d` |
| Navigate to Clients | `g c` |
| Navigate to Review Board | `g r` |
| Create New Post | `c p` |
| Search | `/` |
| Save | `Cmd/Ctrl + S` |

---

## Getting Help

### In-App Help

- Look for **?** icons throughout the interface for contextual help
- Hover over any field for tooltips

### Support Channels

- **Email:** support@blogcanvas.io
- **Documentation:** https://docs.blogcanvas.io
- **Status Page:** https://status.blogcanvas.io

### Troubleshooting

**Common Issues:**

| Issue | Solution |
|-------|----------|
| AI generation stuck | Check API key credits (Settings → API Keys) |
| WordPress publish fails | Verify Application Password is still valid |
| Client can't log in | Resend invitation from client detail page |
| Missing analytics data | Ensure GA4 is connected and active |
| Slow page loads | Clear browser cache and reload |

---

## What's Next?

Now that you've mastered the basics:

1. **Optimize Your Workflow** - Find shortcuts and templates that work for you
2. **Train Your Team** - Share this guide with team members
3. **Explore Advanced Features** - Try competitor analysis, AI image generation
4. **Automate Reporting** - Set up scheduled reports for all clients
5. **Integrate Tools** - Connect Gmail, GA4, and webhooks

**Happy content creating! 🚀**
