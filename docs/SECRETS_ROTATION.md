# Secrets Rotation Procedure

**VENDOR-WC-115**: Zero-downtime key rotation with audit trail

This document outlines the procedure for rotating secrets and API keys in BlogCanvas with zero downtime.

## Overview

BlogCanvas uses multiple external services requiring API keys and secrets:
- Supabase (Database + Auth)
- Stripe (Payments)
- OpenAI (AI features)
- Resend (Email)
- Google APIs (OAuth, Analytics, Search Console)
- Sentry (Error tracking)
- Third-party integrations

## Rotation Schedule

### Regular Rotation
| Secret Type | Rotation Frequency | Priority |
|-------------|-------------------|----------|
| JWT Secrets | Every 90 days | High |
| API Keys | Every 180 days | Medium |
| Database Passwords | Every 90 days | High |
| OAuth Secrets | Every 365 days | Low |
| Webhook Secrets | On compromise | High |

### Event-Driven Rotation
Rotate immediately if:
- ⚠️ Key exposed in code repository
- ⚠️ Employee with access leaves
- ⚠️ Security breach detected
- ⚠️ Suspicious activity in logs
- ⚠️ Third-party service breach

## General Rotation Process

### 1. Preparation Phase
```bash
# Create rotation checklist
# Identify all services using the secret
# Schedule maintenance window (if needed)
# Notify team
# Prepare rollback plan
```

### 2. Create New Secret
```bash
# Generate new secret with appropriate strength
openssl rand -base64 32  # For 32-byte secrets
openssl rand -hex 32     # For hex secrets
```

### 3. Deploy New Secret (Dual-Running)
```bash
# Both old and new secrets work simultaneously
# Allows gradual rollover
# No downtime
```

### 4. Update Consumers
```bash
# Update all clients to use new secret
# Monitor for errors
```

### 5. Deprecate Old Secret
```bash
# Remove old secret after verification
# Audit that old secret is no longer used
```

### 6. Verify & Audit
```bash
# Test all functionality
# Document rotation in audit log
# Update secret management system
```

## Service-Specific Procedures

### Supabase Database Password

**Frequency**: Every 90 days
**Downtime**: Zero

```bash
# 1. Create new database user with same permissions
CREATE USER blogcanvas_new WITH PASSWORD 'new_secure_password';
GRANT ALL PRIVILEGES ON DATABASE blogcanvas TO blogcanvas_new;
GRANT ALL ON ALL TABLES IN SCHEMA public TO blogcanvas_new;

# 2. Update DATABASE_URL in Vercel (staged rollout)
# Production environment variable
vercel env add DATABASE_URL production
# Enter new connection string with blogcanvas_new user

# 3. Trigger new deployment
vercel deploy --prod

# 4. Monitor for 24 hours
# Check error logs, database connection metrics

# 5. Remove old user after verification
DROP USER blogcanvas_old;

# 6. Document in audit log
echo "$(date) - Rotated database password - User: admin" >> security-audit.log
```

### Stripe API Keys

**Frequency**: Every 180 days
**Downtime**: Zero

```bash
# 1. Generate new Restricted API Key in Stripe Dashboard
# Navigate to: Developers → API keys → Create restricted key
# Copy permissions from existing key

# 2. Update Vercel environment variables
vercel env add STRIPE_SECRET_KEY production
# Enter new key (sk_live_...)

# 3. Deploy to production
vercel deploy --prod

# 4. Update webhook signature secret (if rotating webhook secret)
vercel env add STRIPE_WEBHOOK_SECRET production

# 5. Verify webhooks are working
curl -X POST http://localhost:4848/api/webhooks/stripe-test

# 6. Delete old API key from Stripe Dashboard
# After 48 hours of monitoring
```

### OpenAI API Key

**Frequency**: Every 180 days
**Downtime**: Zero

```bash
# 1. Create new API key in OpenAI Dashboard
# platform.openai.com/api-keys

# 2. Update environment variable
vercel env add OPENAI_API_KEY production

# 3. Deploy
vercel deploy --prod

# 4. Test AI features
npm run test:ai-pipeline

# 5. Delete old key from OpenAI Dashboard
# After verification
```

### JWT Secret (Session Tokens)

**Frequency**: Every 90 days
**Downtime**: Sessions invalidated (re-login required)

```bash
# 1. Generate new JWT secret
JWT_NEW=$(openssl rand -base64 64)

# 2. Update environment variable
vercel env add JWT_SECRET production <<< "$JWT_NEW"

# 3. Deploy during low-traffic period
vercel deploy --prod

# 4. Users will need to re-login
# Send notification email beforehand

# 5. Document in changelog
echo "$(date) - JWT secret rotated - All sessions invalidated" >> CHANGELOG.md
```

### JWT Secret (Zero-Downtime Alternative)

For zero downtime, support multiple JWT secrets:

```typescript
// src/lib/auth/jwt.ts
const JWT_SECRETS = [
  process.env.JWT_SECRET,          // Current
  process.env.JWT_SECRET_PREVIOUS, // Being rotated out
].filter(Boolean);

// Sign with current secret
export function signToken(payload: any) {
  return jwt.sign(payload, JWT_SECRETS[0]);
}

// Verify with any valid secret
export function verifyToken(token: string) {
  for (const secret of JWT_SECRETS) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      continue;
    }
  }
  throw new Error('Invalid token');
}
```

Rotation process:
```bash
# 1. Generate new secret
JWT_NEW=$(openssl rand -base64 64)

# 2. Add as primary, move old to previous
vercel env add JWT_SECRET production <<< "$JWT_NEW"
vercel env add JWT_SECRET_PREVIOUS production <<< "$JWT_OLD"

# 3. Deploy - both secrets work
vercel deploy --prod

# 4. Wait for all sessions to refresh (7 days)

# 5. Remove old secret
vercel env rm JWT_SECRET_PREVIOUS production
```

### Google OAuth Credentials

**Frequency**: Every 365 days
**Downtime**: Zero (if using dual credentials)

```bash
# 1. Create new OAuth 2.0 Client ID in Google Cloud Console
# console.cloud.google.com/apis/credentials

# 2. Configure redirect URIs
# https://blogcanvas.com/api/auth/google/callback
# https://staging.blogcanvas.com/api/auth/google/callback

# 3. Update environment variables (both old and new work)
vercel env add GOOGLE_CLIENT_ID_NEW production
vercel env add GOOGLE_CLIENT_SECRET_NEW production

# 4. Update code to try both credentials
# src/lib/auth/google.ts

# 5. Deploy and monitor
vercel deploy --prod

# 6. Remove old credentials after 30 days
vercel env rm GOOGLE_CLIENT_ID production
vercel env rm GOOGLE_CLIENT_SECRET production

# 7. Delete old OAuth client from Google Console
```

### Resend API Key

**Frequency**: Every 180 days
**Downtime**: Zero

```bash
# 1. Create new API key in Resend Dashboard
# resend.com/api-keys

# 2. Update environment variable
vercel env add RESEND_API_KEY production

# 3. Deploy
vercel deploy --prod

# 4. Send test email
npm run test:email

# 5. Delete old key from Resend Dashboard
```

### Webhook Secrets (Stripe, etc.)

**Frequency**: On compromise or annually
**Downtime**: Webhook failures until updated

```bash
# 1. Generate new webhook secret in service dashboard
# Stripe: Developers → Webhooks → Endpoint → Signing secret

# 2. Update environment variable
vercel env add STRIPE_WEBHOOK_SECRET production

# 3. Deploy immediately
vercel deploy --prod

# 4. Test webhook delivery
# Send test webhook from Stripe Dashboard

# 5. Monitor webhook logs for failures
grep "webhook" production.log
```

## Emergency Rotation

If a secret is compromised:

### Immediate Actions (< 1 hour)
```bash
# 1. Revoke compromised secret immediately
# Do this in the service dashboard FIRST

# 2. Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# 3. Update environment variable
vercel env add SECRET_NAME production <<< "$NEW_SECRET"

# 4. Emergency deployment
vercel deploy --prod --force

# 5. Notify security team
# Post to #security-incidents Slack channel

# 6. Begin incident response
# Document: when, how, what, who
```

### Post-Incident (< 24 hours)
```bash
# 1. Audit logs for unauthorized access
# 2. Assess damage
# 3. Rotate related secrets
# 4. Update security procedures
# 5. File incident report
```

## Automation Scripts

### Rotation Script Template
```bash
#!/bin/bash
# rotate-secret.sh

SECRET_NAME=$1
SERVICE=$2

if [ -z "$SECRET_NAME" ] || [ -z "$SERVICE" ]; then
  echo "Usage: ./rotate-secret.sh SECRET_NAME SERVICE"
  exit 1
fi

echo "Rotating $SECRET_NAME for $SERVICE..."

# Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# Update in Vercel
vercel env add "$SECRET_NAME" production <<< "$NEW_SECRET"

# Deploy
vercel deploy --prod

# Audit log
echo "$(date) - Rotated $SECRET_NAME for $SERVICE" >> security-audit.log

echo "✅ Rotation complete. Monitor logs for 24 hours."
```

Usage:
```bash
chmod +x rotate-secret.sh
./rotate-secret.sh JWT_SECRET "Session Tokens"
```

### Scheduled Rotation Reminder

Add to crontab:
```bash
# Check for secrets older than 80 days (warn before 90-day rotation)
0 9 * * 1 /path/to/scripts/check-secret-age.sh
```

`check-secret-age.sh`:
```bash
#!/bin/bash
# Alert if secrets are approaching rotation deadline

ROTATION_WARNING_DAYS=80

# Check last rotation date (stored in security-audit.log)
LAST_JWT_ROTATION=$(grep "JWT_SECRET" security-audit.log | tail -1 | awk '{print $1}')

# Calculate days since rotation
DAYS_AGO=$(( ($(date +%s) - $(date -d "$LAST_JWT_ROTATION" +%s)) / 86400 ))

if [ $DAYS_AGO -gt $ROTATION_WARNING_DAYS ]; then
  echo "⚠️ JWT_SECRET is $DAYS_AGO days old. Rotation due in $((90 - DAYS_AGO)) days."
  # Send notification
  curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
    -d "{\"text\": \"JWT_SECRET rotation needed soon\"}"
fi
```

## Audit Trail

### Security Audit Log Format
```
# security-audit.log
2026-01-19 14:30:00 - JWT_SECRET rotated - Admin: john@blogcanvas.com - Reason: Scheduled rotation
2026-01-20 09:15:00 - STRIPE_SECRET_KEY rotated - Admin: jane@blogcanvas.com - Reason: Security incident
2026-01-25 11:00:00 - DATABASE_PASSWORD rotated - Admin: john@blogcanvas.com - Reason: Scheduled rotation
```

### Tracking Rotation Dates

Use environment variable metadata (if supported) or maintain a separate config:

`secrets-metadata.json`:
```json
{
  "JWT_SECRET": {
    "lastRotated": "2026-01-19",
    "rotatedBy": "john@blogcanvas.com",
    "nextRotation": "2026-04-19",
    "rotationFrequency": "90 days"
  },
  "STRIPE_SECRET_KEY": {
    "lastRotated": "2026-01-20",
    "rotatedBy": "jane@blogcanvas.com",
    "nextRotation": "2026-07-19",
    "rotationFrequency": "180 days"
  }
}
```

## Secret Storage Best Practices

### DO ✅
- Store secrets in Vercel environment variables
- Use different secrets for staging/production
- Rotate on schedule
- Audit secret access
- Use restricted API keys (minimum permissions)
- Encrypt secrets at rest
- Use secret scanning tools (git-secrets, gitleaks)

### DON'T ❌
- Commit secrets to git
- Share secrets via Slack/email
- Use same secret for multiple services
- Store secrets in code
- Use default/example secrets
- Give developers production secrets

## Monitoring

### Alerts to Set Up
1. **Failed authentication spike** → Possible compromised credentials
2. **Webhook verification failures** → Webhook secret mismatch
3. **Database connection errors** → Possible password rotation issue
4. **API rate limit errors** → Check if using correct API key

### Metrics to Track
- Time since last rotation (per secret)
- Number of failed auth attempts
- API key usage patterns
- Secret access audit logs

## Rollback Procedure

If rotation causes issues:

```bash
# 1. Identify failing secret
# Check error logs, monitoring dashboards

# 2. Revert to previous secret
vercel env add SECRET_NAME production <<< "$OLD_SECRET"

# 3. Immediate deployment
vercel deploy --prod --force

# 4. Investigate root cause
# Was new secret invalid?
# Did consumers update correctly?
# Configuration error?

# 5. Document incident
echo "$(date) - Rolled back SECRET_NAME rotation - Reason: ..." >> security-audit.log
```

## Success Criteria (VENDOR-WC-115)

- ✅ Rotation procedure documented
- ✅ Zero-downtime rotation possible
- ✅ Audit trail maintained
- ✅ Scheduled rotation reminders
- ✅ Emergency rotation process defined
- ✅ Rollback procedure tested

## Checklist

### Pre-Rotation
- [ ] Identify secret to rotate
- [ ] Review consumers of secret
- [ ] Schedule rotation (low-traffic window if needed)
- [ ] Notify team
- [ ] Prepare new secret
- [ ] Test in staging first

### During Rotation
- [ ] Generate new secret
- [ ] Update environment variables
- [ ] Deploy changes
- [ ] Monitor for errors
- [ ] Verify functionality

### Post-Rotation
- [ ] Remove old secret (after grace period)
- [ ] Update audit log
- [ ] Update secrets-metadata.json
- [ ] Send completion notification
- [ ] Schedule next rotation reminder

## Next Steps

1. Set up automated rotation reminders
2. Create rotation runbooks for each service
3. Test rollback procedures
4. Implement secret scanning in CI/CD
5. Train team on rotation procedures
