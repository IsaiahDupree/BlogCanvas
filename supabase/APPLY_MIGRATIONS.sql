-- Apply migrations in order to Supabase
-- Run these manually in your Supabase SQL Editor

-- 1. Initial Schema
\i supabase/migrations/20241204000000_initial_schema.sql

-- 2. Enable RLS
\i supabase/migrations/20241204000001_enable_rls.sql

-- 3. Website Scraper
\i supabase/migrations/20241204000001_website_scraper.sql

-- 4. Brand Guides
\i supabase/migrations/20241204000002_brand_guides.sql

-- 5. Multi-Tenancy
\i supabase/migrations/20241204000003_multi_tenancy.sql

-- 6. Add Indexes
\i supabase/migrations/20241204000004_add_indexes.sql

-- 7. RLS for New Tables
\i supabase/migrations/20241204000005_rls_new_tables.sql
