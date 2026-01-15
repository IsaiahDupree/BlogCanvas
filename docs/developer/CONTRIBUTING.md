# Contributing to BlogCanvas

Thank you for your interest in contributing to BlogCanvas! This document provides guidelines and instructions for developers.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Development Workflow](#development-workflow)
4. [Code Standards](#code-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Git Workflow](#git-workflow)
7. [Pull Request Process](#pull-request-process)
8. [Database Migrations](#database-migrations)
9. [AI Agent Development](#ai-agent-development)
10. [Common Patterns](#common-patterns)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **pnpm** 8.x or higher (recommended) or npm
- **Git**
- **Supabase CLI** (for database work)
- **PostgreSQL 15+** (if running local database)

### Required Accounts

- **Supabase** account (for database & auth)
- **OpenAI** API key (for AI features)
- **Stripe** test account (for payment features)
- **Resend** account (for transactional emails)

---

## Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/blogcanvas.git
cd blogcanvas
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:4848
NODE_ENV=development
```

### 4. Database Setup

#### Option A: Use Supabase Cloud

1. Create project at [supabase.com](https://supabase.com)
2. Link your project:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
```

3. Push migrations:

```bash
npx supabase db push
```

#### Option B: Local Supabase (Docker)

```bash
# Start local Supabase
npx supabase start

# Apply migrations
npx supabase db push
```

### 5. Generate Types

```bash
npx supabase gen types typescript --local > src/lib/database.types.ts
```

### 6. Start Development Server

```bash
pnpm dev
# or
npm run dev
```

Visit http://localhost:4848

---

## Development Workflow

### Feature Development Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Develop Feature**
   - Follow [Code Standards](#code-standards)
   - Write tests for new functionality
   - Update documentation

3. **Test Locally**
   ```bash
   pnpm build  # Test production build
   pnpm lint   # Check linting
   pnpm test   # Run tests (if applicable)
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push & Create PR**
   ```bash
   git push origin feat/your-feature-name
   ```

---

## Code Standards

### TypeScript

- **Always use TypeScript** - No `.js` files
- **Type everything** - Avoid `any` unless absolutely necessary
- **Use interfaces** for data structures
- **Use type** for unions and simple types

**Good:**
```typescript
interface BlogPost {
  id: string
  title: string
  status: 'draft' | 'published'
  created_at: Date
}

async function createPost(data: Omit<BlogPost, 'id' | 'created_at'>): Promise<BlogPost> {
  // ...
}
```

**Bad:**
```typescript
function createPost(data: any) {  // ❌ Avoid any
  // ...
}
```

### React Components

#### File Structure

```
components/
├── ui/              # Reusable primitives
│   ├── button.tsx
│   └── dialog.tsx
├── posts/           # Feature-specific
│   ├── PostList.tsx
│   ├── PostEditor.tsx
│   └── PostCard.tsx
└── layout/          # Layout components
    ├── Header.tsx
    └── Sidebar.tsx
```

#### Component Template

```typescript
'use client' // Only if client-side interactivity needed

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PostCardProps {
  post: BlogPost
  onEdit?: (id: string) => void
}

/**
 * Displays a blog post card with title, status, and actions
 */
export function PostCard({ post, onEdit }: PostCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleEdit = () => {
    setIsLoading(true)
    onEdit?.(post.id)
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold">{post.title}</h3>
      <p className="text-sm text-gray-500">{post.status}</p>
      <Button onClick={handleEdit} disabled={isLoading}>
        Edit
      </Button>
    </div>
  )
}
```

### API Routes

#### Route Template

```typescript
// /app/api/blog-posts/[id]/route.ts

import { NextResponse } from 'next/server'
import { createClient, requireAuth } from '@/lib/supabase/server'
import { z } from 'zod'

// Input validation schema
const updatePostSchema = z.object({
  title: z.string().min(10).max(200),
  content: z.string().min(100),
  status: z.enum(['draft', 'published'])
})

/**
 * GET /api/blog-posts/:id
 * Retrieves a single blog post by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, post })
  } catch (error: any) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/blog-posts/:id
 * Updates a blog post
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const supabase = await createClient()

    const body = await request.json()

    // Validate input
    const validated = updatePostSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }

    // Update post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .update(validated.data)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, post })
  } catch (error: any) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update post' },
      { status: 500 }
    )
  }
}
```

### Server Actions

```typescript
'use server'

import { createClient, requireAuth } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Update blog post status
 * @param postId - Blog post UUID
 * @param status - New status value
 */
export async function updatePostStatus(
  postId: string,
  status: string
) {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('blog_posts')
    .update({ status })
    .eq('id', postId)

  if (error) throw error

  // Revalidate relevant pages
  revalidatePath('/app/posts')
  revalidatePath(`/app/posts/${postId}`)

  return { success: true }
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `blog-post-list.tsx` |
| Components | PascalCase | `BlogPostList` |
| Functions | camelCase | `createBlogPost` |
| Constants | UPPER_SNAKE_CASE | `MAX_POSTS_PER_PAGE` |
| Types/Interfaces | PascalCase | `BlogPost`, `CreatePostInput` |
| Database Tables | snake_case | `blog_posts` |
| API Routes | kebab-case | `/api/blog-posts` |

### Comments & Documentation

#### JSDoc for Functions

```typescript
/**
 * Calculates SEO score projection based on content plan
 *
 * @param currentScore - Current SEO score (0-100)
 * @param targetScore - Target SEO score (0-100)
 * @param gapCount - Number of identified content gaps
 * @returns Projection result with recommended posts and timeline
 *
 * @example
 * ```typescript
 * const projection = projectSEOScore(62, 80, 5)
 * console.log(projection.recommended_posts) // 24
 * ```
 */
export function projectSEOScore(
  currentScore: number,
  targetScore: number,
  gapCount: number
): ProjectionResult {
  // Implementation
}
```

#### Inline Comments

```typescript
// Good: Explain WHY, not WHAT
// Use exponential backoff to avoid rate limiting
await delay(Math.pow(2, attempt) * 1000)

// Bad: State the obvious
// Loop through posts
for (const post of posts) {
  // ...
}
```

### Styling

- **Use TailwindCSS** for all styling
- **Avoid inline styles** unless dynamic
- **Use shadcn/ui components** when available

```typescript
// Good
<div className="flex items-center gap-4 rounded-lg border p-4">
  <h3 className="text-lg font-semibold">{title}</h3>
</div>

// Bad
<div style={{ display: 'flex', padding: '16px' }}>
  <h3 style={{ fontSize: '18px' }}>{title}</h3>
</div>
```

---

## Testing Guidelines

### Unit Tests

```typescript
// /lib/__tests__/score-projection.test.ts

import { describe, it, expect } from 'vitest'
import { projectSEOScore } from '../score-projection'

describe('projectSEOScore', () => {
  it('should calculate correct post count for score increase', () => {
    const result = projectSEOScore(60, 80, 5)

    expect(result.recommended_posts).toBeGreaterThan(0)
    expect(result.score_increase).toBe(20)
    expect(result.confidence).toBe('medium')
  })

  it('should handle no score increase', () => {
    const result = projectSEOScore(80, 80, 0)

    expect(result.recommended_posts).toBe(0)
    expect(result.timeline_months).toBe(0)
  })
})
```

### Integration Tests

```typescript
// /app/api/__tests__/blog-posts.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { GET, POST } from '../api/blog-posts/route'

describe('/api/blog-posts', () => {
  beforeEach(() => {
    // Setup test database state
  })

  it('GET should return paginated posts', async () => {
    const { req } = createMocks({
      method: 'GET',
      url: '/api/blog-posts?page=1&limit=20'
    })

    const response = await GET(req as any)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toBeInstanceOf(Array)
    expect(data.page).toBe(1)
  })
})
```

---

## Git Workflow

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (formatting, no logic change)
- `refactor:` Code refactoring
- `perf:` Performance improvement
- `test:` Test addition/modification
- `chore:` Build process, dependencies

**Examples:**

```bash
feat(blog-posts): add CSV import functionality

fix(auth): resolve client invitation token validation

docs(api): add examples for blog post endpoints

refactor(database): optimize query performance with indexes

chore(deps): upgrade next.js to 16.1.0
```

### Branch Naming

| Type | Naming | Example |
|------|--------|---------|
| Feature | `feat/description` | `feat/csv-import` |
| Bug Fix | `fix/description` | `fix/auth-redirect` |
| Hotfix | `hotfix/description` | `hotfix/broken-publish` |
| Docs | `docs/description` | `docs/api-examples` |
| Refactor | `refactor/description` | `refactor/agent-pipeline` |

---

## Pull Request Process

### 1. Before Creating PR

- [ ] Code follows style guidelines
- [ ] All tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Types are correct (`pnpm type-check`)
- [ ] Documentation updated
- [ ] Self-review completed

### 2. PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Closes #123

## Changes Made
- Added CSV import modal component
- Updated batch detail page
- Added validation for CSV format

## Testing
- [ ] Tested locally
- [ ] Added unit tests
- [ ] Tested edge cases

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Commented complex logic
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
```

### 3. PR Review Process

1. **Automated Checks** - CI must pass
2. **Code Review** - At least 1 approval required
3. **Testing** - Reviewer tests feature locally
4. **Merge** - Squash and merge to main

---

## Database Migrations

### Creating Migrations

```bash
# Create new migration
npx supabase migration new add_feature_name

# Edit migration file
# supabase/migrations/YYYYMMDDHHMMSS_add_feature_name.sql
```

### Migration Template

```sql
-- Migration: Add blog_post_tags table
-- Date: 2026-01-15
-- Description: Adds tagging system for blog posts

-- Create table
CREATE TABLE blog_post_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_blog_post_tags_post ON blog_post_tags(blog_post_id);
CREATE INDEX idx_blog_post_tags_name ON blog_post_tags(tag_name);

-- Enable RLS
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users see tags for their client's posts"
  ON blog_post_tags FOR SELECT
  USING (
    blog_post_id IN (
      SELECT id FROM blog_posts
      WHERE client_id IN (
        SELECT client_id FROM client_profiles WHERE id = auth.uid()
      )
    )
  );

-- Add comments
COMMENT ON TABLE blog_post_tags IS 'Tags for organizing blog posts';
COMMENT ON COLUMN blog_post_tags.tag_name IS 'Tag name (e.g., "SEO", "Case Study")';
```

### Applying Migrations

```bash
# Local
npx supabase db push

# Production (via Supabase dashboard or CLI)
npx supabase db push --db-url "$DATABASE_URL"
```

### Rollback Migrations

```bash
# Reset to specific migration
npx supabase db reset --version 20260115000000
```

---

## AI Agent Development

### Agent Structure

```typescript
// /lib/agents/my-agent.ts

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface MyAgentInput {
  postId: string
  options?: {
    temperature?: number
    maxTokens?: number
  }
}

interface MyAgentOutput {
  result: string
  metadata: {
    tokens: number
    cost: number
  }
}

/**
 * My Agent - Does something specific
 *
 * @param input - Agent input parameters
 * @returns Agent output with metadata
 */
export async function runMyAgent(
  input: MyAgentInput
): Promise<MyAgentOutput> {
  const { postId, options = {} } = input

  // Fetch context
  const post = await fetchBlogPost(postId)
  const brandGuide = await fetchBrandGuide(post.client_id)

  // Build prompt
  const systemPrompt = `You are an AI agent that...`
  const userPrompt = `Given the following blog post:\n\nTitle: ${post.title}\n\nPerform the following task...`

  // Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 2000
  })

  const result = response.choices[0].message.content || ''

  // Calculate cost (example: $0.005/1K tokens)
  const totalTokens = response.usage?.total_tokens || 0
  const cost = (totalTokens / 1000) * 0.005

  // Save agent run
  await createAgentRun({
    blog_post_id: postId,
    agent_name: 'my_agent',
    status: 'completed',
    input_tokens: response.usage?.prompt_tokens || 0,
    output_tokens: response.usage?.completion_tokens || 0,
    cost
  })

  return {
    result,
    metadata: {
      tokens: totalTokens,
      cost
    }
  }
}
```

### Agent Best Practices

1. **Always track costs** - Log token usage and calculate costs
2. **Add retry logic** - Handle rate limits and transient errors
3. **Validate outputs** - Parse and validate AI responses
4. **Use structured outputs** - JSON mode or function calling
5. **Add timeouts** - Prevent hanging requests

---

## Common Patterns

### Data Fetching (Server Components)

```typescript
// app/posts/[id]/page.tsx

import { createClient } from '@/lib/supabase/server'

export default async function PostPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*, content_batches(*)')
    .eq('id', params.id)
    .single()

  if (!post) {
    return <div>Post not found</div>
  }

  return <PostDetail post={post} />
}
```

### Form Handling

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const formSchema = z.object({
  title: z.string().min(10).max(200),
  content: z.string().min(100)
})

type FormData = z.infer<typeof formSchema>

export function PostForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: ''
    }
  })

  async function onSubmit(data: FormData) {
    const response = await fetch('/api/blog-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (response.ok) {
      // Success
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('title')} />
      {form.formState.errors.title && (
        <span>{form.formState.errors.title.message}</span>
      )}
      <button type="submit">Submit</button>
    </form>
  )
}
```

### Error Handling

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  if (error instanceof ZodError) {
    // Validation error
    return { error: 'Invalid input', details: error.errors }
  } else if (error instanceof PostgrestError) {
    // Database error
    console.error('Database error:', error.message)
    return { error: 'Database operation failed' }
  } else {
    // Unknown error
    console.error('Unexpected error:', error)
    return { error: 'Something went wrong' }
  }
}
```

---

## Troubleshooting

### Common Issues

#### Issue: Supabase Client Not Connecting

**Solution:**
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Regenerate types
npx supabase gen types typescript --local > src/lib/database.types.ts

# Restart dev server
pnpm dev
```

#### Issue: TypeScript Errors After Database Changes

**Solution:**
```bash
# Regenerate database types
npx supabase gen types typescript --local > src/lib/database.types.ts

# Restart TypeScript server in IDE
# VS Code: Cmd+Shift+P → "Restart TypeScript Server"
```

#### Issue: Build Fails on Vercel

**Solution:**
```bash
# Test build locally first
pnpm build

# Check for:
# - Missing environment variables in Vercel
# - TypeScript errors
# - ESLint errors
# - Missing dependencies
```

#### Issue: RLS Policies Blocking Queries

**Solution:**
```sql
-- Temporarily disable RLS for testing (local only!)
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;

-- Check if query works
-- Then fix your RLS policy

-- Re-enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
```

---

## Getting Help

### Resources

- **Documentation:** `/docs` directory
- **API Reference:** [API_REFERENCE.md](./API_REFERENCE.md)
- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Database Schema:** [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

### Contact

- **GitHub Issues:** https://github.com/yourusername/blogcanvas/issues
- **Email:** dev@blogcanvas.io
- **Slack:** #blogcanvas-dev

---

## Code of Conduct

- **Be respectful** - Treat everyone with kindness
- **Be constructive** - Provide helpful feedback
- **Be collaborative** - Work together, share knowledge
- **Be professional** - Keep discussions focused and productive

---

**Thank you for contributing to BlogCanvas!** 🎉

---

**Last Updated:** 2026-01-15
**Version:** 1.0
