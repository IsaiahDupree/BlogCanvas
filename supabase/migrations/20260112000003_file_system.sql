-- ============================================
-- FILE SYSTEM FOR BLOGCANVAS
-- Feature: feat-017 - Secure file upload with organization
-- ============================================
-- This migration creates a comprehensive file management system
-- with support for folders, metadata, tagging, and RLS policies.
-- ============================================

-- ============================================
-- 1. STORAGE BUCKET
-- ============================================
-- Create a storage bucket for file uploads
-- Note: This needs to be created in Supabase dashboard or via API
-- Bucket name: 'client-files'
-- Public: false (requires authentication)
-- Max file size: 100MB (104857600 bytes)

-- ============================================
-- 2. FILE FOLDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS file_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_folder_id UUID REFERENCES file_folders(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6', -- Hex color for folder display
    icon TEXT DEFAULT 'folder', -- Icon identifier
    is_system BOOLEAN DEFAULT false, -- System folders cannot be deleted
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT folder_owner_check CHECK (
        (client_id IS NOT NULL AND vendor_id IS NULL) OR
        (client_id IS NULL AND vendor_id IS NOT NULL)
    )
);

-- ============================================
-- 3. FILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- File identification
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL, -- MIME type (e.g., 'image/png', 'application/pdf')
    file_extension TEXT, -- e.g., 'pdf', 'jpg', 'docx'
    file_size BIGINT NOT NULL, -- Size in bytes

    -- Storage
    storage_path TEXT NOT NULL UNIQUE, -- Path in Supabase Storage
    storage_bucket TEXT DEFAULT 'client-files',

    -- Organization
    folder_id UUID REFERENCES file_folders(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,

    -- Metadata
    title TEXT, -- User-friendly title
    description TEXT,
    tags TEXT[], -- Array of tags for searchability
    metadata JSONB DEFAULT '{}', -- Additional metadata (dimensions, duration, etc.)

    -- Status and visibility
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    is_public BOOLEAN DEFAULT false,

    -- References (optional links to other entities)
    related_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
    related_batch_id UUID REFERENCES content_batches(id) ON DELETE SET NULL,
    related_work_id UUID REFERENCES work_declarations(id) ON DELETE SET NULL,

    -- Upload information
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),

    -- Processing status (for images, documents, etc.)
    is_processed BOOLEAN DEFAULT false,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_error TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT file_owner_check CHECK (
        (client_id IS NOT NULL AND vendor_id IS NULL) OR
        (client_id IS NULL AND vendor_id IS NOT NULL)
    )
);

-- ============================================
-- 4. FILE SHARES TABLE (for sharing files via links)
-- ============================================
CREATE TABLE IF NOT EXISTS file_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    share_token TEXT NOT NULL UNIQUE,

    -- Share configuration
    permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'download', 'edit')),
    expires_at TIMESTAMPTZ,
    is_password_protected BOOLEAN DEFAULT false,
    password_hash TEXT, -- bcrypt hash if password protected

    -- Usage tracking
    max_downloads INTEGER, -- NULL = unlimited
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,

    -- Metadata
    shared_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,

    -- Active status (not revoked and not expired)
    CONSTRAINT active_share CHECK (
        revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())
    )
);

-- ============================================
-- 5. FILE ACCESS LOG (for audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS file_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- NULL for public/shared access
    share_id UUID REFERENCES file_shares(id) ON DELETE SET NULL,

    -- Access details
    action TEXT NOT NULL CHECK (action IN ('view', 'download', 'upload', 'update', 'delete', 'share')),
    ip_address TEXT,
    user_agent TEXT,

    -- Timestamps
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_files_client ON files(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_vendor ON files(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_storage_path ON files(storage_path);
CREATE INDEX IF NOT EXISTS idx_files_tags ON files USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_file_folders_client ON file_folders(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_file_folders_vendor ON file_folders(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_file_folders_parent ON file_folders(parent_folder_id) WHERE parent_folder_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_file_shares_file ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_token ON file_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_file_shares_expires ON file_shares(expires_at);

CREATE INDEX IF NOT EXISTS idx_file_access_logs_file ON file_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_user ON file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_accessed_at ON file_access_logs(accessed_at DESC);

-- ============================================
-- 7. FUNCTIONS
-- ============================================

-- Function to generate share token
CREATE OR REPLACE FUNCTION generate_file_share_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;

-- Function to update file updated_at timestamp
CREATE OR REPLACE FUNCTION update_file_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Function to update folder updated_at timestamp
CREATE OR REPLACE FUNCTION update_folder_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Function to get folder path (breadcrumb trail)
CREATE OR REPLACE FUNCTION get_folder_path(folder_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    level INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE folder_tree AS (
        -- Base case: start with the given folder
        SELECT
            f.id,
            f.name,
            f.parent_folder_id,
            0 as level
        FROM file_folders f
        WHERE f.id = folder_id

        UNION ALL

        -- Recursive case: get parent folders
        SELECT
            f.id,
            f.name,
            f.parent_folder_id,
            ft.level + 1
        FROM file_folders f
        INNER JOIN folder_tree ft ON f.id = ft.parent_folder_id
    )
    SELECT ft.id, ft.name, ft.level
    FROM folder_tree ft
    ORDER BY ft.level DESC;
END;
$$;

-- Function to check if share link is valid
CREATE OR REPLACE FUNCTION is_share_link_valid(token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    share_record RECORD;
BEGIN
    SELECT * INTO share_record
    FROM file_shares
    WHERE share_token = token
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_downloads IS NULL OR download_count < max_downloads);

    RETURN FOUND;
END;
$$;

-- ============================================
-- 8. TRIGGERS
-- ============================================

-- Trigger to update file timestamp on update
CREATE TRIGGER update_file_timestamp_trigger
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_file_timestamp();

-- Trigger to update folder timestamp on update
CREATE TRIGGER update_folder_timestamp_trigger
    BEFORE UPDATE ON file_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_folder_timestamp();

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. RLS POLICIES - FILES
-- ============================================

-- Vendors can view all files they own
CREATE POLICY "Vendors can view their files"
    ON files FOR SELECT
    USING (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Vendors can insert files for their organization
CREATE POLICY "Vendors can upload files"
    ON files FOR INSERT
    WITH CHECK (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Vendors can update their files
CREATE POLICY "Vendors can update their files"
    ON files FOR UPDATE
    USING (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Vendors can delete their files
CREATE POLICY "Vendors can delete their files"
    ON files FOR DELETE
    USING (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Clients can view files in their organization
CREATE POLICY "Clients can view their files"
    ON files FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE id IN (
                SELECT client_id FROM client_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Clients can upload files to their organization
CREATE POLICY "Clients can upload files"
    ON files FOR INSERT
    WITH CHECK (
        client_id IN (
            SELECT id FROM clients WHERE id IN (
                SELECT client_id FROM client_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================
-- 11. RLS POLICIES - FILE FOLDERS
-- ============================================

-- Vendors can manage their folders
CREATE POLICY "Vendors can view their folders"
    ON file_folders FOR SELECT
    USING (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Vendors can create folders"
    ON file_folders FOR INSERT
    WITH CHECK (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Vendors can update their folders"
    ON file_folders FOR UPDATE
    USING (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        ) AND is_system = false
    );

CREATE POLICY "Vendors can delete their folders"
    ON file_folders FOR DELETE
    USING (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        ) AND is_system = false
    );

-- Clients can view their folders
CREATE POLICY "Clients can view their folders"
    ON file_folders FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE id IN (
                SELECT client_id FROM client_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================
-- 12. RLS POLICIES - FILE SHARES
-- ============================================

-- Users can view shares they created
CREATE POLICY "Users can view their shares"
    ON file_shares FOR SELECT
    USING (shared_by = auth.uid());

-- Users can create shares for files they own
CREATE POLICY "Users can create file shares"
    ON file_shares FOR INSERT
    WITH CHECK (
        file_id IN (
            SELECT id FROM files
            WHERE uploaded_by = auth.uid()
            OR vendor_id IN (SELECT vendor_id FROM profiles WHERE id = auth.uid())
        )
    );

-- Users can update their shares
CREATE POLICY "Users can update their shares"
    ON file_shares FOR UPDATE
    USING (shared_by = auth.uid());

-- Users can delete their shares
CREATE POLICY "Users can delete their shares"
    ON file_shares FOR DELETE
    USING (shared_by = auth.uid());

-- ============================================
-- 13. RLS POLICIES - FILE ACCESS LOGS
-- ============================================

-- Vendors can view access logs for their files
CREATE POLICY "Vendors can view file access logs"
    ON file_access_logs FOR SELECT
    USING (
        file_id IN (
            SELECT id FROM files
            WHERE vendor_id IN (
                SELECT vendor_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Allow system to insert access logs
CREATE POLICY "System can insert access logs"
    ON file_access_logs FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 14. DEFAULT FOLDERS (Optional)
-- ============================================
-- These will be created via application code when vendors/clients are onboarded
-- Examples: "Documents", "Images", "Brand Assets", "Content Drafts", etc.

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Create 'client-files' storage bucket in Supabase dashboard
-- 2. Configure bucket policies for authenticated access
-- 3. Set max file size to 100MB
-- 4. Apply this migration: npx supabase db push
-- 5. Test file upload/download functionality
-- ============================================
