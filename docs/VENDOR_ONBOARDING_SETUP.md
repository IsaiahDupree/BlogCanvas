# Vendor Onboarding and Organization Setup Guide

**Feature:** feat-014
**Status:** Complete
**Version:** 1.0
**Date:** January 11, 2026

---

## Overview

The Vendor Onboarding system enables multi-vendor support in BlogCanvas. Each vendor organization (content agency) can have multiple team members and manage multiple clients independently.

### Key Features

✅ **Vendor Registration** - Self-service sign-up for new vendor organizations
✅ **Organization Profiles** - Customizable branding, contact info, and settings
✅ **Team Management** - Invite and manage team members with roles (Owner, Staff)
✅ **White-Label Branding** - Custom colors for client portal branding
✅ **Multi-Tenancy** - Secure data isolation between vendors with RLS

---

## Architecture

### Database Tables

| Table | Purpose |
|-------|---------|
| `vendors` | Vendor organization master record |
| `profiles` | User accounts (now linked to vendor_id) |
| `clients` | Client companies (now linked to vendor_id) |
| `vendor_team_invitations` | Team member invitation tracking |

### User Roles

| Role | Permissions |
|------|------------|
| **owner** | Full access - manage vendor settings, invite team, manage clients |
| **staff** | Can invite team members, manage clients, create content |
| **client** | View-only portal access to their content |

---

## Setup Instructions

### 1. Apply Database Migration

```bash
# Apply the vendor onboarding migration
npx supabase db push

# Or manually execute:
# supabase/migrations/20260111000005_vendor_onboarding.sql
```

### 2. Environment Variables

No additional environment variables required. Uses existing Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:4848  # For invitation links
```

### 3. Verify Migration

```sql
-- Check vendors table exists
SELECT * FROM vendors LIMIT 1;

-- Check vendor_id columns added
SELECT vendor_id FROM profiles LIMIT 1;
SELECT vendor_id FROM clients LIMIT 1;

-- Check team invitations table
SELECT * FROM vendor_team_invitations LIMIT 1;
```

---

## Usage Guide

### For New Vendors (Registration)

#### Option 1: Via API (Programmatic)

```typescript
// POST /api/vendors/register
const response = await fetch('/api/vendors/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vendorName: 'Acme Content Agency',
    slug: 'acme-agency', // URL-safe, unique identifier
    email: 'hello@acmeagency.com',
    password: 'securePassword123!',
    fullName: 'John Smith',
    companyType: 'agency', // agency|freelancer|inhouse|other
    teamSize: 'small', // solo|small|medium|large
  }),
})

const data = await response.json()
// Returns: { success: true, vendor: {...}, user: {...} }
```

#### Option 2: Via UI (Recommended)

**TODO:** Create registration page at `/auth/vendor-register`
For now, use the API directly or create a simple signup form.

### For Vendor Owners (Settings)

Navigate to: **`/app/vendor/settings`**

**Features:**
- Update organization name, email, phone, website
- Change company type and team size
- Customize brand colors (primary, secondary, accent)
- View team member and client counts

```typescript
// GET /api/vendors - Get current vendor
// PATCH /api/vendors - Update vendor settings
```

### For Team Management

Navigate to: **`/app/vendor/team`**

**Features:**
- View all team members with roles
- Invite new team members via email
- View pending, accepted, expired invitations
- Cancel pending invitations

```typescript
// GET /api/vendors/team - List team members
// GET /api/vendors/team/invite - List invitations
// POST /api/vendors/team/invite - Send invitation
// DELETE /api/vendors/team/invite/[id] - Cancel invitation
```

#### Invitation Flow

1. **Owner/Staff** sends invitation:
   ```typescript
   POST /api/vendors/team/invite
   {
     "email": "colleague@example.com",
     "role": "staff" // or "owner"
   }
   ```

2. **System** generates secure token and invitation record

3. **Invitee** receives email with link (TODO: integrate with transactional email system):
   ```
   http://localhost:4848/auth/accept-team-invite?token=abc123xyz
   ```

4. **Invitee** visits link, creates account:
   ```typescript
   POST /api/vendors/team/accept-invite
   {
     "token": "abc123xyz",
     "password": "securePassword123!",
     "fullName": "Jane Doe"
   }
   ```

5. **System** creates user account, links to vendor, marks invitation as accepted

---

## API Endpoints

### Vendor Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/vendors/register` | Register new vendor | Public |
| GET | `/api/vendors` | Get current vendor details | Authenticated |
| PATCH | `/api/vendors` | Update vendor settings | Owner only |

### Team Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/vendors/team` | List team members | Authenticated |
| GET | `/api/vendors/team/invite` | List invitations | Owner/Staff |
| POST | `/api/vendors/team/invite` | Send invitation | Owner/Staff |
| DELETE | `/api/vendors/team/invite/[id]` | Cancel invitation | Owner/Staff |
| GET | `/api/vendors/team/accept-invite?token=...` | Validate token | Public |
| POST | `/api/vendors/team/accept-invite` | Accept invitation | Public |

---

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

**Vendors Table:**
- Users can only view/update their own vendor organization
- Only owners can update vendor settings

**Vendor Team Invitations:**
- Users can only view invitations for their vendor
- Only owners/staff can create invitations

**Profiles/Clients:**
- Updated to filter by vendor_id
- Ensures data isolation between vendors

### Token Security

- Invitation tokens are 32-byte random values (base64 encoded, URL-safe)
- Tokens expire after 7 days (configurable in migration)
- Expired tokens are automatically detected and marked
- Tokens are single-use (status changes to 'accepted' after use)

### Authentication

- Uses Supabase Auth for user account creation
- Service role required for user creation (server-side only)
- Passwords hashed by Supabase Auth
- Email verification supported (optional)

---

## Data Migration

If you have existing data from before the vendor system:

### Option 1: Create Default Vendor

Uncomment and customize the seed data in the migration:

```sql
INSERT INTO vendors (name, slug, email, status, created_at)
VALUES ('BlogCanvas Agency', 'blogcanvas-agency', 'hello@blogcanvas.io', 'active', NOW())
ON CONFLICT DO NOTHING;

UPDATE profiles SET vendor_id = (SELECT id FROM vendors WHERE slug = 'blogcanvas-agency' LIMIT 1)
WHERE role IN ('owner', 'staff') AND vendor_id IS NULL;

UPDATE clients SET vendor_id = (SELECT id FROM vendors WHERE slug = 'blogcanvas-agency' LIMIT 1)
WHERE vendor_id IS NULL;
```

### Option 2: Manual Assignment

Use the Supabase dashboard or SQL to assign vendor_id to existing records.

---

## Monitoring

### Check Vendor Health

```sql
-- List all vendors with stats
SELECT
    v.id,
    v.name,
    v.slug,
    v.status,
    COUNT(DISTINCT p.id) as team_count,
    COUNT(DISTINCT c.id) as client_count
FROM vendors v
LEFT JOIN profiles p ON p.vendor_id = v.id
LEFT JOIN clients c ON c.vendor_id = v.id
GROUP BY v.id
ORDER BY v.created_at DESC;
```

### Monitor Invitations

```sql
-- Pending invitations by vendor
SELECT
    v.name as vendor_name,
    vti.email,
    vti.role,
    vti.status,
    vti.created_at,
    vti.expires_at
FROM vendor_team_invitations vti
JOIN vendors v ON v.id = vti.vendor_id
WHERE vti.status = 'pending'
ORDER BY vti.created_at DESC;
```

### Expire Old Invitations (Cron Job)

Run periodically to clean up expired invitations:

```sql
SELECT expire_vendor_invitations();
```

Or add to your cron jobs:

```bash
# Every hour
0 * * * * curl -X POST https://yourapp.com/api/cron/expire-invitations \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Troubleshooting

### Issue: "User is not associated with a vendor"

**Cause:** Profile doesn't have vendor_id set
**Solution:**
```sql
-- Check user's profile
SELECT id, email, role, vendor_id FROM profiles WHERE email = 'user@example.com';

-- Assign to vendor
UPDATE profiles SET vendor_id = 'vendor-uuid-here' WHERE id = 'user-uuid';
```

### Issue: "Vendor slug already exists"

**Cause:** Slug must be unique across all vendors
**Solution:** Choose a different slug (URL-safe identifier)

### Issue: "Invitation token invalid or expired"

**Cause:** Token has expired (>7 days old) or already used
**Solution:** Send a new invitation

### Issue: RLS blocks data access

**Cause:** User's vendor_id doesn't match resource's vendor_id
**Solution:** Verify data ownership and vendor_id alignment

---

## Future Enhancements

Ideas for extending the vendor system:

- [ ] **Vendor Registration UI** - Public-facing signup page at `/auth/vendor-register`
- [ ] **Team Invitation Emails** - Integrate with transactional email system (feat-013)
- [ ] **Logo Upload** - Supabase Storage integration for vendor logos
- [ ] **Vendor Dashboard** - Overview stats and recent activity
- [ ] **Team Roles Customization** - Granular permissions beyond owner/staff
- [ ] **Multi-vendor Analytics** - Compare performance across vendors (for platform admins)
- [ ] **Vendor Subscription Billing** - Integrate with Stripe (feat-012)
- [ ] **Client Transfer** - Move clients between vendors
- [ ] **Vendor Deactivation** - Suspend vendor account and archive data

---

## File Reference

### Migration
- `supabase/migrations/20260111000005_vendor_onboarding.sql`

### API Routes
- `src/app/api/vendors/register/route.ts` - Vendor registration
- `src/app/api/vendors/route.ts` - Get/update vendor
- `src/app/api/vendors/team/route.ts` - List team members
- `src/app/api/vendors/team/invite/route.ts` - Invitation CRUD
- `src/app/api/vendors/team/invite/[invitationId]/route.ts` - Cancel invitation
- `src/app/api/vendors/team/accept-invite/route.ts` - Accept invitation

### UI Pages
- `src/app/app/vendor/settings/page.tsx` - Vendor settings
- `src/app/app/vendor/team/page.tsx` - Team management

---

## Support

For questions or issues:
- Check the troubleshooting section above
- Review Supabase logs for RLS policy errors
- Inspect network requests for API error messages
- Verify database migration was applied successfully

---

**Last Updated:** January 11, 2026
**Feature Status:** ✅ Complete (pending database migration application)
