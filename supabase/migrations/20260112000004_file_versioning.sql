-- ============================================
-- FILE VERSIONING SYSTEM
-- Feature: feat-018 - File versioning and sharing
-- ============================================
-- This migration adds version tracking for files,
-- allowing users to maintain revision history and
-- restore previous versions.
-- ============================================

-- ============================================
-- 1. FILE VERSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS file_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,

    -- Version identification
    version_number INTEGER NOT NULL, -- Sequential version number (1, 2, 3, ...)

    -- Storage (each version stored separately)
    storage_path TEXT NOT NULL, -- Path in Supabase Storage for this version
    storage_bucket TEXT DEFAULT 'client-files',

    -- File metadata at time of version
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,

    -- Version metadata
    title TEXT,
    description TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Change tracking
    change_summary TEXT, -- Optional: what changed in this version
    is_current BOOLEAN DEFAULT false, -- Only one version should be current

    -- Upload information
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(file_id, version_number)
);

-- ============================================
-- 2. INDEXES FOR FILE VERSIONS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_current ON file_versions(file_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_file_versions_uploaded_at ON file_versions(uploaded_at DESC);

-- ============================================
-- 3. TRIGGER TO AUTO-INCREMENT VERSION NUMBER
-- ============================================
CREATE OR REPLACE FUNCTION auto_increment_version_number()
RETURNS TRIGGER AS $$
BEGIN
    -- If version_number not provided, auto-increment
    IF NEW.version_number IS NULL THEN
        SELECT COALESCE(MAX(version_number), 0) + 1
        INTO NEW.version_number
        FROM file_versions
        WHERE file_id = NEW.file_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_increment_version_number
    BEFORE INSERT ON file_versions
    FOR EACH ROW
    EXECUTE FUNCTION auto_increment_version_number();

-- ============================================
-- 4. TRIGGER TO UPDATE is_current FLAG
-- ============================================
CREATE OR REPLACE FUNCTION update_current_version()
RETURNS TRIGGER AS $$
BEGIN
    -- If marking this version as current, unmark all other versions
    IF NEW.is_current = true THEN
        UPDATE file_versions
        SET is_current = false
        WHERE file_id = NEW.file_id
          AND id != NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_current_version
    AFTER INSERT OR UPDATE ON file_versions
    FOR EACH ROW
    WHEN (NEW.is_current = true)
    EXECUTE FUNCTION update_current_version();

-- ============================================
-- 5. FUNCTION TO CREATE NEW VERSION
-- ============================================
CREATE OR REPLACE FUNCTION create_file_version(
    p_file_id UUID,
    p_storage_path TEXT,
    p_filename TEXT,
    p_file_type TEXT,
    p_file_size BIGINT,
    p_change_summary TEXT DEFAULT NULL,
    p_uploaded_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_version_id UUID;
BEGIN
    -- Insert new version
    INSERT INTO file_versions (
        file_id,
        storage_path,
        filename,
        file_type,
        file_size,
        change_summary,
        uploaded_by,
        is_current
    )
    VALUES (
        p_file_id,
        p_storage_path,
        p_filename,
        p_file_type,
        p_file_size,
        p_change_summary,
        p_uploaded_by,
        true -- New version becomes current
    )
    RETURNING id INTO v_version_id;

    -- Update main file record to point to new version
    UPDATE files
    SET
        storage_path = p_storage_path,
        filename = p_filename,
        file_type = p_file_type,
        file_size = p_file_size,
        updated_at = NOW()
    WHERE id = p_file_id;

    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. FUNCTION TO RESTORE VERSION
-- ============================================
CREATE OR REPLACE FUNCTION restore_file_version(
    p_version_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_version RECORD;
BEGIN
    -- Get version details
    SELECT * INTO v_version
    FROM file_versions
    WHERE id = p_version_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Version not found';
    END IF;

    -- Mark this version as current
    UPDATE file_versions
    SET is_current = true
    WHERE id = p_version_id;

    -- Update main file record
    UPDATE files
    SET
        storage_path = v_version.storage_path,
        filename = v_version.filename,
        file_type = v_version.file_type,
        file_size = v_version.file_size,
        updated_at = NOW()
    WHERE id = v_version.file_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. ENHANCE FILE_SHARES TABLE
-- ============================================
-- Remove the active_share constraint that prevents shares from being stored
-- when expired or revoked (we want to keep them for audit purposes)
ALTER TABLE file_shares DROP CONSTRAINT IF EXISTS active_share;

-- Add a computed column for checking if share is active
ALTER TABLE file_shares ADD COLUMN IF NOT EXISTS is_active BOOLEAN
GENERATED ALWAYS AS (
    revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())
) STORED;

-- Add index for active shares
CREATE INDEX IF NOT EXISTS idx_file_shares_active ON file_shares(is_active) WHERE is_active = true;

-- ============================================
-- 8. INDEXES FOR FILE_SHARES (if not exists)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_token ON file_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_file_shares_expires_at ON file_shares(expires_at);

-- ============================================
-- 9. RLS POLICIES FOR FILE_VERSIONS
-- ============================================
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;

-- Vendors can view all versions of their files
CREATE POLICY "Vendors can view their file versions"
    ON file_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM files
            WHERE files.id = file_versions.file_id
              AND files.vendor_id IN (
                  SELECT id FROM vendors WHERE user_id = auth.uid()
              )
        )
    );

-- Clients can view versions of files they own
CREATE POLICY "Clients can view their file versions"
    ON file_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM files
            WHERE files.id = file_versions.file_id
              AND files.client_id IN (
                  SELECT id FROM clients WHERE user_id = auth.uid()
              )
        )
    );

-- Only vendors can create new versions
CREATE POLICY "Vendors can create file versions"
    ON file_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM files
            WHERE files.id = file_versions.file_id
              AND files.vendor_id IN (
                  SELECT id FROM vendors WHERE user_id = auth.uid()
              )
        )
    );

-- ============================================
-- 10. RLS POLICIES FOR FILE_SHARES
-- ============================================
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;

-- Users can view shares for files they own
CREATE POLICY "Users can view shares for their files"
    ON file_shares FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM files
            WHERE files.id = file_shares.file_id
              AND (
                  files.vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
                  OR files.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
              )
        )
    );

-- Users can create shares for files they own
CREATE POLICY "Users can create shares for their files"
    ON file_shares FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM files
            WHERE files.id = file_shares.file_id
              AND (
                  files.vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
                  OR files.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
              )
        )
    );

-- Users can update/revoke their own shares
CREATE POLICY "Users can update their file shares"
    ON file_shares FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM files
            WHERE files.id = file_shares.file_id
              AND (
                  files.vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
                  OR files.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
              )
        )
    );

-- ============================================
-- 11. COMMENTS
-- ============================================
COMMENT ON TABLE file_versions IS 'Stores version history for files, allowing revision tracking and restoration';
COMMENT ON TABLE file_shares IS 'Shareable file links with permissions and expiration';
COMMENT ON FUNCTION create_file_version IS 'Creates a new file version and updates the main file record';
COMMENT ON FUNCTION restore_file_version IS 'Restores a previous version as the current version';
