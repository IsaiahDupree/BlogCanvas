# BlogCanvas Vendor Platform - Testing Guide

## Prerequisites

### Environment Setup
Ensure these environment variables are set:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:4848
```

### Apply Database Migrations

Run these migrations in order in your Supabase SQL Editor:

1. `supabase/migrations/20260117000001_vendor_platform_base.sql`
2. `supabase/migrations/20260117000002_vendor_portal_features.sql`
3. `supabase/migrations/20260117000003_vendor_analytics.sql`

Or use Supabase CLI:
```bash
supabase db push
```

---

## Test Suite

### 1. Vendor Registration & Auth

**Test 1.1: Register New Vendor**
```
1. Visit http://localhost:4848/vendor/register
2. Fill in form:
   - Email: test@vendor.com
   - Password: TestPass123!
   - Handle: testvendor
   - Business Name: Test Vendor LLC
   - Full Name: John Doe
3. Click "Create Vendor Account"
4. Should redirect to /vendor/dashboard
5. Verify success message shown
```

**Expected Results:**
- ✅ User created in auth.users
- ✅ Record created in vendors table with handle 'testvendor'
- ✅ Record created in vendor_members with role 'owner'
- ✅ Redirected to vendor dashboard

**Test 1.2: Handle Availability Check**
```
1. Visit /vendor/register
2. Enter handle "testvendor" (from Test 1.1)
3. Tab out or click elsewhere
4. Should show "This handle is already taken"
```

**Test 1.3: Login as Vendor**
```
1. Visit /login
2. Enter: test@vendor.com / TestPass123!
3. Should redirect to /vendor/dashboard
```

---

### 2. Offer Page Creation

**Test 2.1: Create New Offer Page**
```
1. Login as vendor
2. Navigate to /vendor/pages
3. Click "New Page" button
4. Fill in:
   - Title: "Newsletter Audit Service"
   - Slug: "newsletter-audit"
   - Description: "Get a detailed audit of your newsletter"
5. Click "Create Page"
6. Should redirect to page editor
```

**Expected Results:**
- ✅ Record created in offer_pages table
- ✅ Slug is unique for vendor
- ✅ is_published = false by default

**Test 2.2: Add Blocks to Page**
```
1. In page editor, add these blocks:
   - Hero Block (headline, CTA)
   - Features Block (what's included)
   - Testimonials Block
   - Pricing Block
   - FAQ Block
2. Save page
3. Preview page
4. Verify all blocks render correctly
```

**Test 2.3: Create Offer for Page**
```
1. In page editor, go to "Offer Settings"
2. Create offer:
   - Name: "Newsletter Audit"
   - Type: "one_time"
   - Base Price: 99.00
   - Currency: USD
3. Save offer
4. Verify offer appears in pricing block
```

**Test 2.4: Add Add-ons**
```
1. In offer settings, click "Add Add-on"
2. Create:
   - Name: "Rush Delivery (24h)"
   - Type: "rush_delivery"
   - Price: 49.00
3. Create another:
   - Name: "Extra Revision"
   - Type: "extra_revisions"
   - Price: 29.00
4. Save add-ons
```

**Test 2.5: Publish Page**
```
1. Click "Publish" button
2. Confirm publication
3. Verify is_published = true
4. Verify published_at timestamp set
```

---

### 3. Public Offer Page

**Test 3.1: View Published Page**
```
1. Open new incognito window
2. Visit: http://localhost:4848/@testvendor/newsletter-audit
3. Should see public offer page with all blocks
4. Verify vendor branding (business name, logo if set)
```

**Test 3.2: Page View Tracking**
```
1. Visit public page
2. Open browser dev console
3. Check Network tab for call to /api/events/track
4. Verify event_name = 'page_view'
5. Check vendor_event_log table for new record
```

**Test 3.3: Scroll Tracking**
```
1. Scroll down page to 50%
2. Scroll to 100%
3. Check vendor_event_log for scroll_depth events
```

---

### 4. Stripe Connect Setup

**Test 4.1: Connect Stripe Account**
```
1. Login as vendor
2. Go to /vendor/settings/payments
3. Click "Connect Stripe" button
4. Should redirect to Stripe onboarding
5. Complete Stripe Express onboarding (use test mode)
6. Should redirect back to /vendor/settings/payments?success=true
```

**Expected Results:**
- ✅ vendors.stripe_account_id populated
- ✅ Stripe account status shown (charges_enabled, details_submitted)

---

### 5. Checkout Flow (Critical Test)

**Test 5.1: Start Checkout**
```
1. As unauthenticated user, visit: /@testvendor/newsletter-audit
2. Click "Buy Now" CTA button
3. Should call /api/checkout/session
4. Should redirect to Stripe Checkout
```

**Test 5.2: Complete Purchase**
```
1. In Stripe Checkout, fill in:
   - Email: customer@example.com
   - Name: Jane Customer
   - Card: 4242 4242 4242 4242
   - Exp: 12/34
   - CVC: 123
   - ZIP: 12345
2. Optionally select add-ons
3. Click "Pay"
4. Should redirect to success URL
```

**Test 5.3: Verify Webhook Processing**
```
1. Check server console for webhook event
2. Verify in database:
   - vendor_clients: New record for customer@example.com
   - vendor_workspaces: New workspace created
   - vendor_orders: Order with status 'paid'
   - vendor_order_items: Base offer + any selected add-ons
   - onboarding_steps: 5 default steps created
   - vendor_event_log: checkout_complete event
   - vendor_attribution: Marked as converted
3. Check console for welcome email log
```

**Expected Data:**
```sql
-- Check client
SELECT * FROM vendor_clients WHERE email = 'customer@example.com';

-- Check workspace
SELECT * FROM vendor_workspaces WHERE client_id = <client_id_above>;

-- Check order
SELECT * FROM vendor_orders WHERE workspace_id = <workspace_id>;

-- Check order items
SELECT * FROM vendor_order_items WHERE order_id = <order_id>;

-- Check onboarding steps
SELECT * FROM onboarding_steps WHERE workspace_id = <workspace_id> ORDER BY step_order;
```

---

### 6. Vendor Dashboard

**Test 6.1: View Dashboard**
```
1. Login as vendor
2. Visit /vendor/dashboard
3. Should see:
   - Revenue metrics
   - Recent orders
   - Active workspaces
   - Analytics overview
```

**Test 6.2: View Workspaces**
```
1. Click "Workspaces" in sidebar
2. Should see workspace created in Test 5
3. Click on workspace
4. Should see:
   - Client details
   - Order information
   - Onboarding progress
```

**Test 6.3: View Analytics**
```
1. Click "Analytics" in sidebar
2. Should see:
   - Page views for published pages
   - Funnel metrics (views → clicks → checkouts)
   - Conversion rate
   - Revenue chart
```

---

### 7. Client Portal (Pending Implementation)

**Test 7.1: Access Portal (Future)**
```
1. As customer, visit /client-portal/<workspace_id>
2. Login with customer@example.com
3. Should see:
   - Purchase summary
   - Onboarding checklist (5 steps)
   - Workspace status
```

**Test 7.2: Complete Onboarding Step (Future)**
```
1. Click first onboarding step
2. Mark as complete
3. Verify step updated in database
4. Progress bar updates
```

---

### 8. Messaging System (Pending Implementation)

**Test 8.1: Send Message (Future)**
```
1. In client portal, navigate to Messages
2. Type message and send
3. Verify:
   - Message appears in thread
   - Record created in vendor_messages
   - Vendor notified (future)
```

---

### 9. Edge Cases & Error Handling

**Test 9.1: Duplicate Handle**
```
1. Try to register with handle "testvendor"
2. Should show error: "Handle is already taken"
```

**Test 9.2: Invalid Handle Format**
```
1. Try handle with spaces: "test vendor"
2. Should show error about allowed characters
```

**Test 9.3: Checkout Without Stripe Connected**
```
1. Create new vendor without connecting Stripe
2. Try to checkout on their page
3. Should show error: "Vendor has not connected Stripe account"
```

**Test 9.4: Inactive Offer**
```
1. Mark offer as is_active = false
2. Try to checkout
3. Should show error: "This offer is not currently available"
```

**Test 9.5: Quote Mode**
```
1. Set offer to is_quote_mode = true
2. Try to checkout
3. Should redirect to lead capture form (not payment)
```

**Test 9.6: Webhook Idempotency**
```
1. Replay same webhook event (same stripe_event_id)
2. Should not create duplicate records
3. Check stripe_webhook_events table has processed = true
```

---

## Performance Tests

### Test P1: Page Load Speed
```
1. Visit public offer page
2. Check Chrome DevTools Performance tab
3. Verify:
   - FCP < 1.5s
   - LCP < 2.5s
   - CLS < 0.1
```

### Test P2: Database Query Performance
```
-- Check slow queries in Supabase
SELECT * FROM vendor_event_log WHERE vendor_id = '<id>' LIMIT 1000;
-- Should return in < 100ms with proper indexes
```

---

## Security Tests

### Test S1: RLS Policies
```
1. As Vendor A, try to access Vendor B's data:
   - GET /api/vendor/pages?vendorId=<vendor_b_id>
   - Should return 403 or empty results
```

### Test S2: Public Page Access
```
1. Try to access unpublished page
2. Should return 404 or "Page not found"
```

### Test S3: Client Data Isolation
```
1. As Client A, try to access Client B's workspace
2. Should be blocked by RLS
```

---

## Regression Tests

After each code change, run:

1. ✅ Vendor registration
2. ✅ Page creation and publishing
3. ✅ Checkout flow end-to-end
4. ✅ Webhook processing
5. ✅ Analytics tracking

---

## Automated Testing (Future)

Consider adding:
- Playwright E2E tests for checkout flow
- Jest unit tests for utility functions
- Stripe webhook testing with Stripe CLI

```bash
# Test webhooks locally with Stripe CLI
stripe listen --forward-to localhost:4848/api/webhooks/stripe
stripe trigger checkout.session.completed
```

---

## Known Issues

1. **Email Service**: Currently only logs to console, needs Resend/SendGrid integration
2. **File Upload**: Not yet implemented for deliverables
3. **Real-time Updates**: Messaging requires polling or WebSocket setup
4. **Google Calendar**: OAuth flow not implemented

---

## Next Steps

1. Build client portal UI
2. Implement messaging system
3. Add Google Calendar integration
4. Set up email service (Resend)
5. Add file upload for deliverables
6. Create E2E test suite with Playwright
7. Set up staging environment
8. Load testing with k6 or Artillery

---

**Last Updated:** January 17, 2026
