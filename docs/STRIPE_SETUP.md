# Stripe Integration Setup Guide

This guide walks you through setting up Stripe for subscription and invoice management in BlogCanvas.

## Table of Contents
1. [Environment Configuration](#environment-configuration)
2. [Database Migration](#database-migration)
3. [Stripe Dashboard Setup](#stripe-dashboard-setup)
4. [Webhook Configuration](#webhook-configuration)
5. [Testing](#testing)
6. [Usage Guide](#usage-guide)
7. [Troubleshooting](#troubleshooting)

---

## Environment Configuration

### Required Environment Variables

Add these variables to your `.env.local` file:

```bash
# Stripe Keys (Get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...                    # Required for API operations
STRIPE_PUBLISHABLE_KEY=pk_test_...               # Required for client-side operations
STRIPE_WEBHOOK_SECRET=whsec_...                  # Required for webhook signature verification

# Supabase Service Role Key (for webhooks, bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Already configured
```

### Getting Your Stripe Keys

1. **Sign up for Stripe**: Visit [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. **Navigate to API Keys**: Go to Developers → API keys
3. **Copy Keys**:
   - **Secret Key (sk_test_...)**: Used for server-side operations (NEVER expose this)
   - **Publishable Key (pk_test_...)**: Used for client-side operations (safe to expose)

**Important**: Start with test mode keys (sk_test_..., pk_test_...) for development.

---

## Database Migration

Apply the Stripe integration migration to create the required tables.

### Option 1: Using Supabase CLI

```bash
npx supabase db push
```

### Option 2: Manual SQL Execution

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of:
   ```
   supabase/migrations/20260111000003_stripe_integration.sql
   ```
3. Click "Run"

### Tables Created

The migration creates the following tables:

1. **stripe_accounts** - Vendor Stripe Connect accounts
2. **subscription_plans** - Subscription plan templates
3. **subscriptions** - Active client subscriptions
4. **invoices** - Invoices for clients
5. **payment_links** - One-time payment links
6. **stripe_webhook_events** - Webhook event log (audit trail)

It also adds:
- `stripe_customer_id` column to the `clients` table
- Indexes for performance
- RLS policies for security
- Database triggers for `updated_at` timestamps

---

## Stripe Dashboard Setup

### 1. Enable Required Features

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Settings → Business Settings**
3. Enable:
   - ✅ Invoicing
   - ✅ Subscriptions
   - ✅ Payment Links

### 2. Configure Tax Settings (Optional)

If you need to collect taxes:
1. Go to **Settings → Tax**
2. Enable Tax Calculation
3. Configure tax rates for your jurisdictions

### 3. Set Up Email Receipts (Optional)

1. Go to **Settings → Email Settings**
2. Customize receipt emails with your branding
3. Add your business logo

---

## Webhook Configuration

Webhooks keep your database in sync with Stripe events (payments, subscription changes, etc.).

### 1. Get Your Webhook Endpoint URL

Your webhook endpoint is:
```
https://your-domain.com/api/webhooks/stripe
```

**For local development**:
- Use [Stripe CLI](https://stripe.com/docs/stripe-cli) for webhook forwarding
- Or use [ngrok](https://ngrok.com/) to expose localhost

### 2. Create Webhook in Stripe Dashboard

1. Go to **Developers → Webhooks**
2. Click **+ Add endpoint**
3. Enter your endpoint URL:
   ```
   https://your-domain.com/api/webhooks/stripe
   ```
4. Select events to listen for:

   **Subscription Events** (Required):
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

   **Invoice Events** (Required):
   - `invoice.created`
   - `invoice.updated`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.finalized`

   **Payment Events** (Required):
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

5. Click **Add endpoint**

### 3. Copy Webhook Secret

After creating the webhook:
1. Click on the webhook endpoint
2. Click **Reveal** under "Signing secret"
3. Copy the secret (starts with `whsec_...`)
4. Add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 4. Test Webhook (Local Development)

Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
# or
npm install -g stripe-cli
```

Forward webhooks to localhost:
```bash
stripe listen --forward-to localhost:4848/api/webhooks/stripe
```

This command will output a webhook signing secret - add it to `.env.local`.

---

## Testing

### 1. Test Subscription Plan Creation

Use the Billing UI at `/app/billing` or test via API:

```bash
curl -X POST http://localhost:4848/api/subscriptions/plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro Plan",
    "description": "Professional blog content package",
    "amount": 99.99,
    "currency": "usd",
    "interval": "month"
  }'
```

### 2. Test Invoice Creation

```bash
curl -X POST http://localhost:4848/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "<client-uuid>",
    "amount": 199.99,
    "description": "January blog content package",
    "dueDate": "2026-02-01"
  }'
```

### 3. Test Stripe Webhooks

Trigger test events from Stripe Dashboard:
1. Go to **Developers → Webhooks**
2. Click on your webhook
3. Click **Send test webhook**
4. Select an event type (e.g., `invoice.paid`)
5. Check your application logs

### 4. Test Credit Cards

Stripe provides test card numbers:

- **Successful payment**: `4242 4242 4242 4242`
- **Declined payment**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0027 6000 3184`

Use any future expiration date (e.g., 12/34) and any 3-digit CVC.

Full list: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## Usage Guide

### For Vendors (Agency Owners)

#### 1. Create Subscription Plans

1. Navigate to `/app/billing`
2. Click "Plans" tab
3. Click "Create New Plan"
4. Fill in plan details:
   - Name (e.g., "Pro Plan")
   - Description (optional)
   - Amount (in dollars)
   - Interval (month, year, week)
5. Click "Create"

#### 2. Subscribe a Client

Use the API to create a subscription:

```typescript
// POST /api/subscriptions
{
  "clientId": "client-uuid",
  "planId": "plan-uuid",
  "trialDays": 7  // optional
}
```

#### 3. Create an Invoice

Use the API to create and send an invoice:

```typescript
// POST /api/invoices
{
  "clientId": "client-uuid",
  "amount": 199.99,
  "description": "January blog content",
  "dueDate": "2026-02-01",
  "items": [  // optional
    {
      "description": "Blog post - Topic 1",
      "amount": 99.99,
      "quantity": 1
    },
    {
      "description": "Blog post - Topic 2",
      "amount": 99.99,
      "quantity": 1
    }
  ]
}
```

#### 4. Create a Payment Link

For one-time payments:

```typescript
// POST /api/payment-links
{
  "clientId": "client-uuid",  // optional
  "amount": 499.99,
  "description": "One-time SEO audit",
  "expiresAt": "2026-02-01T00:00:00Z"  // optional
}
```

### For Clients

Clients will:
1. Receive invoice emails from Stripe (with payment link)
2. Click the payment link in the email
3. Pay securely via Stripe Checkout
4. Receive a receipt automatically

---

## Monitoring

### View Webhook Events

Check processed webhook events in your database:

```sql
SELECT
  event_type,
  processed,
  created_at,
  error
FROM stripe_webhook_events
ORDER BY created_at DESC
LIMIT 50;
```

### View Subscription Status

```sql
SELECT
  s.id,
  c.company_name,
  sp.name as plan_name,
  s.status,
  s.current_period_end,
  s.cancel_at_period_end
FROM subscriptions s
JOIN clients c ON s.client_id = c.id
JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
WHERE s.status = 'active'
ORDER BY s.created_at DESC;
```

### View Invoice Status

```sql
SELECT
  i.invoice_number,
  c.company_name,
  i.amount_due,
  i.amount_paid,
  i.status,
  i.due_date,
  i.paid_at
FROM invoices i
JOIN clients c ON i.client_id = c.id
ORDER BY i.created_at DESC;
```

---

## Troubleshooting

### Issue: "Stripe is not configured" Error

**Solution**: Check that `STRIPE_SECRET_KEY` is set in `.env.local` and restart your dev server.

```bash
# Verify env var is set
echo $STRIPE_SECRET_KEY

# Restart server
npm run dev
```

### Issue: Webhook Signature Verification Failed

**Causes**:
1. `STRIPE_WEBHOOK_SECRET` not set or incorrect
2. Using wrong endpoint URL
3. Webhook payload modified in transit

**Solution**:
1. Double-check `STRIPE_WEBHOOK_SECRET` in `.env.local`
2. Verify endpoint URL in Stripe Dashboard matches your app
3. Check server logs for detailed error messages

### Issue: Subscription Not Created

**Debugging Steps**:
1. Check that client exists and belongs to vendor
2. Verify plan exists and is active
3. Check server logs for Stripe API errors
4. Ensure Stripe API keys are correct (test vs live)

### Issue: Invoice Not Sending

**Debugging Steps**:
1. Verify client email is valid
2. Check Stripe Dashboard → Logs for API errors
3. Ensure invoice has line items (automatic or manual)
4. Check that `collection_method` is `send_invoice`

---

## Production Deployment Checklist

Before going live:

- [ ] Replace test API keys with live keys:
  - `STRIPE_SECRET_KEY=sk_live_...`
  - `STRIPE_PUBLISHABLE_KEY=pk_live_...`
- [ ] Update webhook endpoint URL to production domain
- [ ] Create new webhook secret for production
- [ ] Enable Stripe Radar for fraud prevention
- [ ] Set up email notifications for failed payments
- [ ] Configure invoice payment retry logic (Stripe Dashboard → Settings → Billing)
- [ ] Test full payment flow end-to-end with real card
- [ ] Review and accept Stripe Terms of Service
- [ ] Verify business details in Stripe Dashboard
- [ ] Set up payout schedule (Stripe Dashboard → Settings → Payouts)

---

## Security Best Practices

1. **Never expose secret keys**:
   - Never commit `STRIPE_SECRET_KEY` to version control
   - Never send secret keys to the client
   - Use environment variables only

2. **Always verify webhook signatures**:
   - Our webhook handler verifies signatures automatically
   - Don't disable signature verification

3. **Use HTTPS in production**:
   - Stripe requires HTTPS for webhooks
   - Vercel provides HTTPS by default

4. **Implement proper access control**:
   - RLS policies restrict data access by vendor/client
   - Always verify user permissions in API routes

5. **Handle errors gracefully**:
   - Log Stripe API errors for debugging
   - Show user-friendly error messages
   - Retry failed operations automatically (for webhooks)

---

## Cost Optimization

1. **Use test mode for development**: Test mode is free, no charges incurred
2. **Understand Stripe pricing**: 2.9% + $0.30 per successful charge (US)
3. **Minimize API calls**: Cache subscription and plan data where possible
4. **Use webhooks instead of polling**: More efficient and real-time
5. **Consider Stripe Billing**: Handles complex billing scenarios automatically

---

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Billing Guide](https://stripe.com/docs/billing/quickstart)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

---

## Support

If you encounter issues:
1. Check this documentation first
2. Review Stripe Dashboard → Logs
3. Check application server logs
4. Search [Stripe Support](https://support.stripe.com/)
5. Contact Stripe Support (available 24/7 via Dashboard)
