# PRD: Growth Data Plane for BlogCanvas

**Status:** Active  
**Created:** 2026-01-25  
**Priority:** P0  
**Reference:** `autonomous-coding-dashboard/harness/prompts/PRD_GROWTH_DATA_PLANE.md`

## Overview

Implement the Growth Data Plane for BlogCanvas: unified event tracking for agency onboarding, client management, and content approval funnels.

## BlogCanvas-Specific Events

| Event | Source | Segment Trigger |
|-------|--------|-----------------|
| `landing_view` | web | - |
| `demo_requested` | web | warm_lead |
| `signup_completed` | web | new_signup |
| `first_client_added` | app | activated |
| `blog_created` | app | - |
| `blog_approved` | app | aha_moment |
| `blog_published` | app | first_value |
| `checkout_started` | web | checkout_started |
| `purchase_completed` | stripe | - |
| `email.clicked` | resend | newsletter_clicker |

## Segments for BlogCanvas

1. **agency_signup_no_client_48h** → email: "Add your first client in 2 minutes"
2. **client_added_no_blog_72h** → email: "Generate your first AI blog"
3. **blog_pending_approval_48h** → email to client: "Review pending content"
4. **high_volume_free_tier** → email: "Upgrade for unlimited clients"
5. **demo_requested_no_signup** → outbound: follow-up sequence

## Features

| ID | Name | Priority |
|----|------|----------|
| GDP-001 | Supabase Schema Setup | P0 |
| GDP-002 | Person & Identity Tables | P0 |
| GDP-003 | Unified Events Table | P0 |
| GDP-004 | Resend Webhook Edge Function | P0 |
| GDP-005 | Email Event Tracking | P0 |
| GDP-006 | Click Redirect Tracker | P1 |
| GDP-007 | Stripe Webhook Integration | P1 |
| GDP-008 | Subscription Snapshot | P1 |
| GDP-009 | PostHog Identity Stitching | P1 |
| GDP-010 | Meta Pixel + CAPI Dedup | P1 |
| GDP-011 | Person Features Computation | P1 |
| GDP-012 | Segment Engine | P1 |
