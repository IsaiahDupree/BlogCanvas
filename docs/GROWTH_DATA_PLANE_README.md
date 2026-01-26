# Growth Data Plane & Meta Pixel Integration

**Status:** ✅ Complete
**Date:** January 26, 2026
**Features Implemented:** 20/20 (100%)

## Overview

This document describes the Growth Data Plane and Meta Pixel integration implemented for BlogCanvas. These systems provide unified event tracking, identity resolution, and growth automation capabilities.

## Features Implemented

### Meta Pixel & CAPI (8 features)
- ✅ META-001: Meta Pixel Installation
- ✅ META-002: PageView Tracking
- ✅ META-003: Standard Events Mapping
- ✅ META-004: CAPI Server-Side Events
- ✅ META-005: Event Deduplication
- ✅ META-006: User Data Hashing (PII)
- ✅ META-007: Custom Audiences Setup
- ✅ META-008: Conversion Optimization

### Growth Data Plane (12 features)
- ✅ GDP-001: Supabase Schema Setup
- ✅ GDP-002: Person & Identity Tables
- ✅ GDP-003: Unified Events Table
- ✅ GDP-004: Resend Webhook Handler
- ✅ GDP-005: Email Event Tracking
- ✅ GDP-006: Click Redirect Tracker
- ✅ GDP-007: Stripe Webhook Integration
- ✅ GDP-008: Subscription Snapshot
- ✅ GDP-009: PostHog Identity Stitching
- ✅ GDP-010: Meta Pixel + CAPI Dedup
- ✅ GDP-011: Person Features Computation
- ✅ GDP-012: Segment Engine

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Growth Data Plane                         │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───▼────┐      ┌──────▼──────┐     ┌─────▼──────┐
    │ Person │◄─────┤IdentityLink │     │   Event    │
    └────┬───┘      └─────────────┘     └─────┬──────┘
         │                                     │
    ┌────▼──────────┐                   ┌─────▼──────┐
    │PersonFeatures │                   │  Segment   │
    └───────────────┘                   └────────────┘
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── tracking/meta/route.ts          # Meta CAPI endpoint
│   │   └── webhooks/
│   │       └── resend/route.ts             # Email tracking webhooks
│   └── layout.tsx                          # Meta Pixel installed here
├── components/
│   └── tracking/
│       └── MetaPixel.tsx                   # Meta Pixel component
├── lib/
│   ├── db/
│   │   └── growth-data-plane.ts            # Database service layer
│   ├── growth/
│   │   └── segment-engine.ts               # Segment evaluation engine
│   └── tracking/
│       ├── meta-capi.ts                    # Meta CAPI functions
│       ├── meta-events.ts                  # Unified Meta tracking
│       ├── posthog-integration.ts          # PostHog identity stitching
│       └── stripe-growth-integration.ts    # Stripe + GDP integration
├── types/
│   └── growth-data-plane.ts                # TypeScript types
└── supabase/
    └── migrations/
        └── 20260126000002_growth_data_plane.sql
```

## Environment Variables

Add these to your `.env.local`:

```bash
# Meta Pixel & CAPI
NEXT_PUBLIC_FB_PIXEL_ID=your_pixel_id_here
FB_CAPI_ACCESS_TOKEN=your_access_token_here

# Resend Webhooks
RESEND_WEBHOOK_SECRET=whsec_your_secret_here

# Optional
NEXT_PUBLIC_SITE_URL=https://blogcanvas.com
```

## Usage Examples

### 1. Track Page View (Browser + Server)

```typescript
import { trackPageView } from '@/lib/tracking/meta-events';

// Automatically fires both Pixel and CAPI with deduplication
await trackPageView({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
});
```

### 2. Track Lead (Demo Request)

```typescript
import { trackLead } from '@/lib/tracking/meta-events';

await trackLead('demo', {
  email: 'user@example.com',
  externalId: personId,
});
```

### 3. Track Purchase

```typescript
import { trackPurchase } from '@/lib/tracking/meta-events';

await trackPurchase(
  99.99, // value
  'USD', // currency
  ['offer-123'], // content IDs
  {
    email: 'user@example.com',
    externalId: personId,
  }
);
```

### 4. Track Custom Event

```typescript
import { trackEvent } from '@/lib/db/growth-data-plane';

await trackEvent({
  person_id: personId,
  event_name: 'first_client_added',
  event_source: 'app',
  properties: {
    client_name: 'Acme Corp',
    client_id: 'client-123',
  },
});
```

### 5. Identity Stitching on Login

```typescript
import { identifyUserInPostHog } from '@/lib/tracking/posthog-integration';
import { findOrCreatePerson, linkIdentity } from '@/lib/db/growth-data-plane';

// On successful login/signup
const person = await findOrCreatePerson({
  email: user.email,
  name: user.name,
});

// Link Supabase user ID
await linkIdentity(person.id, 'supabase', user.id);

// Identify in PostHog
await identifyUserInPostHog(person.id, user.email, {
  name: user.name,
  signup_date: user.created_at,
});
```

### 6. Check Segment Membership

```typescript
import { updateSegmentMembership } from '@/lib/growth/segment-engine';

// After a user performs an action
await updateSegmentMembership(personId);

// This will:
// - Evaluate all segment criteria
// - Update membership records
// - Trigger automations (emails, webhooks) for new entries
```

## System Segments

These segments are automatically created and evaluated:

| Slug | Description | Criteria |
|------|-------------|----------|
| `warm_lead` | Demo requested | `demo_requested = true` |
| `new_signup` | Completed signup | `signup_completed = true` |
| `activated` | Added first client | `first_client_added = true` |
| `aha_moment` | First blog approved | `blog_approved = true` |
| `first_value` | First blog published | `blog_published = true` |
| `checkout_started` | Started checkout | `checkout_started = true` |
| `newsletter_clicker` | High email engagement | `email_click_rate >= 10` |

## Email Event Tracking

### Setup Resend Webhook

1. Go to Resend Dashboard → Webhooks
2. Add webhook endpoint: `https://your-domain.com/api/webhooks/resend`
3. Subscribe to events:
   - `email.sent`
   - `email.delivered`
   - `email.opened`
   - `email.clicked`
   - `email.bounced`
   - `email.complained`
4. Copy the webhook secret to `RESEND_WEBHOOK_SECRET`

### Tag Emails with Person ID

When sending emails via Resend, include person ID in tags:

```typescript
await resend.emails.send({
  from: 'noreply@blogcanvas.com',
  to: email,
  subject: 'Welcome!',
  html: '<p>Welcome to BlogCanvas!</p>',
  tags: [
    { name: 'person_id', value: personId },
    { name: 'campaign', value: 'onboarding' },
  ],
});
```

## Stripe Webhook Integration

The Stripe webhook handler automatically:
- Creates/updates person records from checkout sessions
- Links Stripe customer IDs to persons
- Tracks subscription lifecycle events
- Updates MRR and subscription snapshots
- Fires Meta CAPI Purchase events server-side

## Database Tables

### `person`
Canonical identity record with behavioral features and lifecycle stage.

### `identity_link`
Cross-system identity mapping (PostHog, Stripe, Meta, Google, etc.)

### `event`
Unified event stream from all sources (web, app, email, stripe, booking, meta).

### `email_message`
Sent emails log from Resend.

### `email_event`
Email engagement events (opened, clicked, bounced, etc.)

### `subscription`
Subscription snapshot from Stripe with MRR calculation.

### `person_features`
Computed behavioral features and engagement scores.

### `segment`
Segment definitions with criteria and automation triggers.

### `segment_membership`
Person-to-segment mapping with entry/exit timestamps.

## Cron Jobs

Consider setting up these periodic jobs:

### Daily: Evaluate All Segments
```typescript
import { evaluateAllSegments } from '@/lib/growth/segment-engine';

// Run daily at 6 AM UTC
await evaluateAllSegments();
```

### Weekly: Compute Email Engagement Stats
```typescript
import { getEmailEngagementStats } from '@/lib/db/growth-data-plane';

// Update email stats for all persons
```

## Testing

### Test Meta Pixel
1. Install Meta Pixel Helper Chrome extension
2. Visit any page on the site
3. Verify PageView event fires
4. Check Facebook Events Manager for events

### Test CAPI
Check server logs for Meta CAPI responses:
```
Meta CAPI success: { events_received: 1, messages: [] }
```

### Test Resend Webhooks
Use Resend webhook logs to verify delivery.

### Test Segments
```typescript
import { evaluateSegmentMembership } from '@/lib/growth/segment-engine';

const isMember = await evaluateSegmentMembership(personId, segmentId);
console.log('Is member:', isMember);
```

## Migration

Run the migration to create all tables:

```bash
# Apply migration
supabase migration up
```

Or push to production:
```bash
supabase db push
```

## Monitoring

Monitor these metrics:
- Meta CAPI event delivery rate
- Email webhook processing rate
- Segment membership changes per day
- Person lifecycle stage distribution
- Email engagement rates (open rate, click rate)
- Subscription MRR trends

## Next Steps

1. **Set up Meta Business Manager**
   - Verify domain ownership
   - Configure custom audiences
   - Set up conversion campaigns

2. **Configure Resend Webhooks**
   - Add webhook endpoint
   - Test email tracking

3. **Create Custom Segments**
   - Define high-intent segments
   - Set up automation triggers

4. **Build Dashboards**
   - Growth metrics dashboard
   - Segment health dashboard
   - Email performance dashboard

## Support

For questions or issues:
- Review code in `src/lib/tracking/` and `src/lib/growth/`
- Check Supabase logs for database errors
- Review Meta Events Manager for pixel/CAPI issues
- Check Resend webhook logs for email tracking issues

---

**Implementation Date:** January 26, 2026
**Total Features:** 20
**Status:** ✅ Production Ready
