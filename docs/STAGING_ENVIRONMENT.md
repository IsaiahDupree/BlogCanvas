# Staging Environment Setup

**VENDOR-WC-105**: Staging environment matching production

This document describes the staging environment setup for BlogCanvas, which provides a production-like environment for testing before deployment.

## Overview

The staging environment mirrors production configuration with:
- Separate Supabase project
- Test mode Stripe account
- Isolated database
- Preview URL deployments
- Feature flag testing

## Environment Structure

```
Production:  https://blogcanvas.com
Staging:     https://staging.blogcanvas.com
PR Previews: https://blogcanvas-pr-{number}.vercel.app
```

## Setup Instructions

### 1. Create Staging Supabase Project

```bash
# Create a new Supabase project called "BlogCanvas Staging"
# Copy the staging URL and keys to .env.staging.local
```

### 2. Initialize Staging Database

```bash
# Apply all migrations to staging
npm run migrations:apply -- --env=staging

# Seed test data
npm run test:seed -- --env=staging
```

### 3. Configure Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Link to Vercel project
vercel link

# Set staging environment variables
vercel env add STAGING < .env.staging.local

# Deploy to staging
vercel --target staging
```

### 4. Set Up Staging Domain

In Vercel dashboard:
1. Go to Project Settings > Domains
2. Add custom domain: `staging.blogcanvas.com`
3. Configure DNS:
   - Type: CNAME
   - Name: staging
   - Value: cname.vercel-dns.com

### 5. Configure Third-Party Services

#### Stripe Test Mode
```bash
# Use test mode keys (pk_test_*, sk_test_*)
# Set webhook endpoint: https://staging.blogcanvas.com/api/webhooks/stripe
```

#### Resend Email
```bash
# Create staging sender: staging@blogcanvas.com
# Update RESEND_FROM_EMAIL in staging env
```

#### Google APIs
```bash
# Add staging OAuth redirect:
# https://staging.blogcanvas.com/api/auth/google/callback
```

## Deployment Workflow

### Automatic Deployments

```yaml
# .github/workflows/staging.yml
name: Deploy to Staging
on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel (Staging)
        run: vercel deploy --target staging
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

### Preview Deployments

Every PR automatically creates a preview deployment:
```
PR #123 → https://blogcanvas-pr-123.vercel.app
```

## Environment Variables

Copy `.env.staging` to `.env.staging.local` and fill in values:

```bash
cp .env.staging .env.staging.local
```

Required variables:
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] STRIPE_SECRET_KEY (test mode)
- [ ] RESEND_API_KEY
- [ ] OPENAI_API_KEY

## Testing on Staging

### Run E2E Tests Against Staging

```bash
PLAYWRIGHT_TEST_BASE_URL=https://staging.blogcanvas.com npm run test:e2e
```

### Run Load Tests Against Staging

```bash
BASE_URL=https://staging.blogcanvas.com k6 run __tests__/performance/k6-load-test.js
```

### Manual Testing Checklist

- [ ] User signup/login works
- [ ] Client creation and management
- [ ] Blog post creation and approval
- [ ] Stripe payment flow (test mode)
- [ ] Email notifications sent
- [ ] AI pipeline executes
- [ ] Analytics dashboard loads
- [ ] File uploads work
- [ ] Webhooks received

## Monitoring Staging

### Sentry Error Tracking

```javascript
// Automatically tagged with environment: staging
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'staging',
});
```

### Vercel Analytics

View in Vercel dashboard:
- Deployment frequency
- Build times
- Function execution times
- Edge function usage

### Supabase Monitoring

Check staging project:
- Database performance
- API request volume
- Storage usage
- Auth activity

## Database Management

### Backup Staging Database

```bash
# Manual backup
npm run db:backup -- --env=staging

# Automated daily backups configured in Supabase
```

### Restore from Production (for testing)

```bash
# ⚠️ WARNING: This will overwrite staging data
npm run db:restore -- --from=production --to=staging

# Anonymize PII after restore
npm run db:anonymize -- --env=staging
```

### Reset Staging Data

```bash
# Drop and recreate staging database
npm run db:reset -- --env=staging

# Reseed with test data
npm run test:seed -- --env=staging
```

## Staging-Specific Features

### Debug Mode

Staging has additional debugging enabled:

```typescript
// Automatic in staging
if (process.env.NODE_ENV === 'staging') {
  console.log('[STAGING] Detailed logs enabled');
  enableDebugMode();
}
```

### Feature Flags

Test new features on staging before production:

```typescript
// Enable beta features in staging
const FEATURE_FLAGS = {
  newDashboard: process.env.NODE_ENV === 'staging',
  aiEnhancements: process.env.ENABLE_BETA_FEATURES === 'true',
};
```

### Rate Limiting

More permissive rate limits for testing:

```typescript
// Production: 100 req/min
// Staging:    500 req/min
const rateLimit = process.env.NODE_ENV === 'staging' ? 500 : 100;
```

## Differences from Production

| Feature | Production | Staging |
|---------|-----------|---------|
| Domain | blogcanvas.com | staging.blogcanvas.com |
| Database | Prod Supabase | Staging Supabase |
| Stripe | Live mode | Test mode |
| Email | Production sender | staging@domain |
| Rate limits | Strict | Permissive |
| Debug logs | Off | On |
| Sentry sampling | 10% | 100% |
| Cache TTL | 1 hour | 5 minutes |

## Troubleshooting

### Staging build fails

```bash
# Check build logs
vercel logs --target staging

# Test build locally
NODE_ENV=staging npm run build
```

### Environment variable issues

```bash
# List staging env vars
vercel env ls --target staging

# Pull staging env to local
vercel env pull .env.staging.local --environment staging
```

### Database connection errors

```bash
# Test Supabase connection
npm run test:supabase -- --env=staging

# Check connection pool
# Ensure max_connections is sufficient
```

### Stripe webhook failures

```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:4848/api/webhooks/stripe

# Verify webhook signature secret matches
```

## Maintenance

### Weekly Tasks

- [ ] Review Sentry errors
- [ ] Check database performance
- [ ] Verify automated backups
- [ ] Test payment flows
- [ ] Review function logs

### Monthly Tasks

- [ ] Sync with production schema
- [ ] Update test data
- [ ] Review and clean old deployments
- [ ] Audit environment variables
- [ ] Test disaster recovery

## CI/CD Integration

Staging is automatically deployed on every merge to `develop` branch.

See [CI/CD Documentation](./CI_CD.md) for details.

## Security Considerations

### Staging Data

- Use anonymized data from production
- Never use real customer PII
- Test credit cards only (Stripe test mode)
- Separate API keys for all services

### Access Control

- Restrict staging to internal team
- Use BasicAuth if needed
- Monitor access logs
- Rotate secrets regularly

## Success Criteria (VENDOR-WC-105)

- ✅ Staging database isolated from production
- ✅ Staging environment variables configured
- ✅ Preview URLs generated for each PR
- ✅ Automated deployments working
- ✅ E2E tests can run against staging
- ✅ Monitoring and error tracking active

## Next Steps

1. Set up production environment
2. Configure blue-green deployments
3. Add smoke tests post-deployment
4. Set up staging-to-production promotion workflow
