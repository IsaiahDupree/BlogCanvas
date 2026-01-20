# How to Apply Vendor Platform Migrations

## Quick Steps

### 1. Check Current Status
```bash
node run-vendor-migrations.mjs
```

This will show which tables exist and which migrations need to be applied.

### 2. Open Supabase SQL Editor

Visit: https://supabase.com/dashboard/project/gqjgxltroyysjoxswbmn/sql/new

### 3. Apply Migrations in Order

Copy and paste each file's contents into the SQL editor and click "Run":

#### Migration 1: Base Tables
**File:** `supabase/migrations/20260117000001_vendor_platform_base.sql`

Creates:
- vendors, vendor_members
- offer_pages, offers, offer_addons
- vendor_clients, vendor_workspaces
- vendor_orders, vendor_order_items, vendor_subscriptions

#### Migration 2: Portal Features
**File:** `supabase/migrations/20260117000002_vendor_portal_features.sql`

Creates:
- onboarding_steps
- vendor_forms, vendor_form_submissions
- vendor_messages, vendor_deliverables, vendor_revisions
- vendor_meeting_types, vendor_meetings, vendor_availability
- vendor_calendar_integrations

#### Migration 3: Analytics
**File:** `supabase/migrations/20260117000003_vendor_analytics.sql`

Creates:
- vendor_events (for analytics tracking)
- Event aggregation functions

### 4. Verify Migration Success

Run the check script again:
```bash
node run-vendor-migrations.mjs
```

You should see all tables marked with ✅

### 5. Test the Application

```bash
# Start dev server
npm run dev

# Register a test vendor
open http://localhost:4848/vendor/register
```

---

## Troubleshooting

### If a migration fails:

1. Check the error message in Supabase SQL Editor
2. Look for conflicts with existing tables
3. You may need to drop conflicting tables first (⚠️ be careful!)

### If tables already exist:

Some tables like `vendors` may already exist. The migrations use `CREATE TABLE IF NOT EXISTS` so they should skip existing tables. However, if there are schema differences, you may need to:

1. Export any existing data
2. Drop the old table
3. Run the migration
4. Re-import data if needed

---

## Need Help?

- Supabase Docs: https://supabase.com/docs/guides/database/migrations
- Migration Files Location: `supabase/migrations/`
- Check Script: `run-vendor-migrations.mjs`

---

Created: January 17, 2026
