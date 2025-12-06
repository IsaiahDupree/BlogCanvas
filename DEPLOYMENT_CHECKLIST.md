# Vercel Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## Pre-Deployment

### Code Preparation
- [ ] All code is committed to Git
- [ ] Code is pushed to GitHub/GitLab/Bitbucket
- [ ] Build passes locally: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] No TypeScript errors
- [ ] No linting errors: `npm run lint`

### Environment Variables
- [ ] Supabase project is created (cloud, not local)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is ready
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is ready
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is ready (if needed)
- [ ] Other API keys are ready (OpenAI, Anthropic, etc.)

### Database
- [ ] All migrations are applied to production Supabase
- [ ] RLS policies are configured
- [ ] Test data is ready (if needed)
- [ ] Database indexes are created

## Deployment Steps

### 1. Vercel Setup
- [ ] Create Vercel account (if needed)
- [ ] Import project from Git repository
- [ ] Verify framework is detected as Next.js
- [ ] Check build settings are correct

### 2. Environment Variables
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` (if needed)
- [ ] Add other required environment variables
- [ ] Set variables for Production, Preview, and Development environments

### 3. Deploy
- [ ] Click "Deploy" button
- [ ] Wait for build to complete
- [ ] Check build logs for errors
- [ ] Verify deployment URL is accessible

## Post-Deployment

### Verification
- [ ] App loads without errors
- [ ] Supabase connection works
- [ ] API routes respond correctly
- [ ] Database queries work
- [ ] RLS policies function correctly
- [ ] No console errors in browser

### Testing
- [ ] Test main features
- [ ] Test API endpoints
- [ ] Test database operations
- [ ] Test authentication (if implemented)
- [ ] Test error handling

### Configuration
- [ ] Set up custom domain (if needed)
- [ ] Configure DNS settings
- [ ] Enable SSL (automatic with Vercel)
- [ ] Set up monitoring/analytics
- [ ] Configure branch protection (if needed)

## Troubleshooting

### If Build Fails
- [ ] Check build logs in Vercel dashboard
- [ ] Verify all dependencies are in `package.json`
- [ ] Check for TypeScript errors
- [ ] Verify environment variables are set
- [ ] Test build locally: `npm run build`

### If App Doesn't Work
- [ ] Check function logs in Vercel
- [ ] Verify Supabase connection
- [ ] Check environment variables are correct
- [ ] Verify RLS policies allow access
- [ ] Check browser console for errors

### If Database Issues
- [ ] Verify Supabase project is active
- [ ] Check migrations are applied
- [ ] Verify RLS policies
- [ ] Test queries in Supabase SQL Editor

## Quick Deploy Commands

```bash
# Test build locally
npm run build

# Deploy to Vercel (if using CLI)
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs
```

## Environment Variables Reference

### Required
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Optional
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Support Resources

- [Vercel Deployment Guide](./docs/VERCEL_DEPLOYMENT.md)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Setup Guide](./docs/SUPABASE_SETUP.md)
- [Vercel Support](https://vercel.com/support)

