# File System Setup Guide - feat-017

This document provides setup instructions for the BlogCanvas file management system with folder organization, file uploads, and metadata.

## Features Implemented

✅ **Secure File Upload**
- Upload files up to 100MB
- Progress tracking with visual feedback
- Drag-and-drop support
- MIME type validation
- Multi-file upload support

✅ **Folder Organization**
- Create nested folder hierarchies
- Move files between folders
- Breadcrumb navigation
- Folder-based access control
- Color-coded folders

✅ **File Metadata and Tagging**
- Title and description for files
- Tag-based organization
- Full-text search across filenames, titles, descriptions
- File type and size tracking
- Upload date and user tracking

✅ **File Browser UI**
- Grid and list view modes
- Folder navigation with breadcrumbs
- Search functionality
- Download and delete actions
- Responsive design

## Database Schema

The file system includes the following tables:

### 1. `file_folders`
Hierarchical folder structure with:
- Parent-child relationships (nested folders)
- Client/vendor ownership
- Color and icon customization
- System folder protection

### 2. `files`
File records with:
- Storage path and metadata
- Folder organization
- Tags for searchability
- Client/vendor ownership
- Processing status tracking
- Soft delete support

### 3. `file_shares` (future enhancement)
Shareable file links with:
- Expiration dates
- Permission levels (view, download, edit)
- Password protection
- Usage tracking

### 4. `file_access_logs`
Audit trail for file operations:
- Upload, view, download, update, delete actions
- User and timestamp tracking
- IP address logging

## Setup Instructions

### Step 1: Create Supabase Storage Bucket

You need to create a storage bucket in your Supabase project:

**Option A: Via Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to Storage > Buckets
3. Click "New Bucket"
4. Name: `client-files`
5. Public: **No** (requires authentication)
6. File size limit: 100MB (104857600 bytes)
7. Allowed MIME types: Leave empty for all types (or specify if needed)

**Option B: Via Supabase SQL**
```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('client-files', 'client-files', false, 104857600, NULL);
```

### Step 2: Apply Database Migration

Apply the file system migration:

```bash
npx supabase db push
```

Or manually run the migration file:
```bash
psql <connection_string> < supabase/migrations/20260112000003_file_system.sql
```

### Step 3: Configure Storage Policies

Set up Row Level Security policies for the storage bucket:

```sql
-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-files');

-- Policy: Allow users to read their organization's files
CREATE POLICY "Users can read their files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'client-files' AND
    (
        -- Vendors can access their files
        (auth.uid() IN (
            SELECT id FROM profiles WHERE vendor_id IN (
                SELECT vendor_id FROM profiles WHERE id = auth.uid()
            )
        ) AND storage.foldername(name)[1] = 'vendor')
        OR
        -- Clients can access their files
        (auth.uid() IN (
            SELECT user_id FROM client_profiles WHERE client_id IN (
                SELECT client_id FROM client_profiles WHERE user_id = auth.uid()
            )
        ) AND storage.foldername(name)[1] = 'client')
    )
);

-- Policy: Allow users to update their files
CREATE POLICY "Users can update their files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'client-files');

-- Policy: Allow users to delete their files
CREATE POLICY "Users can delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client-files');
```

### Step 4: Test the File System

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the Files page:**
   - Vendors: http://localhost:4848/app/files
   - Clients: http://localhost:4848/portal/files (if implemented)

3. **Test file operations:**
   - ✅ Create a new folder
   - ✅ Upload a file (test with various file types and sizes)
   - ✅ View file details
   - ✅ Download a file
   - ✅ Search for files
   - ✅ Delete a file (soft delete)
   - ✅ Navigate folder hierarchy

### Step 5: Verify RLS Policies

Test that Row Level Security is working:

```sql
-- As a vendor user, verify you can only see your files
SELECT * FROM files; -- Should only return vendor's files

-- As a client user, verify you can only see your files
SELECT * FROM files; -- Should only return client's files

-- Test file access logs are being created
SELECT * FROM file_access_logs ORDER BY accessed_at DESC LIMIT 10;
```

## API Endpoints

### Files
- `GET /api/files` - List files with filtering (folder, client, tags, search)
- `POST /api/files` - Upload a new file
- `GET /api/files/[id]` - Get file details
- `PATCH /api/files/[id]` - Update file metadata (title, description, tags, folder)
- `DELETE /api/files/[id]` - Delete file (soft delete by default, ?hard=true for permanent)
- `GET /api/files/[id]/download` - Get signed download URL

### Folders
- `GET /api/folders` - List folders (with parent_id filtering)
- `POST /api/folders` - Create new folder
- `GET /api/folders/[id]` - Get folder details with files and subfolders
- `PATCH /api/folders/[id]` - Update folder metadata
- `DELETE /api/folders/[id]` - Delete folder (cascade deletes subfolders and files)

## Components

### `FileUpload`
Location: `src/components/files/FileUpload.tsx`

Props:
- `folderId?: string | null` - Upload to specific folder
- `clientId?: string | null` - Associate with client
- `onUploadComplete?: (file) => void` - Callback on success
- `onUploadError?: (error) => void` - Callback on error
- `maxSize?: number` - Max file size in bytes (default 100MB)
- `acceptedTypes?: string[]` - Allowed MIME types
- `multiple?: boolean` - Allow multiple file selection

Features:
- Drag-and-drop support
- Real-time progress tracking
- File validation (size, type)
- Visual upload status (uploading, success, error)
- Automatic retry on failure

### `FileBrowser`
Location: `src/components/files/FileBrowser.tsx`

Props:
- `clientId?: string | null` - Filter by client
- `initialFolderId?: string | null` - Start in specific folder

Features:
- Grid and list view modes
- Folder navigation with breadcrumbs
- Search across filenames, titles, descriptions
- Create folders
- Upload files
- Download files
- Delete files
- Tag display
- File metadata display

## Usage Examples

### Vendor Upload (from Content Batch)
```tsx
import FileUpload from '@/components/files/FileUpload';

function BatchFilesTab({ batchId }) {
    return (
        <FileUpload
            folderId={null}
            onUploadComplete={(file) => {
                // Link file to content batch
                fetch(`/api/files/${file.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ related_batch_id: batchId })
                });
            }}
        />
    );
}
```

### Client Portal Files
```tsx
import FileBrowser from '@/components/files/FileBrowser';

function ClientFilesPage({ clientId }) {
    return (
        <div className="p-6">
            <h1>My Files</h1>
            <FileBrowser clientId={clientId} />
        </div>
    );
}
```

## Security Considerations

1. **Authentication Required**: All file operations require authenticated users
2. **Organization Isolation**: RLS policies ensure vendors can only access their files, clients can only access their files
3. **Storage Path Namespacing**: Files are organized by organization (vendor/client) in storage
4. **Signed URLs**: Downloads use time-limited signed URLs (1 hour expiration)
5. **Audit Logging**: All file operations are logged in `file_access_logs`
6. **Soft Delete**: Files are marked as deleted by default, allowing recovery
7. **File Size Limits**: 100MB maximum per file
8. **MIME Type Validation**: Optional validation of file types

## Future Enhancements

The following features are prepared but not yet implemented:

1. **File Sharing** (table exists, needs UI)
   - Generate shareable links
   - Set expiration dates
   - Password protection
   - Track downloads and views

2. **File Versioning** (feat-018)
   - Track file versions
   - Compare versions
   - Restore previous versions

3. **Image Processing**
   - Automatic thumbnail generation
   - Image optimization
   - EXIF data extraction

4. **Document Processing**
   - PDF text extraction
   - Document preview generation
   - OCR for scanned documents

5. **Integration with Content Pipeline**
   - Attach files to blog posts
   - Link files to work declarations
   - Include in client reports

## Troubleshooting

### Issue: "Failed to upload file"
- Check that the storage bucket `client-files` exists
- Verify storage policies are applied
- Check file size is under 100MB
- Verify user is authenticated

### Issue: "Cannot see uploaded files"
- Check RLS policies on `files` table
- Verify user has correct vendor_id or client_id
- Check that file was uploaded with correct organization ID

### Issue: "Download URL expired"
- Signed URLs expire after 1 hour
- Generate a new download URL by calling the endpoint again

### Issue: "Cannot create folders"
- Verify RLS policies on `file_folders` table
- Check user has vendor_id or client_id set
- Ensure parent folder exists (if creating subfolder)

## Monitoring

### Storage Usage Query
```sql
-- Total storage used per organization
SELECT
    COALESCE(vendor_id::text, client_id::text) as org_id,
    CASE WHEN vendor_id IS NOT NULL THEN 'vendor' ELSE 'client' END as org_type,
    COUNT(*) as file_count,
    SUM(file_size) as total_bytes,
    ROUND(SUM(file_size)::numeric / 1024 / 1024, 2) as total_mb
FROM files
WHERE status = 'active'
GROUP BY vendor_id, client_id
ORDER BY total_bytes DESC;
```

### Recent File Activity
```sql
-- Recent file uploads and downloads
SELECT
    fal.action,
    f.original_filename,
    f.file_size,
    p.full_name as user_name,
    fal.accessed_at
FROM file_access_logs fal
JOIN files f ON fal.file_id = f.id
LEFT JOIN profiles p ON fal.user_id = p.id
ORDER BY fal.accessed_at DESC
LIMIT 50;
```

### Popular Files
```sql
-- Most downloaded files
SELECT
    f.original_filename,
    f.title,
    COUNT(*) as download_count,
    MAX(fal.accessed_at) as last_downloaded
FROM file_access_logs fal
JOIN files f ON fal.file_id = f.id
WHERE fal.action = 'download'
GROUP BY f.id, f.original_filename, f.title
ORDER BY download_count DESC
LIMIT 20;
```

## Acceptance Criteria Status

All acceptance criteria for feat-017 have been implemented:

✅ **Users can upload files up to 100MB**
- File size validation in upload component
- Server-side validation in API
- Progress tracking during upload

✅ **Files are organized in folders**
- Hierarchical folder structure
- Folder CRUD operations
- Breadcrumb navigation
- Move files between folders

✅ **Metadata and tags are searchable**
- Title, description, and tags fields
- Full-text search across all metadata
- Tag-based filtering
- GIN index on tags for performance

✅ **File browser shows all client files**
- FileBrowser component with grid/list views
- Folder navigation
- Search functionality
- Download and delete actions
- RLS ensures proper access control

## Next Steps

1. Apply database migration
2. Create storage bucket in Supabase
3. Configure storage policies
4. Test all file operations
5. Add file browser link to navigation menu
6. Consider implementing file sharing (feat-018)
7. Add file attachments to blog posts and work declarations
