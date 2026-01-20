# BlogCanvas Vendor Platform - Quick Start Guide

🚀 Get your vendor platform up and running in **15 minutes**!

---

## Prerequisites

- ✅ Node.js installed
- ✅ Supabase account and project
- ✅ Stripe account (test mode)
- ✅ Code cloned and dependencies installed

---

## Step 1: Apply Database Migrations (5 minutes)

### Option A: Supabase SQL Editor (Recommended)

1. **Open Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/gqjgxltroyysjoxswbmn/sql/new
   ```

2. **Apply Migration 1 - Base Tables:**
   - Open: `supabase/migrations/20260117000001_vendor_platform_base.sql`
   - Copy entire file
   - Paste into SQL Editor
   - Click **"Run"**
   - Wait for success message ✅

3. **Apply Migration 2 - Portal Features:**
   - Open: `supabase/migrations/20260117000002_vendor_portal_features.sql`
   - Copy entire file
   - Paste into SQL Editor
   - Click **"Run"**
   - Wait for success message ✅

4. **Apply Migration 3 - Analytics:**
   - Open: `supabase/migrations/20260117000003_vendor_analytics.sql`
   - Copy entire file
   - Paste into SQL Editor
   - Click **"Run"**
   - Wait for success message ✅

5. **Verify Migrations:**
   ```bash
   node run-vendor-migrations.mjs
   ```

   You should see all tables marked with ✅

---

## Step 2: Start Development Server (1 minute)

```bash
npm run dev
```

Server will start on: `http://localhost:4848`

---

## Step 3: Register Test Vendor (3 minutes)

1. **Open Registration Page:**
   ```
   http://localhost:4848/vendor/register
   ```

2. **Fill in Vendor Details:**
   - Business Name: `Test Vendor`
   - Vendor Handle: `testvendor` (unique, URL-friendly)
   - Email: Your test email
   - Full Name: Your name
   - Password: Create a secure password

3. **Submit Registration**
   - Should redirect to vendor dashboard
   - You'll see welcome message and stats overview

---

## Step 4: Create Your First Offer Page (5 minutes)

1. **Navigate to Pages:**
   - Click "Create Offer Page" or visit `/vendor/pages/new`

2. **Choose a Template:**
   - Select "Newsletter Audit" (or any template)
   - Click "Use This Template"

3. **Customize Page:**
   - Edit page title (e.g., "Newsletter Growth Audit")
   - Edit slug (e.g., "newsletter-audit")
   - Customize blocks:
     - **Hero:** Update headline and CTA text
     - **VSL:** Add video URL (optional)
     - **Pricing:** Set your price (e.g., $297)
     - **Features:** List what's included

4. **Configure Offer:**
   - Scroll to "Offer Settings" section
   - Select offer type: "One-time purchase"
   - Set base price: `297.00`
   - Add optional add-ons:
     - Setup fee: `$97`
     - Rush delivery: `$150`

5. **Save and Publish:**
   - Click "Save Page"
   - Click "Publish" to make it live
   - Note your public URL: `/@testvendor/newsletter-audit`

---

## Step 5: Test Checkout Flow (3 minutes)

1. **Visit Your Public Page:**
   ```
   http://localhost:4848/@testvendor/newsletter-audit
   ```

2. **Test Checkout:**
   - Click "Buy Now" button
   - Should redirect to Stripe Checkout
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/34)
   - Any CVC (e.g., 123)
   - Any billing details

3. **Complete Purchase:**
   - Click "Pay"
   - Should redirect back to success page
   - Workspace should be created automatically

4. **Access Client Portal:**
   - You'll receive a workspace ID in the redirect
   - Visit: `/client-portal/{workspace-id}`
   - See purchase summary, onboarding steps, etc.

---

## Step 6: Explore Features (Optional)

### Client Portal Features
- ✅ **Overview:** Purchase summary, onboarding progress, quick actions
- ✅ **Onboarding:** Interactive checklist with progress tracking
- ✅ **Messages:** Real-time messaging with vendor
- ✅ **Deliverables:** File and link delivery with approval workflow
- ✅ **Meetings:** View scheduled meetings, join links
- ✅ **Revisions:** Request revisions on deliverables

### Vendor Dashboard Features
- ✅ **Dashboard:** Stats overview (pages, clients, revenue, views)
- ✅ **Pages:** Manage all offer pages
- ✅ **Clients:** View client workspaces (coming soon)
- ✅ **Analytics:** Track performance (coming soon)
- ✅ **Settings:** Configure Stripe, calendar, profile

---

## Common Tasks

### Create Additional Offer Pages

```bash
# Navigate to pages
http://localhost:4848/vendor/pages

# Click "Create Page"
# Choose template or start from scratch
```

### Test Different Offer Types

1. **Subscription:**
   - Create new page
   - Set offer type: "Subscription"
   - Set billing period: "Monthly"
   - Set price: `97.00`

2. **Retainer:**
   - Create new page
   - Set offer type: "Retainer"
   - Set monthly price: `997.00`
   - Add custom deliverables

3. **Book-a-Call:**
   - Create new page
   - Set offer type: "Book a Call"
   - Configure meeting type
   - Set price or make it free

### Test Messaging

1. Login as vendor
2. Navigate to client workspace
3. Send message to client
4. Login as client
5. View message in client portal
6. Reply to vendor

### Test Deliverables

1. Login as vendor
2. Navigate to client workspace
3. Upload deliverable
4. Mark as "Delivered"
5. Login as client
6. View and approve deliverable

---

## Verification Checklist

After setup, verify these work:

- [ ] Vendor registration and login
- [ ] Vendor dashboard displays
- [ ] Create offer page
- [ ] Publish offer page
- [ ] Public page renders correctly
- [ ] Stripe checkout works
- [ ] Order created in database
- [ ] Workspace created automatically
- [ ] Client can access portal
- [ ] Client can view purchase summary
- [ ] Messaging works
- [ ] Deliverables display

---

## Troubleshooting

### Migrations Failed

**Problem:** Migration shows error in SQL Editor

**Solution:**
1. Check if table already exists
2. If so, drop table: `DROP TABLE table_name CASCADE;`
3. Re-run migration
4. Check Supabase logs for details

### Vendor Registration Fails

**Problem:** "Handle already exists" error

**Solution:**
- Choose a different, unique handle
- Handles must be URL-friendly (lowercase, no spaces)

### Checkout Redirect Fails

**Problem:** After Stripe payment, no redirect

**Solution:**
1. Check Stripe webhook is configured
2. Verify webhook secret in `.env.local`
3. Check webhook endpoint: `/api/webhooks/stripe`
4. Test in Stripe Dashboard > Webhooks

### Client Portal Not Accessible

**Problem:** 404 error on `/client-portal/{workspace-id}`

**Solution:**
1. Verify workspace was created (check database)
2. Check workspace ID in URL is correct
3. Ensure client is logged in
4. Check RLS policies are enabled

### Stats Not Showing

**Problem:** Dashboard shows 0 for all stats

**Solution:**
- This is normal for new installations
- Stats populate as you create pages, get clients, etc.
- Analytics implementation is pending (Phase 1)

---

## Next Steps

Once you've completed the quick start:

1. **Customize Branding:**
   - Update vendor profile
   - Add logo and brand colors
   - Customize page templates

2. **Configure Stripe:**
   - Connect Stripe account
   - Enable Stripe Connect for payouts
   - Configure webhook endpoints

3. **Set Up Email:**
   - Configure Resend API key
   - Customize email templates
   - Test order confirmation emails

4. **Enable Analytics:**
   - Implement event tracking
   - Set up conversion funnels
   - Configure UTM tracking

5. **Deploy to Production:**
   - Set up production Supabase database
   - Apply migrations to production
   - Configure production environment variables
   - Deploy to Vercel

---

## Resources

- **Migration Guide:** `MIGRATION_GUIDE.md`
- **Session Summary:** `SESSION_SUMMARY_JAN_17_2026.md`
- **Vendor Platform Status:** `VENDOR_PLATFORM_STATUS.md`
- **Product Requirements:** `docs/PRD_VENDOR_OFFER_PLATFORM.md`
- **Feature List:** `feature_list.json`

---

## Support

If you run into issues:

1. Check the documentation files listed above
2. Review the troubleshooting section
3. Check Supabase logs for database errors
4. Check browser console for client-side errors
5. Check server logs for API errors

---

**Happy Building!** 🚀

Your vendor offer platform is ready to help you sell services, manage clients, and grow your business.

---

*Last Updated: January 17, 2026*
