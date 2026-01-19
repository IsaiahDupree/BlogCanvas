# PRD: Client Self-Service Portal Enhancements

**Version:** 1.0  
**Created:** January 19, 2026  
**Status:** Draft  
**Priority:** Medium  
**Estimated Effort:** 30-40 hours

---

## 1. Executive Summary

Extend the client portal with self-service capabilities that reduce vendor support burden and empower clients to manage their own accounts, subscriptions, and support requests independently.

---

## 2. Problem Statement

### Current State
- Clients can only view content and approve deliverables
- All account changes require vendor intervention
- No self-service subscription management
- No ticket/support system
- Payment method changes require manual process

### Impact
- High vendor support overhead
- Delayed client requests
- Client frustration with dependency on vendor
- Missed upsell opportunities
- Churn due to friction

---

## 3. Goals & Success Metrics

### Goals
1. Enable clients to manage their own profile and preferences
2. Self-service subscription upgrades/downgrades
3. Built-in support ticket system
4. Payment method management
5. Invoice access and download

### Success Metrics
| Metric | Current | Target |
|--------|---------|--------|
| Support tickets to vendor | 100% | -50% |
| Subscription changes via self-service | 0% | 80% |
| Client NPS | TBD | +15 points |
| Time to resolve billing issues | Days | < 1 hour |

---

## 4. User Stories

### Profile & Preferences

#### US-CSS-001: Update Profile
**As a** client  
**I want to** update my contact information  
**So that** my vendor can reach me correctly

**Acceptance Criteria:**
- [ ] Edit name, email, phone
- [ ] Change profile photo
- [ ] Update company info
- [ ] Email verification for email changes

#### US-CSS-002: Notification Preferences
**As a** client  
**I want to** control what notifications I receive  
**So that** I'm not overwhelmed with emails

**Acceptance Criteria:**
- [ ] Toggle email notifications by type
- [ ] Push notification preferences
- [ ] Digest frequency (immediate, daily, weekly)
- [ ] Quiet hours setting

#### US-CSS-003: Password & Security
**As a** client  
**I want to** manage my password and security settings  
**So that** my account stays secure

**Acceptance Criteria:**
- [ ] Change password
- [ ] Enable/disable 2FA
- [ ] View active sessions
- [ ] Sign out of all devices

---

### Subscription Management

#### US-CSS-004: View Subscription
**As a** client  
**I want to** see my current subscription details  
**So that** I understand what I'm paying for

**Acceptance Criteria:**
- [ ] Current plan name and price
- [ ] Billing cycle and next payment date
- [ ] Included features list
- [ ] Usage stats if applicable

#### US-CSS-005: Upgrade Subscription
**As a** client  
**I want to** upgrade my subscription  
**So that** I can access more features

**Acceptance Criteria:**
- [ ] See available upgrade options
- [ ] Compare plans side-by-side
- [ ] Pro-rated pricing displayed
- [ ] Immediate upgrade with confirmation
- [ ] Email receipt

#### US-CSS-006: Downgrade Subscription
**As a** client  
**I want to** downgrade my subscription  
**So that** I can reduce my costs

**Acceptance Criteria:**
- [ ] See downgrade options
- [ ] Warning about features to lose
- [ ] Effective at end of billing period
- [ ] Confirmation email
- [ ] Option to cancel downgrade

#### US-CSS-007: Cancel Subscription
**As a** client  
**I want to** cancel my subscription  
**So that** I can stop being charged

**Acceptance Criteria:**
- [ ] Cancel option in billing settings
- [ ] Retention offer/discount
- [ ] Reason selection (exit survey)
- [ ] Confirmation of end date
- [ ] Data retention policy displayed

---

### Billing & Payments

#### US-CSS-008: Update Payment Method
**As a** client  
**I want to** update my credit card  
**So that** my payments continue without interruption

**Acceptance Criteria:**
- [ ] Add new payment method
- [ ] Set default payment method
- [ ] Remove old payment methods
- [ ] Card validation before saving

#### US-CSS-009: View Invoices
**As a** client  
**I want to** access my invoice history  
**So that** I can submit them for reimbursement

**Acceptance Criteria:**
- [ ] List all invoices with status
- [ ] Download PDF invoice
- [ ] Filter by date range
- [ ] Show payment method used

#### US-CSS-010: Billing History
**As a** client  
**I want to** see all my transactions  
**So that** I can track my spending

**Acceptance Criteria:**
- [ ] All payments listed
- [ ] Refunds shown
- [ ] Failed payment attempts
- [ ] Export to CSV

---

### Support System

#### US-CSS-011: Create Support Ticket
**As a** client  
**I want to** submit a support request  
**So that** I can get help with issues

**Acceptance Criteria:**
- [ ] Select issue category
- [ ] Describe problem
- [ ] Attach files/screenshots
- [ ] Priority selection
- [ ] Email confirmation

#### US-CSS-012: View Ticket Status
**As a** client  
**I want to** check on my support tickets  
**So that** I know when to expect resolution

**Acceptance Criteria:**
- [ ] List all my tickets
- [ ] Status badges (open, in progress, resolved)
- [ ] Last update timestamp
- [ ] View full conversation

#### US-CSS-013: Reply to Ticket
**As a** client  
**I want to** add information to my ticket  
**So that** I can help resolve it faster

**Acceptance Criteria:**
- [ ] Reply with message
- [ ] Add attachments
- [ ] See vendor responses
- [ ] Close ticket when resolved

---

### Knowledge Base

#### US-CSS-014: Search Help Articles
**As a** client  
**I want to** find answers to common questions  
**So that** I can solve problems myself

**Acceptance Criteria:**
- [ ] Search help center
- [ ] Browse by category
- [ ] Related articles suggestions
- [ ] "Was this helpful?" feedback

---

## 5. Technical Requirements

### 5.1 Database Schema

```sql
-- Support tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES vendor_workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES vendor_clients(id),
  vendor_id UUID REFERENCES vendors(id),
  
  -- Ticket details
  ticket_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL, -- 'billing', 'technical', 'account', 'feature', 'other'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'waiting_client', 'resolved', 'closed'
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- Ticket messages
CREATE TABLE support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_type TEXT NOT NULL, -- 'client', 'vendor', 'system'
  
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  
  -- Metadata
  is_internal BOOLEAN DEFAULT false, -- Vendor-only notes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base articles
CREATE TABLE kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category TEXT NOT NULL,
  tags TEXT[],
  
  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at TIMESTAMPTZ,
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  helpful_yes INTEGER DEFAULT 0,
  helpful_no INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(vendor_id, slug)
);

-- Client notification preferences
CREATE TABLE client_notification_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES vendor_clients(id) ON DELETE CASCADE,
  
  -- Email preferences
  email_deliverables BOOLEAN DEFAULT true,
  email_messages BOOLEAN DEFAULT true,
  email_meetings BOOLEAN DEFAULT true,
  email_billing BOOLEAN DEFAULT true,
  email_digest_frequency TEXT DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly', 'none'
  
  -- Push preferences  
  push_enabled BOOLEAN DEFAULT true,
  push_messages BOOLEAN DEFAULT true,
  push_meetings BOOLEAN DEFAULT true,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone TEXT DEFAULT 'UTC',
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tickets_workspace ON support_tickets(workspace_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_kb_vendor_slug ON kb_articles(vendor_id, slug);
CREATE INDEX idx_kb_category ON kb_articles(category);
```

### 5.2 API Endpoints

```
# Profile
GET    /api/portal/profile              - Get client profile
PATCH  /api/portal/profile              - Update profile
POST   /api/portal/profile/photo        - Upload photo
POST   /api/portal/profile/verify-email - Send verification email

# Security
POST   /api/portal/security/change-password
POST   /api/portal/security/enable-2fa
POST   /api/portal/security/disable-2fa
GET    /api/portal/security/sessions
DELETE /api/portal/security/sessions/:id

# Notifications
GET    /api/portal/notifications/preferences
PUT    /api/portal/notifications/preferences

# Billing
GET    /api/portal/billing/subscription
GET    /api/portal/billing/plans
POST   /api/portal/billing/upgrade
POST   /api/portal/billing/downgrade
POST   /api/portal/billing/cancel
GET    /api/portal/billing/payment-methods
POST   /api/portal/billing/payment-methods
DELETE /api/portal/billing/payment-methods/:id
GET    /api/portal/billing/invoices
GET    /api/portal/billing/invoices/:id/download

# Support
GET    /api/portal/support/tickets
POST   /api/portal/support/tickets
GET    /api/portal/support/tickets/:id
POST   /api/portal/support/tickets/:id/messages
POST   /api/portal/support/tickets/:id/close

# Knowledge Base
GET    /api/portal/kb/articles
GET    /api/portal/kb/articles/:slug
GET    /api/portal/kb/search
POST   /api/portal/kb/articles/:id/feedback
```

### 5.3 Stripe Integration

```typescript
// Subscription management via Stripe Customer Portal
const createBillingPortalSession = async (customerId: string) => {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/client-portal/${workspaceId}/billing`,
    configuration: billingPortalConfigId // Pre-configured in Stripe
  });
};

// Or custom implementation for more control
const updateSubscription = async (subscriptionId: string, newPriceId: string) => {
  return stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscriptionItemId,
      price: newPriceId
    }],
    proration_behavior: 'create_prorations'
  });
};
```

---

## 6. UI/UX Requirements

### 6.1 Portal Navigation Update

```
Current:
├── Overview
├── Onboarding
├── Messages
├── Deliverables
├── Meetings
└── Revisions

New:
├── Overview
├── Onboarding
├── Messages
├── Deliverables
├── Meetings
├── Revisions
├── Support           <- NEW
│   ├── My Tickets
│   └── Help Center
└── Account           <- NEW
    ├── Profile
    ├── Security
    ├── Notifications
    └── Billing
```

### 6.2 Billing Dashboard

```
┌─────────────────────────────────────────┐
│  Billing & Subscription                  │
├─────────────────────────────────────────┤
│                                          │
│  Current Plan                            │
│  ┌─────────────────────────────────────┐ │
│  │ Pro Plan              $99/month     │ │
│  │ Next billing: Feb 19, 2026          │ │
│  │ [Manage Plan]  [View Invoices]      │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  Payment Method                          │
│  ┌─────────────────────────────────────┐ │
│  │ 💳 Visa •••• 4242        Default    │ │
│  │ Expires 12/2027                      │ │
│  │ [Update]  [Add New]                  │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  Recent Invoices                         │
│  ┌─────────────────────────────────────┐ │
│  │ Jan 19, 2026   $99.00    Paid  [↓]  │ │
│  │ Dec 19, 2025   $99.00    Paid  [↓]  │ │
│  │ Nov 19, 2025   $99.00    Paid  [↓]  │ │
│  │              [View All]              │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 6.3 Support Ticket View

```
┌─────────────────────────────────────────┐
│  Support Tickets                         │
├─────────────────────────────────────────┤
│  [+ New Ticket]                          │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ #1234 - Can't download files        │ │
│  │ 🟡 In Progress  •  Updated 2h ago   │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ #1233 - Billing question            │ │
│  │ ✅ Resolved  •  Jan 15, 2026        │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  Can't find what you need?               │
│  [Browse Help Center]                    │
└─────────────────────────────────────────┘
```

---

## 7. Implementation Plan

### Phase 1: Profile & Security (8 hours)
- [ ] Profile edit page
- [ ] Photo upload
- [ ] Password change
- [ ] Session management
- [ ] 2FA toggle

### Phase 2: Notification Preferences (4 hours)
- [ ] Preferences database table
- [ ] Preferences API
- [ ] Settings UI
- [ ] Apply to notification system

### Phase 3: Billing Self-Service (10 hours)
- [ ] Stripe Billing Portal integration
- [ ] Payment method management
- [ ] Invoice download
- [ ] Subscription change flow
- [ ] Cancellation flow with exit survey

### Phase 4: Support Ticketing (12 hours)
- [ ] Tickets database schema
- [ ] Ticket CRUD API
- [ ] Ticket list/detail UI
- [ ] Message threading
- [ ] Email notifications for updates
- [ ] Vendor dashboard for tickets

### Phase 5: Knowledge Base (6 hours)
- [ ] KB articles schema
- [ ] Article management (vendor side)
- [ ] Public article view
- [ ] Search functionality
- [ ] Feedback collection

---

## 8. Testing Requirements

| Test Type | Coverage |
|-----------|----------|
| Profile updates | All fields, validation |
| Password change | Current password verification |
| Subscription changes | Upgrade, downgrade, cancel |
| Payment methods | Add, remove, set default |
| Invoice download | PDF generation |
| Ticket creation | All categories, attachments |
| KB search | Relevance, empty results |

---

## 9. Vendor Configuration

Vendors should be able to configure:
- [ ] Enable/disable self-service billing
- [ ] Allow/disallow cancellation
- [ ] Require approval for downgrades
- [ ] Custom retention offers
- [ ] KB article management
- [ ] Ticket categories
- [ ] Auto-assign rules

---

## 10. Future Enhancements

- [ ] Live chat widget
- [ ] AI-powered ticket routing
- [ ] Chatbot for common questions
- [ ] Scheduled reports for clients
- [ ] Usage dashboards
- [ ] API access for clients

---

*Document Owner: Product*  
*Last Updated: January 19, 2026*
