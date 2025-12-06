# BlogCanvas

A Next.js application for AI-powered blog content creation and management, built with Supabase.

## Features

- 🤖 AI-powered blog post generation pipeline
- 📝 Multi-agent content creation (research, outline, draft, SEO)
- 🔍 Quality gates and review workflows
- 💬 Collaborative commenting and review system
- 🎨 Modern UI with Tailwind CSS and Radix UI
- 🔒 Secure database with Row Level Security (RLS)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Type Safety**: TypeScript
- **Testing**: Jest + React Testing Library

## Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Supabase account (for cloud) OR Docker (for local development)

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd BlogCanvas
npm install
```

### 2. Set Up Supabase

**Option A: Supabase Cloud (Recommended for Quick Start)**

1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings → API
3. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```
4. Fill in your Supabase credentials in `.env.local`

**Option B: Local Development**

1. Install Supabase CLI: `npm install -g supabase`
2. Install and start Docker Desktop
3. Initialize and start Supabase:
   ```bash
   supabase init
   supabase start
   ```
4. Copy the local credentials to `.env.local`

📖 **Detailed Setup**: See [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md) for complete instructions.

### 3. Verify Connection

Test your Supabase connection:

```bash
npm run test:supabase
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
BlogCanvas/
├── docs/                    # Documentation
│   └── SUPABASE_SETUP.md   # Supabase setup guide
├── lib/                     # Core libraries
│   ├── agents/             # AI agent implementations
│   ├── pipeline/           # Content pipeline orchestration
│   └── supabase/           # Supabase client utilities
├── src/
│   ├── app/                # Next.js app router pages
│   │   ├── api/            # API routes
│   │   └── posts/          # Blog post pages
│   └── components/         # React components
├── supabase/
│   └── migrations/         # Database migrations
├── types/
│   └── database.ts         # Generated TypeScript types
└── scripts/                # Utility scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test:supabase` - Test Supabase connection

## Database Schema

The application uses the following main tables:

- **clients** - Client/organization information
- **client_profiles** - Detailed brand and marketing info
- **blog_posts** - Blog post metadata and content
- **blog_post_sections** - Individual sections of blog posts
- **agent_runs** - Logging for AI agent executions
- **review_tasks** - Tasks for human review
- **comments** - Comments on posts and sections
- **cms_connections** - CMS integration settings

See `supabase/migrations/` for the complete schema.

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

See `env.example` for all available variables.

## Deployment

### Deploy to Vercel

The easiest way to deploy BlogCanvas is using [Vercel](https://vercel.com):

1. **Push your code to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Click "Deploy"

3. **Your app is live!** 🚀

📖 **Detailed Guide**: See [docs/VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md) for complete deployment instructions.

## Documentation

- [Supabase Setup Guide](./docs/SUPABASE_SETUP.md) - Complete guide for connecting to Supabase locally or cloud
- [Vercel Deployment Guide](./docs/VERCEL_DEPLOYMENT.md) - Complete guide for deploying to Vercel
- [Migration Management](./docs/MIGRATION_MANAGEMENT.md) - Database migration guide
- [Supabase Documentation](https://supabase.com/docs) - Official Supabase docs

## Development

### Adding New Migrations

1. Create a new migration file:
   ```bash
   supabase migration new migration_name
   ```
2. Or manually create: `supabase/migrations/YYYYMMDDHHMMSS_name.sql`
3. Apply migrations:
   - Local: `supabase db reset` or `supabase migration up`
   - Cloud: Run SQL in Supabase Dashboard → SQL Editor

### Regenerating TypeScript Types

If you modify the database schema, regenerate types:

```bash
# Using Supabase CLI
supabase gen types typescript --local > types/database.ts

# Or using MCP Supabase (if configured)
# The types are auto-generated from your database
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

## Security

- All tables have Row Level Security (RLS) enabled
- RLS policies ensure users can only access their own data
- Never commit `.env.local` or service role keys
- Review RLS policies in `supabase/migrations/20241204000001_enable_rls.sql`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[Your License Here]

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
