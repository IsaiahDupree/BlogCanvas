# PRD: Event Tracking System for BlogCanvas

**Status:** Active  
**Created:** 2026-01-25  
**Based On:** BlankLogo Event Tracking Pattern

## Overview

Implement sophisticated user event tracking for BlogCanvas to optimize agency onboarding, client management, and content approval funnels.

## Event Categories

| Category | Events |
|----------|--------|
| **Acquisition** | `landing_view`, `cta_click`, `pricing_view`, `demo_requested` |
| **Activation** | `signup_start`, `login_success`, `agency_setup_complete`, `first_client_added` |
| **Core Value** | `blog_created`, `blog_generated`, `blog_approved`, `blog_published`, `brief_submitted` |
| **Monetization** | `checkout_started`, `purchase_completed`, `subscription_started`, `plan_upgraded` |
| **Retention** | `return_session`, `client_returning`, `blogs_this_month` |
| **Reliability** | `error_shown`, `generation_failed`, `publish_failed` |

## Core Value Event Properties

### blog_created
```json
{
  "blog_id": "string",
  "client_id": "string",
  "template_used": "string",
  "word_count_target": "number"
}
```

### blog_approved
```json
{
  "blog_id": "string",
  "client_id": "string",
  "revision_count": "number",
  "time_to_approval_hours": "number"
}
```

## 4 North Star Milestones

1. **Activated** = `first_client_added`
2. **First Value** = first `blog_published`
3. **Aha Moment** = first `blog_approved` by client
4. **Monetized** = `purchase_completed`

## Features

| ID | Name | Priority |
|----|------|----------|
| TRACK-001 | Tracking SDK Integration | P1 |
| TRACK-002 | Acquisition Event Tracking | P1 |
| TRACK-003 | Activation Event Tracking | P1 |
| TRACK-004 | Core Value Event Tracking | P1 |
| TRACK-005 | Monetization Event Tracking | P1 |
| TRACK-006 | Client Activity Tracking | P2 |
| TRACK-007 | Error & Performance Tracking | P2 |
| TRACK-008 | User Identification | P1 |
