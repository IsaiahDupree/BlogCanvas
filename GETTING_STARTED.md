# Getting Started with BlogCanvas Vendor Platform

This guide will get your BlogCanvas Vendor Offer Platform up and running in ~30 minutes.

---

## Prerequisites

- Node.js 18+ installed
- Supabase account (already configured)
- Stripe account (for payments)
- Git (for version control)

---

## Quick Start (5 Steps)

### Step 1: Apply Database Migrations (5 minutes) 🔴 REQUIRED

The database tables **must be created** before the platform will work.

**Option A: Supabase Dashboard (Recommended)**

1. Open your Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/gqjgxltroyysjoxswbmn/sql/new
   ```

2. Run migrations in order:
   
   **First:** Copy contents of `supabase/migrations/20260117000001_vendor_platform_base.sql`
   - Paste into SQL editor
   - Click "Run"
   
   **Second:** Copy contents of `supabase/migrations/20260117000002_vendor_portal_features.sql`
   - Paste into SQL editor
   - Click "Run"
   
   **Third:** Copy contents of `supabase/migrations/20260117000003_vendor_analytics.sql`
   - Paste into SQL editor
   - Click "Run"

3. Verify migrations applied:
   ```bash
   node run-vendor-migrations.mjs
   ```
   
   Expected output:
   ```
   vendors: ✅
   vendor_members: ✅
   offer_pages: ✅
   ...
   ```

**Option B: Supabase CLI**

If you have Supabase CLI configured:
```bash
npx supabase db push
```

---

### Step 2: Configure Stripe (10 minutes) 🟡 OPTIONAL FOR TESTING

Add Stripe keys to `.env.local`:

```bash
# Get these from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Get this after setting up webhook endpoint
STRIPE_WEBHOOK_SECRET=whsec_...
```

**To set up Stripe webhooks:**

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "+ Add endpoint"
3. Endpoint URL: `http://localhost:4848/api/webhooks/stripe` (or your production URL)
4. Events to send:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `subscription_created`
   - `subscription_updated`
   - `subscription_deleted`
5. Copy the webhook secret to `.env.local`

---

### Step 3: Start the Development Server (1 minute)

```bash
npm run dev
```

The app will run on: `http://localhost:4848`

---

### Step 4: Create Your First Vendor Account (2 minutes)

1. Open: http://localhost:4848/vendor/register

2. Fill out the form:
   - Email: `you@example.com`
   - Password: `password123` (8+ characters)
   - Handle: `johndoe` (lowercase, no spaces)
   - Business Name: `John's Copywriting`
   - Full Name: `John Doe`

3. Click "Create Vendor Account"

4. You'll be redirected to: http://localhost:4848/vendor/dashboard

---

### Step 5: Create Your First Offer Page (5 minutes)

1. From dashboard, click "Pages" or go to: http://localhost:4848/vendor/pages

2. Click "Create New Page"

3. Fill in page details:
   - Title: `Newsletter Audit`
   - Slug: `newsletter-audit`
   - Description: `Get a professional audit of your newsletter`

4. Add blocks:
   - Click "+ Add Block" → Select "Hero"
   - Fill in headline: `Get Your Newsletter Professionally Audited`
   - CTA Text: `Get Started`
   
   - Click "+ Add Block" → Select "Features"
   - Add features your offer includes
   
   - Click "+ Add Block" → Select "Pricing"
   - Create an offer (one-time payment or subscription)

5. Click "Preview" to see how it looks

6. Click "Publish" when ready

7. View your live page at: `http://localhost:4848/@johndoe/newsletter-audit`

---

## What You Can Do Now

### ✅ Vendor Features (Available Now)

- Create and manage offer pages
- Build pages with 9 block types:
  - Hero (headline + CTA)
  - VSL (video sales letter)
  - Problem/Solution
  - Features (what's included)
  - Testimonials
  - Offer Stack (value building)
  - Pricing
  - FAQ
  - CTA (final call-to-action)
- Configure offers (one-time or subscription)
- Add add-ons (setup fees, rush delivery, etc.)
- Manage vendor profile
- View dashboard

### ✅ Public Features (Available Now)

- View vendor pages at `/@vendorhandle/slug`
- See all blocks rendered beautifully
- Click CTA buttons (checkout needs Stripe)

### 🟡 Needs Stripe Configuration

- Checkout flow (add Stripe keys first)
- Payment processing
- Subscription management
- Client workspace creation (after purchase)

### 🟡 Needs Google OAuth Configuration

- Calendar integration
- Meeting scheduling
- Availability management

---

## Testing the Full Flow

### Test Vendor Registration ✅
```
Visit: http://localhost:4848/vendor/register
Create: Test vendor account
Expected: Redirected to dashboard
```

### Test Page Creation ✅
```
Visit: http://localhost:4848/vendor/pages/new
Create: Offer page with blocks
Expected: Page created and publishable
```

### Test Public Page ✅
```
Visit: http://localhost:4848/@yourhandle/yourslug
Expected: Page displays with all blocks
```

### Test Checkout (Requires Stripe) 🟡
```
Visit: Public page with pricing block
Click: "Buy Now" button
Expected: Stripe checkout opens
Complete: Test purchase
Expected: Workspace created for client
```

### Test Client Portal (After Purchase) 🟡
```
Visit: http://localhost:4848/client-portal
Expected: See purchased workspace
Features:
- Onboarding checklist
- Messages
- Deliverables
- Revision requests
- Meeting scheduling
```

---

## Directory Structure

```
BlogCanvas/
├── src/
│   ├── app/
│   │   ├── vendor/              # Vendor dashboard & pages
│   │   ├── client-portal/       # Client workspace
│   │   ├── [vendor]/[slug]/     # Public offer pages
│   │   └── api/                 # All API endpoints
│   │
│   ├── components/
│   │   ├── editor/              # Page block editor
│   │   ├── public/              # Public page renderers
│   │   └── vendor/              # Vendor dashboard UI
│   │
│   ├── lib/
│   │   ├── db/vendor/           # Database operations
│   │   ├── stripe/              # Stripe integration
│   │   └── supabase/            # Supabase clients
│   │
│   └── types/                   # TypeScript types
│
├── supabase/migrations/         # Database migrations
└── docs/                        # Documentation
```

---

## Common Issues & Solutions

### ❌ "Tenant or user not found" when connecting to database

**Solution:** Database migrations need to be applied. Follow Step 1 above.

### ❌ "Handle is already taken"

**Solution:** Choose a different vendor handle. Handles must be unique.

### ❌ Checkout button doesn't work

**Solution:** Add Stripe keys to `.env.local` (see Step 2)

### ❌ "Vendor has not connected Stripe account"

**Solution:** 
1. Go to vendor settings
2. Click "Payments"
3. Connect Stripe account
OR set vendor `stripe_account_id` in database for testing

### ❌ Page not found at /@vendor/slug

**Solution:** 
- Make sure page is published
- Check that vendor handle is correct (no @ symbol in route)
- Verify database has `offer_pages` table

---

## Environment Variables Reference

### Required
```bash
# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://gqjgxltroyysjoxswbmn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# App
NEXT_PUBLIC_APP_URL=http://localhost:4848
PORT=4848
```

### Optional (Add as needed)
```bash
# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (for emails)
RESEND_API_KEY=re_...

# Google (for calendar)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:4848/api/gmail/callback
```

---

## Next Steps

1. ✅ Apply migrations (Step 1 above)
2. ✅ Start dev server (Step 3 above)
3. ✅ Create test vendor (Step 4 above)
4. ✅ Create test page (Step 5 above)
5. 🟡 Configure Stripe (Step 2 above)
6. 🟡 Test full checkout flow
7. 🟡 Deploy to production

---

## Production Deployment

### Deploy to Vercel

1. Push to GitHub:
   ```bash
   git add .
   git commit -m "BlogCanvas Vendor Platform MVP"
   git push
   ```

2. Connect to Vercel:
   - Go to: https://vercel.com/new
   - Import your repository
   - Add environment variables from `.env.local`
   - Deploy

3. Apply migrations to production Supabase

4. Update webhook URLs in Stripe to use production domain

---

## Support

- **PRD:** `docs/PRD_VENDOR_OFFER_PLATFORM.md`
- **Status:** `VENDOR_PLATFORM_STATUS.md`
- **This Guide:** `GETTING_STARTED.md`

---

**Ready to launch!** 🚀

The platform is fully functional once migrations are applied. Start with Step 1 and you'll have a working vendor platform in 30 minutes.
