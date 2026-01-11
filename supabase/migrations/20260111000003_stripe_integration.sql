-- Migration: Stripe Integration for Billing and Subscriptions
-- Date: 2026-01-11
-- Description: Add tables for Stripe subscription management, invoices, and payment tracking

-- =====================================================
-- 0. ADD STRIPE CUSTOMER ID TO CLIENTS TABLE
-- =====================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- =====================================================
-- 1. STRIPE ACCOUNTS (Vendor Stripe Connect)
-- =====================================================
CREATE TABLE IF NOT EXISTS stripe_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  is_connected BOOLEAN DEFAULT FALSE,
  livemode BOOLEAN DEFAULT FALSE,
  account_type TEXT DEFAULT 'standard', -- standard, express, custom
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  details_submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. SUBSCRIPTION PLANS
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_price_id TEXT NOT NULL,
  stripe_product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  interval TEXT NOT NULL, -- month, year, week
  interval_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. SUBSCRIPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL, -- active, canceled, incomplete, past_due, trialing, unpaid
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. INVOICES
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_due INTEGER NOT NULL, -- in cents
  amount_paid INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL, -- draft, open, paid, void, uncollectible
  description TEXT,
  invoice_number TEXT,
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. PAYMENT LINKS
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  stripe_payment_link_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  description TEXT,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. WEBHOOK EVENTS (for audit trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_stripe_accounts_vendor ON stripe_accounts(vendor_id);
CREATE INDEX idx_subscription_plans_vendor ON subscription_plans(vendor_id);
CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_stripe_id ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payment_links_vendor ON payment_links(vendor_id);
CREATE INDEX idx_payment_links_client ON payment_links(client_id);
CREATE INDEX idx_stripe_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX idx_stripe_webhook_events_processed ON stripe_webhook_events(processed);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Stripe Accounts: Vendors can manage their own
CREATE POLICY "Vendors can view own stripe account"
  ON stripe_accounts FOR SELECT
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can insert own stripe account"
  ON stripe_accounts FOR INSERT
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update own stripe account"
  ON stripe_accounts FOR UPDATE
  USING (vendor_id = auth.uid());

-- Subscription Plans: Vendors can manage their plans
CREATE POLICY "Vendors can view own subscription plans"
  ON subscription_plans FOR SELECT
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can create subscription plans"
  ON subscription_plans FOR INSERT
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update own subscription plans"
  ON subscription_plans FOR UPDATE
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can delete own subscription plans"
  ON subscription_plans FOR DELETE
  USING (vendor_id = auth.uid());

-- Subscriptions: Clients and vendor can view
CREATE POLICY "Clients can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE id = client_id
      AND (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM client_staff WHERE client_id = clients.id AND user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Vendors can view subscriptions for their clients"
  ON subscriptions FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE owner_id IN (
        SELECT id FROM auth.users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Vendors can create subscriptions for their clients"
  ON subscriptions FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update subscriptions for their clients"
  ON subscriptions FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM clients WHERE owner_id = auth.uid()
    )
  );

-- Invoices: Similar to subscriptions
CREATE POLICY "Clients can view own invoices"
  ON invoices FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE id = client_id
      AND (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM client_staff WHERE client_id = clients.id AND user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Vendors can view invoices for their clients"
  ON invoices FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can create invoices for their clients"
  ON invoices FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update invoices for their clients"
  ON invoices FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM clients WHERE owner_id = auth.uid()
    )
  );

-- Payment Links: Vendors manage their links
CREATE POLICY "Vendors can view own payment links"
  ON payment_links FOR SELECT
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can create payment links"
  ON payment_links FOR INSERT
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update own payment links"
  ON payment_links FOR UPDATE
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can delete own payment links"
  ON payment_links FOR DELETE
  USING (vendor_id = auth.uid());

-- Webhook Events: Service role only (webhooks bypass RLS)
CREATE POLICY "Service role can manage webhook events"
  ON stripe_webhook_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stripe_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER stripe_accounts_updated_at
  BEFORE UPDATE ON stripe_accounts
  FOR EACH ROW EXECUTE FUNCTION update_stripe_updated_at();

CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_stripe_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_stripe_updated_at();

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_stripe_updated_at();

CREATE TRIGGER payment_links_updated_at
  BEFORE UPDATE ON payment_links
  FOR EACH ROW EXECUTE FUNCTION update_stripe_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE stripe_accounts IS 'Vendor Stripe Connect accounts for receiving payments';
COMMENT ON TABLE subscription_plans IS 'Subscription plan templates created by vendors';
COMMENT ON TABLE subscriptions IS 'Active subscriptions linking clients to plans';
COMMENT ON TABLE invoices IS 'Invoices generated for projects or subscriptions';
COMMENT ON TABLE payment_links IS 'One-time payment links for ad-hoc work';
COMMENT ON TABLE stripe_webhook_events IS 'Audit trail of Stripe webhook events';
