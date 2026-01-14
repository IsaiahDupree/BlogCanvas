import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/files/[id]/download - Download file
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get file details
        const { data: file, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('id', id)
            .single();

        if (fileError || !file) {
            return NextResponse.json(
                { success: false, error: 'File not found' },
                { status: 404 }
            );
        }

        // Generate signed URL for download (valid for 1 hour)
        const { data: signedUrlData, error: urlError } = await supabaseAdmin
            .storage
            .from(file.storage_bucket)
            .createSignedUrl(file.storage_path, 3600, {
                download: file.original_filename
            });

        if (urlError || !signedUrlData) {
            console.error('Signed URL error:', urlError);
            throw new Error('Failed to generate download URL');
        }

        // Log download
        await supabaseAdmin
            .from('file_access_logs')
            .insert({
                file_id: id,
                user_id: user.id,
                action: 'download'
            });

        // Update last accessed timestamp
        await supabaseAdmin
            .from('files')
            .update({ last_accessed_at: new Date().toISOString() })
            .eq('id', id);

        return NextResponse.json({
            success: true,
            downloadUrl: signedUrlData.signedUrl,
            filename: file.original_filename,
            fileSize: file.file_size,
            fileType: file.file_type,
            expiresIn: 3600 // seconds
        });
    } catch (error: any) {
        console.error('Error generating download URL:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate download URL' },
            { status: 500 }
        );
    }
}
