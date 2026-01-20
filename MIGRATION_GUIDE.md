# BlogCanvas Vendor Platform - Database Migration Guide

**Last Updated:** January 17, 2026

## Quick Start

The BlogCanvas Vendor Offer Platform requires three database migrations to be applied to your Supabase database before the application will work correctly.

### Prerequisites

- Access to Supabase dashboard
- Project URL: `https://gqjgxltroyysjoxswbmn.supabase.co`
- SQL Editor access

## Migration Files

The migrations are located in `supabase/migrations/`:

1. `20260117000001_vendor_platform_base.sql` - Core vendor, pages, offers, clients, orders
2. `20260117000002_vendor_portal_features.sql` - Portal features (messaging, deliverables, meetings)
3. `20260117000003_vendor_analytics.sql` - Analytics and event tracking

## Application Method 1: Supabase SQL Editor (Recommended)

### Step 1: Open Supabase SQL Editor

Visit: https://supabase.com/dashboard/project/gqjgxltroyysjoxswbmn/sql/new

### Step 2: Apply Migrations in Order

For each migration file:

1. Open the migration file in your text editor
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click "Run" to execute
5. Wait for completion (should show "Success")
6. Proceed to next migration

**Important:** Apply migrations in order (001, 002, 003)

### Step 3: Verify Migration Success

Run this command to verify:

```bash
node run-vendor-migrations.mjs
```

You should see all tables marked with ✅

## Application Method 2: Supabase CLI (Alternative)

If you have Supabase CLI set up:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref gqjgxltroyysjoxswbmn

# Push migrations
supabase db push
```

## What Gets Created

### Migration 1: Base Tables (20260117000001)

**Tables:**
- `vendors` - Vendor profiles with handles
- `vendor_members` - Team members (for multi-user support)
- `offer_pages` - Landing pages with JSON block storage
- `offers` - Pricing configuration
- `offer_addons` - Setup fees, rush delivery, extras
- `vendor_clients` - Client records
- `vendor_workspaces` - Client-vendor relationship container
- `vendor_orders` - Purchase records
- `vendor_order_items` - Order line items
- `vendor_subscriptions` - Recurring subscriptions

**Features:**
- Row Level Security (RLS) policies for all tables
- Unique vendor handle constraints
- Order number generation function
- Auto-update timestamps
- Foreign key relationships

### Migration 2: Portal Features (20260117000002)

**Tables:**
- `onboarding_steps` - Client onboarding checklists
- `vendor_forms` - Intake forms
- `vendor_form_submissions` - Form responses
- `vendor_messages` - Vendor-client messaging
- `vendor_deliverables` - Files and links
- `vendor_revisions` - Revision requests
- `vendor_meeting_types` - Meeting configurations
- `vendor_meetings` - Scheduled meetings
- `vendor_availability` - Vendor calendar availability
- `vendor_calendar_integrations` - Google Calendar OAuth tokens

**Features:**
- Complete RLS policies
- Real-time messaging support
- File upload support
- Meeting scheduling infrastructure

### Migration 3: Analytics (20260117000003)

**Tables:**
- `vendor_event_log` - All user events
- `vendor_attribution` - UTM and referrer tracking
- `vendor_daily_rollups` - Pre-aggregated daily stats
- `vendor_page_daily_rollups` - Page-level daily stats
- `vendor_client_engagement` - Weekly engagement metrics
- `vendor_funnel_stats` - Real-time funnel tracking

**Features:**
- Anonymous event tracking (for public pages)
- Attribution tracking (first-touch, last-touch)
- Engagement score calculation
- Conversion funnel analysis

## Verification

After applying migrations, verify with:

```bash
# Check table existence
node run-vendor-migrations.mjs

# Or check manually in Supabase
```

Expected tables (17 total):
- ✅ vendors
- ✅ vendor_members
- ✅ offer_pages
- ✅ offers
- ✅ offer_addons
- ✅ vendor_clients
- ✅ vendor_workspaces
- ✅ vendor_orders
- ✅ vendor_subscriptions
- ✅ onboarding_steps
- ✅ vendor_forms
- ✅ vendor_messages
- ✅ vendor_deliverables
- ✅ vendor_revisions
- ✅ vendor_meeting_types
- ✅ vendor_meetings
- ✅ vendor_event_log

## Troubleshooting

### Error: "table already exists"

The migrations use `CREATE TABLE IF NOT EXISTS`, so this should not occur. If you see this error, it means the table exists but may have a different schema. You may need to:

1. Export existing data
2. Drop the table: `DROP TABLE table_name CASCADE;`
3. Re-run the migration
4. Re-import data if needed

### Error: "permission denied"

Ensure you're using the **service role key** or applying migrations as the database owner via the SQL Editor.

### Error: "relation does not exist"

This means a dependent table hasn't been created yet. Ensure you're applying migrations in order (001 → 002 → 003).

### Some tables are missing after migration

1. Check for errors in the Supabase SQL Editor
2. Look at the migration file for syntax errors
3. Try applying that specific migration again
4. Check Supabase logs for detailed error messages

## Post-Migration Steps

### 1. Test Vendor Registration

```bash
# Start dev server
npm run dev

# Visit registration page
open http://localhost:4848/vendor/register
```

### 2. Create Test Vendor

Register a test vendor with:
- Business name: "Test Vendor"
- Handle: "testvendor" (must be unique)
- Email: Your test email

### 3. Test Offer Page Creation

1. Login as vendor
2. Go to `/vendor/pages/new`
3. Create a test offer page
4. Publish it
5. Visit `/@testvendor/page-slug` to view

### 4. Test Checkout Flow

1. Visit your published page
2. Click "Buy Now" or checkout CTA
3. Complete Stripe checkout (test mode)
4. Verify workspace creation
5. Access client portal at `/client-portal/{workspace-id}`

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- Migration Files: `supabase/migrations/`
- Verification Script: `run-vendor-migrations.mjs`
- Feature List: `feature_list.json`

## Security Notes

- All tables have RLS policies enabled
- Public offer pages use `is_published = true` filter
- Vendor data is isolated by `vendor_id`
- Client data is isolated by `workspace_id`
- Calendar tokens are stored encrypted
- File uploads use signed URLs

---

**Next Steps:** Once migrations are applied, proceed to testing the full vendor offer flow!
