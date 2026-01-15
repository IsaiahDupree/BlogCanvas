# Environment Configuration Guide

## Quick Start Checklist

### Required Variables ✅

These are **required** for basic functionality:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- [ ] `OPENAI_API_KEY` - OpenAI API key for AI features
- [ ] `NEXT_PUBLIC_APP_URL` - Your application URL (e.g., http://localhost:4848)
- [ ] `PORT` - Port to run the app on (default: 4848)

### Optional Features 🔧

Enable these based on the features you need:

#### Payments (Stripe)
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key
- [ ] `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

#### Email (Resend)
- [ ] `RESEND_API_KEY` - Resend API key for transactional emails
- [ ] `RESEND_DOMAIN` - Your verified domain (default: blogcanvas.io)

#### Gmail Integration
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- [ ] `GOOGLE_REDIRECT_URI` - OAuth redirect URI (default: http://localhost:4848/api/gmail/callback)

#### Google Search Console
- [ ] `GOOGLE_SEARCH_CONSOLE_CLIENT_ID` - GSC OAuth client ID
- [ ] `GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET` - GSC OAuth client secret
- [ ] `GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN` - GSC OAuth refresh token

#### Security
- [ ] `TOTP_ENCRYPTION_KEY` - Encryption key for 2FA (64-char hex)
- [ ] `NEXT_PUBLIC_ALLOW_REGISTRATION` - Enable/disable public registration (true/false)

#### Testing
- [ ] `TEST_USER_EMAIL` - Test user email for E2E tests
- [ ] `TEST_USER_PASSWORD` - Test user password for E2E tests

---

## Setup Instructions

### 1. Copy Environment Template

```bash
cp .env.example .env.local
```

### 2. Configure Required Variables

#### Supabase Setup

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project or select existing
3. Go to Settings > API
4. Copy the following:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep this secret!**

#### OpenAI Setup

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Navigate to API Keys
3. Create a new secret key
4. Copy to `OPENAI_API_KEY`

#### App URL

Set `NEXT_PUBLIC_APP_URL` to:
- **Development**: `http://localhost:4848`
- **Production**: Your production domain (e.g., `https://yourdomain.com`)

### 3. Configure Optional Features

#### Stripe (Payments)

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Get your API keys from Developers > API keys
3. For webhooks:
   - Go to Developers > Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Copy the signing secret

#### Resend (Email)

1. Go to [https://resend.com](https://resend.com)
2. Create API key
3. Add and verify your domain
4. Copy API key to `RESEND_API_KEY`
5. Set `RESEND_DOMAIN` to your verified domain

#### Gmail Integration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:4848/api/gmail/callback`
5. Copy Client ID and Client Secret

#### Two-Factor Authentication

Generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to `TOTP_ENCRYPTION_KEY`

### 4. Verify Configuration

Run the database test suite:

```bash
npx tsx scripts/test-database.ts
```

Expected output: All tests pass ✅

---

## Security Best Practices

### ⚠️ Never Commit Secrets

Your `.env.local` file is in `.gitignore`. **Never commit it!**

### 🔒 Production Secrets

For production:
1. Use environment variables in your hosting platform (Vercel, Railway, etc.)
2. Never use test/development keys in production
3. Rotate keys regularly
4. Use webhook signing secrets where available

### 🔑 Service Role Key

`SUPABASE_SERVICE_ROLE_KEY` bypasses Row-Level Security (RLS):
- ⚠️ **NEVER** expose this in client-side code
- ✅ Only use in API routes and server-side code
- 🔒 Keep it secret in production

---

## Environment Validation

The app validates required environment variables on startup. If any are missing, you'll see clear error messages in the console.

### Common Issues

**"Missing NEXT_PUBLIC_SUPABASE_URL"**
- Add `NEXT_PUBLIC_SUPABASE_URL` to `.env.local`

**"Missing OPENAI_API_KEY"**
- Add `OPENAI_API_KEY` to `.env.local`
- Or disable AI features in the code

**OAuth redirect mismatch**
- Ensure `GOOGLE_REDIRECT_URI` matches your OAuth app configuration
- For local development: `http://localhost:4848/api/gmail/callback`
- For production: `https://yourdomain.com/api/gmail/callback`

---

## Development vs Production

### Development (.env.local)

```bash
NEXT_PUBLIC_APP_URL=http://localhost:4848
NEXT_PUBLIC_ALLOW_REGISTRATION=true
PORT=4848
```

### Production (Platform Environment Variables)

```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_ALLOW_REGISTRATION=false
# Port typically set by platform (Vercel, Railway, etc.)
```

---

## Testing Environment

For automated tests (E2E, integration), create `.env.test`:

```bash
# Copy from .env.local
# Override test-specific values
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test_password_123
```

---

## Troubleshooting

### Can't connect to Supabase

1. Check your project URL is correct
2. Verify API keys are not expired
3. Check if Supabase project is paused (free tier)

### OpenAI API errors

1. Verify API key is valid
2. Check you have credits/billing set up
3. Ensure you're using a supported model (gpt-4o-mini, gpt-4o)

### OAuth not working

1. Verify redirect URIs match exactly
2. Check OAuth app is enabled
3. Ensure client ID and secret are correct

---

## Next Steps

After setting up environment variables:

1. Run database migrations: `npx tsx scripts/apply-migrations.ts`
2. Test database: `npx tsx scripts/test-database.ts`
3. Start development server: `npm run dev`
4. Visit: `http://localhost:4848`

For more help, see:
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
