# API Reference - BlogCanvas

Complete reference for BlogCanvas REST API endpoints.

**Base URL:** `http://localhost:4848/api` (development)
**Production:** `https://your-domain.com/api`

**Total Endpoints:** 235+ REST API routes

---

## Table of Contents

1. [Authentication](#authentication)
2. [Clients](#clients)
3. [Websites](#websites)
4. [SEO Audits](#seo-audits)
5. [Content Batches](#content-batches)
6. [Blog Posts](#blog-posts)
7. [AI Pipeline](#ai-pipeline)
8. [Publishing](#publishing)
9. [Analytics & Reports](#analytics--reports)
10. [Comments & Reviews](#comments--reviews)
11. [Brand Guides](#brand-guides)
12. [Integrations](#integrations)

---

## Authentication

BlogCanvas uses Supabase Auth with JWT tokens. All API requests require authentication unless otherwise noted.

### Headers

```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Getting Your Token

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| `vendor_admin` | Full access to all vendor features |
| `vendor_editor` | Create/edit content, no billing or settings |
| `client_admin` | Full client portal access, can invite reviewers |
| `client_reviewer` | View and approve content only |

---

## Clients

### List Clients

Get all clients with pagination and stats.

**Endpoint:** `GET /api/clients`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |
| `sortBy` | string | created_at | Sort column |
| `sortOrder` | string | desc | asc or desc |

**Example Request:**

```bash
curl -X GET "http://localhost:4848/api/clients?page=1&limit=20&sortBy=name&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "website_url": "https://acme.com",
      "contact_email": "john@acme.com",
      "contact_name": "John Doe",
      "status": "active",
      "industry": "Technology",
      "niche": "SaaS",
      "created_at": "2026-01-01T00:00:00Z",
      "websites": [{ "count": 3 }],
      "blog_posts": [{ "count": 42 }],
      "content_batches": [{ "count": 5 }]
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1,
  "totalPages": 1
}
```

---

### Create Client

Create a new client and optionally send invitation.

**Endpoint:** `POST /api/clients`

**Request Body:**

```json
{
  "name": "Acme Corp",
  "website": "https://acme.com",
  "contact_email": "john@acme.com",
  "contact_name": "John Doe",
  "onboarding_method": "manual_intake",
  "send_invitation": true,
  "client_role": "client_admin",
  "industry": "Technology",
  "niche": "SaaS",
  "company_size": "50-200",
  "business_goals": ["increase_traffic", "improve_conversions"],
  "seo_goals": {
    "target_score": 80,
    "current_score": 62,
    "timeline_months": 6
  },
  "target_markets": ["North America", "Europe"],
  "brand_values": ["Innovation", "Reliability", "Customer-First"],
  "key_differentiators": "AI-powered automation for enterprise",
  "content_topics": ["Product Features", "Industry Trends", "Case Studies"]
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:4848/api/clients" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "website": "https://acme.com",
    "contact_email": "john@acme.com",
    "contact_name": "John Doe",
    "send_invitation": true
  }'
```

**Response:**

```json
{
  "success": true,
  "client": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "status": "onboarding",
    "created_at": "2026-01-15T12:00:00Z"
  },
  "invitation": {
    "sent": true,
    "invitationUrl": "http://localhost:4848/auth/client?token=abc123",
    "expiresAt": "2026-01-22T12:00:00Z"
  },
  "message": "Client created and invitation sent successfully"
}
```

---

## Websites

### Create Website

Add a website to a client for analysis.

**Endpoint:** `POST /api/websites`

**Request Body:**

```json
{
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://acme.com",
  "platform": "wordpress",
  "name": "Acme Main Site"
}
```

**Response:**

```json
{
  "success": true,
  "website": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "client_id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "https://acme.com",
    "platform": "wordpress",
    "name": "Acme Main Site",
    "seo_score": null,
    "last_crawled_at": null,
    "created_at": "2026-01-15T12:00:00Z"
  }
}
```

---

### Scrape Website

Trigger a website crawl and SEO audit.

**Endpoint:** `POST /api/websites/scrape`

**Request Body:**

```json
{
  "websiteId": "660e8400-e29b-41d4-a716-446655440001",
  "full_crawl": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Scraping started",
  "job": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "status": "running",
    "progress": 0,
    "pages_discovered": 0
  }
}
```

**Status Codes:**
- `202` - Crawl job started
- `400` - Invalid websiteId
- `500` - Crawl failed to start

---

## SEO Audits

### Get Audit Results

Retrieve SEO audit results for a website.

**Endpoint:** `GET /api/websites/{websiteId}/audit`

**Response:**

```json
{
  "success": true,
  "audit": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "website_id": "660e8400-e29b-41d4-a716-446655440001",
    "baseline_score": 62,
    "pages_indexed": 127,
    "audit_date": "2026-01-15T12:00:00Z",
    "recommendations": [
      "Add meta descriptions to 42 pages",
      "Improve internal linking structure",
      "Optimize images (87 missing alt tags)"
    ],
    "raw_metrics_json": {
      "mobile_friendly": true,
      "https_enabled": true,
      "avg_page_load_time": 2.3,
      "broken_links": 5,
      "missing_meta_descriptions": 42,
      "missing_alt_tags": 87,
      "h1_issues": 12
    }
  },
  "previous_audit": {
    "baseline_score": 58,
    "audit_date": "2025-12-15T12:00:00Z"
  },
  "improvement": 4
}
```

---

### Project SEO Score

Calculate projected SEO score after content plan.

**Endpoint:** `POST /api/websites/{websiteId}/project-score`

**Request Body:**

```json
{
  "current_score": 62,
  "target_score": 80,
  "timeline_months": 6
}
```

**Response:**

```json
{
  "success": true,
  "projection": {
    "current_score": 62,
    "target_score": 80,
    "increase": 18,
    "timeline_months": 6,
    "posts_required": 24,
    "posts_per_month": 4,
    "confidence": "high"
  },
  "cost_estimate": {
    "total_posts": 24,
    "price_range": "$6,000 - $12,000",
    "monthly_retainer": "$1,000 - $2,000/month",
    "cost_per_post": 300,
    "total_min": 6000,
    "total_max": 12000,
    "monthly_min": 1000,
    "monthly_max": 2000
  },
  "milestones": [
    { "month": 1, "posts": 4, "projected_score": 65 },
    { "month": 2, "posts": 8, "projected_score": 68 },
    { "month": 3, "posts": 12, "projected_score": 71 },
    { "month": 4, "posts": 16, "projected_score": 74 },
    { "month": 5, "posts": 20, "projected_score": 77 },
    { "month": 6, "posts": 24, "projected_score": 80 }
  ]
}
```

---

## Content Batches

### Create Content Batch

Create a new content batch for a website.

**Endpoint:** `POST /api/content-batches`

**Request Body:**

```json
{
  "website_id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Q1 2026 Content Push",
  "goal_score_from": 62,
  "goal_score_to": 80,
  "start_date": "2026-01-01",
  "end_date": "2026-03-31",
  "total_posts": 24,
  "cadence": "weekly"
}
```

**Response:**

```json
{
  "success": true,
  "batch": {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "website_id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Q1 2026 Content Push",
    "goal_score_from": 62,
    "goal_score_to": 80,
    "status": "planned",
    "total_posts": 24,
    "posts_completed": 0,
    "posts_approved": 0,
    "posts_published": 0,
    "created_at": "2026-01-15T12:00:00Z"
  }
}
```

---

### Import Topics via CSV

Import blog post topics from CSV.

**Endpoint:** `POST /api/content-batches/{batchId}/import`

**Request Body:** (multipart/form-data)

```
file: topics.csv
```

**CSV Format:**

```csv
topic,keywords,target_audience,template
"How to Choose CRM Software","crm software, business software","B2B decision makers","how-to"
"CRM Integration Best Practices","crm integration, api","IT managers","guide"
```

**Response:**

```json
{
  "success": true,
  "imported": 2,
  "failed": 0,
  "posts": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "title": "How to Choose CRM Software",
      "target_keyword": "crm software, business software",
      "status": "draft"
    }
  ],
  "errors": []
}
```

---

### Export Batch Topics

Export batch topics as CSV.

**Endpoint:** `GET /api/content-batches/{batchId}/export`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `format` | string | csv or json |
| `status` | string | Filter by status (optional) |

**Response:**

```csv
id,title,target_keyword,status,seo_quality_score,created_at
aa0e8400-e29b-41d4-a716-446655440005,"How to Choose CRM Software","crm software",published,85,2026-01-15T12:00:00Z
bb0e8400-e29b-41d4-a716-446655440006,"CRM Integration Guide","crm integration",client_review,78,2026-01-16T09:00:00Z
```

---

## Blog Posts

### Create Blog Post

Create a new blog post.

**Endpoint:** `POST /api/blog-posts`

**Request Body:**

```json
{
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "content_batch_id": "990e8400-e29b-41d4-a716-446655440004",
  "topic_cluster_id": "cc0e8400-e29b-41d4-a716-446655440007",
  "title": "How to Choose CRM Software in 2026",
  "target_keyword": "crm software",
  "search_intent": "informational",
  "due_date": "2026-02-01"
}
```

**Response:**

```json
{
  "success": true,
  "post": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "title": "How to Choose CRM Software in 2026",
    "slug": "how-to-choose-crm-software-in-2026",
    "status": "draft",
    "target_keyword": "crm software",
    "seo_quality_score": null,
    "created_at": "2026-01-15T12:00:00Z"
  }
}
```

---

### Get Blog Post with Revisions

Retrieve a blog post and its revision history.

**Endpoint:** `GET /api/blog-posts/{postId}`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `include_revisions` | boolean | Include revision history |
| `include_comments` | boolean | Include comments |

**Response:**

```json
{
  "success": true,
  "post": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "title": "How to Choose CRM Software in 2026",
    "slug": "how-to-choose-crm-software-in-2026",
    "status": "editor_review",
    "target_keyword": "crm software",
    "seo_quality_score": 82,
    "content": "Full blog post content here...",
    "meta_description": "Learn how to choose the right CRM software...",
    "created_at": "2026-01-15T12:00:00Z",
    "updated_at": "2026-01-16T14:30:00Z"
  },
  "revisions": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440008",
      "revision_type": "draft",
      "created_at": "2026-01-15T14:00:00Z",
      "created_by": null,
      "metadata": { "agent": "drafting_agent", "tokens": 2500 }
    },
    {
      "id": "ee0e8400-e29b-41d4-a716-446655440009",
      "revision_type": "seo_pass",
      "created_at": "2026-01-15T14:15:00Z",
      "created_by": null,
      "metadata": { "agent": "seo_agent", "improvements": ["Added meta description", "Optimized H2 tags"] }
    },
    {
      "id": "ff0e8400-e29b-41d4-a716-44665544000a",
      "revision_type": "human_edit",
      "created_at": "2026-01-16T10:00:00Z",
      "created_by": "user-uuid-here",
      "metadata": { "changes": "Improved introduction, added examples" }
    }
  ]
}
```

---

### Get Revision History

Get all revisions for a blog post.

**Endpoint:** `GET /api/blog-posts/{postId}/revisions`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by revision_type |
| `limit` | integer | Number of revisions (default 50) |
| `offset` | integer | Pagination offset |

**Response:**

```json
{
  "success": true,
  "revisions": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440008",
      "blog_post_id": "aa0e8400-e29b-41d4-a716-446655440005",
      "revision_type": "draft",
      "content": "Full content snapshot...",
      "created_by": null,
      "created_at": "2026-01-15T14:00:00Z",
      "metadata": {
        "agent": "drafting_agent",
        "model": "gpt-4o",
        "tokens": 2500,
        "cost": 0.05
      }
    }
  ],
  "total": 5
}
```

---

### Create Revision

Create a new revision (typically after human edit).

**Endpoint:** `POST /api/blog-posts/{postId}/revisions`

**Request Body:**

```json
{
  "revision_type": "human_edit",
  "content": "Updated blog post content...",
  "metadata": {
    "changes": "Improved introduction, added case studies",
    "editor_notes": "Ready for client review"
  }
}
```

**Response:**

```json
{
  "success": true,
  "revision": {
    "id": "gg0e8400-e29b-41d4-a716-44665544000b",
    "blog_post_id": "aa0e8400-e29b-41d4-a716-446655440005",
    "revision_type": "human_edit",
    "created_at": "2026-01-16T14:30:00Z",
    "created_by": "user-uuid-here"
  }
}
```

---

### Update Blog Post Status

Transition blog post through workflow states.

**Endpoint:** `PATCH /api/blog-posts/{postId}/status`

**Request Body:**

```json
{
  "status": "client_review",
  "notes": "Ready for client approval"
}
```

**Valid Status Transitions:**
- `draft` → `ai_drafting`
- `ai_drafting` → `editor_review`
- `editor_review` → `client_review` (requires editor sign-off)
- `client_review` → `approved` (requires client approval)
- `approved` → `published`

**Response:**

```json
{
  "success": true,
  "post": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "status": "client_review",
    "updated_at": "2026-01-16T15:00:00Z"
  }
}
```

---

## AI Pipeline

### Generate Outline

Trigger AI outline generation for a blog post.

**Endpoint:** `POST /api/blog-posts/{postId}/generate-outline`

**Request Body:**

```json
{
  "model": "gpt-4o",
  "temperature": 0.7,
  "include_faqs": true,
  "include_tables": true
}
```

**Response:**

```json
{
  "success": true,
  "agent_run": {
    "id": "hh0e8400-e29b-41d4-a716-44665544000c",
    "status": "running",
    "started_at": "2026-01-15T13:00:00Z"
  },
  "message": "Outline generation started"
}
```

**Polling for Results:**

```bash
GET /api/agent-runs/{agentRunId}
```

**Completed Response:**

```json
{
  "success": true,
  "agent_run": {
    "id": "hh0e8400-e29b-41d4-a716-44665544000c",
    "status": "completed",
    "completed_at": "2026-01-15T13:02:00Z",
    "input_tokens": 500,
    "output_tokens": 800,
    "cost": 0.02
  },
  "output": {
    "outline": {
      "introduction": "Hook and preview",
      "sections": [
        {
          "heading": "What is CRM Software?",
          "subheadings": ["Definition", "Key Features", "Benefits"]
        },
        {
          "heading": "How to Choose the Right CRM",
          "subheadings": ["Assess Your Needs", "Compare Options", "Try Before You Buy"]
        }
      ],
      "faqs": [
        { "question": "How much does CRM software cost?", "answer": "..." }
      ]
    }
  }
}
```

---

### Generate Full Draft

Generate full blog post content from outline.

**Endpoint:** `POST /api/blog-posts/{postId}/generate-draft`

**Request Body:**

```json
{
  "model": "gpt-4o",
  "word_count_target": 2000,
  "include_examples": true,
  "tone": "professional"
}
```

**Response:** Similar to outline generation (async job)

---

### SEO Optimization Pass

Run SEO optimization agent on existing draft.

**Endpoint:** `POST /api/blog-posts/{postId}/seo-optimize`

**Response:**

```json
{
  "success": true,
  "improvements": [
    "Added meta description (155 chars)",
    "Optimized title tag",
    "Added internal links (3)",
    "Improved keyword density (1.2% → 1.8%)",
    "Added alt tags to images"
  ],
  "seo_score_before": 72,
  "seo_score_after": 85,
  "revised_content": "Updated content with SEO improvements..."
}
```

---

## Publishing

### Publish to WordPress

Publish a blog post to WordPress.

**Endpoint:** `POST /api/publish`

**Request Body:**

```json
{
  "blog_post_id": "aa0e8400-e29b-41d4-a716-446655440005",
  "cms_connection_id": "ii0e8400-e29b-41d4-a716-44665544000d",
  "publish_immediately": true,
  "scheduled_for": null,
  "options": {
    "status": "publish",
    "author_id": 1,
    "category_ids": [5, 12],
    "tags": ["CRM", "Business Software", "Productivity"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "published": {
    "wordpress_post_id": 1234,
    "url": "https://acme.com/blog/how-to-choose-crm-software-in-2026",
    "published_at": "2026-01-17T10:00:00Z"
  },
  "post_updated": {
    "status": "published",
    "cms_url": "https://acme.com/blog/how-to-choose-crm-software-in-2026"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Authentication failed",
  "details": "Invalid WordPress credentials",
  "retry_possible": true
}
```

---

### Batch Publish

Publish multiple approved posts at once.

**Endpoint:** `POST /api/publishing/batch`

**Request Body:**

```json
{
  "blog_post_ids": [
    "aa0e8400-e29b-41d4-a716-446655440005",
    "bb0e8400-e29b-41d4-a716-446655440006"
  ],
  "cms_connection_id": "ii0e8400-e29b-41d4-a716-44665544000d",
  "schedule_strategy": "spread",
  "start_date": "2026-01-20",
  "end_date": "2026-02-20",
  "time_of_day": "09:00"
}
```

**Response:**

```json
{
  "success": true,
  "queued": 2,
  "schedule": [
    {
      "blog_post_id": "aa0e8400-e29b-41d4-a716-446655440005",
      "scheduled_for": "2026-01-20T09:00:00Z"
    },
    {
      "blog_post_id": "bb0e8400-e29b-41d4-a716-446655440006",
      "scheduled_for": "2026-02-05T09:00:00Z"
    }
  ]
}
```

---

## Analytics & Reports

### Get Blog Post Metrics

Retrieve performance metrics for a published post.

**Endpoint:** `GET /api/blog-posts/{postId}/metrics`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | date | Start date (YYYY-MM-DD) |
| `end_date` | date | End date (YYYY-MM-DD) |

**Response:**

```json
{
  "success": true,
  "post": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "title": "How to Choose CRM Software in 2026",
    "published_at": "2026-01-17T10:00:00Z"
  },
  "metrics": [
    {
      "snapshot_date": "2026-01-24",
      "days_since_publish": 7,
      "impressions": 1250,
      "clicks": 87,
      "ctr": 6.96,
      "avg_position": 12.3,
      "sessions": 72,
      "avg_time_on_page": 245,
      "conversions": 3
    },
    {
      "snapshot_date": "2026-02-17",
      "days_since_publish": 30,
      "impressions": 4820,
      "clicks": 342,
      "ctr": 7.09,
      "avg_position": 8.1,
      "sessions": 298,
      "avg_time_on_page": 267,
      "conversions": 12
    }
  ],
  "summary": {
    "total_impressions": 18450,
    "total_clicks": 1205,
    "avg_position": 7.2,
    "position_improvement": 5.1,
    "total_conversions": 45
  }
}
```

---

### Generate Report

Generate a client report for a period.

**Endpoint:** `POST /api/reports/generate`

**Request Body:**

```json
{
  "website_id": "660e8400-e29b-41d4-a716-446655440001",
  "report_type": "pdf",
  "period_start": "2026-01-01",
  "period_end": "2026-01-31",
  "include_sections": [
    "seo_score_progress",
    "top_performing_posts",
    "traffic_growth",
    "keyword_rankings",
    "recommendations"
  ]
}
```

**Response:**

```json
{
  "success": true,
  "report": {
    "id": "jj0e8400-e29b-41d4-a716-44665544000e",
    "report_type": "pdf",
    "generated_at": "2026-02-01T09:00:00Z",
    "storage_url": "https://storage.supabase.co/reports/jan-2026-report.pdf",
    "download_url": "https://blogcanvas.com/reports/jj0e8400.../download"
  }
}
```

---

## Comments & Reviews

### Create Comment

Add a comment to a blog post.

**Endpoint:** `POST /api/comments`

**Request Body:**

```json
{
  "blog_post_id": "aa0e8400-e29b-41d4-a716-446655440005",
  "parent_comment_id": null,
  "content": "Please add more examples in the pricing section"
}
```

**Response:**

```json
{
  "success": true,
  "comment": {
    "id": "kk0e8400-e29b-41d4-a716-44665544000f",
    "blog_post_id": "aa0e8400-e29b-41d4-a716-446655440005",
    "author_id": "user-uuid-here",
    "author": {
      "full_name": "Jane Smith",
      "role": "client_admin"
    },
    "content": "Please add more examples in the pricing section",
    "is_resolved": false,
    "created_at": "2026-01-16T15:30:00Z"
  }
}
```

---

### Client Approval

Submit client approval/rejection for a blog post.

**Endpoint:** `POST /api/client-approvals`

**Request Body:**

```json
{
  "blog_post_id": "aa0e8400-e29b-41d4-a716-446655440005",
  "approval_status": "approved",
  "feedback": "Great work! Post looks excellent."
}
```

**Valid Statuses:**
- `approved` - Accept post, move to approved status
- `rejected` - Reject post, send back to editing
- `changes_requested` - Request specific changes

**Response:**

```json
{
  "success": true,
  "approval": {
    "id": "ll0e8400-e29b-41d4-a716-446655440010",
    "blog_post_id": "aa0e8400-e29b-41d4-a716-446655440005",
    "approval_status": "approved",
    "approved_by": "user-uuid-here",
    "approved_at": "2026-01-17T09:00:00Z"
  },
  "post_status_updated": "approved"
}
```

---

## Brand Guides

### Get Brand Guide

Retrieve brand guide for a client.

**Endpoint:** `GET /api/clients/{clientId}/brand-guide`

**Response:**

```json
{
  "success": true,
  "brand_guide": {
    "id": "mm0e8400-e29b-41d4-a716-446655440011",
    "client_id": "550e8400-e29b-41d4-a716-446655440000",
    "company_name": "Acme Corp",
    "brand_voice": "Professional yet approachable, focusing on innovation and reliability",
    "target_audience": "B2B decision makers, IT managers, CTOs",
    "key_messages": [
      "AI-powered automation that saves time",
      "Enterprise-grade security and compliance",
      "Award-winning customer support"
    ],
    "do_not_mention": [
      "Competitor names",
      "Pricing (unless approved)",
      "Unverified statistics"
    ],
    "tone_guidelines": {
      "do": ["Use active voice", "Include data and examples", "Be concise"],
      "dont": ["Use jargon without explanation", "Make unsubstantiated claims", "Use humor"]
    }
  },
  "products": [
    {
      "name": "Acme CRM Pro",
      "description": "Enterprise CRM with AI automation",
      "key_features": ["AI lead scoring", "Pipeline automation", "Advanced reporting"]
    }
  ],
  "faqs": [
    {
      "question": "What integrations does Acme support?",
      "answer": "Acme integrates with 500+ tools including Salesforce, HubSpot, and Slack"
    }
  ]
}
```

---

## Integrations

### Create CMS Connection

Connect a WordPress site for publishing.

**Endpoint:** `POST /api/cms-connections`

**Request Body:**

```json
{
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "platform": "wordpress",
  "site_url": "https://acme.com",
  "auth_type": "application_password",
  "credentials": {
    "username": "admin",
    "application_password": "xxxx xxxx xxxx xxxx xxxx xxxx"
  }
}
```

**Response:**

```json
{
  "success": true,
  "connection": {
    "id": "ii0e8400-e29b-41d4-a716-44665544000d",
    "platform": "wordpress",
    "site_url": "https://acme.com",
    "is_active": true,
    "last_tested_at": "2026-01-15T12:00:00Z",
    "test_status": "success"
  }
}
```

---

### Test CMS Connection

Verify CMS credentials work.

**Endpoint:** `POST /api/cms-connections/{connectionId}/test`

**Response:**

```json
{
  "success": true,
  "test_result": {
    "connected": true,
    "site_info": {
      "name": "Acme Corp Blog",
      "url": "https://acme.com",
      "wordpress_version": "6.4.2"
    },
    "permissions": {
      "can_create_posts": true,
      "can_upload_media": true,
      "can_manage_categories": true
    }
  }
}
```

---

## Error Handling

All API endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": "Additional context (optional)"
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 202 | Accepted | Async job started |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource or invalid state transition |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Internal server error |

---

## Rate Limiting

API requests are rate limited per client:

- **Vendor users:** 1000 requests/hour
- **Client users:** 100 requests/hour
- **AI generation endpoints:** 10 concurrent jobs per client

Rate limit headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1642435200
```

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sortBy` - Sort column
- `sortOrder` - asc or desc

**Response Format:**

```json
{
  "success": true,
  "data": [...],
  "page": 1,
  "limit": 20,
  "total": 156,
  "totalPages": 8
}
```

---

## Filtering

Many list endpoints support filtering via query parameters:

```bash
# Filter blog posts by status and batch
GET /api/blog-posts?status=client_review&content_batch_id=990e8400...

# Filter by date range
GET /api/blog-posts?created_after=2026-01-01&created_before=2026-01-31

# Search by keyword
GET /api/blog-posts?search=crm+software
```

---

## Webhooks

Configure webhooks to receive real-time notifications:

**Supported Events:**
- `post.status_changed`
- `post.published`
- `batch.completed`
- `client.approval_received`
- `report.generated`

**Webhook Payload:**

```json
{
  "event": "post.published",
  "timestamp": "2026-01-17T10:00:00Z",
  "data": {
    "blog_post_id": "aa0e8400-e29b-41d4-a716-446655440005",
    "title": "How to Choose CRM Software in 2026",
    "cms_url": "https://acme.com/blog/how-to-choose-crm-software-in-2026"
  }
}
```

---

## SDK Examples

### TypeScript/JavaScript

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Create client
const { data: client, error } = await supabase
  .from('clients')
  .insert({
    name: 'Acme Corp',
    contact_email: 'john@acme.com'
  })
  .select()
  .single()

// Fetch blog posts
const { data: posts } = await supabase
  .from('blog_posts')
  .select('*, content_batches(*)')
  .eq('status', 'client_review')
  .order('created_at', { ascending: false })
  .limit(20)
```

### cURL

```bash
# List clients
curl -X GET "http://localhost:4848/api/clients?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create blog post
curl -X POST "http://localhost:4848/api/blog-posts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "550e8400-...",
    "title": "My New Post",
    "target_keyword": "seo tips"
  }'
```

---

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md) - Data model reference
- [Architecture Overview](./ARCHITECTURE.md) - System design
- [Contribution Guide](./CONTRIBUTING.md) - Development workflow

---

**Last Updated:** 2026-01-15
**API Version:** 2.0
**Total Endpoints:** 235+
