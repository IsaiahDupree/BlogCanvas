# Cross-Portal Data Flow Documentation

**Created:** January 14, 2026  
**Purpose:** Map how data updates in one portal affect pages in the other portal

---

## Overview

BlogCanvas has two main portals:
- **Vendor Portal** (`/app/*`) - Used by CSM, Editors, Staff
- **Client Portal** (`/portal/*`) - Used by Clients to review and approve content

This document maps the bi-directional data dependencies between these portals.

---

## 1. Vendor Action → Client Portal Updates

### When Vendor Creates/Updates Blog Post

| Vendor Action | Client Pages Affected | Data Updated |
|---------------|----------------------|--------------|
| Creates new post | `/portal/posts` | Post appears in list |
| Completes AI draft | `/portal/posts` | Post content available |
| Showcases for review | `/portal/approvals`, `/portal/dashboard` | Post in "Needs Review" |
| Publishes to WordPress | `/portal/posts`, `/portal/dashboard` | Status → "Published", URL available |

**API Flow:**
```
POST /api/blog-posts (vendor creates)
  ↓
GET /api/portal/posts (client fetches)
  ↓
Client sees new post in their list
```

---

### When Vendor Showcases Post for Review

| Vendor Action | Notification Created | Client Pages Affected |
|---------------|---------------------|----------------------|
| Click "Showcase" | `content_ready_for_review` | `/portal/notifications` badge updates |
| Add showcase message | — | `/portal/approvals/[id]` shows message |
| Assign to client | — | Post appears in client's `/portal/approvals` |

**API Flow:**
```
POST /api/blog-posts/[id]/showcase (vendor)
  ↓
INSERT notifications (type: content_ready_for_review)
  ↓
GET /api/portal/approvals (client)
  ↓
Client sees post in approval queue
```

**Pages to Update:**
- `/portal/dashboard` - "Needs Your Review" section
- `/portal/approvals` - Pending approvals list
- `/portal/notifications` - New notification badge

---

### When Vendor Responds to Content Request

| Vendor Action | Client Pages Affected | Data Updated |
|---------------|----------------------|--------------|
| Views request | — | (No client impact) |
| Starts work | `/portal/requests` (if exists) | Status → "In Progress" |
| Completes request | `/portal/dashboard`, notifications | Status → "Completed" |
| Links post to request | `/portal/requests` | Result post linked |

**API Flow:**
```
PATCH /api/content-requests/[id] (vendor updates status)
  ↓
INSERT notifications (type: request_status_update)
  ↓
GET /api/portal/requests (client)
  ↓
Client sees updated status
```

---

### When Vendor Updates Client Brand Guide

| Vendor Action | Client Pages Affected | Data Updated |
|---------------|----------------------|--------------|
| Updates brand voice | `/portal/brand` | New voice displayed |
| Adds keywords | `/portal/brand` | Keywords list updated |
| Changes tone settings | `/portal/brand` | Tone preview updated |
| Uploads assets | `/portal/brand` | Assets gallery updated |

**API Flow:**
```
PATCH /api/clients/[id]/brand-guide (vendor)
  ↓
GET /api/portal/brand (client)
  ↓
Client sees updated brand guide
```

---

### When Vendor Publishes Batch

| Vendor Action | Client Pages Affected | Data Updated |
|---------------|----------------------|--------------|
| Publishes all approved | `/portal/posts`, `/portal/batches` | All posts → "Published" |
| Updates WordPress URLs | `/portal/posts/[id]` | Live URL displayed |
| Triggers check-backs | (Future) `/portal/analytics` | Metrics scheduled |

---

## 2. Client Action → Vendor Portal Updates

### When Client Approves Post

| Client Action | Notification Created | Vendor Pages Affected |
|---------------|---------------------|----------------------|
| Click "Approve" | `post_approved` | `/app/approvals` status updates |
| — | — | `/app/dashboard` stats update |
| — | — | Post unlocked for publishing |

**API Flow:**
```
POST /api/portal/approvals/[id]/approve (client)
  ↓
UPDATE blog_posts SET approval_status = 'approved'
  ↓
INSERT notifications (type: post_approved, user: vendor)
  ↓
GET /api/blog-posts (vendor)
  ↓
Vendor sees approved post, can publish
```

**Vendor Pages to Update:**
- `/app/approvals` - Post moves to "Approved" column
- `/app/dashboard` - "Posts Approved" count increases
- `/app/clients/[id]/overview` - Client activity updated
- `/app/review` - Post status updated if visible

---

### When Client Requests Revision

| Client Action | Notification Created | Vendor Pages Affected |
|---------------|---------------------|----------------------|
| Click "Request Changes" | `revision_requested` | `/app/approvals`, `/app/review` |
| Add revision comment | — | `/app/blog-posts/[id]` comments |
| Specify change areas | — | `/app/blog-posts/[id]` tasks |

**API Flow:**
```
POST /api/portal/approvals/[id]/request-revision (client)
  ↓
UPDATE blog_posts SET approval_status = 'revision_requested'
  ↓
INSERT revision_requests
  ↓
INSERT notifications (type: revision_requested, user: vendor)
  ↓
Vendor sees revision request in dashboard
```

**Vendor Pages to Update:**
- `/app/approvals` - Post moves to "Revision Requested"
- `/app/review` - Post appears in review queue
- `/app/blog-posts/[id]` - Revision comments visible
- `/app/notifications` - Alert for vendor

---

### When Client Rejects Post

| Client Action | Notification Created | Vendor Pages Affected |
|---------------|---------------------|----------------------|
| Click "Reject" | `post_rejected` | `/app/approvals` |
| Add rejection reason | — | `/app/blog-posts/[id]` |

**API Flow:**
```
POST /api/portal/approvals/[id]/reject (client)
  ↓
UPDATE blog_posts SET approval_status = 'rejected'
  ↓
INSERT notifications (type: post_rejected, user: vendor)
  ↓
Vendor sees rejection with reason
```

---

### When Client Submits Content Request

| Client Action | Notification Created | Vendor Pages Affected |
|---------------|---------------------|----------------------|
| Submit request | `new_content_request` | `/app/requests` new item |
| Set priority | — | Priority badge on request |
| Add attachments | — | Files visible to vendor |

**API Flow:**
```
POST /api/content-requests (client)
  ↓
INSERT content_requests
  ↓
INSERT notifications (type: new_content_request, user: vendor)
  ↓
GET /api/content-requests (vendor)
  ↓
Vendor sees new request in dashboard
```

**Vendor Pages to Update:**
- `/app/requests` - New request in list
- `/app/dashboard` - Request count badge
- `/app/notifications` - New notification

---

### When Client Updates Profile

| Client Action | Vendor Pages Affected | Data Updated |
|---------------|----------------------|--------------|
| Updates name | `/app/clients/[id]` | Display name changes |
| Updates avatar | `/app/clients`, `/app/requests` | Avatar shown |
| Updates contact info | `/app/clients/[id]/overview` | Contact details |

---

### When Client Adds Comment

| Client Action | Notification Created | Vendor Pages Affected |
|---------------|---------------------|----------------------|
| Post comment on blog | `new_comment` | `/app/blog-posts/[id]` |
| Reply to thread | `comment_reply` | `/app/blog-posts/[id]` |
| @mention vendor | `comment_mention` | `/app/notifications` |

**API Flow:**
```
POST /api/comments (client)
  ↓
INSERT comments
  ↓
INSERT notifications (type: new_comment, user: vendor)
  ↓
Vendor sees comment in post view
```

---

## 3. Shared Data Entities

### Blog Posts
```
┌─────────────────────────────────────────────────────────────────────┐
│                         blog_posts                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Vendor sees: All posts, full edit, all statuses                     │
│ Client sees: Own posts only, read-only, filtered statuses           │
├─────────────────────────────────────────────────────────────────────┤
│ Vendor updates → Client sees:                                        │
│   • content, title, seo_description                                 │
│   • approval_status (when showcased)                                │
│   • wordpress_url (when published)                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Client updates → Vendor sees:                                        │
│   • approval_status (approve/reject/revision)                       │
│   • rejection_reason, revision comments                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Content Batches
```
┌─────────────────────────────────────────────────────────────────────┐
│                       content_batches                                │
├─────────────────────────────────────────────────────────────────────┤
│ Vendor sees: All batches, full management                           │
│ Client sees: Own batches, progress view only                        │
├─────────────────────────────────────────────────────────────────────┤
│ Vendor updates → Client sees:                                        │
│   • Batch progress (posts completed/total)                          │
│   • Batch status changes                                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Notifications (Per-User)
```
┌─────────────────────────────────────────────────────────────────────┐
│                        notifications                                 │
├─────────────────────────────────────────────────────────────────────┤
│ Each user sees only their own notifications                         │
│ Cross-portal actions create notifications for the other party       │
├─────────────────────────────────────────────────────────────────────┤
│ Vendor action → Client notification                                  │
│ Client action → Vendor notification                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Real-Time Update Requirements

### Current Implementation (Polling/Refresh)
- Pages fetch data on mount and manual refresh
- No real-time updates

### Recommended: Supabase Realtime
```typescript
// Example: Client portal listening for new approvals
supabase
  .channel('client-approvals')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'blog_posts',
    filter: `client_id=eq.${clientId}`
  }, (payload) => {
    if (payload.new.approval_status === 'pending_review') {
      // Show notification badge
      // Refresh approvals list
    }
  })
  .subscribe()
```

### Pages Needing Real-Time Updates

| Page | Events to Listen |
|------|-----------------|
| `/portal/dashboard` | `blog_posts.approval_status` → pending_review |
| `/portal/approvals` | `blog_posts` changes for client |
| `/portal/notifications` | `notifications` inserts |
| `/app/dashboard` | `blog_posts.approval_status`, `content_requests` |
| `/app/requests` | `content_requests` inserts/updates |
| `/app/approvals` | `blog_posts.approval_status` changes |
| `/app/notifications` | `notifications` inserts |

---

## 5. Page-by-Page Data Dependencies

### Vendor Portal Pages

| Page | Fetches From | Updates When |
|------|-------------|--------------|
| `/app` (Dashboard) | `websites`, `batches`, `posts` | Posts created, Client approves |
| `/app/clients` | `clients`, `profiles` | Client updates profile |
| `/app/clients/[id]/overview` | `clients`, `posts`, `batches` | Any client post activity |
| `/app/approvals` | `blog_posts` with approval info | Client approves/rejects |
| `/app/requests` | `content_requests` | Client submits request |
| `/app/review` | `blog_posts`, `comments` | Client comments, requests revision |
| `/app/posts/[id]` | `blog_posts`, `comments`, `revisions` | Client comments |
| `/app/notifications` | `notifications` | Client takes any action |

### Client Portal Pages

| Page | Fetches From | Updates When |
|------|-------------|--------------|
| `/portal/dashboard` | `blog_posts`, `notifications` | Vendor showcases post |
| `/portal/posts` | `blog_posts` for client | Vendor creates/updates post |
| `/portal/posts/[id]` | `blog_posts`, `comments` | Vendor updates content |
| `/portal/approvals` | `blog_posts` pending review | Vendor showcases post |
| `/portal/approvals/[id]` | `blog_posts`, `comments` | Vendor responds to revision |
| `/portal/batches` | `content_batches`, `blog_posts` | Vendor batch progress |
| `/portal/brand` | `brand_guides` | Vendor updates brand guide |
| `/portal/notifications` | `notifications` | Vendor takes action |
| `/portal/settings` | `profiles` | Own updates only |

---

## 6. Integration Test Scenarios

### Scenario: Vendor Showcases → Client Sees

```typescript
test('Client sees showcased post in approvals', async () => {
  // 1. Vendor creates and showcases post
  await vendorShowcasesPost(postId, clientId)
  
  // 2. Client fetches approvals
  const approvals = await clientFetchesApprovals(clientId)
  
  // 3. Verify post appears
  expect(approvals).toContainPost(postId)
  expect(approvals[0].approval_status).toBe('pending_review')
})
```

### Scenario: Client Approves → Vendor Sees

```typescript
test('Vendor sees client approval', async () => {
  // 1. Client approves post
  await clientApprovesPost(postId)
  
  // 2. Vendor fetches posts
  const posts = await vendorFetchesPosts()
  
  // 3. Verify status updated
  const post = posts.find(p => p.id === postId)
  expect(post.approval_status).toBe('approved')
  
  // 4. Verify notification created
  const notifications = await vendorFetchesNotifications()
  expect(notifications).toContainType('post_approved')
})
```

### Scenario: Client Requests Content → Vendor Sees

```typescript
test('Vendor sees client content request', async () => {
  // 1. Client submits request
  const requestId = await clientSubmitsRequest({
    title: 'New Article',
    priority: 'high'
  })
  
  // 2. Vendor fetches requests
  const requests = await vendorFetchesRequests()
  
  // 3. Verify request appears
  expect(requests).toContainRequest(requestId)
  
  // 4. Verify notification created
  const notifications = await vendorFetchesNotifications()
  expect(notifications).toContainType('new_content_request')
})
```

---

## 7. Missing Integrations (TODO)

| Missing Feature | Impact | Priority |
|-----------------|--------|----------|
| Real-time updates via Supabase Realtime | Users must refresh to see changes | Medium |
| `/portal/requests` page | Clients can't track their requests | High |
| Batch-level approval ("Approve All") | Clients must approve one by one | Medium |
| Client analytics dashboard | Clients can't see post performance | Low |
| Push notifications | Users only see in-app notifications | Low |

---

## 8. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VENDOR PORTAL                                   │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                │
│  │ Dashboard │  │ Approvals │  │  Requests │  │   Review  │                │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘                │
│        │              │              │              │                       │
└────────┼──────────────┼──────────────┼──────────────┼───────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ blog_posts  │  │   clients   │  │  requests   │  │notifications│        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT PORTAL                                   │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                │
│  │ Dashboard │  │ Approvals │  │   Posts   │  │  Notifs   │                │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*Last updated: January 14, 2026*
