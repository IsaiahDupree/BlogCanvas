-- Migration: Vendor Onboarding and Organization Setup (feat-014)
-- This enables multi-vendor support with organization profiles and team management

-- 1. CREATE VENDORS TABLE
-- Represents vendor organizations (content agencies) that manage clients
CREATE TABLE IF NOT EXISTS vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Organization Info
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier for vendor
    email TEXT NOT NULL, -- Primary contact email
    phone TEXT,
    website TEXT,

    -- Branding
    logo_url TEXT, -- Supabase Storage path
    brand_colors JSONB DEFAULT '{"primary": "#4F46E5", "secondary": "#7C3AED", "accent": "#3B82F6"}', -- Default to BlogCanvas colors

    -- Business Info
    company_type TEXT CHECK (company_type IN ('agency', 'freelancer', 'inhouse', 'other')),
    team_size TEXT CHECK (team_size IN ('solo', 'small', 'medium', 'large')), -- 1, 2-10, 11-50, 51+
    industry_focus JSONB DEFAULT '[]', -- Array of industry tags

    -- Settings
    default_timezone TEXT DEFAULT 'America/New_York',
    notification_settings JSONB DEFAULT '{"email_enabled": true, "slack_enabled": false}',
    billing_settings JSONB DEFAULT '{}', -- Stripe customer ID, subscription info

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('onboarding', 'active', 'suspended', 'cancelled')),
    onboarded_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID -- References auth.users(id), first user who created the vendor account
);

CREATE INDEX idx_vendors_slug ON vendors(slug);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_created_by ON vendors(created_by);

COMMENT ON TABLE vendors IS 'Vendor organizations (agencies) that use BlogCanvas to manage client content';
COMMENT ON COLUMN vendors.brand_colors IS 'JSON object with primary, secondary, accent color codes for white-label branding';


-- 2. UPDATE PROFILES TABLE TO LINK TO VENDORS
-- Add vendor_id to profiles so staff/owner users belong to a vendor organization
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_profiles_vendor ON profiles(vendor_id);

COMMENT ON COLUMN profiles.vendor_id IS 'Vendor organization this user belongs to (for staff/owner roles)';


-- 3. UPDATE CLIENTS TABLE TO LINK TO VENDORS
-- Add vendor_id to clients so each client belongs to a vendor
ALTER TABLE clients ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_clients_vendor ON clients(vendor_id);

COMMENT ON COLUMN clients.vendor_id IS 'Vendor organization that manages this client';


-- 4. CREATE VENDOR_TEAM_INVITATIONS TABLE
-- Track invitations sent to team members to join a vendor organization
CREATE TABLE IF NOT EXISTS vendor_team_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,

    -- Invitation Details
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'staff')), -- Client users don't get vendor invitations
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Token
    token TEXT UNIQUE NOT NULL, -- Secure random token for invitation link
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_team_invitations_vendor ON vendor_team_invitations(vendor_id);
CREATE INDEX idx_vendor_team_invitations_email ON vendor_team_invitations(email);
CREATE INDEX idx_vendor_team_invitations_token ON vendor_team_invitations(token);
CREATE INDEX idx_vendor_team_invitations_status ON vendor_team_invitations(status);

COMMENT ON TABLE vendor_team_invitations IS 'Invitations for team members to join a vendor organization';
COMMENT ON COLUMN vendor_team_invitations.token IS 'Secure random token used in invitation link (base64 encoded)';


-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Vendors: Users can only see/manage their own vendor organization
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendors_select_own ON vendors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.vendor_id = vendors.id
        )
    );

CREATE POLICY vendors_update_own ON vendors
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.vendor_id = vendors.id
            AND profiles.role = 'owner' -- Only owners can update vendor settings
        )
    );

-- Vendor Team Invitations: Only vendor owners/staff can manage invitations
ALTER TABLE vendor_team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_team_invitations_select_own ON vendor_team_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.vendor_id = vendor_team_invitations.vendor_id
        )
    );

CREATE POLICY vendor_team_invitations_insert_own ON vendor_team_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.vendor_id = vendor_team_invitations.vendor_id
            AND profiles.role IN ('owner', 'staff')
        )
    );

CREATE POLICY vendor_team_invitations_update_own ON vendor_team_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.vendor_id = vendor_team_invitations.vendor_id
            AND profiles.role IN ('owner', 'staff')
        )
    );

-- Update existing clients RLS to respect vendor_id
DROP POLICY IF EXISTS clients_select_staff ON clients;
DROP POLICY IF EXISTS clients_select_own ON clients;

CREATE POLICY clients_select_vendor_staff ON clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.vendor_id = clients.vendor_id
            AND profiles.role IN ('owner', 'staff')
        )
    );

CREATE POLICY clients_select_vendor_client ON clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.client_id = clients.id
            AND profiles.role = 'client'
        )
    );


-- 6. FUNCTION: Generate invitation token
CREATE OR REPLACE FUNCTION generate_vendor_invitation_token()
RETURNS TEXT AS $$
DECLARE
    token TEXT;
BEGIN
    -- Generate a secure random token (base64 encoded UUID)
    token := encode(gen_random_bytes(32), 'base64');
    -- Remove URL-unsafe characters
    token := replace(token, '/', '_');
    token := replace(token, '+', '-');
    token := replace(token, '=', '');
    RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. FUNCTION: Automatically set vendor_invitation token on insert
CREATE OR REPLACE FUNCTION set_vendor_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.token IS NULL OR NEW.token = '' THEN
        NEW.token := generate_vendor_invitation_token();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER vendor_team_invitations_token_trigger
    BEFORE INSERT ON vendor_team_invitations
    FOR EACH ROW
    EXECUTE FUNCTION set_vendor_invitation_token();


-- 8. FUNCTION: Check and expire old invitations
CREATE OR REPLACE FUNCTION expire_vendor_invitations()
RETURNS void AS $$
BEGIN
    UPDATE vendor_team_invitations
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 9. TRIGGER: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendors_updated_at_trigger
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_team_invitations_updated_at_trigger
    BEFORE UPDATE ON vendor_team_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 10. SEED DATA: Create default vendor for existing users (optional migration helper)
-- This is commented out by default - uncomment if you want to migrate existing data
-- INSERT INTO vendors (name, slug, email, status, created_at)
-- VALUES ('BlogCanvas Agency', 'blogcanvas-agency', 'hello@blogcanvas.io', 'active', NOW())
-- ON CONFLICT DO NOTHING;

-- UPDATE profiles SET vendor_id = (SELECT id FROM vendors WHERE slug = 'blogcanvas-agency' LIMIT 1)
-- WHERE role IN ('owner', 'staff') AND vendor_id IS NULL;

-- UPDATE clients SET vendor_id = (SELECT id FROM vendors WHERE slug = 'blogcanvas-agency' LIMIT 1)
-- WHERE vendor_id IS NULL;


-- Comments and documentation
COMMENT ON COLUMN profiles.role IS 'User role: owner (vendor admin), staff (vendor employee), client (client user)';
COMMENT ON COLUMN clients.vendor_id IS 'The vendor organization that manages this client';
