# Migration Applied: auth_cms

**Date:** December 2024  
**Migration:** `20241205_auth_cms.sql`  
**Status:** ✅ Successfully Applied

## What Was Applied

### 1. Profiles Table
- ✅ Created/updated `profiles` table with role-based access
- ✅ Roles: `client`, `staff`, `admin`, `owner`
- ✅ Fields: `id`, `role`, `full_name`, `company`, `avatar_url`, `created_at`, `updated_at`
- ✅ Added `email` and `client_id` columns for compatibility

### 2. RLS Policies
- ✅ Users can view/update their own profile
- ✅ Staff can view all profiles
- ✅ RLS enabled on profiles table

### 3. Auto-Profile Creation
- ✅ Function `handle_new_user()` created
- ✅ Trigger `on_auth_user_created` set up
- ✅ Automatically creates profile when user signs up
- ✅ Security: Fixed search_path issue

### 4. CMS Connections Table
- ✅ Enhanced `cms_connections` table
- ✅ Added fields: `connection_status`, `last_tested_at`, `test_result`, `created_by`
- ✅ Updated RLS policies for staff and clients

### 5. Blog Posts Updates
- ✅ Added `final_html` column
- ✅ Added `seo_metadata` JSONB column
- ✅ Added `cms_publish_info` JSONB column
- ✅ Added `seo_notes` text column
- ✅ Added `client_id` foreign key
- ✅ Added indexes for performance

### 6. Content Batches Updates
- ✅ Added `posts_published` counter column

## Security Fixes

- ✅ Fixed `handle_new_user()` function security warning
- ✅ Set `search_path = public` for security
- ✅ All RLS policies properly configured

## Migration Status

**Applied via Supabase MCP:**
- Migration version: `20251206190103`
- Name: `auth_cms`
- Status: ✅ Success

## Next Steps

1. **Regenerate TypeScript Types**
   - Types have been automatically regenerated
   - Update imports if needed

2. **Test Authentication**
   - Create a test user in Supabase Auth
   - Verify profile is auto-created
   - Test login flow

3. **Verify Profiles**
   - Check that existing users have profiles
   - Update any missing profile data

## Notes

- The migration uses `IF NOT EXISTS` so it's safe to run multiple times
- Existing data is preserved
- New columns have been added without breaking existing functionality

