-- Multi-tenancy and role-based access schema

-- User profiles with roles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff', 'client')),
  client_id UUID, -- Only set for client users
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_client ON profiles(client_id);

-- Clients (brands/companies using the service)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  website_url TEXT,
  contact_email TEXT,
  status TEXT DEFAULT 'onboarding' CHECK (status IN ('onboarding', 'active', 'paused', 'churned')),
  
  -- Brand profile data
  product_service_summary TEXT,
  target_audience TEXT,
  positioning TEXT,
  tone_of_voice JSONB, -- Sliders, preferences
  brand_profile JSONB, -- Structured data (phrases, stories)
  story_bank JSONB, -- Array of stories
  
  -- Settings
  notification_settings JSONB,
  
  -- CMS connection
  cms_type TEXT, -- 'wordpress', 'webflow', etc.
  cms_base_url TEXT,
  cms_credentials JSONB, -- Encrypted
  cms_status TEXT DEFAULT 'not_configured' CHECK (cms_status IN ('not_configured', 'connected', 'error')),
  
  -- Metadata
  onboarded_via TEXT, -- 'site_scan', 'manual_intake'
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);

-- Add client_id to blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_blog_posts_client ON blog_posts(client_id);

-- Client notification preferences
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

-- Activity log for audit trail
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'updated', 'approved', 'published', etc.
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_client ON activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_post ON activity_log(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- Update blog_posts to track who did what
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Update comments to link to users
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES profiles(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_role TEXT;

-- Row Level Security (RLS) policies

-- Profiles: users can read their own profile, staff/owner can read all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_select_staff ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'staff')
    )
  );

-- Clients: staff/owner see all, clients see only their own
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_select_staff ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'staff')
    )
  );

CREATE POLICY clients_select_own ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND client_id = clients.id
    )
  );

-- Blog posts: staff/owner see all, clients see only their own
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY blog_posts_select_staff ON blog_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'staff')
    )
  );

CREATE POLICY blog_posts_select_client ON blog_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND client_id = blog_posts.client_id
    )
  );
