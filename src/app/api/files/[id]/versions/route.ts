import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/files/[id]/versions - Get version history for a file
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const fileId = params.id;

        // Verify user has access to this file (RLS will handle this)
        const { data: file, error: fileError } = await supabase
            .from('files')
            .select('id, filename, client_id, vendor_id')
            .eq('id', fileId)
            .single();

        if (fileError || !file) {
            return NextResponse.json(
                { success: false, error: 'File not found' },
                { status: 404 }
            );
        }

        // Get all versions
        const { data: versions, error: versionsError } = await supabase
            .from('file_versions')
            .select(`
                *,
                uploader:profiles!uploaded_by(id, full_name, email)
            `)
            .eq('file_id', fileId)
            .order('version_number', { ascending: false });

        if (versionsError) throw versionsError;

        return NextResponse.json({
            success: true,
            file,
            versions: versions || []
        });
    } catch (error: any) {
        console.error('Error fetching file versions:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch versions' },
            { status: 500 }
        );
    }
}

// POST /api/files/[id]/versions - Create a new version
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const fileId = params.id;
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const changeSummary = formData.get('change_summary') as string;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Verify user owns this file
        const { data: existingFile, error: fileError } = await supabase
            .from('files')
            .select('id, vendor_id, client_id, storage_bucket')
            .eq('id', fileId)
            .single();

        if (fileError || !existingFile) {
            return NextResponse.json(
                { success: false, error: 'File not found' },
                { status: 404 }
            );
        }

        // Upload new version to storage
        const timestamp = Date.now();
        const storagePath = `versions/${fileId}/${timestamp}_${file.name}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from(existingFile.storage_bucket || 'client-files')
            .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Create version record using the database function
        const { data: versionData, error: versionError } = await supabase.rpc(
            'create_file_version',
            {
                p_file_id: fileId,
                p_storage_path: storagePath,
                p_filename: file.name,
                p_file_type: file.type,
                p_file_size: file.size,
                p_change_summary: changeSummary,
                p_uploaded_by: user.id
            }
        );

        if (versionError) throw versionError;

        // Log the upload
        await supabase.from('file_access_logs').insert({
            file_id: fileId,
            user_id: user.id,
            action: 'upload'
        });

        return NextResponse.json({
            success: true,
            version_id: versionData,
            message: 'New version created successfully'
        });
    } catch (error: any) {
        console.error('Error creating file version:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create version' },
            { status: 500 }
        );
    }
}
