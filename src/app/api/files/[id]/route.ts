import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/files/[id] - Get file details
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

        // Fetch file with related data
        const { data: file, error } = await supabase
            .from('files')
            .select(`
                *,
                folder:file_folders(id, name, color, icon),
                uploader:profiles!uploaded_by(id, full_name, email),
                client:clients(id, name),
                vendor:vendors(id, name)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'File not found' },
                { status: 404 }
            );
        }

        // Update last accessed timestamp
        await supabaseAdmin
            .from('files')
            .update({ last_accessed_at: new Date().toISOString() })
            .eq('id', id);

        // Log access
        await supabaseAdmin
            .from('file_access_logs')
            .insert({
                file_id: id,
                user_id: user.id,
                action: 'view'
            });

        return NextResponse.json({
            success: true,
            file
        });
    } catch (error: any) {
        console.error('Error fetching file:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch file' },
            { status: 500 }
        );
    }
}

// PATCH /api/files/[id] - Update file metadata
export async function PATCH(
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
        const body = await request.json();

        const {
            title,
            description,
            tags,
            folder_id,
            status,
            metadata
        } = body;

        // Build update object
        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (tags !== undefined) updates.tags = tags;
        if (folder_id !== undefined) updates.folder_id = folder_id;
        if (status !== undefined) updates.status = status;
        if (metadata !== undefined) updates.metadata = metadata;

        // Update file
        const { data: file, error } = await supabase
            .from('files')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log access
        await supabaseAdmin
            .from('file_access_logs')
            .insert({
                file_id: id,
                user_id: user.id,
                action: 'update'
            });

        return NextResponse.json({
            success: true,
            file,
            message: 'File updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating file:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update file' },
            { status: 500 }
        );
    }
}

// DELETE /api/files/[id] - Delete file (soft delete by default)
export async function DELETE(
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

        const { id } = params;
        const { searchParams } = new URL(request.url);
        const hardDelete = searchParams.get('hard') === 'true';

        // Get file details for storage deletion
        const { data: file } = await supabase
            .from('files')
            .select('storage_path, storage_bucket')
            .eq('id', id)
            .single();

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'File not found' },
                { status: 404 }
            );
        }

        if (hardDelete) {
            // Delete from storage
            const { error: storageError } = await supabaseAdmin
                .storage
                .from(file.storage_bucket)
                .remove([file.storage_path]);

            if (storageError) {
                console.error('Storage deletion error:', storageError);
            }

            // Delete from database
            const { error } = await supabase
                .from('files')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } else {
            // Soft delete - mark as deleted
            const { error } = await supabase
                .from('files')
                .update({ status: 'deleted' })
                .eq('id', id);

            if (error) throw error;
        }

        // Log access
        await supabaseAdmin
            .from('file_access_logs')
            .insert({
                file_id: id,
                user_id: user.id,
                action: 'delete'
            });

        return NextResponse.json({
            success: true,
            message: hardDelete ? 'File permanently deleted' : 'File moved to trash'
        });
    } catch (error: any) {
        console.error('Error deleting file:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete file' },
            { status: 500 }
        );
    }
}
