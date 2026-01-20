-- CONSOLIDATED SCHEMA FIX
-- Use this file to fix the "missing slug/contact_email" errors in the database.
-- It combines the necessary table definitions from missed migrations.

--------------------------------------------------------------------------------
-- 1. Ensure Profiles Table (from Multi-tenancy)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff', 'client', 'admin')),
  client_id UUID, 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_client ON profiles(client_id);

--------------------------------------------------------------------------------
-- 2. Ensure Clients Table (The Core Fix)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- This is the missing column
  website_url TEXT,
  contact_email TEXT,        -- This is the missing column
  status TEXT DEFAULT 'onboarding' CHECK (status IN ('onboarding', 'active', 'paused', 'churned')),
  
  -- Brand profile data
  product_service_summary TEXT,
  target_audience TEXT,
  positioning TEXT,
  tone_of_voice JSONB,
  brand_profile JSONB,
  story_bank JSONB,
  
  -- Settings
  notification_settings JSONB,
  
  -- CMS connection
  cms_type TEXT,
  cms_base_url TEXT,
  cms_credentials JSONB,
  cms_status TEXT DEFAULT 'not_configured' CHECK (cms_status IN ('not_configured', 'connected', 'error')),
  
  -- Metadata
  onboarded_via TEXT,
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);

--------------------------------------------------------------------------------
-- 3. Ensure Blog Posts Columns
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  status TEXT DEFAULT 'idea',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Make sure columns exist if table already existed
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS final_html TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_metadata JSONB DEFAULT '{}';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS cms_publish_info JSONB DEFAULT '{}';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_notes TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS needs_revision BOOLEAN DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_type TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title TEXT;

--------------------------------------------------------------------------------
-- 4. Ensure Comments Table
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES profiles(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_role TEXT;

--------------------------------------------------------------------------------
-- 5. Helper Tables (Logs/Notifications)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  notify_on_draft_ready BOOLEAN DEFAULT true,
  notify_before_publish BOOLEAN DEFAULT true,
  notify_hours_before INTEGER DEFAULT 24,
  weekly_summary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- 6. CMS Connections Table
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    cms_type TEXT NOT NULL CHECK (cms_type IN ('wordpress', 'shopify', 'webflow', 'custom')),
    base_url TEXT NOT NULL,
    auth_payload JSONB NOT NULL,
    connection_status TEXT DEFAULT 'active',
    last_tested_at TIMESTAMP WITH TIME ZONE,
    test_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS safely
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_connections ENABLE ROW LEVEL SECURITY;
