import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/portal/posts/[postId]/approve
export async function POST(
    request: Request,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;

        // Get current user from session and verify they're a client
        const { getServerUserProfile, isClientUser } = await import('@/lib/supabase/server');
        
        const isClient = await isClientUser();
        if (!isClient) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized. Client access required.' },
                { status: 403 }
            );
        }

        const profile = await getServerUserProfile();
        const approvedBy = profile?.user.id;
        
        if (!approvedBy) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 401 }
            );
        }

        // Update post in Supabase
        const { data: post, error } = await supabaseAdmin
            .from('blog_posts')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: approvedBy
            })
            .eq('id', postId)
            .select()
            .single();

        if (error) throw error;

        // Log activity
        await supabaseAdmin.from('activity_log').insert({
            user_id: approvedBy,
            action: 'post_approved',
            resource_type: 'blog_post',
            resource_id: postId,
            details: { status_change: 'ready_for_review → approved' }
        });

        console.log(`Post ${postId} approved by client`);

        // TODO: Notify merchant via email/webhook

        return NextResponse.json({
            success: true,
            post,
            message: 'Post approved successfully'
        });
    } catch (error) {
        console.error('Error approving post:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to approve post' },
            { status: 500 }
        );
    }
}
