# BlogCanvas — Master Product Requirements Document

**Version:** 1.0  
**Date:** February 2026  
**Status:** Active Development  
**Priority:** P3 (Tier 2 Product Application)

---

## Executive Summary

**BlogCanvas** is a client-vendor relationship project management suite for bloggers and content creators. It provides tools for managing vendor offers, client relationships, content pipelines, AI-powered content generation, and white-label delivery — all built on Next.js with Supabase.

**Core Value:** Streamline the entire blogger workflow from vendor pitch → content creation → client approval → publishing, with AI assistance at every step.

---

## Target Users

- **Bloggers** managing brand partnerships and sponsored content
- **Content creators** with multiple vendor/client relationships
- **Marketing agencies** coordinating content across clients
- **Freelance writers** tracking assignments and deliverables

---

## Core Modules

### 1. Vendor Offer Platform
- Browse, filter, and manage vendor offers
- Offer categorization and tagging
- Application tracking and status management
- Revenue tracking per vendor
- **PRD:** `docs/PRD_VENDOR_OFFER_PLATFORM.md` (95% implemented)

### 2. Client Management & Purchasing
- Client profiles with contact info and preferences
- Project assignment and tracking
- Invoice generation and payment tracking
- Client communication history
- **PRD:** `docs/PRD_CLIENT_MANAGEMENT_PURCHASING.md` (Complete)

### 3. AI Content Pipeline
- AI-powered content generation (briefs, drafts, titles)
- Brand context integration for voice consistency
- Content revision history with diff tracking
- Pitch report generator for vendor outreach
- **PRDs:** `docs/PRD_AI_AGENTS_PIPELINE.md`, `docs/PRD_BRAND_CONTEXT_INTEGRATION.md`, `docs/PRD_PITCH_REPORT_GENERATOR.md` (Complete)

### 4. Client Approval Workflow
- Submit content for client review
- Comment and feedback system
- Revision request tracking
- Approval/rejection with timestamps
- **PRD:** `docs/PRD_CLIENT_APPROVAL_WORKFLOW.md` (Complete)

### 5. Pipeline / Kanban Board
- Visual pipeline for content stages
- Drag-and-drop task management
- Custom columns and filters
- Deadline tracking and reminders
- **PRD:** `docs/PRD_PIPELINE_PAGE.md` (Complete)

### 6. CSV Import/Export
- Bulk import clients, vendors, content items
- Export data for reporting
- Template-based import mapping
- Validation and error handling
- **PRD:** `docs/PRD_CSV_IMPORT_EXPORT.md` (Complete)

### 7. Content Request System
- Clients submit content requests
- Template-based request forms
- Priority and deadline management
- Auto-assignment rules
- **PRD:** `docs/PRD_CLIENT_CONTENT_REQUESTS.md` (Complete)

---

## Upcoming Features

### Mobile & PWA Support (High Priority)
- Responsive mobile layouts for all pages
- PWA manifest and service worker
- Offline-capable for reading/editing
- Push notifications for approvals and deadlines
- **PRD:** `docs/PRD_MOBILE_PWA_SUPPORT.md`
- **Effort:** 12-16 hours

### White-Label & Custom Domains (High Priority)
- Custom domain mapping per client/brand
- White-label branding (logo, colors, fonts)
- Custom email domains for notifications
- Branded client portals
- **PRD:** `docs/PRD_WHITE_LABEL_DOMAINS.md`
- **Effort:** 16-20 hours

### Client Self-Service Portal (Medium Priority)
- Clients log in to view their content
- Submit requests and feedback directly
- View invoices and payment history
- Dashboard with project status
- **PRD:** `docs/PRD_CLIENT_SELF_SERVICE.md`
- **Effort:** 30-40 hours

### Referral & Affiliate System (Medium Priority)
- Referral links and tracking
- Commission tiers and payouts
- Affiliate dashboard with analytics
- Automated payout via Stripe Connect
- **PRD:** `docs/PRD_REFERRAL_AFFILIATE_SYSTEM.md`
- **Effort:** 20-25 hours

### Testing Strategy (High Priority)
- Unit test coverage for all utilities
- Integration tests for API routes
- E2E tests with Playwright
- Visual regression testing
- **PRD:** `docs/PRD_TESTING_STRATEGY.md`
- **Effort:** 40-60 hours

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TailwindCSS 4 |
| **Backend** | Next.js API Routes, Server Actions |
| **Database** | Supabase (PostgreSQL) with RLS |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage |
| **Payments** | Stripe |
| **Email** | Resend |
| **Analytics** | PostHog, Meta Pixel |
| **Port** | 4848 (dev server) |

---

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles and settings |
| `vendors` | Vendor companies and offers |
| `clients` | Client accounts and preferences |
| `projects` | Content projects and assignments |
| `content_items` | Individual content pieces |
| `approvals` | Approval workflow records |
| `revisions` | Content revision history |
| `invoices` | Billing and payment records |
| `pipeline_stages` | Kanban board configuration |
| `ai_generations` | AI-generated content log |

---

## PRD Index

### Implemented (Complete)
| PRD | File | Status |
|-----|------|--------|
| Vendor Offer Platform | `docs/PRD_VENDOR_OFFER_PLATFORM.md` | 95% |
| Client Management | `docs/PRD_CLIENT_MANAGEMENT_PURCHASING.md` | Complete |
| AI Agents Pipeline | `docs/PRD_AI_AGENTS_PIPELINE.md` | Complete |
| CSV Import/Export | `docs/PRD_CSV_IMPORT_EXPORT.md` | Complete |
| Client Approval Workflow | `docs/PRD_CLIENT_APPROVAL_WORKFLOW.md` | Complete |
| Pipeline Page | `docs/PRD_PIPELINE_PAGE.md` | Complete |
| Pitch Report Generator | `docs/PRD_PITCH_REPORT_GENERATOR.md` | Complete |
| Brand Context Integration | `docs/PRD_BRAND_CONTEXT_INTEGRATION.md` | Complete |
| Revision History UI | `docs/PRD_REVISION_HISTORY_UI.md` | Complete |
| Client Content Requests | `docs/PRD_CLIENT_CONTENT_REQUESTS.md` | Complete |

### Planned (Next Phase)
| PRD | File | Priority |
|-----|------|----------|
| Mobile & PWA | `docs/PRD_MOBILE_PWA_SUPPORT.md` | High |
| White-Label Domains | `docs/PRD_WHITE_LABEL_DOMAINS.md` | High |
| Testing Strategy | `docs/PRD_TESTING_STRATEGY.md` | High |
| Client Self-Service | `docs/PRD_CLIENT_SELF_SERVICE.md` | Medium |
| Referral/Affiliate | `docs/PRD_REFERRAL_AFFILIATE_SYSTEM.md` | Medium |
| Additional Features | `docs/PRD_ADDITIONAL_FEATURES.md` | Various |

### Analytics & Growth
| PRD | File | Priority |
|-----|------|----------|
| Gap Analysis 2026 | `docs/PRD_GAP_ANALYSIS_JAN_2026.md` | Active |
| Event Tracking | `docs/PRD_EVENT_TRACKING.md` | Active |
| Meta Pixel | `docs/PRD_META_PIXEL_TRACKING.md` | Active |
| Growth Data Plane | `docs/PRD_GROWTH_DATA_PLANE.md` | Active |

---

## Feature Count

**136 features** covering:
- Core platform (auth, profiles, settings)
- Vendor management and offers
- Client management and purchasing
- Content pipeline and AI generation
- Approval workflows
- CSV import/export
- Mobile/PWA support
- White-label and custom domains
- Testing and quality
- Analytics and tracking

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Active bloggers | 500+ monthly |
| Vendor offers managed | 2,000+ |
| Content approval turnaround | <24 hours |
| Client satisfaction (NPS) | >60 |
| Monthly recurring revenue | $15,000 |
| Feature completion rate | >90% |

---

## Development Priority

### Phase 1 (Current)
1. Testing Strategy — foundation for quality
2. Mobile & PWA Support — user experience
3. White-Label Domains — enterprise feature

### Phase 2
4. Client Self-Service Portal — reduce support burden
5. Referral System — growth features

### Phase 3
6. Additional Features — i18n, AI expansion, marketplace
