# PRD: Client Management & Self-Service Purchasing

**Version:** 1.0  
**Date:** January 15, 2026  
**Status:** Specification  
**Epic:** Client Self-Service & Revenue

---

## Overview

This PRD defines features for client management, subscription handling, blog credits/quota tracking, and self-service purchasing. These features enable clients to manage their accounts, view usage, and purchase additional content directly.

---

## Feature Flags (Environment Variables)

All self-service features can be enabled/disabled via environment variables:

```bash
# .env.local or production environment

# Master toggle for all client self-service features
NEXT_PUBLIC_ENABLE_CLIENT_SELF_SERVICE=true

# Individual feature toggles
NEXT_PUBLIC_ENABLE_CLIENT_BILLING_PORTAL=true
NEXT_PUBLIC_ENABLE_BUY_MORE_BLOGS=true
NEXT_PUBLIC_ENABLE_PLAN_UPGRADES=true
NEXT_PUBLIC_ENABLE_CONTENT_REQUESTS=true
NEXT_PUBLIC_ENABLE_USAGE_DASHBOARD=true

# Credit system
NEXT_PUBLIC_ENABLE_CREDIT_TRACKING=true
NEXT_PUBLIC_CREDIT_LOW_WARNING_THRESHOLD=2

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Feature Flag Usage

```typescript
// /src/lib/feature-flags.ts

export const featureFlags = {
  // Master toggle
  clientSelfService: process.env.NEXT_PUBLIC_ENABLE_CLIENT_SELF_SERVICE === 'true',
  
  // Individual features
  clientBillingPortal: process.env.NEXT_PUBLIC_ENABLE_CLIENT_BILLING_PORTAL === 'true',
  buyMoreBlogs: process.env.NEXT_PUBLIC_ENABLE_BUY_MORE_BLOGS === 'true',
  planUpgrades: process.env.NEXT_PUBLIC_ENABLE_PLAN_UPGRADES === 'true',
  contentRequests: process.env.NEXT_PUBLIC_ENABLE_CONTENT_REQUESTS === 'true',
  usageDashboard: process.env.NEXT_PUBLIC_ENABLE_USAGE_DASHBOARD === 'true',
  creditTracking: process.env.NEXT_PUBLIC_ENABLE_CREDIT_TRACKING === 'true',
  
  // Thresholds
  creditLowWarningThreshold: parseInt(process.env.NEXT_PUBLIC_CREDIT_LOW_WARNING_THRESHOLD || '2'),
};

// Check if feature is enabled
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  // Master toggle must be on
  if (!featureFlags.clientSelfService) return false;
  return featureFlags[feature] === true;
}
```

### Conditional Rendering in Portal

```tsx
// In client portal navigation
import { isFeatureEnabled } from '@/lib/feature-flags';

{isFeatureEnabled('clientBillingPortal') && (
  <NavLink href="/portal/billing">Billing</NavLink>
)}

{isFeatureEnabled('buyMoreBlogs') && (
  <Button onClick={() => setShowPurchaseModal(true)}>
    Buy More Blogs
  </Button>
)}
```

### API Protection

```typescript
// In API routes
import { isFeatureEnabled } from '@/lib/feature-flags';

export async function POST(request: NextRequest) {
  if (!isFeatureEnabled('buyMoreBlogs')) {
    return NextResponse.json(
      { error: 'This feature is not enabled' },
      { status: 403 }
    );
  }
  // ... rest of handler
}
```

---

## Current Implementation Status

### ✅ IMPLEMENTED (Vendor Side)

| Feature | Location | Status |
|---------|----------|--------|
| Subscription Plans | `/app/billing` | ✅ Vendors can create plans |
| Client Subscriptions | `/api/subscriptions` | ✅ CRUD operations |
| Invoices | `/api/invoices` | ✅ Create and view |
| Payment Links | `/api/payment-links` | ✅ Generate Stripe links |
| Stripe Webhooks | `/api/webhooks/stripe` | ✅ Event handling |
| Client Plan Info | `clients.plan_type`, `plan_posts_per_month` | ✅ Stored in DB |

### ❌ MISSING (Client Self-Service)

| Feature | Priority | Description |
|---------|----------|-------------|
| Client Billing Portal | **HIGH** | View subscription, invoices, payment history |
| Buy More Blogs | **HIGH** | One-click purchase additional posts |
| Blog Credits System | **HIGH** | Track remaining/used quota |
| Upgrade/Downgrade Plan | **MEDIUM** | Self-service plan changes |
| Usage Dashboard | **MEDIUM** | Visualize consumption |
| Content Request with Purchase | **MEDIUM** | Request specific topics + pay |
| Auto-Renewal Management | **LOW** | Toggle auto-renew |

---

## Part 1: Blog Credits & Quota System

### 1.1 Schema Extension

```sql
-- Add to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS blog_credits_total INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS blog_credits_used INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS blog_credits_rollover BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_reset_date DATE;

-- Credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Transaction details
  type TEXT NOT NULL,  -- 'purchase', 'subscription', 'usage', 'adjustment', 'rollover', 'refund'
  amount INTEGER NOT NULL,  -- Positive = add, Negative = deduct
  balance_after INTEGER NOT NULL,
  
  -- Reference
  reference_type TEXT,  -- 'invoice', 'blog_post', 'subscription', 'manual'
  reference_id UUID,
  
  -- Metadata
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_client ON credit_transactions(client_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
```

### 1.2 Credit Transaction Interface

```typescript
interface CreditTransaction {
  id: string;
  clientId: string;
  type: 'purchase' | 'subscription' | 'usage' | 'adjustment' | 'rollover' | 'refund';
  amount: number;  // + or -
  balanceAfter: number;
  referenceType?: 'invoice' | 'blog_post' | 'subscription' | 'manual';
  referenceId?: string;
  description?: string;
  createdBy?: string;
  createdAt: string;
}

interface ClientCredits {
  total: number;
  used: number;
  remaining: number;
  rollover: boolean;
  resetDate: string | null;
  recentTransactions: CreditTransaction[];
}
```

### 1.3 Credit Deduction Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CREDIT DEDUCTION FLOW                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Blog Post Created                                                  │
│        │                                                            │
│        ▼                                                            │
│  ┌─────────────────┐                                               │
│  │ Check Credits   │                                               │
│  │ remaining > 0?  │                                               │
│  └────────┬────────┘                                               │
│           │                                                         │
│     YES   │   NO                                                    │
│     ┌─────┴─────┐                                                  │
│     ▼           ▼                                                  │
│  ┌─────────┐  ┌─────────────────┐                                  │
│  │ Deduct  │  │ Show "Buy More" │                                  │
│  │ 1 Credit│  │ or Block        │                                  │
│  └────┬────┘  └─────────────────┘                                  │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────┐                                           │
│  │ Create Transaction  │                                           │
│  │ type: 'usage'       │                                           │
│  │ amount: -1          │                                           │
│  └─────────────────────┘                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Client Billing Portal

### 2.1 New Portal Page: `/portal/billing`

```
┌─────────────────────────────────────────────────────────────────────┐
│  💳 Billing & Subscription                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Current Plan                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  📦 Professional Plan                    $499/month         │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  Blog Credits                                         │  │   │
│  │  │  ████████████░░░░░░░░  8/12 remaining                │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                                                              │   │
│  │  Next renewal: February 15, 2026                            │   │
│  │  Auto-renew: ✓ Enabled                                      │   │
│  │                                                              │   │
│  │  [Upgrade Plan]  [Buy More Blogs]  [Manage Payment]         │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Recent Transactions                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Jan 15  Blog Generated: "How to Choose CRM"        -1 credit │   │
│  │ Jan 14  Blog Generated: "CRM vs Spreadsheets"      -1 credit │   │
│  │ Jan 10  Additional Credits Purchased               +5 credits│   │
│  │ Jan 01  Monthly Subscription Renewal              +12 credits│   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Invoices                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ INV-2026-0115  Jan 15, 2026   $99.00   Paid   [Download]    │   │
│  │ INV-2026-0101  Jan 01, 2026  $499.00   Paid   [Download]    │   │
│  │ INV-2025-1201  Dec 01, 2025  $499.00   Paid   [Download]    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 API Endpoints

```typescript
// Get client billing overview
GET /api/portal/billing
Response: {
  subscription: {
    planName: string;
    amount: number;
    interval: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
  credits: {
    total: number;
    used: number;
    remaining: number;
    resetDate: string;
  };
  recentTransactions: CreditTransaction[];
  invoices: Invoice[];
}

// Get credit transactions
GET /api/portal/billing/transactions?limit=20
Response: { transactions: CreditTransaction[] }

// Get invoices
GET /api/portal/billing/invoices
Response: { invoices: Invoice[] }
```

---

## Part 3: Buy More Blogs (One-Click Purchase)

### 3.1 Purchase Packages

```typescript
interface BlogPackage {
  id: string;
  name: string;
  credits: number;
  price: number;  // in cents
  pricePerBlog: number;
  popular?: boolean;
  savings?: string;
}

const BLOG_PACKAGES: BlogPackage[] = [
  { id: 'pack-3', name: '3 Blogs', credits: 3, price: 29700, pricePerBlog: 99 },
  { id: 'pack-5', name: '5 Blogs', credits: 5, price: 44500, pricePerBlog: 89, popular: true, savings: '10%' },
  { id: 'pack-10', name: '10 Blogs', credits: 10, price: 79000, pricePerBlog: 79, savings: '20%' },
  { id: 'pack-20', name: '20 Blogs', credits: 20, price: 139800, pricePerBlog: 69.9, savings: '30%' },
];
```

### 3.2 Purchase Modal UI

```
┌─────────────────────────────────────────────────────────────────────┐
│  Buy More Blog Credits                                         [×]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Current Balance: 2 credits remaining                               │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐                          │
│  │    3 Blogs      │  │    5 Blogs      │  ⭐ POPULAR               │
│  │                 │  │                 │                           │
│  │    $297         │  │    $445         │                           │
│  │  $99/blog       │  │  $89/blog       │                           │
│  │                 │  │  Save 10%       │                           │
│  │   [Select]      │  │   [Select]      │                           │
│  └─────────────────┘  └─────────────────┘                          │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐                          │
│  │   10 Blogs      │  │   20 Blogs      │                           │
│  │                 │  │                 │                           │
│  │    $790         │  │   $1,398        │                           │
│  │  $79/blog       │  │  $69.90/blog    │                           │
│  │  Save 20%       │  │  Save 30%       │                           │
│  │   [Select]      │  │   [Select]      │                           │
│  └─────────────────┘  └─────────────────┘                          │
│                                                                     │
│  Need more? Contact us for custom enterprise packages.              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Purchase Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PURCHASE FLOW                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Client clicks "Buy More Blogs"                                  │
│     │                                                               │
│     ▼                                                               │
│  2. Select package (3, 5, 10, or 20 blogs)                         │
│     │                                                               │
│     ▼                                                               │
│  3. POST /api/portal/billing/purchase                              │
│     │   { packageId: 'pack-5' }                                    │
│     │                                                               │
│     ▼                                                               │
│  4. Server creates Stripe Checkout Session                         │
│     │   - Line item with blog package                              │
│     │   - Success URL: /portal/billing?success=true                │
│     │   - Cancel URL: /portal/billing                              │
│     │                                                               │
│     ▼                                                               │
│  5. Redirect to Stripe Checkout                                    │
│     │                                                               │
│     ▼                                                               │
│  6. Payment completed → Webhook received                           │
│     │                                                               │
│     ▼                                                               │
│  7. Webhook handler:                                                │
│     │   - Add credits to client                                    │
│     │   - Create credit_transaction                                │
│     │   - Create invoice record                                    │
│     │   - Send confirmation email                                  │
│     │                                                               │
│     ▼                                                               │
│  8. Client redirected to /portal/billing with success message      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.4 API Endpoints

```typescript
// Get available packages
GET /api/portal/billing/packages
Response: { packages: BlogPackage[] }

// Initiate purchase
POST /api/portal/billing/purchase
Body: { packageId: string }
Response: { checkoutUrl: string }

// Webhook handler updates (existing)
// checkout.session.completed → Add credits
```

---

## Part 4: Upgrade/Downgrade Plans

### 4.1 Plan Selection UI

```
┌─────────────────────────────────────────────────────────────────────┐
│  Choose Your Plan                                              [×]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │    Starter      │  │  Professional   │  │   Enterprise    │     │
│  │                 │  │   ⭐ CURRENT    │  │                 │     │
│  │   $199/mo       │  │   $499/mo       │  │   $999/mo       │     │
│  │                 │  │                 │  │                 │     │
│  │  4 blogs/mo     │  │  12 blogs/mo    │  │  30 blogs/mo    │     │
│  │  Basic support  │  │  Priority supp  │  │  Dedicated CSM  │     │
│  │  Email reports  │  │  Weekly calls   │  │  Custom reports │     │
│  │                 │  │  Analytics      │  │  API access     │     │
│  │                 │  │                 │  │                 │     │
│  │  [Downgrade]    │  │   Current ✓     │  │   [Upgrade]     │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  ⚠️ Downgrading will reduce your monthly credits. Unused credits   │
│     will not roll over unless you have the rollover add-on.        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Plan Change API

```typescript
// Get available plans
GET /api/portal/billing/plans
Response: { 
  currentPlan: Plan;
  availablePlans: Plan[];
}

// Change plan
POST /api/portal/billing/change-plan
Body: { newPlanId: string }
Response: { 
  success: boolean;
  effectiveDate: string;
  prorationAmount?: number;
}
```

---

## Part 5: Content Request with Purchase

### 5.1 Request Flow

Clients can request specific content topics and pay for them directly:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Request New Content                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  What topics do you want us to write about?                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Topic 1: How to implement CRM automation                    │   │
│  │ Topic 2: Sales pipeline management best practices           │   │
│  │ Topic 3:                                                    │   │
│  │ + Add another topic                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Additional notes:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Please focus on small business use cases...                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📊 Summary                                                   │   │
│  │ Topics requested: 2                                          │   │
│  │ Available credits: 3                                         │   │
│  │ Credits after: 1                                             │   │
│  │                                                              │   │
│  │ ☑ Use available credits (2)                                 │   │
│  │ ☐ Purchase additional credits                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                                [Cancel]  [Submit Request]           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Schema for Content Requests

```sql
CREATE TABLE IF NOT EXISTS content_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Request details
  status TEXT DEFAULT 'pending',  -- pending, approved, in_progress, completed, cancelled
  topics JSONB NOT NULL,  -- Array of { topic, notes }
  general_notes TEXT,
  
  -- Credits
  credits_required INTEGER NOT NULL,
  credits_source TEXT,  -- 'subscription', 'purchase', 'both'
  payment_status TEXT,  -- 'paid', 'pending', 'not_required'
  
  -- Reference
  content_batch_id UUID REFERENCES content_batches(id),
  invoice_id UUID REFERENCES invoices(id),
  
  -- Timestamps
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Part 6: Usage Dashboard

### 6.1 Client Usage View

```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 Content Usage                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  This Month (January 2026)                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  ████████████████████████░░░░░░░░░░░░                       │   │
│  │  8 of 12 credits used                    4 remaining        │   │
│  │                                                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│  │  │ Generated│  │ Approved │  │ Published│  │ Remaining│    │   │
│  │  │    8     │  │    6     │  │    4     │  │    4     │    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Monthly Usage Trend                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  12 ┤                           ████                         │   │
│  │  10 ┤              ████  ████  ████  ████                   │   │
│  │   8 ┤  ████  ████  ████  ████  ████  ████  ████             │   │
│  │   6 ┤  ████  ████  ████  ████  ████  ████  ████             │   │
│  │   4 ┤  ████  ████  ████  ████  ████  ████  ████             │   │
│  │   2 ┤  ████  ████  ████  ████  ████  ████  ████             │   │
│  │   0 └──Aug───Sep───Oct───Nov───Dec───Jan───Feb──            │   │
│  │        ■ Used  □ Limit                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Content Breakdown                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Blog Posts: 6      Guides: 2      Total Words: 12,450       │   │
│  │ Avg. SEO Score: 84    Published: 4    In Review: 2          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part 7: Implementation Files

### New Files Required

| File | Purpose |
|------|---------|
| `/src/app/portal/billing/page.tsx` | Client billing dashboard |
| `/src/app/portal/billing/packages/page.tsx` | Buy more credits |
| `/src/app/portal/billing/plans/page.tsx` | Plan selection |
| `/src/app/portal/usage/page.tsx` | Usage dashboard |
| `/src/app/api/portal/billing/route.ts` | Billing overview API |
| `/src/app/api/portal/billing/purchase/route.ts` | Purchase credits |
| `/src/app/api/portal/billing/transactions/route.ts` | Credit history |
| `/src/app/api/portal/billing/plans/route.ts` | Plan management |
| `/src/lib/credits/credit-manager.ts` | Credit operations |
| `/src/components/billing/CreditUsageCard.tsx` | Credit display |
| `/src/components/billing/PurchaseModal.tsx` | Buy credits modal |

### Webhook Handler Updates

**Update `/src/app/api/webhooks/stripe/route.ts`:**

```typescript
// Handle successful checkout for credit purchase
case 'checkout.session.completed': {
  const session = event.data.object;
  
  if (session.metadata?.type === 'blog_credits') {
    const clientId = session.metadata.client_id;
    const credits = parseInt(session.metadata.credits);
    
    // Add credits
    await addCredits(clientId, credits, {
      type: 'purchase',
      referenceType: 'invoice',
      referenceId: session.invoice,
      description: `Purchased ${credits} blog credits`
    });
    
    // Send confirmation email
    await sendCreditPurchaseConfirmation(clientId, credits);
  }
  break;
}
```

---

## Part 8: Database Migration

```sql
-- Migration: Client Credits and Purchasing
-- Date: 2026-01-15

-- 1. Add credit columns to clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS blog_credits_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS blog_credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS blog_credits_rollover BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS credit_reset_date DATE;

-- 2. Credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Content requests table
CREATE TABLE IF NOT EXISTS content_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  topics JSONB NOT NULL,
  general_notes TEXT,
  credits_required INTEGER NOT NULL,
  credits_source TEXT,
  payment_status TEXT,
  content_batch_id UUID REFERENCES content_batches(id),
  invoice_id UUID REFERENCES invoices(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Blog packages table (vendor-configurable)
CREATE TABLE IF NOT EXISTS blog_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price INTEGER NOT NULL,  -- in cents
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_credit_transactions_client ON credit_transactions(client_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at);
CREATE INDEX idx_content_requests_client ON content_requests(client_id);
CREATE INDEX idx_content_requests_status ON content_requests(status);
CREATE INDEX idx_blog_packages_vendor ON blog_packages(vendor_id);

-- RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_packages ENABLE ROW LEVEL SECURITY;

-- Policies (simplified)
CREATE POLICY "Clients can view own credit transactions"
  ON credit_transactions FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE owner_id = auth.uid()));

CREATE POLICY "Clients can view own content requests"
  ON content_requests FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE owner_id = auth.uid()));
```

---

## Part 9: Acceptance Criteria

### Client Billing Portal
- [ ] Clients can view current subscription details
- [ ] Clients can see credit balance and usage
- [ ] Clients can view transaction history
- [ ] Clients can download invoices

### Buy More Blogs
- [ ] Package options displayed with pricing
- [ ] One-click redirects to Stripe Checkout
- [ ] Credits added after successful payment
- [ ] Confirmation email sent
- [ ] Transaction recorded in history

### Credits System
- [ ] Credits deducted when blog generated
- [ ] Warning shown when credits low
- [ ] Block generation when credits exhausted
- [ ] Transaction history maintained
- [ ] Monthly reset works correctly

### Plan Management
- [ ] Available plans displayed
- [ ] Upgrade flow works with proration
- [ ] Downgrade scheduled for period end
- [ ] Credit allocation updated on change

### Content Requests
- [ ] Clients can submit topic requests
- [ ] Credits checked before submission
- [ ] Purchase option if insufficient credits
- [ ] Request creates workflow for vendor

---

## Part 10: Email Notifications

| Event | Email | Recipient |
|-------|-------|-----------|
| Credits purchased | Purchase confirmation | Client |
| Credits low (2 remaining) | Low credits warning | Client |
| Credits exhausted | Out of credits alert | Client + Vendor |
| Plan upgraded | Upgrade confirmation | Client |
| Plan downgraded | Downgrade confirmation | Client |
| Content request submitted | Request received | Client + Vendor |
| Content request completed | Request fulfilled | Client |

---

*This PRD defines the complete client management and self-service purchasing system.*
