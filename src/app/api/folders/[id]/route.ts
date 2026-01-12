import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/folders/[id] - Get folder details with files
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

        const { id } = params;

        // Get folder details
        const { data: folder, error: folderError } = await supabase
            .from('file_folders')
            .select(`
                *,
                parent:file_folders!parent_folder_id(id, name),
                creator:profiles!created_by(id, full_name)
            `)
            .eq('id', id)
            .single();

        if (folderError) throw folderError;

        // Get files in this folder
        const { data: files } = await supabase
            .from('files')
            .select('*')
            .eq('folder_id', id)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        // Get subfolders
        const { data: subfolders } = await supabase
            .from('file_folders')
            .select('*, files_count:files(count)')
            .eq('parent_folder_id', id)
            .order('name', { ascending: true });

        // Get folder path (breadcrumb)
        const { data: path } = await supabaseAdmin
            .rpc('get_folder_path', { folder_id: id });

        return NextResponse.json({
            success: true,
            folder,
            files: files || [],
            subfolders: subfolders || [],
            path: path || []
        });
    } catch (error: any) {
        console.error('Error fetching folder:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch folder' },
            { status: 500 }
        );
    }
}

// PATCH /api/folders/[id] - Update folder
export async function PATCH(
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
        const body = await request.json();

        const { name, description, color, icon, parent_folder_id } = body;

        // Build update object
        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (color !== undefined) updates.color = color;
        if (icon !== undefined) updates.icon = icon;
        if (parent_folder_id !== undefined) updates.parent_folder_id = parent_folder_id;

        // Update folder
        const { data: folder, error } = await supabase
            .from('file_folders')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            folder,
            message: 'Folder updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating folder:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update folder' },
            { status: 500 }
        );
    }
}

// DELETE /api/folders/[id] - Delete folder
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

        // Check if folder is a system folder
        const { data: folder } = await supabase
            .from('file_folders')
            .select('is_system')
            .eq('id', id)
            .single();

        if (folder?.is_system) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete system folder' },
                { status: 403 }
            );
        }

        // Delete folder (cascade will handle subfolders and files)
        const { error } = await supabase
            .from('file_folders')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Folder deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting folder:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete folder' },
            { status: 500 }
        );
    }
}
