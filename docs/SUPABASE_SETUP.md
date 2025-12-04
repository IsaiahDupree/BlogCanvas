# Supabase Local Development Setup

This guide will help you set up Supabase for local development with BlogCanvas.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Option 1: Using Supabase Cloud (Recommended for Quick Start)](#option-1-using-supabase-cloud)
3. [Option 2: Using Supabase Local Development](#option-2-using-supabase-local-development)
4. [Environment Variables](#environment-variables)
5. [Installing Dependencies](#installing-dependencies)
6. [Verifying Connection](#verifying-connection)
7. [Running Migrations](#running-migrations)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager
- A Supabase account (for cloud setup) OR Docker (for local setup)

## Option 1: Using Supabase Cloud (Recommended for Quick Start)

This is the easiest way to get started. You'll use a hosted Supabase project.

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details:
   - **Name**: BlogCanvas (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to you
4. Click "Create new project" and wait for it to initialize (~2 minutes)

### Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll need these values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")

### Step 3: Set Up Environment Variables

Create a `.env.local` file in the root of your project:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Important**: Never commit `.env.local` to git. It's already in `.gitignore`.

### Step 4: Apply Migrations

The migrations have already been applied via MCP Supabase. If you need to reapply them:

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20241204000000_initial_schema.sql`
4. Paste and run it
5. Then copy and run `supabase/migrations/20241204000001_enable_rls.sql`

## Option 2: Using Supabase Local Development

For a fully local development environment, use Supabase CLI with Docker.

### Step 1: Install Supabase CLI

**macOS/Linux:**
```bash
brew install supabase/tap/supabase
```

**Windows:**
```bash
# Using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or download from: https://github.com/supabase/cli/releases
```

**npm (all platforms):**
```bash
npm install -g supabase
```

### Step 2: Install Docker

Make sure Docker Desktop is installed and running:
- [Download Docker Desktop](https://www.docker.com/products/docker-desktop)

### Step 3: Initialize Supabase Locally

In your project root, run:

```bash
supabase init
```

This creates a `supabase` directory with configuration files.

### Step 4: Start Local Supabase

```bash
supabase start
```

This will:
- Start all Supabase services (Postgres, Auth, Storage, etc.)
- Take a few minutes on first run
- Output your local credentials

You'll see output like:
```
API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5: Set Up Environment Variables

Create a `.env.local` file with your local credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key-from-step-4
```

### Step 6: Apply Migrations Locally

The migrations are already in `supabase/migrations/`. Apply them:

```bash
supabase db reset
```

This will:
- Reset your local database
- Apply all migrations in order
- Seed any seed data (if you add it later)

Or apply migrations manually:

```bash
supabase migration up
```

### Step 7: Access Local Supabase Studio

Open [http://localhost:54323](http://localhost:54323) in your browser to access:
- Database tables and data
- SQL Editor
- Authentication users
- Storage buckets
- API documentation

### Useful Local Commands

```bash
# Stop local Supabase
supabase stop

# View logs
supabase logs

# Reset database (applies all migrations)
supabase db reset

# Create a new migration
supabase migration new migration_name

# Check status
supabase status
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` or `http://localhost:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Optional Variables (for server-side operations)

| Variable | Description | When to Use |
|----------|-------------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) | Server-side operations, admin tasks |

**⚠️ Security Warning**: Never expose the service role key in client-side code. It bypasses all Row Level Security policies.

## Installing Dependencies

Make sure you have the required Supabase packages installed:

```bash
npm install @supabase/ssr @supabase/supabase-js
# or
yarn add @supabase/ssr @supabase/supabase-js
# or
pnpm add @supabase/ssr @supabase/supabase-js
```

## Verifying Connection

### Test 1: Check Environment Variables

Create a test script `scripts/test-supabase-connection.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'

async function testConnection() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('clients').select('count')
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return
    }
    
    console.log('✅ Successfully connected to Supabase!')
    console.log('📊 Database is accessible')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testConnection()
```

Run it:
```bash
npx tsx scripts/test-supabase-connection.ts
```

### Test 2: Check in Next.js App

Start your development server:

```bash
npm run dev
```

Visit `http://localhost:3000` and check the browser console for any Supabase-related errors.

## Running Migrations

### Using Supabase CLI (Local)

```bash
# Apply all pending migrations
supabase migration up

# Reset database and reapply all migrations
supabase db reset

# Create a new migration
supabase migration new add_new_feature
```

### Using Supabase Dashboard (Cloud)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the SQL from your migration file
4. Paste and run it

### Using MCP Supabase

If you have MCP Supabase configured, you can apply migrations directly:

```typescript
// Example: Apply migration via MCP
mcp_supabase_apply_migration({
  name: "migration_name",
  query: "CREATE TABLE ..."
})
```

## Troubleshooting

### Issue: "Invalid API key" or "Invalid URL"

**Solution:**
1. Double-check your `.env.local` file exists
2. Verify the URL and key are correct (no extra spaces)
3. Restart your Next.js dev server after changing env vars
4. For local: Make sure `supabase start` is running

### Issue: "Row Level Security policy violation"

**Solution:**
1. Check that RLS policies are applied (see `supabase/migrations/20241204000001_enable_rls.sql`)
2. Make sure you're authenticated if policies require `auth.uid()`
3. For testing, you can temporarily disable RLS (not recommended for production):
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```

### Issue: "Cannot find module '@supabase/ssr'"

**Solution:**
```bash
npm install @supabase/ssr @supabase/supabase-js
```

### Issue: Local Supabase won't start

**Solution:**
1. Make sure Docker Desktop is running
2. Check if ports 54321-54323 are available
3. Try resetting: `supabase stop && supabase start`
4. Check Docker logs: `docker ps` and `docker logs <container-id>`

### Issue: Migrations not applying

**Solution:**
1. Check migration file names follow the pattern: `YYYYMMDDHHMMSS_name.sql`
2. Verify SQL syntax is correct
3. For local: Run `supabase db reset` to start fresh
4. Check Supabase logs for specific SQL errors

### Issue: TypeScript types are outdated

**Solution:**
1. Regenerate types using MCP Supabase:
   ```typescript
   mcp_supabase_generate_typescript_types()
   ```
2. Or use Supabase CLI:
   ```bash
   supabase gen types typescript --local > types/database.ts
   # or for cloud
   supabase gen types typescript --project-id your-project-id > types/database.ts
   ```

## Next Steps

Once your Supabase connection is working:

1. ✅ Set up authentication (if not already done)
2. ✅ Test database queries in your API routes
3. ✅ Set up real-time subscriptions (if needed)
4. ✅ Configure storage buckets (if needed)
5. ✅ Set up database functions and triggers

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Getting Help

- Check the [Supabase Discord](https://discord.supabase.com)
- Review [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)
- Read the [Supabase Blog](https://supabase.com/blog) for tutorials

