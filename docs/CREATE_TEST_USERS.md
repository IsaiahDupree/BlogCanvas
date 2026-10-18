# Creating Test Users

This guide shows how to create test users for development and testing.

## 🚀 Quick Start

### Using the Script (Recommended)

```bash
npx tsx scripts/create-test-user.ts <email> <password> [role] [fullName]
```

**Examples:**

```bash
# Create a client user
npx tsx scripts/create-test-user.ts client@test.com Test123! client "Test Client"

# Create a staff user
npx tsx scripts/create-test-user.ts staff@test.com Test123! staff "Test Staff"

# Create an admin user
npx tsx scripts/create-test-user.ts admin@test.com Test123! admin "Test Admin"

# Create an owner user
npx tsx scripts/create-test-user.ts owner@test.com Test123! owner "Test Owner"
```

## 📋 What the Script Does

1. ✅ Checks if user already exists
2. ✅ Creates user in Supabase Auth
3. ✅ Auto-confirms email (for testing)
4. ✅ Creates profile with role
5. ✅ Displays login credentials

## 🔐 User Roles

| Role | Description | Access |
|------|-------------|--------|
| `client` | Client user | Portal dashboard only |
| `staff` | Staff member | App dashboard |
| `admin` | Administrator | Full app access |
| `owner` | Owner | Full system access |

## 🧪 Test User Examples

### Client User
```bash
npx tsx scripts/create-test-user.ts \
  client@example.com \
  Client123! \
  client \
  "Test Client"
```

### Staff User
```bash
npx tsx scripts/create-test-user.ts \
  staff@example.com \
  Staff123! \
  staff \
  "Test Staff"
```

### Admin User
```bash
npx tsx scripts/create-test-user.ts \
  admin@example.com \
  Admin123! \
  admin \
  "Test Admin"
```

## 🔄 Updating Existing Users

If a user already exists, the script will:
- ✅ Update their profile role
- ✅ Update their full name
- ✅ Display current user details

## 🗑️ Deleting Test Users

To delete a test user, use the Supabase Dashboard:

1. Go to **Authentication > Users**
2. Find the user by email
3. Click **Delete User**

Or use SQL (requires admin access):

```sql
-- Delete user (cascades to profile)
DELETE FROM auth.users WHERE email = 'test@example.com';
```

## 📝 Environment Variables Required

Make sure these are set in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## ✅ Verification

After creating a user, verify it was created:

1. **Check Supabase Dashboard:**
   - Go to Authentication > Users
   - Find user by email

2. **Check Profile:**
   ```sql
   SELECT * FROM profiles WHERE email = 'test@example.com';
   ```

3. **Test Login:**
   - Go to `http://localhost:3000/portal/login`
   - Use the credentials provided by the script

## 🎯 Common Use Cases

### Create Multiple Test Users

```bash
# Create client
npx tsx scripts/create-test-user.ts client@test.com Test123! client "Client User"

# Create staff
npx tsx scripts/create-test-user.ts staff@test.com Test123! staff "Staff User"

# Create admin
npx tsx scripts/create-test-user.ts admin@test.com Test123! admin "Admin User"
```

### Reset User Password

If you need to reset a password:

1. Use Supabase Dashboard: Authentication > Users > Reset Password
2. Or delete and recreate the user with the script

### Test Different Roles

Create users with different roles to test:
- Role-based access control
- Route protection
- Dashboard redirects
- API permissions

## 🚨 Security Notes

⚠️ **Important:**
- Test users are auto-confirmed (no email verification needed)
- Passwords are stored securely in Supabase
- Service role key is required (keep it secret!)
- Never commit `.env.local` to version control

## 📚 Related Documentation

- [Authentication Setup](./SUPABASE_AUTH_SETUP.md)
- [Auth Implementation](./AUTH_IMPLEMENTATION_COMPLETE.md)

---

**Last Updated:** December 2024

