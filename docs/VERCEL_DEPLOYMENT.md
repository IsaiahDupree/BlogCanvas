# Vercel Deployment Guide

Complete guide for deploying BlogCanvas to Vercel.

## Prerequisites

- [ ] Vercel account ([sign up](https://vercel.com/signup))
- [ ] GitHub/GitLab/Bitbucket repository with your code
- [ ] Supabase project set up (cloud, not local)
- [ ] Environment variables ready

## Quick Deploy

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import Project in Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   
   **Required:**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   
   **Optional:**
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
   - `OPENAI_API_KEY` - If using OpenAI
   - `ANTHROPIC_API_KEY` - If using Anthropic
   - `NEXT_PUBLIC_APP_URL` - Your production URL (auto-set by Vercel)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-5 minutes)
   - Your app will be live at `your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project? No (first time)
   - Project name: blog-canvas (or your choice)
   - Directory: `./`
   - Override settings? No

4. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY  # Optional
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Environment Variables

### Required Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Optional Variables

| Variable | Description | When to Use |
|----------|-------------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Server-side operations |
| `OPENAI_API_KEY` | OpenAI API key | If using OpenAI |
| `ANTHROPIC_API_KEY` | Anthropic API key | If using Anthropic |
| `NEXT_PUBLIC_APP_URL` | Production URL | Auto-set by Vercel |

### Setting Environment Variables

**Via Dashboard:**
1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add each variable
4. Select environments: Production, Preview, Development
5. Redeploy after adding variables

**Via CLI:**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

## Build Configuration

The project is configured for Vercel with:

- **Framework**: Next.js 16 (App Router)
- **Node Version**: 18.x (default)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### Custom Build Settings

If needed, you can override in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

## Post-Deployment Checklist

After deployment:

- [ ] Verify environment variables are set
- [ ] Test Supabase connection
- [ ] Check build logs for errors
- [ ] Test API routes
- [ ] Verify RLS policies work
- [ ] Check domain configuration (if using custom domain)

## Custom Domain

### Add Custom Domain

1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (~24-48 hours)

### Domain Configuration

Vercel will provide DNS records to add:
- **A Record**: Point to Vercel IP
- **CNAME Record**: Point to Vercel hostname

## Continuous Deployment

Vercel automatically deploys on:
- Push to `main` branch → Production
- Push to other branches → Preview deployment
- Pull requests → Preview deployment

### Branch Protection

To require manual approval:
1. Settings → Git
2. Enable "Production Branch Protection"
3. Require approval for production deployments

## Monitoring & Logs

### View Logs

**Via Dashboard:**
- Go to your deployment
- Click "View Function Logs"

**Via CLI:**
```bash
vercel logs [deployment-url]
```

### Performance Monitoring

Vercel provides:
- Real-time analytics
- Function execution times
- Error tracking
- Web Vitals

## Troubleshooting

### Build Fails

**Common Issues:**

1. **Missing Environment Variables**
   - Check all required variables are set
   - Ensure they're set for the correct environment

2. **TypeScript Errors**
   ```bash
   # Test build locally first
   npm run build
   ```

3. **Missing Dependencies**
   - Check `package.json` includes all dependencies
   - Ensure dev dependencies aren't used in production

4. **Supabase Connection Issues**
   - Verify Supabase URL and keys
   - Check Supabase project is active
   - Ensure RLS policies allow public access if needed

### Runtime Errors

1. **Check Function Logs**
   - Vercel Dashboard → Deployment → Functions
   - Look for error messages

2. **Test API Routes**
   - Visit `/api/health` (if you create one)
   - Check browser console for errors

3. **Verify Environment Variables**
   - Ensure variables are set for production
   - Check variable names match exactly

### Performance Issues

1. **Enable Edge Functions**
   - Use Edge Runtime for API routes when possible
   - Reduces cold start times

2. **Optimize Images**
   - Use Next.js Image component
   - Configure image domains in `next.config.ts`

3. **Database Queries**
   - Add indexes (already done)
   - Use connection pooling
   - Optimize queries

## Security Best Practices

1. **Never commit secrets**
   - Use environment variables
   - Keep `.env.local` in `.gitignore`

2. **Use RLS policies**
   - All tables have RLS enabled
   - Test policies in production

3. **Service Role Key**
   - Only use server-side
   - Never expose in client code
   - Use for admin operations only

4. **API Routes**
   - Validate input
   - Rate limit if needed
   - Use authentication

## Updating Deployment

### Automatic Updates

Vercel automatically redeploys on:
- Git push to connected branch
- Manual redeploy from dashboard

### Manual Redeploy

**Via Dashboard:**
1. Go to Deployments
2. Click "..." on a deployment
3. Select "Redeploy"

**Via CLI:**
```bash
vercel --prod
```

### Rollback

1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

## Environment-Specific Configuration

### Production

- Use production Supabase project
- Set `NODE_ENV=production`
- Use production API keys

### Preview

- Can use staging Supabase project
- Test new features before production
- Separate environment variables

### Development

- Local development
- Use `.env.local`
- Local Supabase (optional)

## Vercel CLI Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel list

# View logs
vercel logs

# Remove deployment
vercel remove

# Link to project
vercel link
```

## Next Steps After Deployment

1. ✅ **Set up monitoring**
   - Enable Vercel Analytics
   - Set up error tracking

2. ✅ **Configure domains**
   - Add custom domain
   - Set up SSL (automatic)

3. ✅ **Test thoroughly**
   - Test all features
   - Verify Supabase connection
   - Check API routes

4. ✅ **Set up CI/CD**
   - Already automatic with Vercel
   - Configure branch protection if needed

5. ✅ **Monitor performance**
   - Check Vercel Analytics
   - Monitor function execution
   - Track errors

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel CLI](https://vercel.com/docs/cli)

## Support

- [Vercel Support](https://vercel.com/support)
- [Vercel Discord](https://vercel.com/discord)
- [GitHub Issues](https://github.com/vercel/vercel/issues)

