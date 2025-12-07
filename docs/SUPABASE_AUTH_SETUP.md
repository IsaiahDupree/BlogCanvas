# Supabase Authentication Setup Guide

This guide covers configuring Supabase authentication, callback URLs, and SMTP settings for all auth flows.

## 📋 Table of Contents

1. [Callback URLs Configuration](#callback-urls-configuration)
2. [SMTP Setup](#smtp-setup)
3. [Auth Settings](#auth-settings)
4. [Testing Auth Flows](#testing-auth-flows)

---

## 🔗 Callback URLs Configuration

### Required Callback URLs

Configure these in your Supabase Dashboard under **Authentication > URL Configuration**:

#### Production URLs
```
https://yourdomain.com/auth/callback
https://yourdomain.com/auth/reset-password
```

#### Development URLs
```
http://localhost:3000/auth/callback
http://localhost:3002/auth/callback
http://localhost:3005/auth/callback
```

### Site URL

Set your **Site URL** in Supabase Dashboard:
- **Production:** `https://yourdomain.com`
- **Development:** `http://localhost:3000`

### Redirect URLs

Add these to **Redirect URLs** (allowlist):

```
https://yourdomain.com/auth/callback
https://yourdomain.com/auth/callback?type=email_change
https://yourdomain.com/auth/callback?type=invite
https://yourdomain.com/auth/reset-password
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?type=email_change
http://localhost:3000/auth/callback?type=invite
http://localhost:3000/auth/reset-password
```

---

## 📧 SMTP Setup

### Why SMTP is Required

SMTP enables Supabase to send:
- ✅ Email confirmation links
- ✅ Magic link sign-in
- ✅ Password reset emails
- ✅ Email change verification
- ✅ User invitation emails

### Setup Steps

1. **Go to Supabase Dashboard**
   - Navigate to **Project Settings > Auth > SMTP Settings**

2. **Choose SMTP Provider**

   **Option A: Use Supabase Default (Limited)**
   - Free tier: 3 emails/hour
   - Good for development only
   - Not recommended for production

   **Option B: Custom SMTP (Recommended)**
   
   **Gmail SMTP:**
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: [App Password - see below]
   Sender email: your-email@gmail.com
   Sender name: Your App Name
   ```

   **SendGrid:**
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [Your SendGrid API Key]
   Sender email: noreply@yourdomain.com
   Sender name: Your App Name
   ```

   **AWS SES:**
   ```
   Host: email-smtp.us-east-1.amazonaws.com
   Port: 587
   Username: [Your AWS Access Key]
   Password: [Your AWS Secret Key]
   Sender email: noreply@yourdomain.com
   Sender name: Your App Name
   ```

3. **Gmail App Password Setup**

   If using Gmail:
   1. Enable 2FA on your Google account
   2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   3. Generate a new app password
   4. Use this password (not your regular password) in SMTP config

4. **Test SMTP Connection**

   - Click "Test Email" in Supabase Dashboard
   - Check your email inbox
   - Verify email arrives correctly

---

## ⚙️ Auth Settings

### Email Confirmation

**Location:** Authentication > Settings > Email Auth

**Recommended Settings:**
- ✅ **Enable email confirmations** (Production)
- ⚠️ **Disable for development** (for faster testing)

**Behavior:**
- When enabled: Users must click confirmation link before they can sign in
- When disabled: Users can sign in immediately after signup

### Magic Link

**Location:** Authentication > Settings > Email Auth

**Settings:**
- ✅ **Enable magic link** (Recommended)
- Set redirect URL: `${NEXT_PUBLIC_APP_URL}/auth/callback`

### Password Reset

**Location:** Authentication > Settings > Email Auth

**Settings:**
- ✅ **Enable password reset** (Default: Enabled)
- Reset URL: `${NEXT_PUBLIC_APP_URL}/auth/reset-password`

### Email Change

**Location:** Authentication > Settings > Email Auth

**Settings:**
- ✅ **Require email confirmation** (Recommended)
- Redirect URL: `${NEXT_PUBLIC_APP_URL}/auth/callback?type=email_change`

### User Invitations

**Location:** Authentication > Settings > Email Auth

**Settings:**
- ✅ **Enable user invitations** (Default: Enabled)
- Invite URL: `${NEXT_PUBLIC_APP_URL}/auth/callback?type=invite`

---

## 🧪 Testing Auth Flows

### 1. Sign Up Flow

**Test Steps:**
1. Call `POST /api/auth/signup` with email and password
2. Check email for confirmation link
3. Click link → redirects to `/auth/callback`
4. Verify user is created and profile exists
5. Verify redirect to appropriate dashboard

**Expected Behavior:**
- If email confirmation enabled: User must confirm before login
- If disabled: User can login immediately

### 2. Magic Link Login

**Test Steps:**
1. Call `POST /api/auth/magic-link` with email
2. Check email for magic link
3. Click link → redirects to `/auth/callback`
4. Verify user is signed in
5. Verify redirect to dashboard

### 3. Password Reset

**Test Steps:**
1. Call `POST /api/auth/reset-password` with email
2. Check email for reset link
3. Click link → redirects to `/auth/reset-password?token=...`
4. Call `PUT /api/auth/reset-password` with new password
5. Verify password is updated
6. Test login with new password

### 4. Email Change

**Test Steps:**
1. Sign in as user
2. Call `POST /api/auth/change-email` with new email
3. Check new email for verification link
4. Click link → redirects to `/auth/callback?type=email_change`
5. Verify email is updated

### 5. User Invitation

**Test Steps:**
1. Sign in as staff/owner
2. Call `POST /api/auth/invite` with email and role
3. Check email for invitation link
4. Click link → redirects to `/auth/callback?type=invite`
5. Set password
6. Verify user is created with correct role

### 6. Re-authentication

**Test Steps:**
1. Sign in as user
2. Call `POST /api/auth/reauth` with password
3. Verify password is correct → success
4. Call with wrong password → error

---

## 🔐 Environment Variables

Ensure these are set in your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL (for callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://yourdomain.com  # Production
```

---

## 📝 Callback Route Details

### `/auth/callback` Route

**File:** `src/app/auth/callback/route.ts`

**Handles:**
- Email confirmation
- Magic link sign-in
- Password reset completion
- Email change verification
- Invite acceptance

**Query Parameters:**
- `code` - Auth code from Supabase
- `next` - Redirect URL after auth (optional)
- `error` - Error code (if auth failed)
- `error_description` - Error message

**Flow:**
1. Receives callback from Supabase
2. Exchanges code for session
3. Gets user profile
4. Redirects based on role:
   - `client` → `/portal/dashboard`
   - `staff/admin/owner` → `/app`

---

## 🚨 Common Issues

### Issue: "Redirect URL not allowed"

**Solution:**
1. Add URL to Supabase Dashboard > Auth > URL Configuration > Redirect URLs
2. Ensure URL matches exactly (including protocol, port, path)

### Issue: "Email not sending"

**Solution:**
1. Check SMTP settings in Supabase Dashboard
2. Verify SMTP credentials are correct
3. Check email provider limits (Gmail: 500/day)
4. Check spam folder

### Issue: "User not found after signup"

**Solution:**
1. Check if email confirmation is required
2. Verify user clicked confirmation link
3. Check Supabase Auth logs

### Issue: "Profile not created"

**Solution:**
1. Verify `handle_new_user()` trigger exists
2. Check trigger is enabled
3. Check RLS policies allow insert

---

## 📚 API Reference

### Auth Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create new user account |
| `/api/auth/login` | POST | Sign in with email/password |
| `/api/auth/magic-link` | POST | Send magic link |
| `/api/auth/logout` | POST | Sign out |
| `/api/auth/reset-password` | POST | Request password reset |
| `/api/auth/reset-password` | PUT | Update password |
| `/api/auth/change-email` | POST | Request email change |
| `/api/auth/invite` | POST | Invite new user (staff only) |
| `/api/auth/reauth` | POST | Re-authenticate user |
| `/api/auth/me` | GET | Get current user |

---

## ✅ Checklist

Before going to production:

- [ ] SMTP configured with production provider
- [ ] All callback URLs added to Supabase
- [ ] Site URL set correctly
- [ ] Email confirmation enabled (production)
- [ ] Test all auth flows
- [ ] Verify emails are being sent
- [ ] Check spam folder for test emails
- [ ] Verify redirects work correctly
- [ ] Test role-based redirects
- [ ] Verify profile auto-creation works

---

**Last Updated:** December 2024

