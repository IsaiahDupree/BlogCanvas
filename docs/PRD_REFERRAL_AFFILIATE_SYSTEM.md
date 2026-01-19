# PRD: Referral & Affiliate System

**Version:** 1.0  
**Created:** January 19, 2026  
**Status:** Draft  
**Priority:** Medium  
**Estimated Effort:** 20-25 hours

---

## 1. Executive Summary

Implement a comprehensive referral and affiliate system that enables organic growth through vendor-to-vendor referrals, client referrals, and external affiliate partnerships. This system will track referrals, calculate commissions, and automate payouts.

---

## 2. Problem Statement

### Current State
- No referral tracking mechanism
- Vendors acquire clients independently
- No incentive for word-of-mouth growth
- No affiliate/partner program
- Manual tracking of any referral agreements

### Impact
- Missed organic growth opportunities
- Higher customer acquisition costs
- No viral loop mechanism
- Vendors don't promote platform to peers
- Lost partnership revenue

---

## 3. Goals & Success Metrics

### Goals
1. Enable vendors to earn by referring other vendors
2. Enable clients to earn by referring other clients
3. Support external affiliate partnerships
4. Automate commission tracking and payouts
5. Provide transparent reporting

### Success Metrics
| Metric | Target |
|--------|--------|
| Vendor referrals per month | 50+ |
| Referral conversion rate | 15% |
| Revenue from referred vendors | 20% of total |
| Affiliate-driven signups | 10% of total |
| Payout automation rate | 95% |

---

## 4. User Stories

### Vendor Referrals

#### US-REF-001: Generate Referral Link
**As a** vendor  
**I want to** get a unique referral link  
**So that** I can share it with other potential vendors

**Acceptance Criteria:**
- [ ] Unique referral code/link generated
- [ ] Customizable slug option
- [ ] Copy to clipboard functionality
- [ ] Track link clicks

#### US-REF-002: Track Referrals
**As a** vendor  
**I want to** see who signed up through my link  
**So that** I can track my referral success

**Acceptance Criteria:**
- [ ] List of referred vendors
- [ ] Signup date and status
- [ ] Subscription tier
- [ ] Earned commission

#### US-REF-003: Earn Commission
**As a** vendor  
**I want to** earn commission when my referrals pay  
**So that** I'm rewarded for growing the platform

**Acceptance Criteria:**
- [ ] Commission calculated on payments
- [ ] Recurring commission option
- [ ] Commission rate visible
- [ ] Pending vs paid status

#### US-REF-004: Request Payout
**As a** vendor  
**I want to** withdraw my referral earnings  
**So that** I can receive my money

**Acceptance Criteria:**
- [ ] View available balance
- [ ] Minimum payout threshold
- [ ] Payout method selection
- [ ] Payout history

---

### Client Referrals

#### US-REF-005: Client Refer-a-Friend
**As a** client  
**I want to** refer my vendor to others  
**So that** I can earn discounts or credits

**Acceptance Criteria:**
- [ ] Referral link in client portal
- [ ] Track successful referrals
- [ ] Earn account credit
- [ ] Apply credit to invoices

---

### Affiliate Program

#### US-REF-006: Apply as Affiliate
**As an** external partner  
**I want to** join the affiliate program  
**So that** I can earn by promoting BlogCanvas

**Acceptance Criteria:**
- [ ] Affiliate application form
- [ ] Application review process
- [ ] Approval notification
- [ ] Affiliate dashboard access

#### US-REF-007: Affiliate Dashboard
**As an** affiliate  
**I want to** track my performance  
**So that** I can optimize my promotions

**Acceptance Criteria:**
- [ ] Click tracking
- [ ] Conversion tracking
- [ ] Earnings summary
- [ ] Marketing materials

---

### Admin Management

#### US-REF-008: Configure Program
**As a** platform admin  
**I want to** configure commission rates  
**So that** I can control program economics

**Acceptance Criteria:**
- [ ] Set vendor referral commission %
- [ ] Set affiliate commission %
- [ ] Set commission duration
- [ ] Set minimum payout
- [ ] Enable/disable programs

#### US-REF-009: Review Affiliates
**As a** platform admin  
**I want to** approve affiliate applications  
**So that** I can control who promotes us

**Acceptance Criteria:**
- [ ] View pending applications
- [ ] Approve/reject with reason
- [ ] View affiliate activity
- [ ] Suspend affiliates

---

## 5. Technical Requirements

### 5.1 Database Schema

```sql
-- Referral programs configuration
CREATE TABLE referral_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_type TEXT NOT NULL, -- 'vendor', 'client', 'affiliate'
  name TEXT NOT NULL,
  
  -- Commission settings
  commission_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed'
  commission_value DECIMAL(10,2) NOT NULL, -- 20 = 20% or $20
  commission_duration_months INTEGER, -- NULL = lifetime, 12 = first year
  
  -- Payout settings
  minimum_payout DECIMAL(10,2) DEFAULT 50.00,
  payout_schedule TEXT DEFAULT 'monthly', -- 'weekly', 'monthly', 'manual'
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral codes/links
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES referral_programs(id),
  
  -- Owner (one of these)
  vendor_id UUID REFERENCES vendors(id),
  client_id UUID REFERENCES vendor_clients(id),
  affiliate_id UUID REFERENCES affiliates(id),
  
  -- Code details
  code TEXT NOT NULL UNIQUE,
  custom_slug TEXT UNIQUE,
  
  -- Tracking
  clicks INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals tracking
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID REFERENCES referral_codes(id),
  program_id UUID REFERENCES referral_programs(id),
  
  -- Referrer (one of these)
  referrer_vendor_id UUID REFERENCES vendors(id),
  referrer_client_id UUID REFERENCES vendor_clients(id),
  referrer_affiliate_id UUID REFERENCES affiliates(id),
  
  -- Referred party
  referred_vendor_id UUID REFERENCES vendors(id),
  referred_client_id UUID REFERENCES vendor_clients(id),
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'qualified', 'converted', 'churned', 'fraudulent'
  qualified_at TIMESTAMPTZ, -- When they became paying
  
  -- Attribution
  landing_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commission earnings
CREATE TABLE referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES referrals(id),
  referral_code_id UUID REFERENCES referral_codes(id),
  
  -- Referrer
  referrer_vendor_id UUID REFERENCES vendors(id),
  referrer_affiliate_id UUID REFERENCES affiliates(id),
  
  -- Transaction that triggered commission
  source_type TEXT NOT NULL, -- 'subscription', 'one_time', 'renewal'
  source_id UUID NOT NULL, -- order_id or subscription_id
  source_amount DECIMAL(10,2) NOT NULL,
  
  -- Commission
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'reversed'
  
  -- Payout reference
  payout_id UUID REFERENCES referral_payouts(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts
CREATE TABLE referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  vendor_id UUID REFERENCES vendors(id),
  affiliate_id UUID REFERENCES affiliates(id),
  
  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Method
  payout_method TEXT NOT NULL, -- 'stripe', 'paypal', 'bank_transfer', 'credit'
  payout_details JSONB, -- Method-specific details
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  processed_at TIMESTAMPTZ,
  
  -- Reference
  external_reference TEXT, -- Stripe transfer ID, etc.
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliates (external partners)
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Profile
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  website TEXT,
  
  -- Application
  application_notes TEXT,
  promotion_methods TEXT[], -- ['blog', 'youtube', 'email', 'social']
  audience_size TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'suspended'
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  
  -- Payout
  payout_method TEXT DEFAULT 'paypal',
  payout_email TEXT,
  stripe_account_id TEXT,
  
  -- Terms
  agreed_to_terms BOOLEAN DEFAULT false,
  agreed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Click tracking
CREATE TABLE referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID REFERENCES referral_codes(id),
  
  -- Visitor info
  ip_hash TEXT, -- Hashed for privacy
  user_agent TEXT,
  landing_page TEXT,
  referrer_url TEXT,
  
  -- UTM
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Conversion
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  referral_id UUID REFERENCES referrals(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_vendor ON referral_codes(vendor_id);
CREATE INDEX idx_referrals_referrer_vendor ON referrals(referrer_vendor_id);
CREATE INDEX idx_commissions_status ON referral_commissions(status);
CREATE INDEX idx_payouts_status ON referral_payouts(status);
CREATE INDEX idx_affiliates_status ON affiliates(status);
```

### 5.2 API Endpoints

```
# Referral Codes
GET    /api/referrals/code              - Get my referral code
POST   /api/referrals/code              - Create/customize code
GET    /api/referrals/code/stats        - Get code statistics

# My Referrals
GET    /api/referrals                   - List my referrals
GET    /api/referrals/:id               - Get referral details

# Commissions
GET    /api/referrals/commissions       - List my commissions
GET    /api/referrals/commissions/summary - Earnings summary

# Payouts
GET    /api/referrals/payouts           - List my payouts
POST   /api/referrals/payouts/request   - Request payout
GET    /api/referrals/balance           - Get available balance

# Tracking (public)
GET    /api/r/:code                     - Redirect with tracking
POST   /api/referrals/track             - Track signup attribution

# Affiliates
POST   /api/affiliates/apply            - Submit application
GET    /api/affiliates/dashboard        - Affiliate dashboard
GET    /api/affiliates/materials        - Marketing materials

# Admin
GET    /api/admin/referrals/programs    - List programs
PUT    /api/admin/referrals/programs/:id - Update program
GET    /api/admin/affiliates            - List affiliates
PUT    /api/admin/affiliates/:id        - Approve/reject
GET    /api/admin/referrals/stats       - Program statistics
POST   /api/admin/referrals/payouts/process - Process payouts
```

### 5.3 Commission Calculation

```typescript
interface CommissionConfig {
  type: 'percentage' | 'fixed';
  value: number;
  durationMonths: number | null; // null = lifetime
}

function calculateCommission(
  transactionAmount: number,
  config: CommissionConfig,
  referralDate: Date
): number {
  // Check if still within commission window
  if (config.durationMonths) {
    const monthsSinceReferral = getMonthsDiff(referralDate, new Date());
    if (monthsSinceReferral > config.durationMonths) {
      return 0;
    }
  }
  
  // Calculate commission
  if (config.type === 'percentage') {
    return transactionAmount * (config.value / 100);
  }
  return config.value;
}
```

### 5.4 Webhook Integration

```typescript
// Hook into Stripe webhooks to track payments
async function handlePaymentSuccess(payment: StripePayment) {
  // Check if customer was referred
  const referral = await getReferralByVendorId(payment.vendorId);
  if (!referral) return;
  
  // Calculate and create commission
  const commission = calculateCommission(
    payment.amount,
    referral.program,
    referral.created_at
  );
  
  if (commission > 0) {
    await createCommission({
      referralId: referral.id,
      sourceType: 'subscription',
      sourceId: payment.id,
      sourceAmount: payment.amount,
      commissionAmount: commission
    });
  }
}
```

---

## 6. UI/UX Requirements

### 6.1 Vendor Referral Dashboard

```
┌─────────────────────────────────────────┐
│  Referral Program                        │
├─────────────────────────────────────────┤
│                                          │
│  Your Referral Link                      │
│  ┌─────────────────────────────────────┐ │
│  │ blogcanvas.com/r/john-agency   [📋] │ │
│  │ [Customize Link]                     │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │  123    │  │   45    │  │  $890   │  │
│  │ Clicks  │  │ Signups │  │ Earned  │  │
│  └─────────┘  └─────────┘  └─────────┘  │
│                                          │
│  Earnings                                │
│  ┌─────────────────────────────────────┐ │
│  │ Available Balance: $340.00           │ │
│  │ Pending: $125.00                     │ │
│  │ Lifetime: $890.00                    │ │
│  │ [Request Payout]                     │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  Recent Referrals                        │
│  ┌─────────────────────────────────────┐ │
│  │ 🟢 acme-agency  Pro  $45.00 earned  │ │
│  │ 🟡 newvendor    Free Pending...     │ │
│  │ 🟢 creative-co  Pro  $45.00 earned  │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 6.2 Affiliate Application

```
┌─────────────────────────────────────────┐
│  Join Our Affiliate Program              │
├─────────────────────────────────────────┤
│                                          │
│  Earn 25% commission on all referrals!   │
│                                          │
│  Company Name                            │
│  [                                    ]  │
│                                          │
│  Your Name                               │
│  [                                    ]  │
│                                          │
│  Email                                   │
│  [                                    ]  │
│                                          │
│  Website/Social                          │
│  [                                    ]  │
│                                          │
│  How will you promote BlogCanvas?        │
│  ☐ Blog/Content  ☐ YouTube              │
│  ☐ Email List    ☐ Social Media         │
│  ☐ Paid Ads      ☐ Other                │
│                                          │
│  Estimated Audience Size                 │
│  [Select...                          ▼]  │
│                                          │
│  Tell us about yourself                  │
│  [                                    ]  │
│  [                                    ]  │
│                                          │
│  ☑ I agree to the Affiliate Terms        │
│                                          │
│            [Submit Application]          │
└─────────────────────────────────────────┘
```

---

## 7. Implementation Plan

### Phase 1: Database & Core (6 hours)
- [ ] Create all database tables
- [ ] Implement referral code generation
- [ ] Build tracking redirect endpoint
- [ ] Add attribution to signup flow

### Phase 2: Commission System (6 hours)
- [ ] Hook into payment webhooks
- [ ] Implement commission calculation
- [ ] Build commission tracking
- [ ] Create earnings summary API

### Phase 3: Vendor UI (4 hours)
- [ ] Referral dashboard page
- [ ] Referral list view
- [ ] Earnings display
- [ ] Payout request flow

### Phase 4: Payouts (4 hours)
- [ ] Stripe Connect payouts
- [ ] PayPal integration
- [ ] Payout processing cron
- [ ] Payout history

### Phase 5: Affiliate Program (5 hours)
- [ ] Application form
- [ ] Admin review interface
- [ ] Affiliate dashboard
- [ ] Marketing materials page

---

## 8. Commission Structure (Default)

| Program | Commission | Duration | Min Payout |
|---------|------------|----------|------------|
| Vendor Referral | 20% | 12 months | $50 |
| Client Referral | $25 credit | One-time | N/A |
| Affiliate | 25% | 6 months | $100 |

---

## 9. Fraud Prevention

| Risk | Mitigation |
|------|------------|
| Self-referral | Block same email/IP |
| Fake signups | Require payment to qualify |
| Cookie stuffing | First-click attribution |
| Affiliate fraud | Manual review, activity monitoring |

---

## 10. Testing Requirements

| Test Type | Coverage |
|-----------|----------|
| Referral tracking | Click → Signup → Payment |
| Commission calculation | All scenarios |
| Payout processing | Success and failure |
| Fraud detection | Self-referral, duplicates |

---

## 11. Future Enhancements

- [ ] Multi-tier referrals (MLM-lite)
- [ ] Custom landing pages per affiliate
- [ ] Real-time earnings notifications
- [ ] Leaderboards and gamification
- [ ] Affiliate API for tracking
- [ ] Sub-affiliate support

---

*Document Owner: Growth*  
*Last Updated: January 19, 2026*
