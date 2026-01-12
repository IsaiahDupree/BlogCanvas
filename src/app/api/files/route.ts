import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/files - List files with optional filtering
export async function GET(request: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const folderId = searchParams.get('folder_id');
        const clientId = searchParams.get('client_id');
        const status = searchParams.get('status') || 'active';
        const tags = searchParams.get('tags')?.split(',').filter(Boolean);
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query
        let query = supabase
            .from('files')
            .select(`
                *,
                folder:file_folders(id, name, color),
                uploader:profiles!uploaded_by(id, full_name, email)
            `, { count: 'exact' })
            .eq('status', status)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (folderId) {
            query = query.eq('folder_id', folderId);
        }

        if (clientId) {
            query = query.eq('client_id', clientId);
        }

        if (tags && tags.length > 0) {
            query = query.contains('tags', tags);
        }

        if (search) {
            query = query.or(`filename.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data: files, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            files,
            pagination: {
                total: count || 0,
                limit,
                offset,
                hasMore: (count || 0) > offset + limit
            }
        });
    } catch (error: any) {
        console.error('Error fetching files:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch files' },
            { status: 500 }
        );
    }
}

// POST /api/files - Upload a new file
export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user's profile to determine vendor_id or client_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('vendor_id')
            .eq('id', user.id)
            .single();

        // Get client_id if user is a client
        const { data: clientProfile } = await supabase
            .from('client_profiles')
            .select('client_id')
            .eq('user_id', user.id)
            .single();

        const vendorId = profile?.vendor_id || null;
        const clientId = clientProfile?.client_id || null;

        if (!vendorId && !clientId) {
            return NextResponse.json(
                { success: false, error: 'User must be associated with a vendor or client' },
                { status: 403 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folderId = formData.get('folder_id') as string | null;
        const title = formData.get('title') as string | null;
        const description = formData.get('description') as string | null;
        const tags = formData.get('tags') as string | null;
        const isPublic = formData.get('is_public') === 'true';

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file size (100MB max)
        const maxSize = 100 * 1024 * 1024; // 100MB in bytes
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: 'File size exceeds 100MB limit' },
                { status: 400 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop() || '';
        const uniqueFilename = `${timestamp}-${randomString}.${fileExtension}`;

        // Determine storage path
        const orgPrefix = vendorId ? `vendor/${vendorId}` : `client/${clientId}`;
        const folderPath = folderId ? `${folderId}/` : '';
        const storagePath = `${orgPrefix}/${folderPath}${uniqueFilename}`;

        // Upload to Supabase Storage
        const fileBuffer = await file.arrayBuffer();
        const { data: uploadData, error: uploadError } = await supabaseAdmin
            .storage
            .from('client-files')
            .upload(storagePath, fileBuffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        // Create file record in database
        const { data: fileRecord, error: dbError } = await supabaseAdmin
            .from('files')
            .insert({
                filename: uniqueFilename,
                original_filename: file.name,
                file_type: file.type,
                file_extension: fileExtension,
                file_size: file.size,
                storage_path: storagePath,
                storage_bucket: 'client-files',
                folder_id: folderId || null,
                client_id: clientId,
                vendor_id: vendorId,
                title: title || file.name,
                description: description || null,
                tags: tags ? tags.split(',').map(t => t.trim()) : [],
                is_public: isPublic,
                uploaded_by: user.id,
                processing_status: 'completed'
            })
            .select()
            .single();

        if (dbError) {
            // Rollback: delete uploaded file
            await supabaseAdmin.storage.from('client-files').remove([storagePath]);
            console.error('Database error:', dbError);
            throw dbError;
        }

        // Log access
        await supabaseAdmin
            .from('file_access_logs')
            .insert({
                file_id: fileRecord.id,
                user_id: user.id,
                action: 'upload'
            });

        return NextResponse.json({
            success: true,
            file: fileRecord,
            message: 'File uploaded successfully'
        });
    } catch (error: any) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to upload file' },
            { status: 500 }
        );
    }
}
