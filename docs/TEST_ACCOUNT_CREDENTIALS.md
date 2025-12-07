# Test Account Credentials

## Quick Reference

### Standard Test Accounts

You can create test accounts using the script:

```bash
npx tsx scripts/create-test-user.ts <email> <password> [role] [fullName]
```

### Example Test Accounts

**Client User:**
- **Email:** `client@test.com`
- **Password:** `Test123!`
- **Role:** `client`
- **Access:** Portal dashboard only

**Staff User:**
- **Email:** `staff@test.com`
- **Password:** `Test123!`
- **Role:** `staff`
- **Access:** App dashboard

**Admin User:**
- **Email:** `admin@test.com`
- **Password:** `Test123!`
- **Role:** `admin`
- **Access:** Full app access

**Owner User:**
- **Email:** `owner@test.com`
- **Password:** `Test123!`
- **Role:** `owner`
- **Access:** Full system access

## Your Personal Test Account

Based on previous setup:
- **Email:** `isaiahdupree33@gmail.com`
- **Password:** `Frogger12`
- **Role:** (Check in Supabase Dashboard)

## Creating a New Test Account

To create a test account, run:

```bash
# Client user
npx tsx scripts/create-test-user.ts client@test.com Test123! client "Test Client"

# Staff user
npx tsx scripts/create-test-user.ts staff@test.com Test123! staff "Test Staff"

# Admin user
npx tsx scripts/create-test-user.ts admin@test.com Test123! admin "Test Admin"
```

## Login URL

- **Local:** `http://localhost:3000/portal/login`
- **Production:** `https://www.blogcanvas.io/portal/login`

## Notes

- Test users are auto-confirmed (no email verification needed)
- Passwords must meet Supabase requirements (min 6 characters)
- Users are created in Supabase Auth and profiles table
- Check Supabase Dashboard > Authentication > Users to see all test accounts

---

**Last Updated:** December 2024

