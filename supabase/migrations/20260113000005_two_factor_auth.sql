-- Two-Factor Authentication (2FA/MFA) System
-- Epic 16: Security - feat-040
-- Implements TOTP-based 2FA with backup codes and recovery flow

-- Step 1: Create table to track 2FA status and settings per user
CREATE TABLE IF NOT EXISTS user_2fa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- 2FA Status
  enabled BOOLEAN DEFAULT FALSE NOT NULL,
  enforced BOOLEAN DEFAULT FALSE NOT NULL, -- True for admin users who must use 2FA

  -- TOTP Configuration
  totp_secret TEXT, -- Encrypted TOTP secret
  totp_verified BOOLEAN DEFAULT FALSE NOT NULL,

  -- Recovery
  backup_codes_generated_at TIMESTAMPTZ,
  backup_codes_count INTEGER DEFAULT 0,

  -- Metadata
  enabled_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for 2FA settings lookups
CREATE INDEX IF NOT EXISTS idx_user_2fa_settings_user_id ON user_2fa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_settings_enabled ON user_2fa_settings(enabled) WHERE enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_2fa_settings_enforced ON user_2fa_settings(enforced) WHERE enforced = TRUE;

-- Step 2: Create backup codes table
CREATE TABLE IF NOT EXISTS user_2fa_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Code (hashed for security)
  code_hash TEXT NOT NULL,

  -- Status
  used BOOLEAN DEFAULT FALSE NOT NULL,
  used_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for backup codes
CREATE INDEX IF NOT EXISTS idx_user_2fa_backup_codes_user_id ON user_2fa_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_backup_codes_unused ON user_2fa_backup_codes(user_id, used) WHERE used = FALSE;

-- Step 3: Create audit log for 2FA events
CREATE TABLE IF NOT EXISTS user_2fa_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    '2fa_enabled',
    '2fa_disabled',
    '2fa_verified_success',
    '2fa_verified_failed',
    'backup_code_used',
    'backup_codes_regenerated',
    '2fa_enforced',
    '2fa_recovery_initiated'
  )),

  -- Context
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_user_2fa_audit_log_user_id ON user_2fa_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_audit_log_event_type ON user_2fa_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_user_2fa_audit_log_created_at ON user_2fa_audit_log(created_at DESC);

-- Step 4: Add RLS policies for user_2fa_settings
ALTER TABLE user_2fa_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own 2FA settings
CREATE POLICY user_2fa_settings_select_own ON user_2fa_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own 2FA settings
CREATE POLICY user_2fa_settings_update_own ON user_2fa_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own 2FA settings
CREATE POLICY user_2fa_settings_insert_own ON user_2fa_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Staff/owner can view all 2FA settings (for support)
CREATE POLICY user_2fa_settings_select_staff ON user_2fa_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'staff')
    )
  );

-- Step 5: Add RLS policies for user_2fa_backup_codes
ALTER TABLE user_2fa_backup_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own backup codes
CREATE POLICY user_2fa_backup_codes_select_own ON user_2fa_backup_codes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own backup codes
CREATE POLICY user_2fa_backup_codes_insert_own ON user_2fa_backup_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own backup codes (mark as used)
CREATE POLICY user_2fa_backup_codes_update_own ON user_2fa_backup_codes
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own backup codes (when regenerating)
CREATE POLICY user_2fa_backup_codes_delete_own ON user_2fa_backup_codes
  FOR DELETE USING (auth.uid() = user_id);

-- Step 6: Add RLS policies for user_2fa_audit_log
ALTER TABLE user_2fa_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit log
CREATE POLICY user_2fa_audit_log_select_own ON user_2fa_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert audit logs (SECURITY DEFINER functions)
CREATE POLICY user_2fa_audit_log_insert_system ON user_2fa_audit_log
  FOR INSERT WITH CHECK (TRUE);

-- Staff/owner can view all audit logs (for security monitoring)
CREATE POLICY user_2fa_audit_log_select_staff ON user_2fa_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'staff')
    )
  );

-- Step 7: Create function to log 2FA events
CREATE OR REPLACE FUNCTION log_2fa_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO user_2fa_audit_log (user_id, event_type, ip_address, user_agent, metadata)
  VALUES (p_user_id, p_event_type, p_ip_address, p_user_agent, p_metadata)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create function to check if user has valid backup codes
CREATE OR REPLACE FUNCTION user_has_backup_codes(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_2fa_backup_codes
    WHERE user_id = p_user_id AND used = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create function to enforce 2FA for admin users
CREATE OR REPLACE FUNCTION enforce_2fa_for_admins()
RETURNS void AS $$
BEGIN
  -- Create 2FA settings for all owner/staff users if not exists
  INSERT INTO user_2fa_settings (user_id, enforced)
  SELECT p.id, TRUE
  FROM profiles p
  WHERE p.role IN ('owner', 'staff')
    AND NOT EXISTS (
      SELECT 1 FROM user_2fa_settings WHERE user_id = p.id
    );

  -- Set enforced flag for existing admin users
  UPDATE user_2fa_settings
  SET enforced = TRUE, updated_at = NOW()
  WHERE user_id IN (
    SELECT id FROM profiles WHERE role IN ('owner', 'staff')
  )
  AND enforced = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create trigger to auto-create 2FA settings for new users
CREATE OR REPLACE FUNCTION create_2fa_settings_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is admin (owner/staff)
  IF NEW.role IN ('owner', 'staff') THEN
    INSERT INTO user_2fa_settings (user_id, enforced)
    VALUES (NEW.id, TRUE)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO user_2fa_settings (user_id, enforced)
    VALUES (NEW.id, FALSE)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_2fa_settings
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_2fa_settings_for_new_user();

-- Step 11: Create trigger to enforce 2FA when user role changes to admin
CREATE OR REPLACE FUNCTION enforce_2fa_on_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role changed to owner/staff, enforce 2FA
  IF NEW.role IN ('owner', 'staff') AND OLD.role NOT IN ('owner', 'staff') THEN
    UPDATE user_2fa_settings
    SET enforced = TRUE, updated_at = NOW()
    WHERE user_id = NEW.id;

    -- Log the event
    PERFORM log_2fa_event(NEW.id, '2fa_enforced', NULL, NULL,
      jsonb_build_object('reason', 'role_changed_to_admin', 'old_role', OLD.role, 'new_role', NEW.role)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_2fa_on_role_change
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION enforce_2fa_on_role_change();

-- Step 12: Automatically create 2FA settings for existing users
INSERT INTO user_2fa_settings (user_id, enforced)
SELECT p.id, CASE WHEN p.role IN ('owner', 'staff') THEN TRUE ELSE FALSE END
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_2fa_settings WHERE user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 13: Run the enforcement function for existing admins
SELECT enforce_2fa_for_admins();

-- Step 14: Add comments for documentation
COMMENT ON TABLE user_2fa_settings IS 'Stores 2FA configuration and status for each user';
COMMENT ON TABLE user_2fa_backup_codes IS 'Stores hashed backup codes for 2FA recovery';
COMMENT ON TABLE user_2fa_audit_log IS 'Audit log for all 2FA-related events';
COMMENT ON FUNCTION log_2fa_event IS 'Logs 2FA events with context for security monitoring';
COMMENT ON FUNCTION user_has_backup_codes IS 'Checks if user has unused backup codes available';
COMMENT ON FUNCTION enforce_2fa_for_admins IS 'Enforces 2FA requirement for all admin users';
