import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/files/[id]/versions/[versionId] - Get specific version details
export async function GET(
    request: Request,
    { params }: { params: { id: string; versionId: string } }
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

        const { id: fileId, versionId } = params;

        // Get version details (RLS will check access)
        const { data: version, error } = await supabase
            .from('file_versions')
            .select(`
                *,
                uploader:profiles!uploaded_by(id, full_name, email)
            `)
            .eq('id', versionId)
            .eq('file_id', fileId)
            .single();

        if (error || !version) {
            return NextResponse.json(
                { success: false, error: 'Version not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            version
        });
    } catch (error: any) {
        console.error('Error fetching version:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch version' },
            { status: 500 }
        );
    }
}

// POST /api/files/[id]/versions/[versionId]/restore - Restore a previous version
export async function POST(
    request: Request,
    { params }: { params: { id: string; versionId: string } }
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

        const { id: fileId, versionId } = params;

        // Verify version belongs to this file
        const { data: version, error: versionError } = await supabase
            .from('file_versions')
            .select('*')
            .eq('id', versionId)
            .eq('file_id', fileId)
            .single();

        if (versionError || !version) {
            return NextResponse.json(
                { success: false, error: 'Version not found' },
                { status: 404 }
            );
        }

        // Restore version using database function
        const { error: restoreError } = await supabase.rpc(
            'restore_file_version',
            { p_version_id: versionId }
        );

        if (restoreError) throw restoreError;

        // Log the restore action
        await supabase.from('file_access_logs').insert({
            file_id: fileId,
            user_id: user.id,
            action: 'update'
        });

        return NextResponse.json({
            success: true,
            message: `Version ${version.version_number} restored successfully`
        });
    } catch (error: any) {
        console.error('Error restoring version:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to restore version' },
            { status: 500 }
        );
    }
}
