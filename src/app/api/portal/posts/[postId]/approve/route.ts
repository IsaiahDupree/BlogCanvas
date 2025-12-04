import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/portal/posts/[postId]/approve
export async function POST(
    request: Request,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;

        // TODO: Get current user from session and verify they're a client
        const approvedBy = 'client-user-id'; // Would get from auth session

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
