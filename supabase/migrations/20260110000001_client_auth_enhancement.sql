-- Client Authentication Enhancement
-- Epic 4: Authentication - feat-001
-- Adds client invitation system and client sub-roles (client_admin, client_reviewer)

-- Step 1: Update profiles table to support client sub-roles
-- First, drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with client sub-roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'staff', 'client', 'client_admin', 'client_reviewer'));

-- Add client_role column to track sub-role for client users
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS client_role TEXT
  CHECK (client_role IN ('admin', 'reviewer') OR client_role IS NULL);

-- Index for client_role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_client_role ON profiles(client_role) WHERE client_role IS NOT NULL;

-- Step 2: Create client_invitations table
CREATE TABLE IF NOT EXISTS client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client_admin', 'client_reviewer')),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for invitation lookups
CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON client_invitations(token);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON client_invitations(email);
CREATE INDEX IF NOT EXISTS idx_client_invitations_client ON client_invitations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_status ON client_invitations(status);

-- Function to generate secure random token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE client_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Step 3: Add RLS policies for client_invitations

ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

-- Staff/owner can see all invitations
CREATE POLICY client_invitations_select_staff ON client_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'staff')
    )
  );

-- Client admins can see invitations for their client
CREATE POLICY client_invitations_select_client_admin ON client_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND client_id = client_invitations.client_id
        AND (role = 'client_admin' OR client_role = 'admin')
    )
  );

-- Staff/owner can create invitations
CREATE POLICY client_invitations_insert_staff ON client_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'staff')
    )
  );

-- Client admins can create invitations for their client
CREATE POLICY client_invitations_insert_client_admin ON client_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND client_id = client_invitations.client_id
        AND (role = 'client_admin' OR client_role = 'admin')
    )
  );

-- Staff/owner can update invitations
CREATE POLICY client_invitations_update_staff ON client_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'staff')
    )
  );

-- Step 4: Create helper function to validate invitation and create user
CREATE OR REPLACE FUNCTION validate_and_accept_invitation(
  p_token TEXT,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  client_id UUID,
  role TEXT
) AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Fetch the invitation
  SELECT * INTO v_invitation
  FROM client_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Invalid or expired invitation token'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- Update the invitation status
  UPDATE client_invitations
  SET status = 'accepted',
      accepted_at = NOW(),
      updated_at = NOW()
  WHERE id = v_invitation.id;

  -- Update the user profile with client info
  UPDATE profiles
  SET client_id = v_invitation.client_id,
      role = v_invitation.role,
      client_role = CASE
        WHEN v_invitation.role = 'client_admin' THEN 'admin'
        WHEN v_invitation.role = 'client_reviewer' THEN 'reviewer'
        ELSE NULL
      END,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN QUERY SELECT TRUE, 'Invitation accepted successfully'::TEXT, v_invitation.client_id, v_invitation.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Update existing 'client' role users to 'client_admin' for backward compatibility
UPDATE profiles
SET role = 'client_admin',
    client_role = 'admin'
WHERE role = 'client'
  AND client_id IS NOT NULL;

-- Step 6: Add comment for documentation
COMMENT ON TABLE client_invitations IS 'Stores invitation tokens for client users to join their organization';
COMMENT ON FUNCTION validate_and_accept_invitation IS 'Validates invitation token and updates user profile with client access';
COMMENT ON COLUMN profiles.client_role IS 'Sub-role for client users: admin (full access) or reviewer (review-only)';
