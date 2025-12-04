# Supabase Quick Reference

Quick reference for common Supabase operations in BlogCanvas.

## Client Usage

### Server Components / API Routes

```typescript
import { createClient } from '@/lib/supabase/server'

// In Server Components or API routes
const supabase = createClient()

// Query data
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .eq('owner_id', userId)

// Insert data
const { data, error } = await supabase
  .from('clients')
  .insert({ name: 'New Client', owner_id: userId })
  .select()

// Update data
const { data, error } = await supabase
  .from('blog_posts')
  .update({ status: 'published' })
  .eq('id', postId)
  .select()
```

### Client Components

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function ClientList() {
  const [clients, setClients] = useState([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchClients() {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
      
      if (error) {
        console.error(error)
        return
      }
      
      setClients(data)
    }
    
    fetchClients()
  }, [])

  return <div>{/* render clients */}</div>
}
```

## Common Queries

### Get All Clients for User

```typescript
const { data: clients } = await supabase
  .from('clients')
  .select('*')
  .eq('owner_id', userId)
  .order('created_at', { ascending: false })
```

### Get Blog Post with Sections

```typescript
const { data: post } = await supabase
  .from('blog_posts')
  .select(`
    *,
    blog_post_sections (
      id,
      section_key,
      title,
      content,
      order_index
    )
  `)
  .eq('id', postId)
  .single()
```

### Get Recent Agent Runs

```typescript
const { data: runs } = await supabase
  .from('agent_runs')
  .select('*')
  .eq('blog_post_id', postId)
  .order('started_at', { ascending: false })
  .limit(10)
```

### Insert with Related Data

```typescript
// Insert blog post
const { data: post } = await supabase
  .from('blog_posts')
  .insert({
    client_id: clientId,
    topic: 'My Topic',
    status: 'idea'
  })
  .select()
  .single()

// Insert sections
const { data: sections } = await supabase
  .from('blog_post_sections')
  .insert([
    { blog_post_id: post.id, section_key: 'intro', order_index: 0 },
    { blog_post_id: post.id, section_key: 'body', order_index: 1 }
  ])
  .select()
```

## Type Safety

All queries are fully typed using the generated `Database` type:

```typescript
import { Database } from '@/types/database'

type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']
type BlogPostStatus = Database['public']['Enums']['blog_post_status']
```

## Error Handling

```typescript
const { data, error } = await supabase
  .from('clients')
  .select('*')

if (error) {
  // Handle error
  console.error('Error:', error.message)
  console.error('Code:', error.code)
  console.error('Details:', error.details)
  return
}

// Use data
console.log(data)
```

## Real-time Subscriptions

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export function RealtimePost({ postId }: { postId: string }) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`post:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blog_posts',
          filter: `id=eq.${postId}`
        },
        (payload) => {
          console.log('Change received!', payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId])

  return <div>{/* render post */}</div>
}
```

## Authentication (if using Supabase Auth)

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Sign out
await supabase.auth.signOut()
```

## Useful Supabase CLI Commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# View status
supabase status

# Reset database (applies all migrations)
supabase db reset

# Create new migration
supabase migration new migration_name

# Generate TypeScript types
supabase gen types typescript --local > types/database.ts

# View logs
supabase logs
```

## Common Issues

### RLS Policy Violation

If you get an RLS error, check:
1. User is authenticated: `await supabase.auth.getUser()`
2. RLS policies are correct for your use case
3. You're using the right user ID in queries

### Type Errors

If types are outdated:
```bash
supabase gen types typescript --local > types/database.ts
```

### Connection Issues

1. Check `.env.local` exists and has correct values
2. Restart dev server after changing env vars
3. For local: Ensure `supabase start` is running

