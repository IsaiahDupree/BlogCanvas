# BlogCanvas: Vendor Offer Platform PRD

**Version:** 1.0  
**Date:** January 17, 2026  
**Status:** Draft

---

## Executive Summary

BlogCanvas evolves from a blog/content platform into a **Vendor-branded landing pages + offer checkout + client onboarding hub + relationship management** platform.

### Core Value Proposition
- **Landing page builder** with proven templates + VSL blocks
- **Checkout** (one-time / subscription / setup fee / add-ons)
- **Client portal** (deliverables, revisions, calls, updates)
- **Calendar scheduling** (vendor + client)
- **Analytics + event tracking** (views, clicks, bookings, purchases)

---

## 1. System Architecture

```
                    ┌──────────────────────────────────────────┐
Visitor / Client ──▶│  BlogCanvas Web (Next.js)                │
Vendor / Admin  ───▶│  - Landing Pages (public)                │
                    │  - Editor (vendor)                       │
                    │  - Vendor Dashboard                      │
                    │  - Client Portal (workspace)             │
                    └───────────────┬──────────────────────────┘
                                    │ (API calls / server actions)
                                    ▼
                    ┌──────────────────────────────────────────┐
                    │  BlogCanvas App API (same repo)          │
                    │  - Auth + RBAC                           │
                    │  - Offer/Checkout orchestration          │
                    │  - Scheduling orchestration              │
                    │  - Webhooks (Stripe, Calendar)           │
                    │  - Event tracking (server-side)          │
                    └───────────────┬──────────────────────────┘
                                    │
         ┌──────────────────────────┼───────────────────────────┐
         ▼                          ▼                           ▼
┌───────────────────┐     ┌───────────────────┐        ┌───────────────────┐
│ Postgres (Supabase│     │ Object Storage     │        │ Event/Analytics    │
│ + RLS multi-tenant│     │ (R2/S3/Supabase)   │        │ (PostHog)          │
└───────────────────┘     └───────────────────┘        └───────────────────┘
         │                          │                           │
         ▼                          ▼                           ▼
┌───────────────────┐     ┌───────────────────┐        ┌───────────────────┐
│ Payments (Stripe) │     │ Email/SMS (Resend/ │        │ Ads (Meta Pixel +  │
│ + webhooks         │     │ Twilio)            │        │ CAPI server-side)  │
└───────────────────┘     └───────────────────┘        └───────────────────┘

(Background Jobs)
┌───────────────────────────────────────────────────────────────┐
│ Inngest / Trigger.dev / BullMQ                                │
│ - send emails, generate PDFs, roll up analytics, sync calendar │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. URL Routing Scheme

### Public Offer Pages
```
blogcanvas.com/@vendorhandle/<slug>
```

**Example:** `blogcanvas.com/@portalcopyco/newsletter-audit`

### Custom Domains (Phase 2)
```
offers.vendor.com/<slug>
```

### Internal Keys
- `vendor_handle` - public URL identifier
- `page_slug` - human-readable page path
- `page_id` - immutable internal ID (for redirects)

---

## 3. Landing Page Builder

### Page Framework (Conversion-Optimized Sections)

| Section | Purpose | Components |
|---------|---------|------------|
| **Hero** | Hook + CTA | Headline, one-liner, primary CTA button |
| **VSL Block** | Video sales letter | Embed (YT/Vimeo/upload), CTA button below |
| **Problem → Solution** | Agitate pain | Problem statement, agitation, solution preview |
| **What's Included** | Deliverables | Bullets, modules, feature list |
| **Proof** | Social proof | Testimonials, logos, screenshots, case studies |
| **Offer Stack** | Value build | Base offer, add-ons, bonuses |
| **Pricing + Checkout** | Conversion | One-time/subscription/retainer, setup fee, add-ons |
| **FAQ** | Objection handling | Expandable Q&A |
| **Final CTA** | Close | Last call-to-action |

### Vendor Add-Ons (First-Class Objects)
- Setup fee
- Rush delivery
- Extra revisions
- Retainer upgrade
- Done-for-you funnel setup
- Ad pixel setup
- Monthly optimization

---

## 4. Checkout System

### Offer Types
| Type | Description |
|------|-------------|
| One-time purchase | Single payment |
| Subscription | Recurring monthly/annual |
| Retainer | Monthly with defined scope |
| Book-a-call | Free or paid deposit |

### Checkout Features
- Base price + add-ons
- Optional deposit
- Optional "request a quote" mode (lead capture)
- Stripe integration with webhooks

### Post-Checkout Flow
1. Stripe webhook confirms purchase
2. Create client record (if new)
3. Create workspace
4. Create order record
5. Generate onboarding checklist from template
6. Send "Your portal is ready" email

---

## 5. Client Portal (Workspace)

### Client View
| Feature | Description |
|---------|-------------|
| Purchase summary | Scope, pricing, add-ons |
| Onboarding checklist | Step-by-step tasks |
| Forms | Goals, brand voice, assets, logins |
| Revisions | Request/approve loop |
| Deliverables | Files and links |
| Meeting scheduler | Book + view meetings |
| Messages | Updates and communication |
| Timeline | Milestones and progress |

### Vendor Dashboard
| Feature | Description |
|---------|-------------|
| Leads | Who visited, opted in, booked |
| Sales | Purchases, MRR, refunds |
| Pipeline | Prospect → Booked → Paid → Onboarding → Active → Completed |
| Client profiles | Notes, forms, files, messages |
| Content engagement | What they viewed, check-in frequency |
| Calendar settings | Availability, meeting types |
| Templates library | Landing page + onboarding templates |

---

## 6. Scheduling System

### MVP Approach
1. Vendor connects Google Calendar (OAuth)
2. Vendor defines availability + meeting types
3. Client books a slot
4. System creates event + sends confirmations

### Phase 2
- Client calendar linking (conflict checks)
- Multi-calendar support (Outlook, Apple CalDAV)

**Rule:** Vendor calendar is source of truth.

---

## 7. Event Tracking & Analytics

### Landing Page Events
| Event | Trigger |
|-------|---------|
| `page_view` | Page load |
| `scroll_depth` | 25/50/75/100% |
| `vsl_play` | Video starts |
| `cta_click_primary` | Main CTA clicked |
| `checkout_start` | Checkout initiated |
| `checkout_complete` | Payment successful |
| `lead_submit` | Opt-in form submitted |
| `book_call_start` | Booking flow started |
| `book_call_complete` | Meeting booked |

### Client Portal Events
| Event | Trigger |
|-------|---------|
| `client_portal_view` | Portal accessed |
| `onboarding_step_completed` | Task finished |
| `form_submitted` | Form filled |
| `message_sent` | Message posted |
| `revision_requested` | Revision created |
| `deliverable_viewed` | File/link opened |
| `meeting_join_link_clicked` | Join button clicked |

### Vendor Dashboard Metrics
- Time on page
- Scroll depth buckets
- VSL completion %
- CTA click-through rate
- Checkout conversion rate
- Booked call rate
- Client check-in frequency (portal visits/week)

---

## 8. Data Model

### Core Objects
```
vendors
├── vendor_members (team roles)
├── offer_pages (landing pages)
│   ├── page_blocks / page_json
│   ├── offers
│   │   └── offer_addons
│   └── domain_mappings
├── meeting_types
└── templates

clients
├── workspaces (client ↔ vendor container)
│   ├── onboarding_steps
│   ├── forms / form_submissions
│   ├── messages
│   ├── deliverables
│   ├── revision_requests
│   └── meetings
└── orders / subscriptions

checkout_sessions
orders
subscriptions
invoices

event_log (analytics)
attribution (UTM, referrer, campaign)
daily_rollups / funnel_rollups
```

---

## 9. Security & Multi-Tenancy

### Row Level Security (RLS)
- All tables keyed with `vendor_id` and/or `workspace_id`
- Public offer pages: `is_published = true` only

### Roles
| Role | Access |
|------|--------|
| `vendor_owner` | Full vendor access |
| `vendor_admin` | Manage clients, pages |
| `vendor_member` | Limited access |
| `client_user` | Own workspace only |

### Sensitive Data
- Stripe keys: server env only
- Google tokens: encrypted at rest
- Storage: signed URLs for client files

---

## 10. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Database | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage / R2 |
| Payments | Stripe |
| Email | Resend |
| Analytics | PostHog |
| Calendar | Google Calendar API |
| Background Jobs | Inngest / Trigger.dev |
| Hosting | Vercel |

---

## 11. Implementation Phases

### Phase 1: MVP (Ship First)
1. Vendor auth + vendor profile
2. Offer page builder (JSON blocks + 3-5 templates)
3. URL scheme + publish flow
4. Stripe checkout (one-time + subscription)
5. Post-checkout workspace creation
6. Client portal (onboarding + messaging + deliverables + revisions)
7. Vendor dashboard (workspaces + revenue + basic funnel)
8. Google Calendar connect + booking
9. Core event tracking

### Phase 2: Scale
- Custom domains
- Template marketplace
- Advanced add-ons (revision packs, rush, setup fee rules)
- Client calendar linking + conflict checks
- Automations (email/SMS reminders, onboarding nudges)
- Multi-vendor teams, roles, permissions
- Deeper analytics + attribution (UTMs, adset tracking)
- Meta CAPI server-side tracking

---

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| Vendor activation | 70% create first offer page |
| Checkout conversion | 3-5% visitor → purchase |
| Client portal engagement | 3+ check-ins/week |
| Meeting show rate | 80%+ |
| Vendor retention | 60% monthly active |

---

## Appendix: Critical User Flows

### Flow 1: Visitor → Checkout
1. Visitor opens `/@vendor/slug`
2. Page renders with vendor branding + pixel injection
3. UTM captured → attribution cookie
4. Events fire: `page_view`, `scroll_depth`, `vsl_play`, `cta_click`
5. Click "Buy" → Stripe checkout session created
6. Stripe confirms → workspace + order created
7. Email sent: "Your portal is ready"

### Flow 2: Client Portal Usage
1. Client logs in → `client_portal_view` event
2. Completes onboarding steps → `onboarding_step_completed`
3. Submits forms → `form_submitted`
4. Views deliverables → `deliverable_viewed`
5. Rollups compute weekly engagement

### Flow 3: Booking a Call
1. Client selects meeting type + slot
2. API checks vendor availability
3. Creates: meeting record + Google Calendar event
4. Sends confirmations + reminders
5. Meeting appears in portal + dashboard

### Flow 4: Vendor Dashboard
1. Vendor views traffic funnel (views → clicks → checkout → purchase)
2. Sees booked calls + show rate
3. Reviews client engagement (check-ins)
4. Manages active workspaces + "needs attention" flags
