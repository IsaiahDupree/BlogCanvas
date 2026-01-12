import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// GET /api/shared/[token] - Access a shared file
export async function GET(
    request: Request,
    { params }: { params: { token: string } }
) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const password = searchParams.get('password');

        const shareToken = params.token;

        // Get share details (using admin client to bypass RLS for shared access)
        const { data: share, error: shareError } = await supabaseAdmin
            .from('file_shares')
            .select(`
                *,
                file:files(*)
            `)
            .eq('share_token', shareToken)
            .single();

        if (shareError || !share) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired share link' },
                { status: 404 }
            );
        }

        // Check if share is active
        if (share.revoked_at) {
            return NextResponse.json(
                { success: false, error: 'This share link has been revoked' },
                { status: 403 }
            );
        }

        if (share.expires_at && new Date(share.expires_at) < new Date()) {
            return NextResponse.json(
                { success: false, error: 'This share link has expired' },
                { status: 403 }
            );
        }

        // Check max downloads
        if (share.max_downloads && share.download_count >= share.max_downloads) {
            return NextResponse.json(
                { success: false, error: 'Download limit reached for this share link' },
                { status: 403 }
            );
        }

        // Check password if required
        if (share.is_password_protected) {
            if (!password) {
                return NextResponse.json(
                    { success: false, error: 'Password required', requires_password: true },
                    { status: 401 }
                );
            }

            const passwordValid = await bcrypt.compare(password, share.password_hash);
            if (!passwordValid) {
                return NextResponse.json(
                    { success: false, error: 'Invalid password' },
                    { status: 401 }
                );
            }
        }

        // Update view count
        await supabaseAdmin
            .from('file_shares')
            .update({
                view_count: (share.view_count || 0) + 1,
                last_accessed_at: new Date().toISOString()
            })
            .eq('id', share.id);

        // Log access
        await supabaseAdmin.from('file_access_logs').insert({
            file_id: share.file_id,
            share_id: share.id,
            action: 'view'
        });

        return NextResponse.json({
            success: true,
            share: {
                id: share.id,
                permission: share.permission,
                expires_at: share.expires_at,
                file: share.file
            }
        });
    } catch (error: any) {
        console.error('Error accessing shared file:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to access shared file' },
            { status: 500 }
        );
    }
}

// POST /api/shared/[token]/download - Download a shared file
export async function POST(
    request: Request,
    { params }: { params: { token: string } }
) {
    try {
        const shareToken = params.token;
        const body = await request.json();
        const { password } = body;

        // Get share details
        const { data: share, error: shareError } = await supabaseAdmin
            .from('file_shares')
            .select(`
                *,
                file:files(*)
            `)
            .eq('share_token', shareToken)
            .single();

        if (shareError || !share) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired share link' },
                { status: 404 }
            );
        }

        // Validate share (same checks as GET)
        if (share.revoked_at) {
            return NextResponse.json(
                { success: false, error: 'This share link has been revoked' },
                { status: 403 }
            );
        }

        if (share.expires_at && new Date(share.expires_at) < new Date()) {
            return NextResponse.json(
                { success: false, error: 'This share link has expired' },
                { status: 403 }
            );
        }

        if (share.max_downloads && share.download_count >= share.max_downloads) {
            return NextResponse.json(
                { success: false, error: 'Download limit reached' },
                { status: 403 }
            );
        }

        // Check permission
        if (share.permission === 'view') {
            return NextResponse.json(
                { success: false, error: 'This share link does not allow downloads' },
                { status: 403 }
            );
        }

        // Check password
        if (share.is_password_protected) {
            if (!password) {
                return NextResponse.json(
                    { success: false, error: 'Password required' },
                    { status: 401 }
                );
            }

            const passwordValid = await bcrypt.compare(password, share.password_hash);
            if (!passwordValid) {
                return NextResponse.json(
                    { success: false, error: 'Invalid password' },
                    { status: 401 }
                );
            }
        }

        // Generate signed URL for download
        const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
            .from(share.file.storage_bucket || 'client-files')
            .createSignedUrl(share.file.storage_path, 3600); // 1 hour expiry

        if (urlError) throw urlError;

        // Update download count
        await supabaseAdmin
            .from('file_shares')
            .update({
                download_count: (share.download_count || 0) + 1,
                last_accessed_at: new Date().toISOString()
            })
            .eq('id', share.id);

        // Log download
        await supabaseAdmin.from('file_access_logs').insert({
            file_id: share.file_id,
            share_id: share.id,
            action: 'download'
        });

        return NextResponse.json({
            success: true,
            download_url: signedUrlData.signedUrl,
            filename: share.file.filename
        });
    } catch (error: any) {
        console.error('Error downloading shared file:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to download file' },
            { status: 500 }
        );
    }
}
