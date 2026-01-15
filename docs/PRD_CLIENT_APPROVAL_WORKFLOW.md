# PRD: Client Approval Workflow System

**Feature ID:** FEAT-050  
**Version:** 1.0  
**Date:** January 14, 2026  
**Status:** In Development

---

## 1. Executive Summary

This feature implements a comprehensive client approval workflow system that enables vendors to showcase blogs and content batches to clients, receive client feedback (approve/revise/reject), and publish approved content to WordPress. The system includes notification capabilities (web + email), public sharing URLs, and full audit tracking.

---

## 2. Problem Statement

Currently, BlogCanvas lacks a structured workflow for:
- Associating content with specific clients/websites
- Getting client approval before publishing
- Tracking revision requests and feedback
- Sharing content previews with clients
- Publishing approved content to client websites

Vendors need a streamlined process to collaborate with clients on content approval before final publication.

---

## 3. Goals & Objectives

### Primary Goals
1. **Client Association** - Link blogs/batches to specific clients and their websites
2. **Showcase Workflow** - Enable vendors to present content for client review
3. **Approval System** - Allow clients to approve, request revisions, or reject content
4. **Notification System** - Alert clients via web and email when content needs review
5. **Public Sharing** - Generate shareable URLs for content preview without login
6. **WordPress Publishing** - Push approved content directly to client WordPress sites

### Success Metrics
- Client approval turnaround time < 48 hours
- 90%+ of content goes through approval workflow
- Zero unauthorized publications

---

## 4. User Stories

### Vendor Stories
| ID | Story | Priority |
|----|-------|----------|
| V1 | As a vendor, I want to assign blogs/batches to specific clients so content is organized | High |
| V2 | As a vendor, I want to showcase content to clients for approval | High |
| V3 | As a vendor, I want to see approval status of all content at a glance | High |
| V4 | As a vendor, I want to make content public with a shareable URL | Medium |
| V5 | As a vendor, I want to respond to client revision requests | High |
| V6 | As a vendor, I want to push approved content to WordPress | High |
| V7 | As a vendor, I want to track all approval history and comments | Medium |

### Client Stories
| ID | Story | Priority |
|----|-------|----------|
| C1 | As a client, I want to receive notifications when content is ready for review | High |
| C2 | As a client, I want to approve content with one click | High |
| C3 | As a client, I want to request revisions with specific comments | High |
| C4 | As a client, I want to reject content with a reason | Medium |
| C5 | As a client, I want to see all content pending my approval | High |
| C6 | As a client, I want to view content history and previous versions | Low |

---

## 5. Feature Specifications

### 5.1 Content-Client Association

**Database Changes:**
```sql
-- Add client association to blog_posts
ALTER TABLE blog_posts ADD COLUMN client_id UUID REFERENCES clients(id);
ALTER TABLE blog_posts ADD COLUMN website_id UUID REFERENCES websites(id);

-- Add approval workflow fields
ALTER TABLE blog_posts ADD COLUMN approval_status TEXT DEFAULT 'draft';
-- Status: draft, pending_review, approved, revision_requested, rejected, published
ALTER TABLE blog_posts ADD COLUMN showcased_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN approved_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN approved_by UUID REFERENCES profiles(id);
ALTER TABLE blog_posts ADD COLUMN public_token TEXT UNIQUE;
ALTER TABLE blog_posts ADD COLUMN is_public BOOLEAN DEFAULT false;
```

**Approval Statuses:**
| Status | Description | Next Actions |
|--------|-------------|--------------|
| `draft` | Content being created/edited | Showcase to client |
| `pending_review` | Awaiting client approval | Approve, Request Revision, Reject |
| `revision_requested` | Client requested changes | Edit and re-showcase |
| `approved` | Client approved content | Publish to WordPress |
| `rejected` | Client rejected content | Archive or delete |
| `published` | Live on WordPress | N/A |

### 5.2 Showcase Workflow

**Vendor Actions:**
1. Select blog post or batch
2. Choose client/website to showcase to
3. Add optional message/notes
4. Click "Showcase to Client"
5. System sends notifications

**API Endpoint:**
```
POST /api/blog-posts/[id]/showcase
Body: { client_id, website_id, message }
```

### 5.3 Client Approval Interface

**Client Portal Features:**
- Dashboard widget showing pending approvals
- Dedicated "Pending Approvals" page
- Content preview with full formatting
- Action buttons: Approve | Request Revision | Reject
- Comment/feedback form
- Approval history timeline

**Client Actions:**
```
POST /api/blog-posts/[id]/approve
POST /api/blog-posts/[id]/request-revision
Body: { comment, specific_changes[] }
POST /api/blog-posts/[id]/reject
Body: { reason }
```

### 5.4 Notification System

**Trigger Events:**
| Event | Recipients | Channels |
|-------|------------|----------|
| Content showcased | Client users | Web + Email |
| Revision requested | Vendor users | Web + Email |
| Content approved | Vendor users | Web + Email |
| Content rejected | Vendor users | Web + Email |
| Content published | Client users | Web + Email |

**Email Templates:**
- `showcase-notification` - New content ready for review
- `revision-requested` - Client requested changes
- `content-approved` - Content has been approved
- `content-rejected` - Content was rejected
- `content-published` - Content is now live

**Web Notifications:**
- Real-time toast notifications
- Notification bell with unread count
- Notification center with history

### 5.5 Public Sharing

**Features:**
- Generate unique public token for content
- Public URL: `/shared/[token]`
- No authentication required to view
- Toggle public/private per content
- Optional password protection
- Expiration date option

**Security:**
- Cryptographically secure tokens
- Rate limiting on public endpoints
- No sensitive data exposed
- Audit logging of views

### 5.6 WordPress Publishing

**Integration:**
- Store WordPress credentials per client/website
- Support for REST API publishing
- Map content fields to WordPress post format
- Handle featured images
- Set categories and tags
- Schedule or publish immediately

**API Flow:**
```
POST /api/blog-posts/[id]/publish-wordpress
Body: { website_id, publish_date?, categories[], tags[] }
```

---

## 6. Database Schema

### 6.1 New Tables

```sql
-- Content approval history
CREATE TABLE content_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES content_batches(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- showcased, approved, revision_requested, rejected, published
    actor_id UUID REFERENCES profiles(id),
    actor_type TEXT NOT NULL, -- vendor, client
    comment TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revision requests
CREATE TABLE revision_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES profiles(id),
    comment TEXT NOT NULL,
    specific_changes JSONB, -- Array of specific change requests
    status TEXT DEFAULT 'open', -- open, addressed, closed
    addressed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    read BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WordPress integrations
CREATE TABLE wordpress_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    website_id UUID REFERENCES websites(id),
    site_url TEXT NOT NULL,
    api_username TEXT,
    api_key_encrypted TEXT, -- Application password, encrypted
    status TEXT DEFAULT 'active',
    last_publish_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Published posts tracking
CREATE TABLE wordpress_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    wordpress_site_id UUID REFERENCES wordpress_sites(id),
    wordpress_post_id INTEGER,
    wordpress_url TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);
```

### 6.2 Updated Tables

```sql
-- blog_posts additions
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS website_id UUID REFERENCES websites(id);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS showcased_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS showcased_by UUID REFERENCES profiles(id);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS public_expires_at TIMESTAMPTZ;

-- content_batches additions
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft';
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS showcased_at TIMESTAMPTZ;
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS showcased_by UUID REFERENCES profiles(id);
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;
ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
```

---

## 7. API Endpoints

### 7.1 Showcase APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/blog-posts/[id]/showcase` | Showcase post to client |
| POST | `/api/batches/[id]/showcase` | Showcase batch to client |
| GET | `/api/showcase/pending` | Get all pending showcases |

### 7.2 Approval APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/blog-posts/[id]/approve` | Client approves post |
| POST | `/api/blog-posts/[id]/request-revision` | Client requests changes |
| POST | `/api/blog-posts/[id]/reject` | Client rejects post |
| GET | `/api/approvals/history/[id]` | Get approval history |

### 7.3 Public Sharing APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/blog-posts/[id]/make-public` | Generate public link |
| DELETE | `/api/blog-posts/[id]/make-private` | Revoke public access |
| GET | `/api/shared/[token]` | Get public content |

### 7.4 WordPress APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wordpress/sites` | Add WordPress site |
| GET | `/api/wordpress/sites` | List WordPress sites |
| POST | `/api/blog-posts/[id]/publish-wordpress` | Publish to WordPress |
| GET | `/api/wordpress/posts/[id]` | Get WordPress post status |

### 7.5 Notification APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PATCH | `/api/notifications/[id]/read` | Mark as read |
| PATCH | `/api/notifications/mark-all-read` | Mark all as read |
| GET | `/api/notifications/unread-count` | Get unread count |

---

## 8. UI Components

### 8.1 Vendor Dashboard Updates
- **Approval Status Column** - Show status in blog/batch lists
- **Showcase Button** - Quick action to showcase content
- **Status Filters** - Filter by approval status
- **Notification Bell** - Real-time notification indicator

### 8.2 New Vendor Pages
- `/app/approvals` - Approval management dashboard
- `/app/wordpress` - WordPress site management

### 8.3 Client Portal Updates
- **Pending Approvals Widget** - Dashboard summary
- `/portal/approvals` - Full approval queue
- `/portal/approvals/[id]` - Content review page
- **Notification Center** - View all notifications

### 8.4 Public Pages
- `/shared/[token]` - Public content view (no auth)

---

## 9. Email Templates

### 9.1 Showcase Notification
```
Subject: New content ready for your review - [Post Title]

Hi [Client Name],

[Vendor Name] has shared new content for your review:

Title: [Post Title]
Type: Blog Post / Content Batch

[Preview Button]

Please review and provide your feedback:
- Approve if ready to publish
- Request revisions with specific changes
- Reject if not suitable

This content is waiting for your approval.

Best regards,
BlogCanvas Team
```

### 9.2 Revision Requested
```
Subject: Revision requested for [Post Title]

Hi [Vendor Name],

[Client Name] has requested revisions to:

Title: [Post Title]

Feedback:
[Client Comments]

[View Details Button]

Please address these changes and re-submit for approval.
```

---

## 10. Implementation Phases

### Phase 1: Database & Core APIs (Week 1)
- [ ] Create database migrations
- [ ] Implement approval status fields
- [ ] Build showcase API endpoints
- [ ] Build approval API endpoints

### Phase 2: Vendor UI (Week 1-2)
- [ ] Add approval status to blog/batch lists
- [ ] Create showcase modal/flow
- [ ] Build approval management dashboard
- [ ] Add status filters and actions

### Phase 3: Client Portal (Week 2)
- [ ] Create pending approvals page
- [ ] Build content review interface
- [ ] Implement approve/revise/reject actions
- [ ] Add comment functionality

### Phase 4: Notifications (Week 2-3)
- [ ] Create notification system
- [ ] Build email templates
- [ ] Implement web notifications
- [ ] Add notification preferences

### Phase 5: Public Sharing (Week 3)
- [ ] Implement public token generation
- [ ] Create public view page
- [ ] Add toggle public/private UI

### Phase 6: WordPress Integration (Week 3-4)
- [ ] Build WordPress site management
- [ ] Implement REST API publishing
- [ ] Add publish workflow UI
- [ ] Handle media uploads

### Phase 7: Testing & Polish (Week 4)
- [ ] E2E tests for all workflows
- [ ] Email delivery testing
- [ ] Security audit
- [ ] Performance optimization

---

## 11. Security Considerations

1. **Authorization** - Verify user can access/modify content
2. **Public Tokens** - Cryptographically secure, non-guessable
3. **WordPress Credentials** - Encrypted at rest, never exposed in API
4. **Rate Limiting** - Prevent abuse of public endpoints
5. **Audit Logging** - Track all approval actions
6. **Email Validation** - Verify email addresses before sending

---

## 12. Success Criteria

- [ ] Vendors can showcase content to any client
- [ ] Clients receive email + web notifications
- [ ] Clients can approve/revise/reject from portal
- [ ] Vendors see all approval statuses at a glance
- [ ] Public URLs work without authentication
- [ ] Approved content can be published to WordPress
- [ ] Full audit trail of all actions
- [ ] E2E tests pass for all workflows

---

## 13. Open Questions

1. Should batch approval require approving each post individually or batch-level approval?
2. What happens to content when a client is deleted?
3. Should there be auto-approval after X days?
4. Should vendors be able to publish without client approval (override)?

---

## Appendix A: Workflow Diagrams

### Content Approval Flow
```
[Draft] → Vendor: Showcase → [Pending Review]
                                    ↓
                    Client: Approve → [Approved] → Vendor: Publish → [Published]
                    Client: Request Revision → [Revision Requested] → Vendor: Edit → [Pending Review]
                    Client: Reject → [Rejected]
```

### Notification Flow
```
Vendor: Showcase → System: Create Notification → System: Send Email → Client: Receives Alert
Client: Action → System: Create Notification → System: Send Email → Vendor: Receives Alert
```
