import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// GET /api/files/[id]/share - Get all shares for a file
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

        // Get all shares for this file (RLS will check access)
        const { data: shares, error } = await supabase
            .from('file_shares')
            .select(`
                *,
                shared_by_user:profiles!shared_by(id, full_name, email)
            `)
            .eq('file_id', fileId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            shares: shares || []
        });
    } catch (error: any) {
        console.error('Error fetching file shares:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch shares' },
            { status: 500 }
        );
    }
}

// POST /api/files/[id]/share - Create a shareable link
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
        const body = await request.json();
        const {
            permission = 'view',
            expires_at = null,
            password = null,
            max_downloads = null
        } = body;

        // Validate permission
        if (!['view', 'download', 'edit'].includes(permission)) {
            return NextResponse.json(
                { success: false, error: 'Invalid permission level' },
                { status: 400 }
            );
        }

        // Verify user owns this file
        const { data: file, error: fileError } = await supabase
            .from('files')
            .select('id, filename')
            .eq('id', fileId)
            .single();

        if (fileError || !file) {
            return NextResponse.json(
                { success: false, error: 'File not found' },
                { status: 404 }
            );
        }

        // Generate unique share token
        const shareToken = crypto.randomBytes(32).toString('hex');

        // Hash password if provided
        let passwordHash = null;
        if (password) {
            passwordHash = await bcrypt.hash(password, 10);
        }

        // Create share record
        const { data: share, error: shareError } = await supabase
            .from('file_shares')
            .insert({
                file_id: fileId,
                share_token: shareToken,
                permission,
                expires_at,
                is_password_protected: !!password,
                password_hash: passwordHash,
                max_downloads,
                shared_by: user.id
            })
            .select()
            .single();

        if (shareError) throw shareError;

        // Log the share action
        await supabase.from('file_access_logs').insert({
            file_id: fileId,
            user_id: user.id,
            action: 'share'
        });

        // Generate shareable URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848';
        const shareUrl = `${baseUrl}/shared/${shareToken}`;

        return NextResponse.json({
            success: true,
            share: {
                ...share,
                share_url: shareUrl
            }
        });
    } catch (error: any) {
        console.error('Error creating file share:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create share' },
            { status: 500 }
        );
    }
}

// PATCH /api/files/[id]/share/[shareId] - Update or revoke a share
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

        const body = await request.json();
        const { share_id, revoked } = body;

        if (!share_id) {
            return NextResponse.json(
                { success: false, error: 'Share ID required' },
                { status: 400 }
            );
        }

        // Revoke the share
        const updates: any = {};
        if (revoked) {
            updates.revoked_at = new Date().toISOString();
        }

        const { data: share, error } = await supabase
            .from('file_shares')
            .update(updates)
            .eq('id', share_id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            share
        });
    } catch (error: any) {
        console.error('Error updating file share:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update share' },
            { status: 500 }
        );
    }
}
