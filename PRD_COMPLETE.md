# BlogCanvas - Complete Product Requirements Document

**Version:** 2.0  
**Date:** January 10, 2026  
**Status:** Draft for Complete Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [System Architecture](#3-system-architecture)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Epic 1: Client-Vendor Relationship Management](#5-epic-1-client-vendor-relationship-management)
6. [Epic 2: Project Transparency & Status Dashboard](#6-epic-2-project-transparency--status-dashboard)
7. [Epic 3: File Transfer & Document Management](#7-epic-3-file-transfer--document-management)
8. [Epic 4: Client Research & Website Analysis](#8-epic-4-client-research--website-analysis)
9. [Epic 5: AI-Powered Blog Generation Pipeline](#9-epic-5-ai-powered-blog-generation-pipeline)
10. [Epic 6: AI Review System](#10-epic-6-ai-review-system)
11. [Epic 7: Newsletter System](#11-epic-7-newsletter-system)
12. [Epic 8: Integrations](#12-epic-8-integrations)
13. [Epic 9: Vendor Dev Access](#13-epic-9-vendor-dev-access)
14. [Database Schema Extensions](#14-database-schema-extensions)
15. [API Specifications](#15-api-specifications)
16. [Security Requirements](#16-security-requirements)
17. [Success Metrics](#17-success-metrics)

---

## 1. Executive Summary

### 1.1 Vision

BlogCanvas is a comprehensive **client-vendor relationship project management suite for bloggers**. It enables content agencies (vendors) to manage SEO-optimized blog content creation for their clients with full transparency, AI-assisted workflows, and integrated billing/communication systems.

### 1.2 Core Value Propositions

| Stakeholder | Value |
|-------------|-------|
| **Vendors** | Streamlined content production, AI automation, client management |
| **Clients** | Full visibility into work progress, quality assurance, easy approvals |
| **End Users** | High-quality, SEO-optimized blog content that drives organic traffic |

### 1.3 Key Capabilities

- **Multi-tenant Architecture**: Support multiple vendors, each with multiple clients
- **Transparent Project Management**: Real-time status visibility for all parties
- **AI Content Pipeline**: Research → Outline → Draft → SEO → Review → Publish
- **Integrated Billing**: Stripe subscriptions and invoicing
- **Communication Hub**: Email (Resend, Gmail), Newsletters, In-app messaging
- **Analytics & Reporting**: Performance tracking and automated reports

---

## 2. Current State Analysis

### 2.1 Existing Infrastructure

Based on repository analysis, BlogCanvas currently has:

#### Database Tables (Implemented)
- `clients`, `client_profiles` - Client management
- `blog_posts`, `blog_post_sections`, `blog_post_revisions` - Content management
- `blog_post_metrics` - Performance tracking
- `agent_runs`, `review_tasks`, `comments` - Workflow management
- `cms_connections` - CMS integration
- `websites`, `website_pages`, `website_insights` - Website analysis
- `brand_guides`, `uploaded_documents` - Assets
- `content_batches`, `topic_clusters`, `seo_audits`, `reports` - SEO system

#### API Routes (Implemented)
- `/api/analytics`, `/api/analyze`, `/api/auth`
- `/api/blog-posts`, `/api/check-backs`, `/api/clients`
- `/api/comments`, `/api/content-batches`, `/api/portal`
- `/api/posts`, `/api/publishing`, `/api/reports`, `/api/websites`

#### Pages (Implemented)
- `/analyze`, `/app`, `/auth`, `/blog`, `/brand-guide`
- `/portal`, `/posts`, `/settings`

### 2.2 Gaps to Address

| Feature Area | Current State | Required State |
|--------------|---------------|----------------|
| Vendor-Client Roles | Basic auth | Full RBAC with vendor/client separation |
| File Transfer | Documents table exists | Full upload/download UI with versioning |
| Newsletter System | Not implemented | Full newsletter builder + scheduling |
| Stripe Integration | Not implemented | Subscriptions, invoices, payment links |
| Resend Integration | Not implemented | Transactional emails, notifications |
| Gmail Integration | Not implemented | Email sync, thread management |
| Vendor Dev Access | Not implemented | API keys, webhooks, dev portal |

---

## 3. System Architecture

### 3.1 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, TailwindCSS 4 |
| **Backend** | Next.js API Routes, Server Actions |
| **Database** | Supabase (PostgreSQL) with RLS |
| **Auth** | Supabase Auth with role-based access |
| **Storage** | Supabase Storage for files |
| **Payments** | Stripe |
| **Email** | Resend (transactional), Gmail API (sync) |
| **AI** | OpenAI GPT-4, Anthropic Claude (configurable) |
| **Deployment** | Vercel |

### 3.2 Multi-Tenant Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PLATFORM                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │    VENDOR A     │  │    VENDOR B     │  │   VENDOR C   │ │
│  ├─────────────────┤  ├─────────────────┤  ├──────────────┤ │
│  │ ┌─────┐ ┌─────┐│  │ ┌─────┐ ┌─────┐│  │ ┌─────┐      │ │
│  │ │Cli 1│ │Cli 2││  │ │Cli 1│ │Cli 2││  │ │Cli 1│      │ │
│  │ └─────┘ └─────┘│  │ └─────┘ └─────┘│  │ └─────┘      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. User Roles & Permissions

### 4.1 Role Hierarchy

| Role | Description | Access Level |
|------|-------------|--------------|
| **Platform Admin** | BlogCanvas platform operator | Full system access |
| **Vendor Admin** | Agency owner/manager | Full vendor tenant access |
| **Vendor Editor** | Content creator/editor | Create/edit content, limited settings |
| **Vendor CSM** | Client success manager | Client management, reporting |
| **Client Admin** | Client organization owner | Full client portal access |
| **Client Reviewer** | Client team member | View/approve content only |

### 4.2 Permission Matrix

| Action | Platform Admin | Vendor Admin | Vendor Editor | Vendor CSM | Client Admin | Client Reviewer |
|--------|----------------|--------------|---------------|------------|--------------|-----------------|
| Manage vendors | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage clients | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Create content | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit content | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve content | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage billing | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Send newsletters | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Dev API access | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 5. Epic 1: Client-Vendor Relationship Management

### 5.1 Features

#### F1.1 Vendor Onboarding
- **Description**: Self-service vendor registration with organization setup
- **User Stories**:
  - As a vendor, I can register my agency and set up my organization profile
  - As a vendor admin, I can invite team members with specific roles
  - As a vendor, I can configure my branding (logo, colors) for client-facing views

#### F1.2 Client Onboarding
- **Description**: Vendors can onboard new clients with guided setup
- **User Stories**:
  - As a vendor CSM, I can create a new client account with brand details
  - As a vendor, I can send a client invitation email with portal access
  - As a client, I can complete my profile with business details and preferences

#### F1.3 Relationship Dashboard
- **Description**: Overview of all vendor-client relationships
- **User Stories**:
  - As a vendor admin, I can see all my clients with health scores and activity
  - As a client admin, I can see my vendor relationship summary and contacts
  - As a vendor, I can set and track client-specific SLAs

### 5.2 Acceptance Criteria

```gherkin
Feature: Client Onboarding
  Scenario: Vendor creates new client
    Given I am logged in as a vendor CSM
    When I click "Add New Client"
    And I fill in client details (name, website, industry)
    And I click "Create Client"
    Then a new client record is created
    And a client portal is provisioned
    And an invitation email is queued

  Scenario: Client accepts invitation
    Given I received a client invitation email
    When I click the invitation link
    And I set my password
    And I complete my profile
    Then I can access my client portal
    And I see my vendor's branding
```

---

## 6. Epic 2: Project Transparency & Status Dashboard

### 6.1 Features

#### F2.1 Vendor Dashboard
- **Description**: Comprehensive view of all projects and their statuses
- **Components**:
  - Active projects kanban board
  - Content pipeline status
  - Client activity feed
  - Upcoming deadlines calendar
  - Performance metrics widgets

#### F2.2 Client Portal Dashboard
- **Description**: Client-specific view of their projects
- **Components**:
  - Project overview with status indicators
  - Pending approvals queue
  - Recent deliveries
  - Performance reports
  - Communication thread

#### F2.3 Work Declaration System
- **Description**: Vendors declare work items clients can track
- **User Stories**:
  - As a vendor, I can create work declarations specifying deliverables and timelines
  - As a client, I can see all declared work with real-time status updates
  - As a vendor, I can update work status and notify clients of milestones

### 6.2 Status Workflow

```
DECLARED → IN_PROGRESS → INTERNAL_REVIEW → CLIENT_REVIEW → APPROVED → PUBLISHED
                ↓                               ↓
           BLOCKED                      CHANGES_REQUESTED
```

### 6.3 Acceptance Criteria

```gherkin
Feature: Work Transparency
  Scenario: Client views work declaration
    Given I am logged in as a client
    When I navigate to my project dashboard
    Then I see all declared work items
    And each item shows current status and progress percentage
    And I can click to see detailed breakdown and timeline
```

---

## 7. Epic 3: File Transfer & Document Management

### 7.1 Features

#### F3.1 Secure File Upload
- **Description**: Upload files with virus scanning and access control
- **Supported Types**: PDF, DOCX, XLSX, Images (PNG, JPG, WEBP), Videos (MP4)
- **Max Size**: 100MB per file, 1GB per batch

#### F3.2 File Organization
- **Description**: Folder structure with tagging and search
- **Hierarchy**: Client → Project → Category (Assets, Deliverables, Research)
- **Metadata**: Tags, descriptions, version numbers, upload date

#### F3.3 Version Control
- **Description**: Track file versions with diff view for documents
- **User Stories**:
  - As a vendor, I can upload a new version of a file maintaining history
  - As a client, I can compare versions and download any version
  - As a vendor, I can restore a previous version if needed

#### F3.4 Sharing & Permissions
- **Description**: Granular file-level permissions
- **Options**: View only, Download, Comment, Edit
- **Features**: Expiring links, password protection, download tracking

### 7.2 Data Model

```sql
-- File storage table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  project_id UUID REFERENCES content_batches(id),
  folder_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  version INT DEFAULT 1,
  parent_version_id UUID REFERENCES files(id),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- File shares table
CREATE TABLE file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id),
  shared_with_user_id UUID REFERENCES users(id),
  shared_with_email TEXT,
  permission_level TEXT CHECK (permission_level IN ('view', 'download', 'comment', 'edit')),
  expires_at TIMESTAMPTZ,
  password_hash TEXT,
  access_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Epic 4: Client Research & Website Analysis

### 8.1 Features

#### F4.1 Website Crawler
- **Description**: Automated crawling of client websites for content analysis
- **Capabilities**:
  - Page discovery and sitemap extraction
  - Content extraction (headings, paragraphs, meta tags)
  - Internal link structure mapping
  - Technical SEO checks (page speed, mobile-friendly, etc.)

#### F4.2 SEO Gap Analysis
- **Description**: Identify content gaps and opportunities
- **Outputs**:
  - Current SEO score (0-100)
  - Topic coverage map
  - Keyword gap analysis
  - Competitor comparison
  - Recommended topics list with priority scores

#### F4.3 Brand Voice Extraction
- **Description**: Analyze existing content to define brand voice
- **Outputs**:
  - Tone profile (formal/casual, technical/simple)
  - Common phrases and terminology
  - Writing style guidelines
  - Do's and Don'ts list

#### F4.4 Research Dashboard
- **Description**: Centralized view of all client research
- **Components**:
  - Website health score
  - Content inventory
  - Keyword rankings
  - Traffic trends
  - Competitive landscape

### 8.2 User Stories

```gherkin
Feature: SEO Gap Analysis
  Scenario: Vendor runs SEO audit
    Given I am logged in as a vendor
    And I have a client with website URL configured
    When I click "Run SEO Audit"
    Then the system crawls the client's website
    And generates an SEO score
    And identifies topic clusters covered/not covered
    And recommends a content plan with estimated impact

  Scenario: Vendor generates pitch from audit
    Given I have completed an SEO audit for a client
    When I click "Generate Pitch Deck"
    Then the system creates a presentation with:
      | Baseline SEO score |
      | Topic gaps identified |
      | Recommended blog package |
      | Projected SEO improvement |
      | Investment and timeline |
```

---

## 9. Epic 5: AI-Powered Blog Generation Pipeline

### 9.1 Pipeline Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   RESEARCH   │───▶│   OUTLINE    │───▶│    DRAFT     │
│    Agent     │    │    Agent     │    │    Agent     │
└──────────────┘    └──────────────┘    └──────────────┘
                                              │
┌──────────────┐    ┌──────────────┐          ▼
│   PUBLISH    │◀───│    REVIEW    │◀───┌──────────────┐
│    Agent     │    │    Agent     │    │  SEO/IMAGE   │
└──────────────┘    └──────────────┘    │    Agent     │
                                        └──────────────┘
```

### 9.2 Features

#### F5.1 Research Agent
- **Inputs**: Topic, target audience, client context
- **Outputs**: Key points, statistics, sources, competitor analysis
- **Sources**: Web search, academic papers, industry reports

#### F5.2 Outline Agent
- **Inputs**: Research output, SEO keywords, template
- **Outputs**: H1-H3 structure, key points per section, FAQ suggestions
- **Features**: Multiple outline options, drag-drop reordering

#### F5.3 Draft Agent
- **Inputs**: Outline, brand voice, word count goal
- **Outputs**: Full article draft with sections
- **Features**: Section-by-section generation, inline citations

#### F5.4 SEO Agent
- **Inputs**: Draft content, target keywords
- **Outputs**: SEO score, optimization suggestions, meta tags
- **Checks**: Keyword density, readability, heading structure, internal links

#### F5.5 Image Agent
- **Inputs**: Article content, image requirements
- **Outputs**: Image suggestions, alt text, captions
- **Sources**: Stock photos (Unsplash, Pexels), AI-generated (DALL-E, Midjourney)

#### F5.6 Fact-Check Agent
- **Inputs**: Draft with claims
- **Outputs**: Verified claims, flagged unverified claims, source suggestions
- **Features**: Citation format selection, source quality scoring

### 9.3 Template System

| Template Type | Components |
|---------------|------------|
| **How-To Guide** | Introduction, Steps (numbered), Tips, Conclusion, FAQ |
| **Listicle** | Introduction, Numbered items with details, Summary |
| **Comparison** | Introduction, Feature matrix, Pros/Cons, Verdict |
| **Case Study** | Challenge, Solution, Results, Key Takeaways |
| **News Article** | Lead, Background, Quotes, Analysis, Conclusion |
| **Pillar Content** | Comprehensive sections, Internal links, Resources |

### 9.4 Batch Processing

```gherkin
Feature: Batch Blog Generation
  Scenario: Vendor processes topic CSV
    Given I have a CSV with 50 topics and parameters
    When I upload the CSV and click "Start Batch"
    Then the system:
      | Creates 50 blog post records |
      | Queues each for pipeline processing |
      | Shows progress dashboard |
      | Notifies me when batch is complete |

  Scenario: Pipeline failure handling
    Given a blog post is in the pipeline
    When an agent fails (e.g., research timeout)
    Then the post is marked with failure status
    And the error is logged with details
    And I can retry from the failed step
```

---

## 10. Epic 6: AI Review System

### 10.1 Features

#### F6.1 Automated AI Review
- **Description**: Multi-pass AI review of generated content
- **Review Types**:
  - Grammar and spelling check
  - Factual accuracy verification
  - Brand voice consistency
  - SEO optimization check
  - Plagiarism detection
  - Readability scoring

#### F6.2 Human Review Workflow
- **Description**: Kanban-style review board for editors
- **Columns**: AI Draft → Editor Review → Ready for Client → Changes Requested → Approved
- **Features**: 
  - Diff view between versions
  - Inline commenting
  - Approval with notes
  - Batch approval for multiple posts

#### F6.3 Client Review Portal
- **Description**: Client-facing review interface
- **Features**:
  - Read-only content preview
  - Approval/rejection with comments
  - Change request submission
  - Bulk approval option

#### F6.4 Review Analytics
- **Description**: Track review metrics and patterns
- **Metrics**:
  - Average review time
  - Rejection rate by reason
  - Editor productivity
  - Client approval rate

### 10.2 Review Workflow States

```yaml
AI_REVIEW:
  automated_checks:
    - grammar_check
    - fact_check
    - seo_check
    - plagiarism_check
  pass_threshold: 85%
  actions:
    pass: EDITOR_REVIEW
    fail: NEEDS_REVISION

EDITOR_REVIEW:
  assignee: vendor_editor
  SLA: 24_hours
  actions:
    approve: CLIENT_REVIEW
    request_changes: AI_REVISION
    escalate: VENDOR_ADMIN

CLIENT_REVIEW:
  assignee: client_reviewer
  SLA: 72_hours
  actions:
    approve: APPROVED
    request_changes: EDITOR_REVIEW
    reject: REJECTED
```

---

## 11. Epic 7: Newsletter System

### 11.1 Features

#### F7.1 Newsletter Builder
- **Description**: Drag-drop email builder for vendor newsletters
- **Components**:
  - Header with logo
  - Text blocks with rich formatting
  - Image blocks
  - Blog post cards (auto-populated)
  - CTA buttons
  - Footer with unsubscribe

#### F7.2 Template Library
- **Description**: Pre-built newsletter templates
- **Types**:
  - Monthly Progress Report
  - New Content Announcement
  - Performance Summary
  - Upcoming Work Preview
  - Holiday/Special Messages

#### F7.3 Audience Management
- **Description**: Manage newsletter recipients
- **Features**:
  - Client contact lists
  - Subscription preferences
  - Segment by client, project, or custom tags
  - Unsubscribe handling

#### F7.4 Scheduling & Automation
- **Description**: Schedule newsletters and set up automations
- **Automations**:
  - Project milestone notifications
  - Monthly report delivery
  - Content approval reminders
  - Performance threshold alerts

#### F7.5 Analytics
- **Description**: Track newsletter performance
- **Metrics**:
  - Open rate, click rate
  - Unsubscribe rate
  - Link click tracking
  - Device/client breakdown

### 11.2 Data Model

```sql
-- Newsletter templates
CREATE TABLE newsletter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  name TEXT NOT NULL,
  description TEXT,
  html_content TEXT NOT NULL,
  json_content JSONB,
  thumbnail_url TEXT,
  is_system_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter campaigns
CREATE TABLE newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  template_id UUID REFERENCES newsletter_templates(id),
  subject TEXT NOT NULL,
  preview_text TEXT,
  html_content TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter recipients
CREATE TABLE newsletter_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES newsletter_campaigns(id),
  email TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  status TEXT CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);
```

---

## 12. Epic 8: Integrations

### 12.1 Stripe Integration

#### F8.1.1 Subscription Management
- **Features**:
  - Create subscription plans (per-client, per-post, retainer)
  - Client subscription portal
  - Automatic billing
  - Usage-based billing option

#### F8.1.2 Invoice Management
- **Features**:
  - Generate invoices for projects
  - Send invoice emails
  - Track payment status
  - Overdue reminders

#### F8.1.3 Payment Links
- **Features**:
  - One-time payment links for ad-hoc work
  - Embed in client portal
  - Track conversions

#### F8.1.4 Webhook Handling
- **Events**:
  - `invoice.paid` → Mark project as paid
  - `customer.subscription.updated` → Update client status
  - `payment_intent.payment_failed` → Send alert

### 12.2 Resend Integration

#### F8.2.1 Transactional Emails
- **Types**:
  - User invitations
  - Password resets
  - Project notifications
  - Approval requests
  - Report deliveries

#### F8.2.2 Email Templates
- **System Templates**:
  - Welcome email
  - Project started
  - Content ready for review
  - Content approved
  - Content published
  - Monthly report

### 12.3 Gmail Integration

#### F8.3.1 Email Sync
- **Features**:
  - Connect vendor Gmail accounts
  - Sync client-related emails
  - Thread view in app
  - Search across emails

#### F8.3.2 Compose & Send
- **Features**:
  - Compose emails from within app
  - Email templates
  - Attachment support
  - Send on behalf of vendor

#### F8.3.3 Activity Logging
- **Features**:
  - Log emails to client timeline
  - Associate emails with projects
  - Searchable email history

### 12.4 Integration Data Model

```sql
-- Stripe integration
CREATE TABLE stripe_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  stripe_account_id TEXT NOT NULL,
  stripe_customer_id TEXT,
  is_connected BOOLEAN DEFAULT FALSE,
  livemode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  stripe_subscription_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gmail integration
CREATE TABLE gmail_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id),
  gmail_address TEXT NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_connection_id UUID REFERENCES gmail_connections(id),
  client_id UUID REFERENCES clients(id),
  project_id UUID REFERENCES content_batches(id),
  gmail_thread_id TEXT NOT NULL,
  subject TEXT,
  snippet TEXT,
  last_message_at TIMESTAMPTZ,
  message_count INT DEFAULT 0,
  is_read BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 13. Epic 9: Vendor Dev Access

### 13.1 Features

#### F9.1 API Key Management
- **Features**:
  - Generate API keys with scopes
  - Key rotation
  - Usage limits and rate limiting
  - Key revocation

#### F9.2 Webhook Configuration
- **Features**:
  - Register webhook endpoints
  - Select events to subscribe
  - Webhook signature verification
  - Retry configuration
  - Delivery logs

#### F9.3 Developer Portal
- **Features**:
  - API documentation (OpenAPI/Swagger)
  - Interactive API explorer
  - Code examples (Node, Python, cURL)
  - SDKs download
  - Changelog

#### F9.4 Sandbox Environment
- **Features**:
  - Separate test environment
  - Test data generation
  - Webhook testing tools
  - Mock payment flows

### 13.2 API Scopes

| Scope | Description | Endpoints |
|-------|-------------|-----------|
| `clients:read` | Read client data | GET /api/v1/clients |
| `clients:write` | Modify client data | POST/PUT/DELETE /api/v1/clients |
| `content:read` | Read blog posts | GET /api/v1/posts |
| `content:write` | Create/edit posts | POST/PUT /api/v1/posts |
| `publish` | Publish to CMS | POST /api/v1/publish |
| `analytics:read` | Read analytics | GET /api/v1/analytics |
| `billing:read` | Read invoices | GET /api/v1/invoices |
| `billing:write` | Create invoices | POST /api/v1/invoices |

### 13.3 Webhook Events

| Event | Payload |
|-------|---------|
| `post.created` | Post ID, client ID, topic, status |
| `post.status_changed` | Post ID, old status, new status |
| `post.published` | Post ID, CMS URL, publish date |
| `client.created` | Client ID, name, website |
| `review.requested` | Post ID, reviewer, deadline |
| `review.completed` | Post ID, decision, comments |
| `invoice.created` | Invoice ID, amount, client |
| `payment.received` | Invoice ID, amount, method |

---

## 14. Database Schema Extensions

### 14.1 New Tables Required

```sql
-- Vendors (multi-tenant root)
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT,
  settings JSONB DEFAULT '{}',
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users with roles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL, -- Supabase auth.users.id
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  vendor_id UUID REFERENCES vendors(id),
  client_id UUID REFERENCES clients(id),
  role TEXT NOT NULL CHECK (role IN (
    'platform_admin', 'vendor_admin', 'vendor_editor', 
    'vendor_csm', 'client_admin', 'client_reviewer'
  )),
  preferences JSONB DEFAULT '{}',
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work declarations
CREATE TABLE work_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  vendor_id UUID REFERENCES vendors(id),
  title TEXT NOT NULL,
  description TEXT,
  deliverables JSONB NOT NULL, -- Array of deliverable items
  status TEXT DEFAULT 'declared',
  declared_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  progress_percentage INT DEFAULT 0,
  created_by UUID REFERENCES users(id)
);

-- Project milestones
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_declaration_id UUID REFERENCES work_declarations(id),
  content_batch_id UUID REFERENCES content_batches(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  order_index INT
);

-- API keys for dev access
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- bcrypt hash of the key
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  scopes TEXT[] NOT NULL,
  rate_limit_per_minute INT DEFAULT 60,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  retry_count INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook deliveries
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id),
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INT,
  response_body TEXT,
  delivered_at TIMESTAMPTZ,
  attempts INT DEFAULT 0,
  next_retry_at TIMESTAMPTZ
);
```

### 14.2 Modify Existing Tables

```sql
-- Add vendor_id to clients
ALTER TABLE clients ADD COLUMN vendor_id UUID REFERENCES vendors(id);

-- Add vendor_id to content_batches  
ALTER TABLE content_batches ADD COLUMN vendor_id UUID REFERENCES vendors(id);

-- Add approval tracking to blog_posts
ALTER TABLE blog_posts ADD COLUMN 
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT;
```

---

## 15. API Specifications

### 15.1 Core API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Clients** |||
| GET | `/api/v1/clients` | List all clients |
| POST | `/api/v1/clients` | Create client |
| GET | `/api/v1/clients/:id` | Get client details |
| PUT | `/api/v1/clients/:id` | Update client |
| DELETE | `/api/v1/clients/:id` | Archive client |
| **Content** |||
| GET | `/api/v1/posts` | List posts with filters |
| POST | `/api/v1/posts` | Create post |
| GET | `/api/v1/posts/:id` | Get post details |
| PUT | `/api/v1/posts/:id` | Update post |
| POST | `/api/v1/posts/:id/generate` | Trigger AI generation |
| POST | `/api/v1/posts/:id/review` | Submit review |
| POST | `/api/v1/posts/:id/publish` | Publish to CMS |
| **Batches** |||
| POST | `/api/v1/batches` | Create content batch |
| POST | `/api/v1/batches/import` | Import from CSV |
| GET | `/api/v1/batches/:id/progress` | Get batch progress |
| **Files** |||
| POST | `/api/v1/files/upload` | Upload file |
| GET | `/api/v1/files/:id` | Get file metadata |
| GET | `/api/v1/files/:id/download` | Download file |
| POST | `/api/v1/files/:id/share` | Create share link |
| **Newsletters** |||
| GET | `/api/v1/newsletters` | List campaigns |
| POST | `/api/v1/newsletters` | Create campaign |
| POST | `/api/v1/newsletters/:id/send` | Send campaign |
| GET | `/api/v1/newsletters/:id/stats` | Get campaign stats |
| **Billing** |||
| GET | `/api/v1/invoices` | List invoices |
| POST | `/api/v1/invoices` | Create invoice |
| POST | `/api/v1/subscriptions` | Create subscription |
| POST | `/api/v1/payment-links` | Create payment link |

---

## 16. Security Requirements

### 16.1 Authentication

- **Method**: Supabase Auth with JWT tokens
- **MFA**: Optional for vendor admins, enforced for platform admins
- **Session**: 7-day sliding window, 30-day maximum

### 16.2 Authorization

- **RLS**: Row Level Security on all tables
- **Role Checks**: Middleware validation on all API routes
- **Scope Checks**: API key scope validation

### 16.3 Data Protection

- **Encryption at Rest**: Supabase default encryption
- **Encryption in Transit**: TLS 1.3
- **PII Handling**: Encrypted storage for tokens, passwords
- **Audit Logging**: All data access logged

### 16.4 Compliance

- **GDPR**: Data export, deletion capabilities
- **SOC 2**: Audit trails, access controls
- **PCI DSS**: Stripe handles all payment data

---

## 17. Success Metrics

### 17.1 Platform Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Vendor onboarding time | < 10 minutes | Time from signup to first client |
| Client onboarding time | < 5 minutes | Time from invite to active |
| Content pipeline throughput | 100 posts/day | Posts processed per day |
| AI review accuracy | > 90% | Human override rate |
| System uptime | 99.9% | Monthly availability |

### 17.2 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Client approval rate | > 85% | First-pass approvals |
| Content publish rate | > 95% | Approved posts published |
| Newsletter engagement | > 30% open rate | Email opens |
| Payment collection | > 98% | Successful payments |
| Client retention | > 90% | Annual retention |

### 17.3 User Satisfaction

| Metric | Target | Method |
|--------|--------|--------|
| Vendor NPS | > 50 | Quarterly survey |
| Client NPS | > 60 | Quarterly survey |
| Support ticket volume | < 5% of users | Monthly tracking |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Vendor** | Content agency using BlogCanvas to serve clients |
| **Client** | Business receiving blog content from a vendor |
| **Content Batch** | Collection of blog posts for a specific campaign |
| **Topic Cluster** | Group of related topics for SEO strategy |
| **Work Declaration** | Vendor's commitment of deliverables to client |
| **Pipeline** | Automated workflow from research to publish |
| **Check-back** | Scheduled performance review of published content |

---

## Appendix B: Related Documents

- `PRD_STATEMENT.md` - Original vision statement
- `PRD.txt` - Previous PRD version
- `DEPLOYMENT_CHECKLIST.md` - Deployment guide
- `docs/SUPABASE_SETUP.md` - Database setup
- `docs/VERCEL_DEPLOYMENT.md` - Hosting guide

---

*Document maintained by BlogCanvas development team. Last updated: January 10, 2026*
