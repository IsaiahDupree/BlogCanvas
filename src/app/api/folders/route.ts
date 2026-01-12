import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/folders - List folders
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

        const { searchParams } = new URL(request.url);
        const parentId = searchParams.get('parent_id');
        const clientId = searchParams.get('client_id');

        // Build query
        let query = supabase
            .from('file_folders')
            .select(`
                *,
                files_count:files(count),
                creator:profiles!created_by(id, full_name)
            `)
            .order('name', { ascending: true });

        // Filter by parent folder
        if (parentId === 'root' || parentId === null) {
            query = query.is('parent_folder_id', null);
        } else if (parentId) {
            query = query.eq('parent_folder_id', parentId);
        }

        // Filter by client
        if (clientId) {
            query = query.eq('client_id', clientId);
        }

        const { data: folders, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            folders
        });
    } catch (error: any) {
        console.error('Error fetching folders:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch folders' },
            { status: 500 }
        );
    }
}

// POST /api/folders - Create new folder
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

        // Get user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('vendor_id')
            .eq('id', user.id)
            .single();

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

        const body = await request.json();
        const {
            name,
            parent_folder_id,
            description,
            color = '#3B82F6',
            icon = 'folder'
        } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Folder name is required' },
                { status: 400 }
            );
        }

        // Create folder
        const { data: folder, error } = await supabaseAdmin
            .from('file_folders')
            .insert({
                name,
                parent_folder_id: parent_folder_id || null,
                client_id: clientId,
                vendor_id: vendorId,
                description,
                color,
                icon,
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            folder,
            message: 'Folder created successfully'
        });
    } catch (error: any) {
        console.error('Error creating folder:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create folder' },
            { status: 500 }
        );
    }
}
