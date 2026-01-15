# Blog Creation Pipeline & Status Flow Documentation

**Created:** January 14, 2026  
**Purpose:** Document full blog creation pipeline, URL handling, and status display across pages

---

## Overview

This document maps the complete blog creation process from URL input through all pipeline stages, and how status is displayed consistently across different pages in both vendor and client portals.

---

## 1. Blog Creation Entry Points

### Entry Point A: Pipeline Page (URL-based)
```
/app/pipeline → Enter URL → Run Pipeline → Generate Topics → Create Blogs
```

**URL Input Flow:**
1. User enters website URL (e.g., `https://example.com`)
2. Creates `pipeline_jobs` record with URL
3. Runs 4-step pipeline: Crawl → SEO Analysis → Gap Analysis → Topic Generation
4. Generates topic clusters from URL content
5. User selects topics → Creates blog posts

**API Sequence:**
```typescript
// 1. Create pipeline job
POST /api/pipeline-jobs
  { website_url, client_id, target_market, client_goals }

// 2. Run website audit
POST /api/ai/website-audit
  { websiteUrl, action: 'quick', maxPages: 30 }

// 3. Analyze content gaps
POST /api/ai/content-analysis
  { websiteUrl, action: 'keywords', industry }

// 4. Generate topic clusters
POST /api/ai/topic-clusters
  { websiteUrl, industry, targetAudience, businessGoals }

// 5. Generate blog from topic
POST /api/blog-posts/generate-full
  { topic, targetKeyword, clientId, wordCountGoal }
```

---

### Entry Point B: Client Posts Page
```
/app/clients/[clientId]/posts/new → Enter Topic → Generate Blog
```

**Direct Generation Flow:**
1. User selects client from dropdown
2. Enters topic and keyword manually
3. Generates blog with full AI pipeline
4. Blog associated with client automatically

---

### Entry Point C: Content Batch
```
/app/batches/new → Import Topics (CSV) → Bulk Generate
```

**Batch Flow:**
1. Create content batch with goals
2. Import topics via CSV
3. Generate blogs for each topic
4. Track batch progress

---

## 2. Blog Status State Machine

### All Possible Statuses

```typescript
type BlogStatus = 
  | 'idea'           // Initial concept
  | 'planned'        // Scheduled for creation
  | 'researching'    // Research agent running
  | 'outlining'      // Outline agent running
  | 'drafting'       // Draft agent running
  | 'generating'     // Full pipeline running
  | 'draft'          // AI draft complete
  | 'editing'        // Human editing in progress
  | 'needs_human_input' // Requires human review
  | 'ready_for_review'  // Ready for internal review
  | 'in_review'      // Being reviewed internally
  | 'client_review'  // Sent to client for approval
  | 'pending_review' // Waiting for client (approval_status)
  | 'revision_requested' // Client requested changes
  | 'approved'       // Client approved
  | 'scheduled'      // Scheduled for publishing
  | 'published'      // Live on WordPress
  | 'failed'         // Generation failed
```

### Status Transitions

```
                                    ┌──────────────┐
                                    │     idea     │
                                    └──────┬───────┘
                                           │
                                    ┌──────▼───────┐
                                    │   planned    │
                                    └──────┬───────┘
                                           │
        ┌──────────────────────────────────┼──────────────────────────────────┐
        │                                  │                                  │
┌───────▼───────┐               ┌──────────▼──────────┐              ┌───────▼───────┐
│  researching  │──────────────▶│     outlining       │─────────────▶│   drafting    │
└───────────────┘               └─────────────────────┘              └───────┬───────┘
                                                                            │
                                                                     ┌──────▼───────┐
                                                                     │ generating   │
                                                                     └──────┬───────┘
                                                                            │
        ┌───────────────────────────────────┬───────────────────────────────┤
        │                                   │                               │
┌───────▼───────┐                   ┌───────▼───────┐               ┌───────▼───────┐
│    failed     │                   │    draft      │◀──────────────│   editing     │
└───────────────┘                   └───────┬───────┘               └───────┬───────┘
                                            │                               │
                                    ┌───────▼───────┐               ┌───────▼───────┐
                                    │ready_for_review◀──────────────│needs_human_input
                                    └───────┬───────┘               └───────────────┘
                                            │
                                    ┌───────▼───────┐
                                    │  in_review    │
                                    └───────┬───────┘
                                            │
                                    ┌───────▼───────┐
                                    │ client_review │ (showcased)
                                    └───────┬───────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────┐
        │                                   │                               │
┌───────▼───────┐               ┌───────────▼───────────┐          ┌───────▼───────┐
│revision_requested             │      approved         │          │   rejected    │
└───────┬───────┘               └───────────┬───────────┘          └───────────────┘
        │                                   │
        │                           ┌───────▼───────┐
        └──────────────────────────▶│  scheduled    │
                                    └───────┬───────┘
                                            │
                                    ┌───────▼───────┐
                                    │   published   │
                                    └───────────────┘
```

---

## 3. Pages Displaying Blog Status

### Vendor Portal Pages

| Page | Statuses Shown | Data Source | Updates When |
|------|---------------|-------------|--------------|
| `/app` (Dashboard) | All (counts) | `/api/blog-posts` | Any status change |
| `/app/pipeline` | generating, draft | `/api/pipeline-jobs` | Pipeline completes |
| `/app/review` | draft → published | `/api/blog-posts` | Status drag-drop |
| `/app/approvals` | pending_review → published | `/api/blog-posts?include_approval=true` | Client action |
| `/app/batches` | All (per batch) | `/api/content-batches/[id]/posts` | Post status change |
| `/app/clients/[id]/posts` | All (per client) | `/api/clients/[id]/posts` | Post created/updated |
| `/app/publishing` | approved, scheduled, published | `/api/blog-posts?status=approved` | WordPress publish |

### Client Portal Pages

| Page | Statuses Shown | Data Source | Updates When |
|------|---------------|-------------|--------------|
| `/portal/dashboard` | pending_review (priority) | `/api/portal/approvals` | Vendor showcases |
| `/portal/posts` | All client posts | `/api/portal/posts` | Any post change |
| `/portal/approvals` | pending_review | `/api/portal/approvals?approval_status=pending_review` | Vendor showcases |
| `/portal/batches/[id]` | All in batch | `/api/portal/batches/[id]/posts` | Post status change |

---

## 4. Shared API Resources

### Core Blog Posts API

```typescript
// GET /api/blog-posts
// Returns posts filtered by status, batch, client
{
  posts: [{
    id: string,
    topic: string,
    status: BlogStatus,
    approval_status: ApprovalStatus,
    seo_quality_score: number,
    target_keyword: string,
    content_batch_id: string,
    client_id: string,
    wordpress_url?: string,
    created_at: string,
    updated_at: string
  }]
}

// Used by:
// - /app/review (all posts)
// - /app/dashboard (stats)
// - /app/batches (filtered by batch)
// - /app/clients/[id] (filtered by client)
```

### Portal Posts API (Client-Filtered)

```typescript
// GET /api/portal/posts
// Returns only posts for authenticated client
{
  posts: [{
    id: string,
    title: string,
    status: BlogStatus,
    approval_status: ApprovalStatus,
    showcased_at?: string,
    showcased_message?: string,
    wordpress_url?: string
  }]
}

// Used by:
// - /portal/dashboard
// - /portal/posts
// - /portal/approvals
```

### Status Update API

```typescript
// PATCH /api/blog-posts/[id]/status
// Updates post status
{ status: BlogStatus }

// Used by:
// - /app/review (drag-drop)
// - /app/approvals (showcase)
// - /api/blog-posts/[id]/publish-wordpress

// Triggers:
// - Notification creation (for client/vendor)
// - Approval status sync
// - WordPress publish (if status → published)
```

---

## 5. Status Badge Consistency

### Status Badge Component Pattern

All pages should use consistent status badge styling:

```typescript
const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { bg: string, text: string, label: string }> = {
    // Drafting stages
    'idea': { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Idea' },
    'planned': { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Planned' },
    'researching': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Researching' },
    'outlining': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Outlining' },
    'drafting': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Drafting' },
    'generating': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Generating...' },
    'draft': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
    
    // Review stages
    'editing': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Editing' },
    'needs_human_input': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Needs Input' },
    'ready_for_review': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Ready for Review' },
    'in_review': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In Review' },
    'client_review': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Client Review' },
    'pending_review': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending Review' },
    
    // Approval stages
    'revision_requested': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Revision Requested' },
    'approved': { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
    'rejected': { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
    
    // Publishing stages
    'scheduled': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Scheduled' },
    'published': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Published' },
    
    // Error
    'failed': { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' }
  };
  
  return statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
};
```

---

## 6. Review Board (Kanban) Columns

The review board groups statuses into columns:

```typescript
const KANBAN_COLUMNS = [
  { 
    id: 'draft', 
    title: 'Draft', 
    statuses: ['draft', 'generating', 'idea', 'researching', 'outlining', 'drafting'],
    color: 'bg-gray-100' 
  },
  { 
    id: 'editing', 
    title: 'Editing', 
    statuses: ['editing', 'needs_human_input'],
    color: 'bg-yellow-100' 
  },
  { 
    id: 'review', 
    title: 'In Review', 
    statuses: ['ready_for_review', 'in_review'],
    color: 'bg-blue-100' 
  },
  { 
    id: 'client', 
    title: 'Client Review', 
    statuses: ['client_review', 'pending_review'],
    color: 'bg-orange-100' 
  },
  { 
    id: 'approved', 
    title: 'Approved', 
    statuses: ['approved'],
    color: 'bg-green-100' 
  },
  { 
    id: 'published', 
    title: 'Published', 
    statuses: ['published', 'scheduled'],
    color: 'bg-purple-100' 
  }
];
```

---

## 7. Pipeline Job Status

For tracking pipeline execution:

```typescript
type PipelineJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface PipelineJob {
  id: string;
  website_url: string;
  status: PipelineJobStatus;
  current_step?: 'crawl' | 'analyze' | 'gaps' | 'topics';
  progress: number; // 0-100
  
  // Results
  seo_score?: number;
  pages_indexed?: number;
  content_gaps?: number;
  topics_generated?: number;
  blogs_created?: number;
  
  // Error handling
  error_message?: string;
  error_step?: string;
  
  // Timestamps
  started_at?: string;
  completed_at?: string;
  created_at: string;
}
```

---

## 8. Real-Time Status Updates

### Current Implementation
Pages fetch status on mount and require manual refresh.

### Recommended: Supabase Realtime

```typescript
// Subscribe to blog_posts status changes
supabase
  .channel('blog-status-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'blog_posts',
    filter: `status=neq.${oldStatus}`
  }, (payload) => {
    // Update local state
    setPosts(posts.map(p => 
      p.id === payload.new.id ? { ...p, status: payload.new.status } : p
    ))
  })
  .subscribe()
```

### Pages Needing Real-Time Status

| Page | Listen For |
|------|-----------|
| `/app/review` | Any status change |
| `/app/dashboard` | Status counts |
| `/app/pipeline` | Pipeline job progress |
| `/portal/dashboard` | `pending_review` count |
| `/portal/approvals` | New showcased posts |

---

## 9. Integration Test Scenarios

### Scenario: Pipeline → Blog Creation → Status Display

```typescript
test('Full pipeline creates blogs with correct status', async () => {
  // 1. Create pipeline job with URL
  const job = await createPipelineJob('https://example.com')
  
  // 2. Run pipeline
  await runPipeline(job.id)
  
  // 3. Verify job completed
  expect(job.status).toBe('completed')
  expect(job.topics_generated).toBeGreaterThan(0)
  
  // 4. Generate blog from topic
  const blog = await generateBlog(job.topics[0])
  
  // 5. Verify blog created with draft status
  expect(blog.status).toBe('draft')
  
  // 6. Verify appears in review board
  const reviewPosts = await fetchReviewPosts()
  expect(reviewPosts.find(p => p.id === blog.id)).toBeDefined()
})
```

### Scenario: Status Change Reflects Across Pages

```typescript
test('Status change syncs across all pages', async () => {
  // 1. Create blog in draft status
  const blog = await createBlog({ status: 'draft' })
  
  // 2. Update to ready_for_review
  await updateStatus(blog.id, 'ready_for_review')
  
  // 3. Verify review board shows in correct column
  const reviewPosts = await fetchReviewPosts()
  const post = reviewPosts.find(p => p.id === blog.id)
  expect(post.status).toBe('ready_for_review')
  
  // 4. Verify dashboard counts updated
  const stats = await fetchDashboardStats()
  expect(stats.inReview).toBeGreaterThan(0)
  
  // 5. Showcase for client
  await showcasePost(blog.id)
  
  // 6. Verify client portal shows post
  const clientApprovals = await fetchClientApprovals()
  expect(clientApprovals.find(p => p.id === blog.id)).toBeDefined()
})
```

---

## 10. Missing/TODO Items

| Feature | Status | Priority |
|---------|--------|----------|
| Shared StatusBadge component | ⏳ Each page has own implementation | Medium |
| Real-time status updates | ⏳ Not implemented | Medium |
| Pipeline job progress polling | ✅ Implemented | — |
| Status transition validation API | ⚠️ Partial (client-side only) | High |
| Batch progress calculation | ✅ Implemented | — |

---

*Last updated: January 14, 2026*
