# BlogCanvas Platform Overview

## Two Portals, Two Experiences

BlogCanvas provides separate interfaces for **Vendors** (content agencies) and **Clients** (their customers).

---

## 🏢 Vendor Dashboard (`/app/*`)

The vendor dashboard is the command center for content agencies to manage all their clients and content production.

### Pages & Features

| Route | Page | Description |
|-------|------|-------------|
| `/app` | Dashboard | Overview metrics, recent activity, work declarations |
| `/app/clients` | Client Management | List all clients, add new clients |
| `/app/clients/new` | Add Client | Onboard a new client |
| `/app/clients/[id]/overview` | Client Detail | Individual client overview and stats |
| `/app/websites` | Website Analysis | Manage client websites, run SEO audits |
| `/app/websites/[id]` | Website Detail | SEO scores, topic clusters, gaps |
| `/app/batches` | Content Batches | Manage content production batches |
| `/app/batches/[id]` | Batch Detail | View/edit batch, generate content |
| `/app/review` | Review Board | Kanban board for content workflow |
| `/app/publishing` | Publishing Queue | Schedule and publish approved content |
| `/app/analytics` | Analytics | Performance metrics across all clients |
| `/app/reports` | Reports | Generate client reports |
| `/app/reports/schedules` | Scheduled Reports | Automate recurring reports |

### AI & Content Tools

| Route | Page | Description |
|-------|------|-------------|
| `/app/competitor` | Competitor Analysis | Compare client sites vs competitors |
| `/app/images` | AI Image Generator | Generate blog images with DALL-E |
| `/app/posts/[id]/history` | Revision History | AI revision tracking |
| `/app/posts/[id]/outlines` | Outline Options | Multiple AI-generated outlines |

### Communication

| Route | Page | Description |
|-------|------|-------------|
| `/app/inbox` | Gmail Inbox | Integrated email management |
| `/app/emails` | Email Templates | Transactional email management |
| `/app/newsletters` | Newsletters | Newsletter campaigns |
| `/app/newsletters/[id]/recipients` | Recipients | Manage newsletter subscribers |

### Settings & Admin

| Route | Page | Description |
|-------|------|-------------|
| `/app/settings` | General Settings | Account settings |
| `/app/settings/gmail` | Gmail Integration | Connect Gmail accounts |
| `/app/settings/ga4` | GA4 Integration | Connect Google Analytics |
| `/app/settings/2fa` | Two-Factor Auth | Security settings |
| `/app/settings/security` | Security | Password, sessions |
| `/app/settings/sla` | SLA Config | Service level agreements |
| `/app/vendor/settings` | Vendor Profile | Company branding, logo |
| `/app/vendor/team` | Team Management | Invite team members |
| `/app/billing` | Billing | Subscription & invoices |

### Developer Tools

| Route | Page | Description |
|-------|------|-------------|
| `/app/developer` | Developer Portal | API overview |
| `/app/api-keys` | API Keys | Manage API keys |
| `/app/api-docs` | API Documentation | Interactive API explorer |
| `/app/webhooks` | Webhooks | Configure webhook endpoints |
| `/app/audit-logs` | Audit Logs | Activity tracking |

### Work Management

| Route | Page | Description |
|-------|------|-------------|
| `/app/work-declarations` | Work Declarations | Declare work for clients |
| `/app/work-declarations/[id]` | Declaration Detail | Update progress, milestones |
| `/app/files` | File Manager | Upload/share files with clients |

---

## 👤 Client Portal (`/portal/*`)

The client portal provides a streamlined view for clients to review and approve content.

### Pages & Features

| Route | Page | Description |
|-------|------|-------------|
| `/portal/login` | Login | Client authentication |
| `/portal/onboarding` | Onboarding | New client setup wizard |
| `/portal/dashboard` | Dashboard | Project overview, SEO progress |
| `/portal/posts` | Blog Posts | View all posts for review |
| `/portal/posts/[id]` | Post Detail | Review, approve, or request changes |
| `/portal/batches` | Content Batches | View content batch progress |
| `/portal/batches/[id]` | Batch Detail | Batch overview and posts |
| `/portal/brand` | Brand Guide | View/edit brand voice settings |
| `/portal/work` | Work Progress | See declared work and milestones |
| `/portal/notifications` | Notifications | Activity feed |
| `/portal/settings/notifications` | Notification Settings | Configure email preferences |

---

## Key Differences

| Feature | Vendor (`/app`) | Client (`/portal`) |
|---------|-----------------|-------------------|
| **Access** | Full admin access | Read + approve only |
| **Clients** | Manage multiple | See own data only |
| **Content** | Create, edit, generate | Review, approve, comment |
| **Analytics** | Full metrics | Project summary |
| **Billing** | Manage subscriptions | View invoices |
| **Settings** | Full configuration | Notification prefs only |

---

## Navigation Flow

```
Vendor Journey:
  /app → /app/clients → /app/websites/[id] → /app/batches → /app/review → /app/publishing

Client Journey:
  /portal/login → /portal/dashboard → /portal/posts → /portal/posts/[id] (approve)
```

---

## Access URLs

- **Vendor Dashboard**: `https://blogcanvas.io/app`
- **Client Portal**: `https://blogcanvas.io/portal`
- **Marketing Site**: `https://blogcanvas.io`
