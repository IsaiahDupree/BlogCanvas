# Migration Management with MCP Supabase

This guide explains how to manage database migrations using Supabase MCP (Model Context Protocol) in BlogCanvas.

## Overview

Migrations are managed through:
1. **SQL migration files** in `supabase/migrations/`
2. **MCP Supabase tools** for applying migrations
3. **Migration management scripts** for local development

## Migration Files

All migrations are stored in `supabase/migrations/` with the naming convention:
```
YYYYMMDDHHMMSS_migration_name.sql
```

### Current Migrations

1. **20241204000000_initial_schema.sql** - Core schema (clients, blog posts, sections, etc.)
2. **20241204000001_enable_rls.sql** - Row Level Security policies
3. **20241204000001_website_scraper.sql** - Website scraping tables
4. **20241204000002_brand_guides.sql** - Brand guide and content requirements
5. **20241204000004_add_indexes.sql** - Performance indexes
6. **20241204000005_rls_new_tables.sql** - RLS for new tables

## Using MCP Supabase

### List Applied Migrations

```typescript
// Via MCP (in Cursor/Claude Desktop)
mcp_supabase_list_migrations()
```

This shows all migrations that have been applied to your database.

### Apply a Migration

```typescript
// Via MCP
mcp_supabase_apply_migration({
  name: "migration_name",
  query: "CREATE TABLE ..."
})
```

### Check Migration Status

```bash
# List local migration files
npx tsx scripts/manage-migrations.ts list

# Check database status
# Use MCP: mcp_supabase_list_migrations()
```

## Creating New Migrations

### Step 1: Create Migration File

Create a new file in `supabase/migrations/`:

```bash
# Format: YYYYMMDDHHMMSS_description.sql
# Example: 20241205000000_add_user_preferences.sql
```

### Step 2: Write SQL

```sql
-- Add user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
  ON user_preferences(user_id);
```

### Step 3: Apply via MCP

Use MCP Supabase to apply:

```typescript
mcp_supabase_apply_migration({
  name: "add_user_preferences",
  query: `-- Your SQL here`
})
```

### Step 4: Add RLS (if needed)

If the table contains user data, add RLS:

```sql
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);
```

## Migration Best Practices

### 1. Always Use IF NOT EXISTS

```sql
-- ✅ Good
CREATE TABLE IF NOT EXISTS new_table (...);

-- ❌ Bad
CREATE TABLE new_table (...);
```

### 2. Add Indexes for Foreign Keys

```sql
CREATE INDEX IF NOT EXISTS idx_table_foreign_key 
  ON table_name(foreign_key_column);
```

### 3. Enable RLS on New Tables

```sql
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
-- Then add policies
```

### 4. Use Transactions for Complex Migrations

```sql
BEGIN;

-- Multiple operations
CREATE TABLE ...;
ALTER TABLE ...;
CREATE INDEX ...;

COMMIT;
```

### 5. Test Migrations Locally First

```bash
# Local Supabase
supabase db reset  # Applies all migrations
```

## Migration Management Script

Use the migration management script:

```bash
# List all migrations
npx tsx scripts/manage-migrations.ts list

# View a specific migration
npx tsx scripts/manage-migrations.ts apply migration_name

# Check status
npx tsx scripts/manage-migrations.ts status
```

## Common Migration Patterns

### Adding a Column

```sql
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS new_field TEXT;
```

### Modifying a Column

```sql
ALTER TABLE blog_posts 
ALTER COLUMN status TYPE TEXT 
USING status::TEXT;
```

### Adding an Index

```sql
CREATE INDEX IF NOT EXISTS idx_blog_posts_new_field 
ON blog_posts(new_field);
```

### Creating a Function

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Adding a Trigger

```sql
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

## Rollback Strategy

Supabase doesn't support automatic rollbacks. To rollback:

1. **Create a new migration** that reverses the changes
2. **Manually fix** the database if needed
3. **Use Supabase Dashboard** SQL Editor for quick fixes

Example rollback migration:

```sql
-- 20241205000001_rollback_add_user_preferences.sql
DROP TABLE IF EXISTS user_preferences;
```

## Verifying Migrations

### Check Applied Migrations

```typescript
// Via MCP
mcp_supabase_list_migrations()
```

### Verify Tables Exist

```typescript
// Via MCP
mcp_supabase_list_tables()
```

### Check RLS Policies

```typescript
// Via MCP
mcp_supabase_get_advisors({ type: "security" })
```

### Regenerate TypeScript Types

After applying migrations, regenerate types:

```typescript
// Via MCP
mcp_supabase_generate_typescript_types()
```

Or via CLI:

```bash
supabase gen types typescript --local > types/database.ts
```

## Troubleshooting

### Migration Fails

1. **Check SQL syntax** - Test in Supabase SQL Editor first
2. **Verify dependencies** - Ensure referenced tables exist
3. **Check constraints** - Foreign keys, unique constraints, etc.
4. **Review logs** - Check Supabase logs for errors

### Migration Already Applied

If a migration was partially applied:
1. Check what was created
2. Create a new migration to fix inconsistencies
3. Or manually fix via SQL Editor

### Type Errors After Migration

Regenerate TypeScript types:

```bash
npm run generate:types
# or
supabase gen types typescript --local > types/database.ts
```

## Local Development Workflow

### 1. Create Migration

```bash
# Create new migration file
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_my_migration.sql
```

### 2. Write SQL

Edit the migration file with your SQL.

### 3. Test Locally

```bash
# Reset local database (applies all migrations)
supabase db reset

# Or apply specific migration
supabase migration up
```

### 4. Apply to Production

Use MCP Supabase to apply:

```typescript
mcp_supabase_apply_migration({
  name: "my_migration",
  query: "/* SQL from file */"
})
```

### 5. Verify

```typescript
mcp_supabase_list_migrations()
mcp_supabase_list_tables()
mcp_supabase_get_advisors({ type: "security" })
```

## Migration Checklist

Before applying a migration:

- [ ] SQL syntax is correct
- [ ] Uses `IF NOT EXISTS` where appropriate
- [ ] Indexes added for foreign keys
- [ ] RLS enabled and policies created
- [ ] Tested locally first
- [ ] TypeScript types will be regenerated
- [ ] Migration is idempotent (can run multiple times)

## Resources

- [Supabase Migrations Guide](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)

## Next Steps

After applying migrations:

1. ✅ Regenerate TypeScript types
2. ✅ Update API routes if schema changed
3. ✅ Update components if data structure changed
4. ✅ Test queries with new schema
5. ✅ Update documentation

