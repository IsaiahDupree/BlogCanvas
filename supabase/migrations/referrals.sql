-- Referral & Affiliate System Migration
-- PRD: PRD_REFERRAL_AFFILIATE_SYSTEM.md
-- Created: 2026-01-19

-- ============================================================================
-- REFERRAL PROGRAMS CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_type TEXT NOT NULL CHECK (program_type IN ('vendor', 'client', 'affiliate')),
  name TEXT NOT NULL,

  -- Commission settings
  commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value DECIMAL(10,2) NOT NULL CHECK (commission_value >= 0),
  commission_duration_months INTEGER CHECK (commission_duration_months > 0), -- NULL = lifetime

  -- Payout settings
  minimum_payout DECIMAL(10,2) DEFAULT 50.00 CHECK (minimum_payout >= 0),
  payout_schedule TEXT DEFAULT 'monthly' CHECK (payout_schedule IN ('weekly', 'monthly', 'manual')),

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AFFILIATES (External Partners)
-- ============================================================================

CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  website TEXT,

  -- Application
  application_notes TEXT,
  promotion_methods TEXT[], -- ['blog', 'youtube', 'email', 'social']
  audience_size TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,

  -- Payout
  payout_method TEXT DEFAULT 'paypal' CHECK (payout_method IN ('stripe', 'paypal', 'bank_transfer', 'credit')),
  payout_email TEXT,
  stripe_account_id TEXT,

  -- Terms
  agreed_to_terms BOOLEAN DEFAULT false,
  agreed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- REFERRAL CODES/LINKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES referral_programs(id) ON DELETE CASCADE,

  -- Owner (one of these will be set)
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  client_id UUID REFERENCES vendor_clients(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,

  -- Code details
  code TEXT NOT NULL UNIQUE,
  custom_slug TEXT UNIQUE,

  -- Tracking
  clicks INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint to ensure exactly one owner is set
ALTER TABLE referral_codes ADD CONSTRAINT referral_codes_owner_check
  CHECK (
    (vendor_id IS NOT NULL AND client_id IS NULL AND affiliate_id IS NULL) OR
    (vendor_id IS NULL AND client_id IS NOT NULL AND affiliate_id IS NULL) OR
    (vendor_id IS NULL AND client_id IS NULL AND affiliate_id IS NOT NULL)
  );

-- ============================================================================
-- REFERRALS TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID REFERENCES referral_codes(id) ON DELETE SET NULL,
  program_id UUID REFERENCES referral_programs(id) ON DELETE SET NULL,

  -- Referrer (one of these)
  referrer_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  referrer_client_id UUID REFERENCES vendor_clients(id) ON DELETE SET NULL,
  referrer_affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,

  -- Referred party (one of these)
  referred_vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  referred_client_id UUID REFERENCES vendor_clients(id) ON DELETE CASCADE,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'converted', 'churned', 'fraudulent')),
  qualified_at TIMESTAMPTZ, -- When they became paying customer

  -- Attribution
  landing_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint to ensure at least one referrer and one referred party
ALTER TABLE referrals ADD CONSTRAINT referrals_referrer_check
  CHECK (referrer_vendor_id IS NOT NULL OR referrer_client_id IS NOT NULL OR referrer_affiliate_id IS NOT NULL);

ALTER TABLE referrals ADD CONSTRAINT referrals_referred_check
  CHECK (referred_vendor_id IS NOT NULL OR referred_client_id IS NOT NULL);

-- ============================================================================
-- COMMISSION EARNINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
  referral_code_id UUID REFERENCES referral_codes(id) ON DELETE SET NULL,

  -- Referrer (one of these)
  referrer_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  referrer_affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,

  -- Transaction that triggered commission
  source_type TEXT NOT NULL CHECK (source_type IN ('subscription', 'one_time', 'renewal')),
  source_id UUID NOT NULL, -- order_id or subscription_id
  source_amount DECIMAL(10,2) NOT NULL CHECK (source_amount >= 0),

  -- Commission
  commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0),
  commission_amount DECIMAL(10,2) NOT NULL CHECK (commission_amount >= 0),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'reversed')),

  -- Payout reference
  payout_id UUID REFERENCES referral_payouts(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PAYOUTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient (one of these)
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,

  -- Amount
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',

  -- Method
  payout_method TEXT NOT NULL CHECK (payout_method IN ('stripe', 'paypal', 'bank_transfer', 'credit')),
  payout_details JSONB, -- Method-specific details

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMPTZ,

  -- Reference
  external_reference TEXT, -- Stripe transfer ID, etc.
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CLICK TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID REFERENCES referral_codes(id) ON DELETE CASCADE,

  -- Visitor info (privacy-preserving)
  ip_hash TEXT, -- Hashed for privacy
  user_agent TEXT,
  landing_page TEXT,
  referrer_url TEXT,

  -- UTM parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Conversion tracking
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_vendor ON referral_codes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_client ON referral_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_affiliate ON referral_codes(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_vendor ON referrals(referrer_vendor_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_client ON referrals(referrer_client_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_affiliate ON referrals(referrer_affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_vendor ON referrals(referred_vendor_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_client ON referrals(referred_client_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

CREATE INDEX IF NOT EXISTS idx_commissions_referrer_vendor ON referral_commissions(referrer_vendor_id);
CREATE INDEX IF NOT EXISTS idx_commissions_referrer_affiliate ON referral_commissions(referrer_affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON referral_commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_payout ON referral_commissions(payout_id);

CREATE INDEX IF NOT EXISTS idx_payouts_vendor ON referral_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payouts_affiliate ON referral_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON referral_payouts(status);

CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON affiliates(email);

CREATE INDEX IF NOT EXISTS idx_clicks_code ON referral_clicks(referral_code_id);
CREATE INDEX IF NOT EXISTS idx_clicks_converted ON referral_clicks(converted) WHERE converted = true;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE referral_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;

-- Referral Programs: Anyone can read active programs, only admins can modify
CREATE POLICY "Anyone can view active programs" ON referral_programs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage programs" ON referral_programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Affiliates: Users can view own profile, admins can view all
CREATE POLICY "Users can view own affiliate profile" ON affiliates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all affiliates" ON affiliates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Users can apply as affiliate" ON affiliates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending application" ON affiliates
  FOR UPDATE USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all affiliates" ON affiliates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Referral Codes: Owners can view/manage their codes
CREATE POLICY "Vendors can view own referral codes" ON referral_codes
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Clients can view own referral codes" ON referral_codes
  FOR SELECT USING (
    client_id IN (SELECT id FROM vendor_clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Affiliates can view own referral codes" ON referral_codes
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Vendors can manage own referral codes" ON referral_codes
  FOR ALL USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Affiliates can manage own referral codes" ON referral_codes
  FOR ALL USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

-- Referrals: Referrers can view their referrals
CREATE POLICY "Vendors can view own referrals" ON referrals
  FOR SELECT USING (
    referrer_vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Clients can view own referrals" ON referrals
  FOR SELECT USING (
    referrer_client_id IN (SELECT id FROM vendor_clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Affiliates can view own referrals" ON referrals
  FOR SELECT USING (
    referrer_affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

-- Commissions: Referrers can view their commissions
CREATE POLICY "Vendors can view own commissions" ON referral_commissions
  FOR SELECT USING (
    referrer_vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Affiliates can view own commissions" ON referral_commissions
  FOR SELECT USING (
    referrer_affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

-- Payouts: Recipients can view their payouts
CREATE POLICY "Vendors can view own payouts" ON referral_payouts
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Affiliates can view own payouts" ON referral_payouts
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

-- Clicks: No user access (system only)
CREATE POLICY "No direct access to clicks" ON referral_clicks
  FOR SELECT USING (false);

-- ============================================================================
-- DEFAULT PROGRAMS
-- ============================================================================

-- Insert default referral programs
INSERT INTO referral_programs (program_type, name, commission_type, commission_value, commission_duration_months, minimum_payout, payout_schedule)
VALUES
  ('vendor', 'Vendor Referral Program', 'percentage', 20.00, 12, 50.00, 'monthly'),
  ('client', 'Client Referral Program', 'fixed', 25.00, NULL, 0.00, 'manual'),
  ('affiliate', 'Affiliate Partner Program', 'percentage', 25.00, 6, 100.00, 'monthly')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(base_text TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code from base_text or random string
    IF base_text IS NOT NULL THEN
      code := LOWER(REGEXP_REPLACE(base_text, '[^a-zA-Z0-9]', '-', 'g')) || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
    ELSE
      code := SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10);
    END IF;

    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE referral_codes.code = code) INTO exists;

    -- Exit loop if code is unique
    EXIT WHEN NOT exists;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to update referral code stats
CREATE OR REPLACE FUNCTION increment_referral_code_clicks(code_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE referral_codes
  SET clicks = clicks + 1
  WHERE id = code_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_referral_code_signups(code_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE referral_codes
  SET signups = signups + 1
  WHERE id = code_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_referral_code_conversions(code_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE referral_codes
  SET conversions = conversions + 1
  WHERE id = code_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_referral_programs_updated_at BEFORE UPDATE ON referral_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE referral_programs IS 'Configuration for different referral program types';
COMMENT ON TABLE affiliates IS 'External affiliate partners who promote the platform';
COMMENT ON TABLE referral_codes IS 'Unique referral codes/links for tracking';
COMMENT ON TABLE referrals IS 'Tracks individual referral relationships';
COMMENT ON TABLE referral_commissions IS 'Commission earnings from referrals';
COMMENT ON TABLE referral_payouts IS 'Payout records to referrers';
COMMENT ON TABLE referral_clicks IS 'Click tracking for referral links';
