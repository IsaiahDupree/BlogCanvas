# PRD: Meta Pixel & CAPI Integration for BlogCanvas

**Status:** Active  
**Created:** 2026-01-25  
**Priority:** P1

## Overview

Implement Facebook Meta Pixel and Conversions API for BlogCanvas to enable retargeting agencies and optimizing for sign-ups and subscriptions.

## Standard Events Mapping

| BlogCanvas Event | Meta Standard Event | Parameters |
|------------------|---------------------|------------|
| `landing_view` | `PageView` | - |
| `demo_requested` | `Lead` | `content_name: 'demo'` |
| `signup_complete` | `CompleteRegistration` | `content_name`, `status` |
| `first_client_added` | `AddToCart` | `content_type: 'client'` |
| `blog_published` | `ViewContent` | `content_type: 'blog'` |
| `checkout_started` | `InitiateCheckout` | `value`, `currency` |
| `purchase_completed` | `Purchase` | `value`, `currency`, `content_ids` |

## Implementation

### Pixel Script (Layout)
```tsx
// app/layout.tsx
<Script id="fb-pixel" strategy="afterInteractive">
  {`!function(f,b,e,v,n,t,s){...}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
  fbq('track', 'PageView');`}
</Script>
```

### CAPI Endpoint
```typescript
// app/api/meta-capi/route.ts
// Server-side event sending with user data hashing
```

## Features

| ID | Name | Priority |
|----|------|----------|
| META-001 | Meta Pixel Installation | P1 |
| META-002 | PageView Tracking | P1 |
| META-003 | Standard Events Mapping | P1 |
| META-004 | CAPI Server-Side Events | P1 |
| META-005 | Event Deduplication | P1 |
| META-006 | User Data Hashing (PII) | P1 |
| META-007 | Custom Audiences Setup | P2 |
| META-008 | Conversion Optimization | P2 |
