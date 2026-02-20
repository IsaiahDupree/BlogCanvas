# BlogCanvas API Documentation

**Version:** 1.0.0
**Generated:** 2026-02-20T01:27:48.393Z

## Base URLs

- **Development:** http://localhost:4848/api
- **Production:** https://app.blogcanvas.com/api

## Authentication

Most endpoints require authentication via Bearer token (JWT).

Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints


### Ai

#### POST /ai/agents/draft

POST /api/ai/agents/draft
Writes complete blog post content following an outline
PRD feat-119: AI Pipeline - Drafting Agent Endpoint

**Authentication:** Required

**File:** `src/app/api/ai/agents/draft/route.ts`

---

#### POST /ai/agents/enhance

POST /api/ai/agents/enhance
Adds visual and structural elements to improve engagement
PRD feat-119: AI Pipeline - Enhancement Agent Endpoint

**Authentication:** Required

**File:** `src/app/api/ai/agents/enhance/route.ts`

---

#### POST /ai/agents/fact-check

POST /api/ai/agents/fact-check
Verifies claims and adds credible sources
PRD feat-119: AI Pipeline - Fact-Check Agent Endpoint

**Authentication:** Required

**File:** `src/app/api/ai/agents/fact-check/route.ts`

---

#### POST /ai/agents/outline

POST /api/ai/agents/outline
Creates structured content outline with H2/H3 structure, FAQs, and table ideas
PRD feat-119: AI Pipeline - Outline Agent Endpoint

**Authentication:** Required

**File:** `src/app/api/ai/agents/outline/route.ts`

---

#### POST /ai/agents/seo

POST /api/ai/agents/seo
Optimizes content for search engines without compromising readability
PRD feat-119: AI Pipeline - SEO Agent Endpoint

**Authentication:** Required

**File:** `src/app/api/ai/agents/seo/route.ts`

---

#### POST /ai/content-analysis

**Authentication:** Required

**File:** `src/app/api/ai/content-analysis/route.ts`

---

#### POST /ai/generate-batch

**Authentication:** Required

**File:** `src/app/api/ai/generate-batch/route.ts`

---

#### POST /ai/headlines

**Authentication:** Required

**File:** `src/app/api/ai/headlines/route.ts`

---

#### POST /ai/images

**Authentication:** Required

**File:** `src/app/api/ai/images/route.ts`

---

#### POST /ai/internal-links

**Authentication:** Required

**File:** `src/app/api/ai/internal-links/route.ts`

---

#### POST /ai/pitch

**Authentication:** Required

**File:** `src/app/api/ai/pitch/route.ts`

---

#### POST /ai/readability

**Authentication:** Required

**File:** `src/app/api/ai/readability/route.ts`

---

#### POST /ai/repurpose

**Authentication:** Required

**File:** `src/app/api/ai/repurpose/route.ts`

---

#### POST /ai/revise

**Authentication:** Required

**File:** `src/app/api/ai/revise/route.ts`

---

#### POST /ai/revisions

**Authentication:** Required

**File:** `src/app/api/ai/revisions/route.ts`

---

#### POST /ai/rewrite

**Authentication:** Required

**File:** `src/app/api/ai/rewrite/route.ts`

---

#### POST /ai/topic-clusters

**Authentication:** Required

**File:** `src/app/api/ai/topic-clusters/route.ts`

---

#### POST /ai/website-audit

**Authentication:** Required

**File:** `src/app/api/ai/website-audit/route.ts`

---


### Analytics

#### GET /analytics/batch-stats

GET /api/analytics/batch-stats
Query params:
- batchId: (optional) Specific batch to get stats for
- clientId: (optional) Get stats for all batches of a client
Returns aggregated metrics for specified batch or all batches

**Authentication:** Required

**File:** `src/app/api/analytics/batch-stats/route.ts`

---

#### GET, POST /analytics/check-backs

**Authentication:** Required

**File:** `src/app/api/analytics/check-backs/route.ts`

---

#### GET, POST /analytics/check-backs/process

Cron job endpoint to process pending check-backs
Should be called by Vercel Cron or external scheduler

To set up in vercel.json:
{
  "crons": [{
    "path": "/api/analytics/check-backs/process",
    "schedule": "0 6 * * *"
  }]
}

**Authentication:** Required

**File:** `src/app/api/analytics/check-backs/process/route.ts`

---

#### GET /analytics/client-stats

GET /api/analytics/client-stats
Returns aggregated metrics per client, showing all clients with published posts

**Authentication:** Required

**File:** `src/app/api/analytics/client-stats/route.ts`

---

#### GET /analytics/cohorts

GET /api/analytics/cohorts
Fetch cohort analysis data

**File:** `src/app/api/analytics/cohorts/route.ts`

---

#### GET /analytics/metrics/{postId}

GET /api/analytics/metrics/[postId] - Get metrics history for a post

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |

**File:** `src/app/api/analytics/metrics/[postId]/route.ts`

---

#### GET /analytics/metrics/{postId}/export

GET /api/analytics/metrics/[postId]/export - Export metrics history as CSV or JSON

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |

**File:** `src/app/api/analytics/metrics/[postId]/export/route.ts`

---

#### GET /analytics/overall-stats

**Authentication:** Required

**File:** `src/app/api/analytics/overall-stats/route.ts`

---

#### GET /analytics/projected-seo

GET /api/analytics/projected-seo
Calculate projected SEO score for a website or content batch
Query params:
- website_id: UUID (required if batch_id not provided)
- batch_id: UUID (required if website_id not provided)
Returns:
- baseline_score: Current SEO score from latest audit
- current_projected_score: Projected score with current post progress
- target_score: Goal score from batch (if batch_id provided)
- post_impacts: Array of per-post impact details
- score_breakdown: Breakdown by post status

**File:** `src/app/api/analytics/projected-seo/route.ts`

---

#### POST /analytics/reports/generate

**Authentication:** Required

**File:** `src/app/api/analytics/reports/generate/route.ts`

---

#### GET /analytics/review-metrics

**Authentication:** Required

**File:** `src/app/api/analytics/review-metrics/route.ts`

---

#### GET /analytics/top-posts

**File:** `src/app/api/analytics/top-posts/route.ts`

---

#### POST /analytics/web-vitals

Web Vitals Analytics Endpoint
Receives and processes Core Web Vitals metrics from the client

**File:** `src/app/api/analytics/web-vitals/route.ts`

---


### Analyze

#### POST /analyze

**File:** `src/app/api/analyze/route.ts`

---

#### GET /analyze/{analysisId}

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| analysisId | string | path | Yes | The analysisId identifier |

**File:** `src/app/api/analyze/[analysisId]/route.ts`

---


### Api-keys

#### GET, POST /api-keys

API Keys Management Endpoints
GET /api/api-keys - List all API keys for the authenticated vendor
POST /api/api-keys - Create a new API key

**Authentication:** Required

**File:** `src/app/api/api-keys/route.ts`

---

#### GET, PATCH, DELETE /api-keys/{id}

Individual API Key Endpoints
GET /api/api-keys/[id] - Get a specific API key
PATCH /api/api-keys/[id] - Update an API key
DELETE /api/api-keys/[id] - Delete (revoke) an API key

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/api-keys/[id]/route.ts`

---

#### GET /api-keys/{id}/usage

API Key Usage Statistics Endpoint
GET /api/api-keys/[id]/usage - Get usage statistics for an API key

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/api-keys/[id]/usage/route.ts`

---


### Audit-logs

#### GET /audit-logs

List audit logs with filtering
GET /api/audit-logs?actionType=...&resourceType=...&startDate=...&endDate=...&limit=50&offset=0

**Authentication:** Required

**File:** `src/app/api/audit-logs/route.ts`

---

#### POST /audit-logs/export

Export audit logs
POST /api/audit-logs/export
Body: { exportType: 'csv' | 'json' | 'pdf', filters: AuditLogFilter }

**Authentication:** Required

**File:** `src/app/api/audit-logs/export/route.ts`

---

#### GET /audit-logs/resource/{resourceType}/{resourceId}

Get audit history for a specific resource
GET /api/audit-logs/resource/:resourceType/:resourceId

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| resourceType | string | path | Yes | The resourceType identifier |
| resourceId | string | path | Yes | The resourceId identifier |

**File:** `src/app/api/audit-logs/resource/[resourceType]/[resourceId]/route.ts`

---


### Auth

#### GET, POST /auth/2fa/backup-codes

GET /api/auth/2fa/backup-codes
Get backup codes count and status
POST /api/auth/2fa/backup-codes
Regenerate backup codes

**Authentication:** Required

**File:** `src/app/api/auth/2fa/backup-codes/route.ts`

---

#### POST /auth/2fa/disable

POST /api/auth/2fa/disable
Disable 2FA for the authenticated user

**Authentication:** Required

**File:** `src/app/api/auth/2fa/disable/route.ts`

---

#### POST /auth/2fa/recovery

POST /api/auth/2fa/recovery
Use a backup code to verify identity when TOTP is unavailable

**Authentication:** Required

**File:** `src/app/api/auth/2fa/recovery/route.ts`

---

#### GET, POST /auth/2fa/setup

POST /api/auth/2fa/setup
Initialize 2FA setup for a user - generates TOTP secret and QR code

**Authentication:** Required

**File:** `src/app/api/auth/2fa/setup/route.ts`

---

#### POST /auth/2fa/verify

POST /api/auth/2fa/verify
Verify TOTP token and complete 2FA setup OR verify during login

**Authentication:** Required

**File:** `src/app/api/auth/2fa/verify/route.ts`

---

#### POST /auth/accept-invitation

POST /api/auth/accept-invitation - Accept client invitation and create account
Creates user account with email/password and links to client

**File:** `src/app/api/auth/accept-invitation/route.ts`

---

#### GET /auth/callback

**Authentication:** Required

**File:** `src/app/api/auth/callback/route.ts`

---

#### POST /auth/change-email

POST /api/auth/change-email - Request email change
Sends verification email to new address

**Authentication:** Required

**File:** `src/app/api/auth/change-email/route.ts`

---

#### GET, POST /auth/client-invite

POST /api/auth/client-invite - Create a client invitation with token
Staff/owner can invite client_admin or client_reviewer

**Authentication:** Required

**File:** `src/app/api/auth/client-invite/route.ts`

---

#### GET /auth/google

Google OAuth initiation endpoint
Redirects vendor to Google OAuth consent screen

**Authentication:** Required

**File:** `src/app/api/auth/google/route.ts`

---

#### GET /auth/google/callback

Google OAuth callback endpoint
Handles OAuth redirect and stores tokens

**File:** `src/app/api/auth/google/callback/route.ts`

---

#### POST /auth/invite

POST /api/auth/invite - Invite a new user (staff/owner only)
Creates user account and sends invitation email

**File:** `src/app/api/auth/invite/route.ts`

---

#### POST /auth/login

**File:** `src/app/api/auth/login/route.ts`

---

#### POST /auth/logout

POST /api/auth/logout - Sign out the current user

**File:** `src/app/api/auth/logout/route.ts`

---

#### POST /auth/magic-link

**File:** `src/app/api/auth/magic-link/route.ts`

---

#### GET /auth/me

GET /api/auth/me - Get current authenticated user and profile

**File:** `src/app/api/auth/me/route.ts`

---

#### POST /auth/reauth

POST /api/auth/reauth - Re-authenticate user before sensitive action
Requires current password for verification

**Authentication:** Required

**File:** `src/app/api/auth/reauth/route.ts`

---

#### POST, PUT /auth/reset-password

POST /api/auth/reset-password - Request password reset
Sends reset email to user

**File:** `src/app/api/auth/reset-password/route.ts`

---

#### POST /auth/signup

POST /api/auth/signup - Create new user account
Requires email confirmation if enabled in Supabase
Set ALLOW_REGISTRATION=true to enable public signup

**Authentication:** Required

**File:** `src/app/api/auth/signup/route.ts`

---

#### GET, POST /auth/sso/login

SSO Login Initiation API
Start SAML or OIDC authentication flow

**File:** `src/app/api/auth/sso/login/route.ts`

---


### Blog-posts

#### GET /blog-posts

**File:** `src/app/api/blog-posts/route.ts`

---

#### GET /blog-posts/{id}/agent-outputs

GET /api/blog-posts/[id]/agent-outputs
Fetches all agent outputs for a specific blog post in chronological order
PRD feat-121: Timeline component showing all agent outputs

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/agent-outputs/route.ts`

---

#### POST /blog-posts/{id}/approve

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/approve/route.ts`

---

#### GET, POST /blog-posts/{id}/categories-tags

GET /api/blog-posts/[id]/categories-tags
Get current category and tag assignments for a blog post

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/categories-tags/route.ts`

---

#### GET, POST /blog-posts/{id}/change-requests

GET /api/blog-posts/[id]/change-requests
Get all change requests for a blog post

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/change-requests/route.ts`

---

#### GET /blog-posts/{id}/conversions

GET /api/blog-posts/[id]/conversions
Get conversion data for a blog post
Returns total conversions and per-goal breakdown

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/conversions/route.ts`

---

#### PATCH /blog-posts/{id}/dates

Update blog post dates (due_date, publish_window)
PATCH /api/blog-posts/[id]/dates
Body: {
  due_date?: string | null,
  publish_window_start?: string | null,
  publish_window_end?: string | null
}

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/dates/route.ts`

---

#### GET, POST /blog-posts/{id}/editor-sign-off

POST /api/blog-posts/[id]/editor-sign-off
Toggle editor sign-off for a blog post
Body:
- signedOff: boolean - whether to sign off or remove sign-off
- notes: string (optional) - sign-off notes

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/editor-sign-off/route.ts`

---

#### POST /blog-posts/{id}/generate

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/generate/route.ts`

---

#### GET, POST /blog-posts/{id}/generate-images

Extract content preview from post draft or outline

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/generate-images/route.ts`

---

#### PATCH, DELETE /blog-posts/{id}/images/{imageId}

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |
| imageId | string | path | Yes | The imageId identifier |

**File:** `src/app/api/blog-posts/[id]/images/[imageId]/route.ts`

---

#### POST, DELETE /blog-posts/{id}/make-public

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/make-public/route.ts`

---

#### GET, PATCH /blog-posts/{id}/pipeline-status

GET /api/blog-posts/[id]/pipeline-status
Get current pipeline status for a blog post
PRD feat-120: Pipeline status tracking per post

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/pipeline-status/route.ts`

---

#### POST /blog-posts/{id}/pipeline-status/pause

POST /api/blog-posts/[id]/pipeline-status/pause
Pause or resume the pipeline for a blog post
PRD feat-120: Pipeline status tracking per post - Allow pause/resume

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/pipeline-status/pause/route.ts`

---

#### POST /blog-posts/{id}/publish

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/publish/route.ts`

---

#### POST /blog-posts/{id}/publish-wordpress

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/publish-wordpress/route.ts`

---

#### POST /blog-posts/{id}/reject

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/reject/route.ts`

---

#### POST /blog-posts/{id}/request-revision

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/request-revision/route.ts`

---

#### GET, POST /blog-posts/{id}/revisions

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/revisions/route.ts`

---

#### GET, POST /blog-posts/{id}/seo-score

GET /api/blog-posts/[id]/seo-score
Calculate and return SEO quality score for a blog post

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/seo-score/route.ts`

---

#### POST /blog-posts/{id}/showcase

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/showcase/route.ts`

---

#### PATCH /blog-posts/{id}/status

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/status/route.ts`

---

#### POST /blog-posts/{id}/transition

POST /api/blog-posts/[id]/transition
Transition blog post status according to PRD workflow:
ai_drafting → editor_review → client_review → approved → published
Body:
- targetStatus: 'editor_review' | 'client_review' | 'approved' | 'published'
- comment?: string (optional comment for the transition)

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/blog-posts/[id]/transition/route.ts`

---

#### POST /blog-posts/generate-full

**Authentication:** Required

**File:** `src/app/api/blog-posts/generate-full/route.ts`

---


### Brand

#### GET, POST /brand/learn-styles

POST /api/brand/learn-styles
Analyzes top-performing blog posts for a client and learns writing patterns
@feat-170 PRD Brand: Auto-learn styles from top performing posts
Request body:
{
  clientId: string;          // Required: Client UUID
  minPosts?: number;         // Optional: Minimum posts to analyze (default: 5)
  engagementThreshold?: number; // Optional: Min engagement score (default: 60)
  autoUpdate?: boolean;      // Optional: Auto-update brand guide (default: false)
}
Response:
{
  success: boolean;
  learnedStyles: LearnedStyle[];
  updated?: boolean;
  message?: string;
}

**Authentication:** Required

**File:** `src/app/api/brand/learn-styles/route.ts`

---

#### GET /brand/style-performance

GET /api/brand/style-performance?clientId={id}
Get performance metrics for all styles used by a client
@feat-171 PRD Brand: Data backing for style rules with metrics
Response:
{
  success: boolean;
  styles: StylePerformance[];
  recommendations: Recommendation[];
  summary: {
    totalStyles: number;
    avgEngagement: number;
    topStyle: string;
    bottomStyle: string;
  };
}

**Authentication:** Required

**File:** `src/app/api/brand/style-performance/route.ts`

---

#### GET /brand/validate-context

GET /api/brand/validate-context?clientId={id}
Validate brand context completeness before content generation
@feat-173 PRD Brand: Context validation before generation
Response:
{
  success: boolean;
  validation: {
    isValid: boolean;
    completeness: number;
    canProceed: boolean;
    message: string;
    issues: ValidationIssue[];
    suggestions: Record<string, any>;
  };
}

**Authentication:** Required

**File:** `src/app/api/brand/validate-context/route.ts`

---


### Check-backs

#### GET /check-backs/posts/{postId}

GET /api/check-backs/posts/[postId] - Get check-back schedules for a post

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |

**File:** `src/app/api/check-backs/posts/[postId]/route.ts`

---

#### GET, POST /check-backs/process

POST /api/check-backs/process - Process due check-backs
This endpoint should be called by a cron job or scheduled task

**File:** `src/app/api/check-backs/process/route.ts`

---

#### POST /check-backs/schedule

POST /api/check-backs/schedule - Schedule check-backs for a published post

**File:** `src/app/api/check-backs/schedule/route.ts`

---


### Checkout

#### POST /checkout/session

**Authentication:** Required

**File:** `src/app/api/checkout/session/route.ts`

---


### Clients

#### GET, POST /clients

**Authentication:** Required

**File:** `src/app/api/clients/route.ts`

---

#### GET, PATCH /clients/{clientId}

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| clientId | string | path | Yes | The clientId identifier |

**File:** `src/app/api/clients/[clientId]/route.ts`

---

#### GET, PATCH /clients/{clientId}/brand-guide

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| clientId | string | path | Yes | The clientId identifier |

**File:** `src/app/api/clients/[clientId]/brand-guide/route.ts`

---

#### GET /clients/{clientId}/context

GET /api/clients/[clientId]/context
Returns the unified brand context for a client
@feat-165 PRD Brand: GET /api/clients/{id}/context endpoint

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| clientId | string | path | Yes | The clientId identifier |

**File:** `src/app/api/clients/[clientId]/context/route.ts`

---

#### GET /clients/{clientId}/overview

GET /api/clients/[clientId]/overview - Get client overview with relationship health metrics

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| clientId | string | path | Yes | The clientId identifier |

**File:** `src/app/api/clients/[clientId]/overview/route.ts`

---

#### GET, POST /clients/{clientId}/posts

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| clientId | string | path | Yes | The clientId identifier |

**File:** `src/app/api/clients/[clientId]/posts/route.ts`

---


### Cms-connections

#### GET, POST /cms-connections

**Authentication:** Required

**File:** `src/app/api/cms-connections/route.ts`

---

#### PUT, DELETE /cms-connections/{id}

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/cms-connections/[id]/route.ts`

---


### Comments

#### GET, POST /comments

**File:** `src/app/api/comments/route.ts`

---


### Content-batches

#### GET, POST /content-batches

**File:** `src/app/api/content-batches/route.ts`

---

#### GET /content-batches/{id}/download-csv-template

Download CSV template for content batch imports
GET /api/content-batches/[id]/download-csv-template
Returns a CSV template with:
- All supported column headers
- Example data row with instructions
- Instructions in comment format

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/content-batches/[id]/download-csv-template/route.ts`

---

#### GET /content-batches/{id}/export-csv

Export batch topics as CSV with filtering options
GET /api/content-batches/[id]/export-csv
Query params:
  - status: Filter by post status (optional)
  - dateFrom: Filter by created date >= (YYYY-MM-DD, optional)
  - dateTo: Filter by created date <= (YYYY-MM-DD, optional)
  - columns: Comma-separated list of columns to export (optional)

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/content-batches/[id]/export-csv/route.ts`

---

#### GET, POST /content-batches/{id}/generate-all

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/content-batches/[id]/generate-all/route.ts`

---

#### POST /content-batches/{id}/generate-topics

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/content-batches/[id]/generate-topics/route.ts`

---

#### POST /content-batches/{id}/import-csv

Import blog posts from CSV file with flexible column mapping
POST /api/content-batches/[id]/import-csv
Supports custom column mapping via formData:
- file: CSV file
- column_mapping: JSON string mapping internal fields to CSV columns
- custom_fields: JSON string defining custom fields

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/content-batches/[id]/import-csv/route.ts`

---

#### GET /content-batches/{id}/overdue

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/content-batches/[id]/overdue/route.ts`

---

#### GET /content-batches/{id}/posts

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/content-batches/[id]/posts/route.ts`

---

#### POST /content-batches/{id}/publish-all

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/content-batches/[id]/publish-all/route.ts`

---


### Content-requests

#### GET, POST /content-requests

**Authentication:** Required

**File:** `src/app/api/content-requests/route.ts`

---

#### GET, PATCH /content-requests/{id}

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/content-requests/[id]/route.ts`

---


### Conversion-goals

#### GET, POST /conversion-goals

GET /api/conversion-goals
Get all conversion goals for a website

**Authentication:** Required

**File:** `src/app/api/conversion-goals/route.ts`

---

#### GET, PATCH, DELETE /conversion-goals/{id}

GET /api/conversion-goals/[id]
Get a single conversion goal

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/conversion-goals/[id]/route.ts`

---


### Cron

#### GET /cron/check-backs

Cron job to process pending check-backs
Called by Vercel Cron or external scheduler

**File:** `src/app/api/cron/check-backs/route.ts`

---


### Csv-mappings

#### GET, POST /csv-mappings

Get CSV import mappings for a client
GET /api/csv-mappings?client_id=xxx

**Authentication:** Required

**File:** `src/app/api/csv-mappings/route.ts`

---

#### PUT, DELETE /csv-mappings/{id}

Update a CSV import mapping
PUT /api/csv-mappings/[id]

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/csv-mappings/[id]/route.ts`

---

#### POST /csv-mappings/{id}/use

Mark a mapping as used (updates last_used_at timestamp)
POST /api/csv-mappings/[id]/use

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/csv-mappings/[id]/use/route.ts`

---


### Docs

#### GET /docs/openapi.json

**File:** `src/app/api/docs/openapi.json/route.ts`

---


### Emails

#### GET, POST /emails/queue/process

Email Queue Processor Endpoint
POST /api/emails/queue/process
Processes pending emails in the queue
Should be called by a cron job every 1-5 minutes

**File:** `src/app/api/emails/queue/process/route.ts`

---

#### GET /emails/queue/stats

Email Queue Statistics API
GET /api/emails/queue/stats
Returns statistics about the email queue

**Authentication:** Required

**File:** `src/app/api/emails/queue/stats/route.ts`

---

#### POST /emails/send

Transactional Email Sending API
POST /api/emails/send
Queue a transactional email for sending

**Authentication:** Required

**File:** `src/app/api/emails/send/route.ts`

---

#### GET /emails/templates

Email Templates API
GET /api/emails/templates - List all templates
POST /api/emails/templates - Create custom template (future feature)

**Authentication:** Required

**File:** `src/app/api/emails/templates/route.ts`

---


### Events

#### POST /events/track

Track vendor events (page views, clicks, checkouts, etc.)
POST /api/events/track

**Authentication:** Required

**File:** `src/app/api/events/track/route.ts`

---


### Files

#### GET, POST /files

**Authentication:** Required

**File:** `src/app/api/files/route.ts`

---

#### GET, PATCH, DELETE /files/{id}

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/files/[id]/route.ts`

---

#### GET /files/{id}/download

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/files/[id]/download/route.ts`

---

#### GET, POST, PATCH /files/{id}/share

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/files/[id]/share/route.ts`

---

#### GET, POST /files/{id}/versions

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/files/[id]/versions/route.ts`

---

#### GET, POST /files/{id}/versions/{versionId}

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |
| versionId | string | path | Yes | The versionId identifier |

**File:** `src/app/api/files/[id]/versions/[versionId]/route.ts`

---


### Folders

#### GET, POST /folders

**Authentication:** Required

**File:** `src/app/api/folders/route.ts`

---

#### GET, PATCH, DELETE /folders/{id}

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/folders/[id]/route.ts`

---


### Ga4

#### GET, POST /ga4/connections

GET /api/ga4/connections
List all GA4 connections for the current user's vendor/client

**Authentication:** Required

**File:** `src/app/api/ga4/connections/route.ts`

---

#### GET, PUT, DELETE /ga4/connections/{id}

GET /api/ga4/connections/[id]
Get a single GA4 connection

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/ga4/connections/[id]/route.ts`

---

#### POST /ga4/sync

POST /api/ga4/sync
Sync GA4 metrics for blog posts
Request body:
- blog_post_id: UUID (optional) - specific post to sync
- website_id: UUID (optional) - all posts for a website
- date_range: { start: ISO string, end: ISO string } (optional, defaults to last 30 days)

**Authentication:** Required

**File:** `src/app/api/ga4/sync/route.ts`

---

#### POST /ga4/test-connection

POST /api/ga4/test-connection
Test a GA4 connection before saving
Request body:
- property_id: string
- service_account_email: string
- service_account_credentials: JSON object or string

**File:** `src/app/api/ga4/test-connection/route.ts`

---


### Gdpr

#### POST /gdpr/delete

GDPR Data Deletion API
feat-045: Data export/deletion/consent
Allows users to permanently delete all their data (Right to be forgotten)

**Authentication:** Required

**File:** `src/app/api/gdpr/delete/route.ts`

---

#### DELETE /gdpr/delete-account

DELETE /api/gdpr/delete-account - Delete user account and all data (GDPR compliance)
Body:
- confirmation: string (must be "DELETE MY ACCOUNT")
This is irreversible!

**Authentication:** Required

**File:** `src/app/api/gdpr/delete-account/route.ts`

---

#### GET /gdpr/export

GDPR Data Export API
feat-045: Data export/deletion/consent
Allows users to download all their personal data

**Authentication:** Required

**File:** `src/app/api/gdpr/export/route.ts`

---


### Gmail

#### GET /gmail/callback

**File:** `src/app/api/gmail/callback/route.ts`

---

#### GET /gmail/connect

**Authentication:** Required

**File:** `src/app/api/gmail/connect/route.ts`

---

#### GET, DELETE /gmail/connection

**Authentication:** Required

**File:** `src/app/api/gmail/connection/route.ts`

---

#### POST /gmail/send

**Authentication:** Required

**File:** `src/app/api/gmail/send/route.ts`

---

#### POST /gmail/sync

**Authentication:** Required

**File:** `src/app/api/gmail/sync/route.ts`

---

#### GET /gmail/threads

**Authentication:** Required

**File:** `src/app/api/gmail/threads/route.ts`

---

#### POST /gmail/threads/{threadId}/link

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| threadId | string | path | Yes | The threadId identifier |

**File:** `src/app/api/gmail/threads/[threadId]/link/route.ts`

---

#### GET /gmail/threads/{threadId}/messages

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| threadId | string | path | Yes | The threadId identifier |

**File:** `src/app/api/gmail/threads/[threadId]/messages/route.ts`

---


### Gsc

#### GET, POST /gsc/connections

GET /api/gsc/connections - Get all GSC connections for current user

**Authentication:** Required

**File:** `src/app/api/gsc/connections/route.ts`

---

#### DELETE /gsc/connections/{id}

DELETE /api/gsc/connections/[id] - Delete GSC connection

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/gsc/connections/[id]/route.ts`

---

#### POST /gsc/sync

POST /api/gsc/sync - Sync metrics from Google Search Console

**Authentication:** Required

**File:** `src/app/api/gsc/sync/route.ts`

---

#### POST /gsc/test-connection

POST /api/gsc/test-connection - Test GSC connection

**Authentication:** Required

**File:** `src/app/api/gsc/test-connection/route.ts`

---


### Health

#### GET /health

**File:** `src/app/api/health/route.ts`

---

#### GET /health/live

Liveness probe for Kubernetes/container orchestration
Returns 200 when service is alive (doesn't check dependencies)

**File:** `src/app/api/health/live/route.ts`

---

#### GET /health/ready

Readiness probe for Kubernetes/container orchestration
Returns 200 when service is ready to accept traffic

**File:** `src/app/api/health/ready/route.ts`

---


### Invoices

#### GET, POST /invoices

Invoices API
GET - List invoices (filtered by client)
POST - Create and send a new invoice

**Authentication:** Required

**File:** `src/app/api/invoices/route.ts`

---

#### GET, PATCH /invoices/{id}

Invoice Detail API
GET - Get invoice details
PATCH - Mark invoice as paid or void
POST - Send payment reminder

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/invoices/[id]/route.ts`

---


### Monitoring

#### GET /monitoring/error-rate

GET /api/monitoring/error-rate
Get error rate statistics

**Authentication:** Required

**File:** `src/app/api/monitoring/error-rate/route.ts`

---


### Newsletters

#### GET, POST /newsletters/automations

GET /api/newsletters/automations
List all newsletter automations for the vendor

**Authentication:** Required

**File:** `src/app/api/newsletters/automations/route.ts`

---

#### GET, PATCH, DELETE /newsletters/automations/{id}

GET /api/newsletters/automations/[id]
Get a specific automation

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/newsletters/automations/[id]/route.ts`

---

#### GET, POST /newsletters/automations/process

POST /api/newsletters/automations/process
Process all due automations (called by cron job)
This endpoint should be called periodically (e.g., every hour) by a cron job
or scheduled task to check for and execute due automations.

**File:** `src/app/api/newsletters/automations/process/route.ts`

---

#### GET, POST /newsletters/campaigns

Newsletter Campaigns API Endpoints
GET /api/newsletters/campaigns - List all campaigns
POST /api/newsletters/campaigns - Create a new campaign

**Authentication:** Required

**File:** `src/app/api/newsletters/campaigns/route.ts`

---

#### GET /newsletters/campaigns/{id}/analytics

GET /api/newsletters/campaigns/[id]/analytics
Get analytics for a campaign (open rate, click rate, bounce rate, etc.)

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/newsletters/campaigns/[id]/analytics/route.ts`

---

#### GET, POST /newsletters/campaigns/{id}/recipients

GET /api/newsletters/campaigns/[id]/recipients
List all recipients for a campaign with optional filtering and pagination

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/newsletters/campaigns/[id]/recipients/route.ts`

---

#### DELETE /newsletters/campaigns/{id}/recipients/{recipientId}

DELETE /api/newsletters/campaigns/[id]/recipients/[recipientId]
Remove a specific recipient from a campaign

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |
| recipientId | string | path | Yes | The recipientId identifier |

**File:** `src/app/api/newsletters/campaigns/[id]/recipients/[recipientId]/route.ts`

---

#### POST /newsletters/campaigns/{id}/recipients/import

POST /api/newsletters/campaigns/[id]/recipients/import
Bulk import recipients from CSV file
Expected CSV format: email,name (headers optional)

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/newsletters/campaigns/[id]/recipients/import/route.ts`

---

#### POST /newsletters/campaigns/{id}/send

Send Newsletter Campaign
POST /api/newsletters/campaigns/[id]/send

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/newsletters/campaigns/[id]/send/route.ts`

---

#### GET, POST /newsletters/templates

Newsletter Templates API Endpoints
GET /api/newsletters/templates - List all templates
POST /api/newsletters/templates - Create a new template

**Authentication:** Required

**File:** `src/app/api/newsletters/templates/route.ts`

---

#### GET, POST /newsletters/unsubscribe

POST /api/newsletters/unsubscribe
Unsubscribe a recipient from newsletters
Body: { token: string } or { email: string, campaign_id: string }

**File:** `src/app/api/newsletters/unsubscribe/route.ts`

---

#### GET, POST /newsletters/webhooks/resend

POST /api/newsletters/webhooks/resend
Webhook receiver for Resend delivery events
Resend sends webhooks for various email events:
- email.sent: Email was accepted by the receiving server
- email.delivered: Email was successfully delivered
- email.delivery_delayed: Delivery was delayed
- email.bounced: Email bounced (hard or soft bounce)
- email.opened: Email was opened by recipient
- email.clicked: Link in email was clicked
- email.complained: Recipient marked email as spam
To set up webhooks in Resend:
1. Go to https://resend.com/webhooks
2. Add webhook URL: https://your-domain.com/api/newsletters/webhooks/resend
3. Select events to subscribe to
4. Copy the webhook signing secret and add to env as RESEND_WEBHOOK_SECRET

**File:** `src/app/api/newsletters/webhooks/resend/route.ts`

---


### Notifications

#### GET /notifications

**Authentication:** Required

**File:** `src/app/api/notifications/route.ts`

---

#### PATCH /notifications/{id}/read

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/notifications/[id]/read/route.ts`

---

#### PATCH /notifications/mark-all-read

**Authentication:** Required

**File:** `src/app/api/notifications/mark-all-read/route.ts`

---

#### GET, PUT /notifications/preferences

GET /api/notifications/preferences
Get notification preferences for the authenticated user

**Authentication:** Required

**File:** `src/app/api/notifications/preferences/route.ts`

---


### Payment-links

#### GET, POST /payment-links

Payment Links API
GET - List payment links for the vendor
POST - Create a new payment link

**Authentication:** Required

**File:** `src/app/api/payment-links/route.ts`

---


### Pipeline-jobs

#### GET, POST /pipeline-jobs

GET /api/pipeline-jobs - List all pipeline jobs for vendor
POST /api/pipeline-jobs - Create a new pipeline job

**Authentication:** Required

**File:** `src/app/api/pipeline-jobs/route.ts`

---

#### GET, PATCH, DELETE /pipeline-jobs/{jobId}

GET /api/pipeline-jobs/[jobId] - Get a specific pipeline job
PATCH /api/pipeline-jobs/[jobId] - Update a pipeline job status/results
DELETE /api/pipeline-jobs/[jobId] - Delete a pipeline job

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| jobId | string | path | Yes | The jobId identifier |

**File:** `src/app/api/pipeline-jobs/[jobId]/route.ts`

---

#### POST /pipeline-jobs/{jobId}/cancel

POST /api/pipeline-jobs/[jobId]/cancel - Cancel a running pipeline job

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| jobId | string | path | Yes | The jobId identifier |

**File:** `src/app/api/pipeline-jobs/[jobId]/cancel/route.ts`

---

#### GET /pipeline-jobs/{jobId}/export-topics

Export pipeline job topics as CSV
GET /api/pipeline-jobs/[jobId]/export-topics

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| jobId | string | path | Yes | The jobId identifier |

**File:** `src/app/api/pipeline-jobs/[jobId]/export-topics/route.ts`

---

#### POST /pipeline-jobs/{jobId}/retry

POST /api/pipeline-jobs/[jobId]/retry - Retry a pipeline job by cloning it

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| jobId | string | path | Yes | The jobId identifier |

**File:** `src/app/api/pipeline-jobs/[jobId]/retry/route.ts`

---

#### POST /pipeline-jobs/create-batch

**File:** `src/app/api/pipeline-jobs/create-batch/route.ts`

---


### Pitch-deck

#### POST /pitch-deck/email

**Authentication:** Required

**File:** `src/app/api/pitch-deck/email/route.ts`

---

#### GET, POST /pitch-deck/generate

**Authentication:** Required

**File:** `src/app/api/pitch-deck/generate/route.ts`

---


### Portal

#### GET /portal/approvals

**Authentication:** Required

**File:** `src/app/api/portal/approvals/route.ts`

---

#### GET /portal/approvals/{id}

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/portal/approvals/[id]/route.ts`

---

#### GET /portal/client-profile

GET /api/portal/client-profile - Get current client's profile information
Client-only endpoint

**Authentication:** Required

**File:** `src/app/api/portal/client-profile/route.ts`

---

#### POST /portal/complete-onboarding

POST /api/portal/complete-onboarding - Complete client onboarding process
Saves onboarding data and marks client as active

**Authentication:** Required

**File:** `src/app/api/portal/complete-onboarding/route.ts`

---

#### POST /portal/posts/{postId}/approve

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |

**File:** `src/app/api/portal/posts/[postId]/approve/route.ts`

---

#### GET, POST, PATCH /portal/posts/{postId}/comments

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |

**File:** `src/app/api/portal/posts/[postId]/comments/route.ts`

---

#### POST /portal/posts/{postId}/request-changes

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |

**File:** `src/app/api/portal/posts/[postId]/request-changes/route.ts`

---

#### POST /portal/posts/batch-action

**Authentication:** Required

**File:** `src/app/api/portal/posts/batch-action/route.ts`

---

#### GET, PATCH /portal/profile

**Authentication:** Required

**File:** `src/app/api/portal/profile/route.ts`

---

#### GET /portal/project-overview

**Authentication:** Required

**File:** `src/app/api/portal/project-overview/route.ts`

---

#### GET /portal/work-declarations

GET /api/portal/work-declarations
Get work declarations for the current client (client portal view)
Includes progress statistics and filtering options

**Authentication:** Required

**File:** `src/app/api/portal/work-declarations/route.ts`

---


### Posts

#### GET, POST /posts/{postId}/generate-images

API Route: Generate AI Images for Blog Post
POST: Generate multiple image options using DALL-E
feat-039: AI image generation for posts

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |

**File:** `src/app/api/posts/[postId]/generate-images/route.ts`

---

#### PATCH, DELETE /posts/{postId}/images/{imageId}

API Route: Manage Individual Generated Image
PATCH: Update image selection, featured status, alt text, etc.
DELETE: Soft delete an image

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |
| imageId | string | path | Yes | The imageId identifier |

**File:** `src/app/api/posts/[postId]/images/[imageId]/route.ts`

---

#### GET, POST /posts/{postId}/outline-options

API Route: Outline Options Management
GET: Fetch all outline options for a post
POST: Generate 3 outline options

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |

**File:** `src/app/api/posts/[postId]/outline-options/route.ts`

---

#### POST /posts/{postId}/outline-options/{optionId}/select

API Route: Select an outline option
POST: Mark an outline option as selected and copy to blog_posts.outline

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |
| optionId | string | path | Yes | The optionId identifier |

**File:** `src/app/api/posts/[postId]/outline-options/[optionId]/select/route.ts`

---

#### POST /posts/{postId}/outline-options/custom

API Route: Save custom merged/edited outline
POST: Save a custom outline created by user (merging or editing options)

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |

**File:** `src/app/api/posts/[postId]/outline-options/custom/route.ts`

---

#### GET, POST /posts/{postId}/pipeline

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |

**File:** `src/app/api/posts/[postId]/pipeline/route.ts`

---

#### GET, POST /posts/{postId}/revisions

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |

**File:** `src/app/api/posts/[postId]/revisions/route.ts`

---

#### GET /posts/{postId}/revisions/{revisionId}

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |
| revisionId | string | path | Yes | The revisionId identifier |

**File:** `src/app/api/posts/[postId]/revisions/[revisionId]/route.ts`

---

#### GET /posts/{postId}/revisions/{revisionId}/diff

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |
| revisionId | string | path | Yes | The revisionId identifier |

**File:** `src/app/api/posts/[postId]/revisions/[revisionId]/diff/route.ts`

---

#### POST /posts/{postId}/revisions/{revisionId}/restore

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |
| revisionId | string | path | Yes | The revisionId identifier |

**File:** `src/app/api/posts/[postId]/revisions/[revisionId]/restore/route.ts`

---

#### POST, PATCH /posts/{postId}/sections/{sectionId}

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |
| sectionId | string | path | Yes | The sectionId identifier |

**File:** `src/app/api/posts/[postId]/sections/[sectionId]/route.ts`

---

#### POST /posts/{postId}/status

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| postId | string | path | Yes | The postId identifier |

**File:** `src/app/api/posts/[postId]/status/route.ts`

---


### Public

#### GET /public/vendor/{handle}

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| handle | string | path | Yes | The handle identifier |

**File:** `src/app/api/public/vendor/[handle]/route.ts`

---

#### GET /public/vendor/{handle}/page/{slug}

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| handle | string | path | Yes | The handle identifier |
| slug | string | path | Yes | The slug identifier |

**File:** `src/app/api/public/vendor/[handle]/page/[slug]/route.ts`

---


### Publish-queue

#### PATCH, DELETE /publish-queue/{jobId}

Publish Queue Job Management
DELETE /api/publish-queue/[jobId] - Cancel a queued job
PATCH /api/publish-queue/[jobId] - Retry a failed job

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| jobId | string | path | Yes | The jobId identifier |

**File:** `src/app/api/publish-queue/[jobId]/route.ts`

---

#### POST /publish-queue/process

POST /api/publish-queue/process
Cron endpoint to process pending publish jobs
This should be called periodically (e.g., every 5 minutes) by a cron service
Authentication: Bearer token (CRON_SECRET)

**File:** `src/app/api/publish-queue/process/route.ts`

---

#### POST /publish-queue/queue

POST /api/publish-queue/queue
Queue a post or batch of posts for publishing
Body:
- postId: string (single post)
- postIds: string[] (batch of posts)
- scheduledFor: ISO date string (optional, defaults to now)
- priority: number 1-10 (optional, defaults to 5)
- cmsConnectionId: string (optional, auto-detected if not provided)
- publishStatus: 'draft' | 'publish' | 'pending' | 'future' (optional, defaults to 'publish')
- staggerMinutes: number (optional, for batches - stagger posts by N minutes)

**Authentication:** Required

**File:** `src/app/api/publish-queue/queue/route.ts`

---

#### GET /publish-queue/schedule

GET /api/publish-queue/schedule
Get scheduled publishes for calendar view
Query params:
- startDate: ISO date string (optional)
- endDate: ISO date string (optional)
- clientId: string (optional)
- limit: number (optional)

**Authentication:** Required

**File:** `src/app/api/publish-queue/schedule/route.ts`

---

#### GET /publish-queue/stats

GET /api/publish-queue/stats
Get publish queue statistics
Query params:
- clientId: string (optional)
- batchId: string (optional)

**Authentication:** Required

**File:** `src/app/api/publish-queue/stats/route.ts`

---


### Publishing

#### POST /publishing/retry

POST /api/publishing/retry - Retry publishing a failed post

**File:** `src/app/api/publishing/retry/route.ts`

---

#### GET /publishing/status

GET /api/publishing/status - Get publishing status for posts
Query params:
- batchId: Filter by content batch
- clientId: Filter by client
- status: Filter by publish status (published, scheduled, failed)

**File:** `src/app/api/publishing/status/route.ts`

---


### Push

#### POST /push/subscribe

POST /api/push/subscribe
Subscribe a user to push notifications
Body:
{
  subscription: PushSubscription,
  deviceInfo?: { browser?: string, os?: string, device?: string }
}

**Authentication:** Required

**File:** `src/app/api/push/subscribe/route.ts`

---

#### DELETE /push/unsubscribe

DELETE /api/push/unsubscribe
Unsubscribe a user from push notifications
Body:
{
  endpoint: string
}

**Authentication:** Required

**File:** `src/app/api/push/unsubscribe/route.ts`

---

#### GET /push/vapid-key

GET /api/push/vapid-key
Returns the public VAPID key for push notification subscription

**File:** `src/app/api/push/vapid-key/route.ts`

---


### R

#### GET /r/{code}

GET /api/r/:code - Referral redirect with tracking
Public endpoint for referral link clicks

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| code | string | path | Yes | The code identifier |

**File:** `src/app/api/r/[code]/route.ts`

---


### Referrals

#### GET, POST /referrals/code

GET /api/referrals/code - Get my referral code
POST /api/referrals/code - Create or update referral code

**Authentication:** Required

**File:** `src/app/api/referrals/code/route.ts`

---


### Reports

#### GET /reports

List all reports with optional filtering
GET /api/reports?websiteId=...&limit=20&offset=0

**Authentication:** Required

**File:** `src/app/api/reports/route.ts`

---

#### GET /reports/{id}/download

Download PDF report
GET /api/reports/[id]/download

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/reports/[id]/download/route.ts`

---

#### POST /reports/{id}/send-email

Send report via email
POST /api/reports/[id]/send-email
Body: {
  recipientEmail?: string (optional, defaults to client email)
  includePDF?: boolean (optional, attach PDF if report type is email)
}

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/reports/[id]/send-email/route.ts`

---

#### POST /reports/generate

Generate analytics report for a website or content batch
POST /api/reports/generate

Body: {
  websiteId?: string,
  batchId?: string,
  periodStart: string (ISO date),
  periodEnd: string (ISO date),
  format: 'email' | 'pdf' | 'slide'
}

**Authentication:** Required

**File:** `src/app/api/reports/generate/route.ts`

---


### Scheduled-pipelines

#### GET, POST /scheduled-pipelines

GET /api/scheduled-pipelines - List all scheduled pipeline runs
POST /api/scheduled-pipelines - Create a new scheduled pipeline run

**Authentication:** Required

**File:** `src/app/api/scheduled-pipelines/route.ts`

---

#### GET, PATCH, DELETE /scheduled-pipelines/{scheduleId}

GET /api/scheduled-pipelines/[scheduleId] - Get a specific scheduled pipeline
PATCH /api/scheduled-pipelines/[scheduleId] - Update a scheduled pipeline
DELETE /api/scheduled-pipelines/[scheduleId] - Delete a scheduled pipeline

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| scheduleId | string | path | Yes | The scheduleId identifier |

**File:** `src/app/api/scheduled-pipelines/[scheduleId]/route.ts`

---

#### POST /scheduled-pipelines/execute

POST /api/scheduled-pipelines/execute - Execute scheduled pipelines that are due
This endpoint should be called by a cron job

**Authentication:** Required

**File:** `src/app/api/scheduled-pipelines/execute/route.ts`

---


### Scheduled-reports

#### GET, POST /scheduled-reports

GET /api/scheduled-reports
List all scheduled reports for the authenticated vendor

**Authentication:** Required

**File:** `src/app/api/scheduled-reports/route.ts`

---

#### GET, PATCH, DELETE /scheduled-reports/{id}

GET /api/scheduled-reports/[id]
Get details of a specific scheduled report

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/scheduled-reports/[id]/route.ts`

---

#### POST /scheduled-reports/process

POST /api/scheduled-reports/process
Process scheduled reports that are due to run
This endpoint should be called by a cron job (e.g., every hour or every day)
to check for and process any scheduled reports that need to run.
Authentication: Requires service role key or cron secret

**Authentication:** Required

**File:** `src/app/api/scheduled-reports/process/route.ts`

---


### Scheduling

#### POST, DELETE /scheduling/book

Meeting Booking API
Create a new meeting and sync with Google Calendar

**File:** `src/app/api/scheduling/book/route.ts`

---

#### GET /scheduling/slots

Scheduling Slots API
Returns available booking slots for a vendor and meeting type

**File:** `src/app/api/scheduling/slots/route.ts`

---


### Shared

#### GET, POST /shared/{token}

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| token | string | path | Yes | The token identifier |

**File:** `src/app/api/shared/[token]/route.ts`

---

#### GET /shared/post/{token}

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| token | string | path | Yes | The token identifier |

**File:** `src/app/api/shared/post/[token]/route.ts`

---


### Sla

#### GET, POST /sla/check-and-alert

SLA Monitoring and Alert Endpoint
POST /api/sla/check-and-alert
Checks pending reviews against SLA deadlines and sends alerts
Should be called by a cron job every 15-30 minutes

**File:** `src/app/api/sla/check-and-alert/route.ts`

---

#### GET /sla/metrics

SLA Metrics Endpoint
GET /api/sla/metrics
Returns SLA compliance metrics for the current vendor

**Authentication:** Required

**File:** `src/app/api/sla/metrics/route.ts`

---

#### GET, PUT /sla/settings

SLA Settings Endpoint
GET /api/sla/settings - Get current vendor's SLA settings
PUT /api/sla/settings - Update vendor's SLA settings

**Authentication:** Required

**File:** `src/app/api/sla/settings/route.ts`

---


### Stripe

#### GET, POST /stripe/connect

GET /api/stripe/connect - Get Connect account status

**File:** `src/app/api/stripe/connect/route.ts`

---


### Subscriptions

#### GET, POST /subscriptions

Subscriptions API
GET - List subscriptions (filtered by client or vendor)
POST - Create a new subscription for a client

**Authentication:** Required

**File:** `src/app/api/subscriptions/route.ts`

---

#### GET, PATCH, DELETE /subscriptions/{id}

Subscription Detail API
GET - Get subscription details
PATCH - Update subscription (change plan)
DELETE - Cancel subscription

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/subscriptions/[id]/route.ts`

---

#### GET, POST /subscriptions/plans

Subscription Plans API
GET - List all subscription plans for the vendor
POST - Create a new subscription plan

**Authentication:** Required

**File:** `src/app/api/subscriptions/plans/route.ts`

---

#### GET, PATCH, DELETE /subscriptions/plans/{id}

Subscription Plan Detail API
GET - Get subscription plan details
PATCH - Update subscription plan
DELETE - Deactivate subscription plan

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/subscriptions/plans/[id]/route.ts`

---


### Tracking

#### POST, PUT /tracking/attribution

Mark a session as converted

**Authentication:** Required

**File:** `src/app/api/tracking/attribution/route.ts`

---

#### POST /tracking/meta

API route for sending Meta Conversions API events
This allows client-side code to trigger server-side Meta tracking

**File:** `src/app/api/tracking/meta/route.ts`

---


### Upload

#### POST, DELETE /upload/avatar

**Authentication:** Required

**File:** `src/app/api/upload/avatar/route.ts`

---


### Vendor

#### GET, POST /vendor/addons

**File:** `src/app/api/vendor/addons/route.ts`

---

#### GET, PATCH, DELETE /vendor/addons/{id}

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/vendor/addons/[id]/route.ts`

---

#### GET /vendor/analytics/funnel

GET /api/vendor/analytics/funnel
Get funnel metrics for the vendor

**Authentication:** Required

**File:** `src/app/api/vendor/analytics/funnel/route.ts`

---

#### GET /vendor/analytics/pages

GET /api/vendor/analytics/pages
Get page performance metrics for the vendor

**Authentication:** Required

**File:** `src/app/api/vendor/analytics/pages/route.ts`

---

#### GET, POST, PUT /vendor/availability

Vendor availability API
Manage vendor availability slots

**Authentication:** Required

**File:** `src/app/api/vendor/availability/route.ts`

---

#### GET /vendor/check-handle

**File:** `src/app/api/vendor/check-handle/route.ts`

---

#### GET /vendor/clients

**Authentication:** Required

**File:** `src/app/api/vendor/clients/route.ts`

---

#### GET /vendor/clients/{id}

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/vendor/clients/[id]/route.ts`

---

#### GET /vendor/dashboard/stats

**Authentication:** Required

**File:** `src/app/api/vendor/dashboard/stats/route.ts`

---

#### GET, POST, PATCH /vendor/deliverables

**Authentication:** Required

**File:** `src/app/api/vendor/deliverables/route.ts`

---

#### GET, POST /vendor/domains

GET /api/vendor/domains
List all custom domains for the authenticated vendor

**Authentication:** Required

**File:** `src/app/api/vendor/domains/route.ts`

---

#### GET, PATCH, DELETE /vendor/domains/{domainId}

GET /api/vendor/domains/[domainId]
Get a specific custom domain

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| domainId | string | path | Yes | The domainId identifier |

**File:** `src/app/api/vendor/domains/[domainId]/route.ts`

---

#### GET, POST /vendor/domains/{domainId}/ssl

POST /api/vendor/domains/[domainId]/ssl
Provision SSL certificate for the domain

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| domainId | string | path | Yes | The domainId identifier |

**File:** `src/app/api/vendor/domains/[domainId]/ssl/route.ts`

---

#### GET, POST /vendor/domains/{domainId}/verify

POST /api/vendor/domains/[domainId]/verify
Verify domain ownership

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| domainId | string | path | Yes | The domainId identifier |

**File:** `src/app/api/vendor/domains/[domainId]/verify/route.ts`

---

#### GET, POST, PATCH /vendor/ip-allowlist

Get IP allowlist rules for current vendor
GET /api/vendor/ip-allowlist

**Authentication:** Required

**File:** `src/app/api/vendor/ip-allowlist/route.ts`

---

#### PATCH, DELETE /vendor/ip-allowlist/{ruleId}

Update an IP allowlist rule
PATCH /api/vendor/ip-allowlist/[ruleId]

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| ruleId | string | path | Yes | The ruleId identifier |

**File:** `src/app/api/vendor/ip-allowlist/[ruleId]/route.ts`

---

#### GET /vendor/leads

**Authentication:** Required

**File:** `src/app/api/vendor/leads/route.ts`

---

#### GET, POST /vendor/meeting-types

**Authentication:** Required

**File:** `src/app/api/vendor/meeting-types/route.ts`

---

#### GET /vendor/meetings

**Authentication:** Required

**File:** `src/app/api/vendor/meetings/route.ts`

---

#### GET, POST /vendor/offers

**File:** `src/app/api/vendor/offers/route.ts`

---

#### GET, PATCH, DELETE /vendor/offers/{id}

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/vendor/offers/[id]/route.ts`

---

#### GET, POST /vendor/pages

GET /api/vendor/pages
Get all offer pages for the current vendor

**Authentication:** Required

**File:** `src/app/api/vendor/pages/route.ts`

---

#### GET, PATCH, DELETE /vendor/pages/{id}

GET /api/vendor/pages/[id]
Get a specific offer page

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/vendor/pages/[id]/route.ts`

---

#### GET /vendor/pipeline

**Authentication:** Required

**File:** `src/app/api/vendor/pipeline/route.ts`

---

#### GET, PATCH /vendor/profile

GET /api/vendor/profile
Get the current user's vendor profile

**Authentication:** Required

**File:** `src/app/api/vendor/profile/route.ts`

---

#### POST /vendor/register

**File:** `src/app/api/vendor/register/route.ts`

---

#### GET /vendor/sales

**Authentication:** Required

**File:** `src/app/api/vendor/sales/route.ts`

---

#### GET /vendor/security/metrics

Get security metrics for vendor dashboard
GET /api/vendor/security/metrics

**Authentication:** Required

**File:** `src/app/api/vendor/security/metrics/route.ts`

---

#### GET, POST /vendor/sso

SSO Connections API
Manage SAML and OIDC SSO configurations

**Authentication:** Required

**File:** `src/app/api/vendor/sso/route.ts`

---

#### GET, PATCH, DELETE /vendor/sso/{id}

SSO Connection by ID API
Manage individual SSO connections

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/vendor/sso/[id]/route.ts`

---

#### POST /vendor/sso/{id}/test

Test SSO Connection API
Verify SSO configuration is valid

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/vendor/sso/[id]/test/route.ts`

---

#### GET, POST /vendor/tasks

**Authentication:** Required

**File:** `src/app/api/vendor/tasks/route.ts`

---

#### GET, PATCH, DELETE /vendor/tasks/{taskId}

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| taskId | string | path | Yes | The taskId identifier |

**File:** `src/app/api/vendor/tasks/[taskId]/route.ts`

---


### Vendors

#### GET, PATCH /vendors

GET /api/vendors
Get current user's vendor organization details

**Authentication:** Required

**File:** `src/app/api/vendors/route.ts`

---

#### POST /vendors/register

POST /api/vendors/register
Register a new vendor organization and create the first owner user
This endpoint is called during vendor sign-up to create:
1. Vendor organization record
2. User account via Supabase Auth
3. Profile record linked to vendor

**File:** `src/app/api/vendors/register/route.ts`

---

#### GET /vendors/team

GET /api/vendors/team
Get all team members for current vendor

**Authentication:** Required

**File:** `src/app/api/vendors/team/route.ts`

---

#### GET, POST /vendors/team/accept-invite

POST /api/vendors/team/accept-invite
Accept a team invitation and create user account
Body: { token, password, fullName }

**File:** `src/app/api/vendors/team/accept-invite/route.ts`

---

#### GET, POST /vendors/team/invite

POST /api/vendors/team/invite
Create a team member invitation

**Authentication:** Required

**File:** `src/app/api/vendors/team/invite/route.ts`

---

#### DELETE /vendors/team/invite/{invitationId}

DELETE /api/vendors/team/invite/[invitationId]
Cancel a pending invitation

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| invitationId | string | path | Yes | The invitationId identifier |

**File:** `src/app/api/vendors/team/invite/[invitationId]/route.ts`

---


### Webhooks

#### GET, POST /webhooks

Webhooks API - List and Create
GET /api/webhooks - List all webhooks for the vendor
POST /api/webhooks - Create a new webhook

**Authentication:** Required

**File:** `src/app/api/webhooks/route.ts`

---

#### GET, PATCH, DELETE /webhooks/{id}

Webhooks API - Individual Webhook Operations
GET /api/webhooks/[id] - Get webhook details
PATCH /api/webhooks/[id] - Update webhook
DELETE /api/webhooks/[id] - Delete webhook

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/webhooks/[id]/route.ts`

---

#### GET /webhooks/{id}/deliveries

Webhook Deliveries API
GET /api/webhooks/[id]/deliveries - Get delivery logs for a webhook

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/webhooks/[id]/deliveries/route.ts`

---

#### POST /webhooks/{id}/test

Webhook Test API
POST /api/webhooks/[id]/test - Send a test webhook delivery

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/webhooks/[id]/test/route.ts`

---

#### GET, POST /webhooks/process

Webhook Processing Cron Endpoint
POST /api/webhooks/process - Process pending webhook deliveries
This endpoint should be called by a cron job every 1-5 minutes
Can use Vercel Cron, GitHub Actions, or external cron service

**File:** `src/app/api/webhooks/process/route.ts`

---

#### POST /webhooks/resend

Resend Webhook Handler
Handles email events: sent, delivered, opened, clicked, bounced, complained

**File:** `src/app/api/webhooks/resend/route.ts`

---

#### GET, POST /webhooks/stripe

Stripe Webhook Handler
Processes Stripe webhook events to keep database in sync

**Authentication:** Required

**File:** `src/app/api/webhooks/stripe/route.ts`

---


### Website-scans

#### GET, DELETE /website-scans/{id}

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/website-scans/[id]/route.ts`

---


### Websites

#### GET, POST /websites

**File:** `src/app/api/websites/route.ts`

---

#### GET, PATCH, DELETE /websites/{id}

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/websites/[id]/route.ts`

---

#### GET /websites/{id}/blog-performance

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/websites/[id]/blog-performance/route.ts`

---

#### GET, PUT, DELETE /websites/{id}/check-back-config

GET /api/websites/[id]/check-back-config
Get check-back configuration for a website

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/websites/[id]/check-back-config/route.ts`

---

#### GET, POST /websites/{id}/competitors

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/websites/[id]/competitors/route.ts`

---

#### GET, PATCH, DELETE /websites/{id}/competitors/{competitorId}

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |
| competitorId | string | path | Yes | The competitorId identifier |

**File:** `src/app/api/websites/[id]/competitors/[competitorId]/route.ts`

---

#### POST /websites/{id}/competitors/{competitorId}/analyze

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |
| competitorId | string | path | Yes | The competitorId identifier |

**File:** `src/app/api/websites/[id]/competitors/[competitorId]/analyze/route.ts`

---

#### POST /websites/{id}/export-audit

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/websites/[id]/export-audit/route.ts`

---

#### GET, POST /websites/{id}/gap-report

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/websites/[id]/gap-report/route.ts`

---

#### GET, POST /websites/{id}/gaps

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/websites/[id]/gaps/route.ts`

---

#### POST /websites/{id}/generate-pitch

Generate pitch document (PDF/Email) for a website
POST /api/websites/[id]/generate-pitch

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/websites/[id]/generate-pitch/route.ts`

---

#### GET /websites/{id}/keyword-gaps

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/websites/[id]/keyword-gaps/route.ts`

---

#### GET, POST /websites/{id}/pitch/pdf

Generate PDF pitch deck for a website
POST /api/websites/[id]/pitch/pdf

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/websites/[id]/pitch/pdf/route.ts`

---

#### POST /websites/{id}/project-score

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/websites/[id]/project-score/route.ts`

---

#### GET, POST /websites/{id}/scan

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/websites/[id]/scan/route.ts`

---

#### GET /websites/{id}/seo-audits

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/websites/[id]/seo-audits/route.ts`

---

#### GET, POST /websites/{id}/topic-clusters

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/websites/[id]/topic-clusters/route.ts`

---

#### POST /websites/scrape

**File:** `src/app/api/websites/scrape/route.ts`

---


### Wordpress

#### GET, POST /wordpress/connections

**Authentication:** Required

**File:** `src/app/api/wordpress/connections/route.ts`

---

#### GET, POST /wordpress/publish

**Authentication:** Required

**File:** `src/app/api/wordpress/publish/route.ts`

---

#### GET, POST /wordpress/sites

**Authentication:** Required

**File:** `src/app/api/wordpress/sites/route.ts`

---

#### GET /wordpress/taxonomies

GET /api/wordpress/taxonomies
Fetch categories and tags from a WordPress site
Query params:
- connectionId: UUID of wordpress_connections record
- clientId: UUID of client (alternative to connectionId)

**Authentication:** Required

**File:** `src/app/api/wordpress/taxonomies/route.ts`

---


### Work-declarations

#### GET, POST /work-declarations

GET /api/work-declarations
List work declarations with filtering
Query params:
- clientId: Filter by client ID
- status: Filter by status
- type: Filter by type
- limit: Number of records (default 50)
- offset: Pagination offset (default 0)

**Authentication:** Required

**File:** `src/app/api/work-declarations/route.ts`

---

#### GET, PATCH, DELETE /work-declarations/{id}

GET /api/work-declarations/[id]
Get a single work declaration with full details including updates

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/work-declarations/[id]/route.ts`

---

#### GET, POST /work-declarations/{id}/updates

GET /api/work-declarations/[id]/updates
Get all updates for a work declaration

**Authentication:** Required

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | Yes | The id identifier |

**File:** `src/app/api/work-declarations/[id]/updates/route.ts`

---


## Statistics

- **Total Endpoints:** 314
- **Categories:** 60
- **Methods:**
  - DELETE: 38
  - GET: 201
  - PATCH: 41
  - POST: 183
  - PUT: 9
- **Authenticated Endpoints:** 215 (68%)
