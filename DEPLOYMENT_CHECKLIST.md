# BlogCanvas Vendor Platform - Deployment Checklist

## Pre-Deployment

### 1. Database Migrations ✅
- [ ] Run migration: `20260117000001_vendor_platform_base.sql`
- [ ] Run migration: `20260117000002_vendor_portal_features.sql`
- [ ] Run migration: `20260117000003_vendor_analytics.sql`
- [ ] Verify all tables created
- [ ] Verify RLS policies enabled

### 2. Environment Variables 🔐
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] NEXT_PUBLIC_APP_URL

### 3. Stripe Configuration 💳
- [ ] Enable Stripe Connect
- [ ] Set up webhook endpoint
- [ ] Test webhook delivery

---

## Deployment Steps

### Vercel Deployment
```bash
vercel --prod
```

### Post-Deployment
- [ ] Test vendor registration
- [ ] Test checkout flow
- [ ] Verify webhooks working

---

**Version:** 1.0.0
