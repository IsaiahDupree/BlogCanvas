-- ============================================
-- REPORTS STORAGE BUCKET
-- Feature: feat-114 - Slide deck report generation with storage
-- ============================================
-- This migration creates a storage bucket for generated reports
-- (slide decks, PDFs, etc.) with public read access
-- ============================================

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================
-- Note: Storage buckets in Supabase need to be created via the dashboard or API
-- This migration documents the required configuration:
--
-- Bucket name: 'reports'
-- Public: true (for easy sharing of generated reports)
-- Max file size: 50MB (52428800 bytes)
-- Allowed MIME types: text/html, application/pdf, application/json
-- File size limit: 50MB per file
--
-- To create manually via Supabase dashboard:
-- 1. Go to Storage
-- 2. Click "New bucket"
-- 3. Name: reports
-- 4. Public bucket: Yes
-- 5. File size limit: 50MB
--
-- Or via SQL (requires service role):
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('reports', 'reports', true, 52428800, ARRAY['text/html', 'application/pdf', 'application/json']);

-- ============================================
-- STORAGE POLICIES
-- ============================================
-- Even though the bucket is public, we want to control who can upload/delete

-- Allow authenticated users to upload reports
CREATE POLICY IF NOT EXISTS "Authenticated users can upload reports"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'reports');

-- Allow public read access (reports can be shared publicly)
CREATE POLICY IF NOT EXISTS "Public can view reports"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'reports');

-- Only authenticated users can delete their own reports
CREATE POLICY IF NOT EXISTS "Authenticated users can delete their reports"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'reports' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- VERIFY REPORTS TABLE HAS storage_url COLUMN
-- ============================================
-- The storage_url column should already exist from previous migrations
-- This is just a safety check

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'reports'
        AND column_name = 'storage_url'
    ) THEN
        ALTER TABLE reports ADD COLUMN storage_url TEXT;
    END IF;
END $$;

-- ============================================
-- ADD INDEX ON storage_url FOR FASTER LOOKUPS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reports_storage_url ON reports(storage_url) WHERE storage_url IS NOT NULL;

-- ============================================
-- MIGRATION NOTES
-- ============================================
-- After running this migration:
-- 1. Ensure the 'reports' bucket exists in Supabase Storage
-- 2. Verify public access is enabled for the bucket
-- 3. Test slide deck generation via /api/reports/generate with format=slide_deck
-- 4. Verify generated HTML is accessible via the public URL
-- ============================================
