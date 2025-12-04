-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clients Table
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL, -- references auth.users(id) in a real Supabase setup
  name text NOT NULL,
  primary_contact_email text,
  website_url text,
  has_website boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. Client Profiles (for detailed brand info)
CREATE TABLE client_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  product_service_summary text,
  target_audience text,
  positioning text,
  tone_of_voice text,
  competitors text,
  keywords jsonb,          -- ["email marketing", "shopify", ...]
  locations jsonb,         -- ["US", "Austin, TX", ...]
  acquisition_channels jsonb,
  extra_notes text,
  updated_at timestamptz DEFAULT now()
);

-- 3. Website Pages (crawled content)
CREATE TABLE website_pages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text,
  html text,
  clean_text text,
  crawl_job_id uuid,
  created_at timestamptz DEFAULT now()
);

-- 4. Blog Posts
CREATE TYPE blog_post_status AS ENUM (
  'idea', 'researching', 'outlining', 'drafting', 'editing',
  'needs_human_input', 'ready_for_review', 'approved',
  'scheduled', 'published', 'rejected',
  'research_failed', 'outline_failed', 'draft_failed' -- Added failure states
);

CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  topic text NOT NULL,
  target_keyword text,
  status blog_post_status DEFAULT 'idea',
  tone_of_voice text,
  target_audience text,
  word_count_goal int,
  goal text, -- traffic, authority, etc.
  seo_notes text,
  research_context jsonb,            -- processed website + profile summary
  outline jsonb,                     -- TOC + sections
  draft jsonb,                       -- structured sections content snapshot
  seo_metadata jsonb,                -- title tag, meta desc, slug, og tags
  image_briefs jsonb,                -- [{section_id, prompt, license_note}]
  final_html text,                   -- rendered HTML
  cms_publish_info jsonb,            -- post_id, url, published_at
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Blog Post Sections (Granular content)
CREATE TABLE blog_post_sections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  section_key text NOT NULL,      -- 'intro', 'section_1', 'conclusion', etc.
  title text,
  type text,                      -- 'intro', 'body', 'conclusion', 'cta', 'faq'
  order_index int NOT NULL,
  content text,
  ai_content jsonb,               -- raw AI output / metadata
  needs_human boolean DEFAULT false,
  human_prompt text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(blog_post_id, section_key)
);

-- 6. Agent Runs (Logging)
CREATE TABLE agent_runs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE SET NULL,
  agent_name text NOT NULL,       -- 'research', 'outline', 'draft', 'seo', 'tone', 'images'
  status text NOT NULL,           -- 'queued', 'running', 'succeeded', 'failed'
  input_summary jsonb,
  output_summary jsonb,
  error_message text,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz
);

-- 7. Review Tasks & Comments
CREATE TABLE review_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  section_id uuid REFERENCES blog_post_sections(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',     -- pending, resolved
  description text NOT NULL,
  assigned_to uuid,                  -- user id
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  section_id uuid REFERENCES blog_post_sections(id) ON DELETE CASCADE,
  user_id uuid,                      -- user id
  author_name text,                  -- fallback if no user_id
  content text NOT NULL,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. CMS Connections
CREATE TABLE cms_connections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  cms_type text NOT NULL,         -- 'wordpress', 'ghost', 'webflow', ...
  base_url text NOT NULL,
  auth_payload jsonb NOT NULL,    -- {username, app_password} or tokens
  created_at timestamptz DEFAULT now()
);
