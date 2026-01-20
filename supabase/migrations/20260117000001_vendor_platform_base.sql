-- Vendor Offer Platform - Base Tables
-- This migration creates the core vendor, offer pages, clients, and workspaces infrastructure

-- ============================================================================
-- VENDORS
-- ============================================================================

-- Vendors table: Each vendor can create offer pages and manage clients
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  handle TEXT UNIQUE NOT NULL, -- URL-friendly identifier for /@handle
  business_name TEXT NOT NULL,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,

  -- Branding
  brand_color TEXT DEFAULT '#000000',
  logo_url TEXT,

  -- Settings
  timezone TEXT DEFAULT 'UTC',

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_handle ON vendors(handle);
CREATE INDEX idx_vendors_status ON vendors(status);

-- Handle uniqueness constraint
CREATE UNIQUE INDEX idx_vendors_handle_lower ON vendors(LOWER(handle));

-- ============================================================================
-- VENDOR TEAM MEMBERS (for future multi-user support)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, user_id)
);

CREATE INDEX idx_vendor_members_vendor ON vendor_members(vendor_id);
CREATE INDEX idx_vendor_members_user ON vendor_members(user_id);

-- ============================================================================
-- OFFER PAGES
-- ============================================================================

-- Offer pages: Landing pages with block-based content
CREATE TABLE IF NOT EXISTS offer_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Page details
  title TEXT NOT NULL,
  slug TEXT NOT NULL, -- URL slug for /@handle/slug
  description TEXT,

  -- Content (JSON blocks)
  blocks JSONB DEFAULT '[]'::jsonb, -- Array of block objects

  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,

  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,

  -- Analytics
  view_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, slug)
);

CREATE INDEX idx_offer_pages_vendor ON offer_pages(vendor_id);
CREATE INDEX idx_offer_pages_slug ON offer_pages(vendor_id, slug);
CREATE INDEX idx_offer_pages_published ON offer_pages(is_published, published_at);

-- ============================================================================
-- OFFERS (Pricing Configuration)
-- ============================================================================

-- Offers: Pricing configuration for offer pages
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES offer_pages(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Offer details
  name TEXT NOT NULL,
  description TEXT,

  -- Pricing
  offer_type TEXT NOT NULL CHECK (offer_type IN ('one_time', 'subscription', 'retainer', 'book_call')),
  base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',

  -- Subscription-specific
  billing_period TEXT CHECK (billing_period IN ('monthly', 'annual', 'weekly', NULL)),

  -- Quote mode
  is_quote_mode BOOLEAN DEFAULT false, -- If true, leads submit info instead of paying

  -- Stripe
  stripe_product_id TEXT,
  stripe_price_id TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offers_page ON offers(page_id);
CREATE INDEX idx_offers_vendor ON offers(vendor_id);
CREATE INDEX idx_offers_active ON offers(is_active);

-- ============================================================================
-- OFFER ADD-ONS
-- ============================================================================

-- Add-ons: Optional extras (setup fee, revisions, rush, etc.)
CREATE TABLE IF NOT EXISTS offer_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Add-on details
  name TEXT NOT NULL,
  description TEXT,
  addon_type TEXT NOT NULL CHECK (addon_type IN ('setup_fee', 'rush_delivery', 'extra_revisions', 'retainer_upgrade', 'custom')),

  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Stripe
  stripe_product_id TEXT,
  stripe_price_id TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offer_addons_offer ON offer_addons(offer_id);
CREATE INDEX idx_offer_addons_vendor ON offer_addons(vendor_id);

-- ============================================================================
-- CLIENTS (Purchasers)
-- ============================================================================

-- Clients: People who purchase from vendors
CREATE TABLE IF NOT EXISTS vendor_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable if they haven't registered

  -- Client info
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,

  -- Attribution
  first_page_id UUID REFERENCES offer_pages(id) ON DELETE SET NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Status
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'customer', 'churned')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, email)
);

CREATE INDEX idx_vendor_clients_vendor ON vendor_clients(vendor_id);
CREATE INDEX idx_vendor_clients_user ON vendor_clients(user_id);
CREATE INDEX idx_vendor_clients_status ON vendor_clients(status);
CREATE INDEX idx_vendor_clients_email ON vendor_clients(vendor_id, email);

-- ============================================================================
-- WORKSPACES (Client-Vendor Relationship Container)
-- ============================================================================

-- Workspaces: Container for vendor-client engagement
CREATE TABLE IF NOT EXISTS vendor_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES vendor_clients(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  page_id UUID REFERENCES offer_pages(id) ON DELETE SET NULL,

  -- Workspace details
  name TEXT NOT NULL, -- e.g., "Newsletter Audit - Acme Corp"

  -- Status
  status TEXT DEFAULT 'onboarding' CHECK (status IN ('onboarding', 'active', 'completed', 'paused', 'cancelled')),

  -- Timeline
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_workspaces_vendor ON vendor_workspaces(vendor_id);
CREATE INDEX idx_vendor_workspaces_client ON vendor_workspaces(client_id);
CREATE INDEX idx_vendor_workspaces_status ON vendor_workspaces(status);

-- ============================================================================
-- ORDERS
-- ============================================================================

-- Orders: Purchase records
CREATE TABLE IF NOT EXISTS vendor_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES vendor_clients(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES vendor_workspaces(id) ON DELETE SET NULL,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE RESTRICT,

  -- Order details
  order_number TEXT UNIQUE NOT NULL, -- Human-readable order number

  -- Pricing
  base_amount DECIMAL(10, 2) NOT NULL,
  addons_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Payment
  payment_method TEXT CHECK (payment_method IN ('stripe', 'manual', NULL)),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),

  -- Stripe
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_orders_vendor ON vendor_orders(vendor_id);
CREATE INDEX idx_vendor_orders_client ON vendor_orders(client_id);
CREATE INDEX idx_vendor_orders_workspace ON vendor_orders(workspace_id);
CREATE INDEX idx_vendor_orders_status ON vendor_orders(payment_status);
CREATE INDEX idx_vendor_orders_number ON vendor_orders(order_number);

-- ============================================================================
-- ORDER LINE ITEMS
-- ============================================================================

-- Order line items: Individual items in an order (base + add-ons)
CREATE TABLE IF NOT EXISTS vendor_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES vendor_orders(id) ON DELETE CASCADE,

  -- Item details
  item_type TEXT NOT NULL CHECK (item_type IN ('base_offer', 'addon')),
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  addon_id UUID REFERENCES offer_addons(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  description TEXT,

  -- Pricing
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_order_items_order ON vendor_order_items(order_id);

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================

-- Subscriptions: Recurring subscriptions
CREATE TABLE IF NOT EXISTS vendor_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES vendor_clients(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES vendor_workspaces(id) ON DELETE SET NULL,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE RESTRICT,

  -- Subscription details
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),

  -- Pricing
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'annual', 'weekly')),

  -- Stripe
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  -- Dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_subscriptions_vendor ON vendor_subscriptions(vendor_id);
CREATE INDEX idx_vendor_subscriptions_client ON vendor_subscriptions(client_id);
CREATE INDEX idx_vendor_subscriptions_status ON vendor_subscriptions(status);
CREATE INDEX idx_vendor_subscriptions_stripe ON vendor_subscriptions(stripe_subscription_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Vendors: Users can only access their own vendor record
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendors_own_record ON vendors
  FOR ALL USING (user_id = auth.uid());

-- Vendor members: Members can access their vendor
ALTER TABLE vendor_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_members_access ON vendor_members
  FOR ALL USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM vendor_members vm
      WHERE vm.vendor_id = vendor_members.vendor_id
      AND vm.user_id = auth.uid()
    )
  );

-- Offer pages: Vendors can manage their own pages, public can view published pages
ALTER TABLE offer_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY offer_pages_vendor_all ON offer_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = offer_pages.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY offer_pages_public_select ON offer_pages
  FOR SELECT USING (is_published = true);

-- Offers: Vendors can manage their own offers
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY offers_vendor_all ON offers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = offers.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Offer add-ons: Vendors can manage their own add-ons
ALTER TABLE offer_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY offer_addons_vendor_all ON offer_addons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = offer_addons.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Vendor clients: Vendors can access their clients, clients can view their own record
ALTER TABLE vendor_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_clients_vendor_all ON vendor_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_clients.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY vendor_clients_own_select ON vendor_clients
  FOR SELECT USING (user_id = auth.uid());

-- Vendor workspaces: Vendors and clients can access
ALTER TABLE vendor_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_workspaces_vendor_all ON vendor_workspaces
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_workspaces.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY vendor_workspaces_client_select ON vendor_workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vendor_clients
      WHERE vendor_clients.id = vendor_workspaces.client_id
      AND vendor_clients.user_id = auth.uid()
    )
  );

-- Vendor orders: Vendors and clients can access
ALTER TABLE vendor_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_orders_vendor_all ON vendor_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_orders.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY vendor_orders_client_select ON vendor_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vendor_clients
      WHERE vendor_clients.id = vendor_orders.client_id
      AND vendor_clients.user_id = auth.uid()
    )
  );

-- Order items: Same as orders
ALTER TABLE vendor_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_order_items_via_order ON vendor_order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendor_orders
      JOIN vendors ON vendors.id = vendor_orders.vendor_id
      WHERE vendor_orders.id = vendor_order_items.order_id
      AND vendors.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM vendor_orders
      JOIN vendor_clients ON vendor_clients.id = vendor_orders.client_id
      WHERE vendor_orders.id = vendor_order_items.order_id
      AND vendor_clients.user_id = auth.uid()
    )
  );

-- Subscriptions: Vendors and clients can access
ALTER TABLE vendor_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_subscriptions_vendor_all ON vendor_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_subscriptions.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY vendor_subscriptions_client_select ON vendor_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vendor_clients
      WHERE vendor_clients.id = vendor_subscriptions.client_id
      AND vendor_clients.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    new_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM vendor_orders WHERE order_number = new_order_number
    );

    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Could not generate unique order number';
    END IF;
  END LOOP;

  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER offer_pages_updated_at BEFORE UPDATE ON offer_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER offers_updated_at BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER offer_addons_updated_at BEFORE UPDATE ON offer_addons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_clients_updated_at BEFORE UPDATE ON vendor_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_workspaces_updated_at BEFORE UPDATE ON vendor_workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_orders_updated_at BEFORE UPDATE ON vendor_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_subscriptions_updated_at BEFORE UPDATE ON vendor_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
