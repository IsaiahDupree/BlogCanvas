import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/blog-posts/[id]/change-requests
 * Get all change requests for a blog post
 */
export async function GET(
    request: NextRequest,
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

        // Get change requests with user info
        const { data: changeRequests, error } = await supabase
            .from('blog_post_change_requests')
            .select(`
                *,
                requested_by_user:requested_by(email),
                resolved_by_user:resolved_by(email)
            `)
            .eq('blog_post_id', id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching change requests:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            changeRequests: changeRequests || []
        });

    } catch (error: any) {
        console.error('Error in change requests GET:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/blog-posts/[id]/change-requests
 * Create a new change request (client action)
 *
 * Body: {
 *   feedback: string
 * }
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: blogPostId } = await params;
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { feedback } = body;

        if (!feedback || feedback.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Feedback is required' },
                { status: 400 }
            );
        }

        // Verify the post exists and is in client_review status
        const { data: post, error: postError } = await supabase
            .from('blog_posts')
            .select('id, topic, status, client_id')
            .eq('id', blogPostId)
            .single();

        if (postError || !post) {
            return NextResponse.json(
                { success: false, error: 'Blog post not found' },
                { status: 404 }
            );
        }

        if (post.status !== 'client_review') {
            return NextResponse.json(
                { success: false, error: 'Post is not in client review status' },
                { status: 400 }
            );
        }

        // Create change request
        const { data: changeRequest, error: createError } = await supabase
            .from('blog_post_change_requests')
            .insert({
                blog_post_id: blogPostId,
                requested_by: user.id,
                feedback: feedback.trim(),
                status: 'pending'
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating change request:', createError);
            return NextResponse.json(
                { success: false, error: createError.message },
                { status: 500 }
            );
        }

        // Get client info for notifications
        const { data: client } = await supabase
            .from('clients')
            .select('id, name, vendor_user_id')
            .eq('id', post.client_id)
            .single();

        // Send notification to vendor/editor
        if (client?.vendor_user_id) {
            await supabase.from('notifications').insert({
                user_id: client.vendor_user_id,
                type: 'change_request',
                title: 'Client requested changes',
                message: `${client.name} requested changes on "${post.topic}"`,
                link: `/app/posts/${blogPostId}`,
                metadata: {
                    blog_post_id: blogPostId,
                    change_request_id: changeRequest.id,
                    feedback: feedback.substring(0, 200)
                }
            });
        }

        // Create a comment for the change request (for history)
        await supabase.from('comments').insert({
            blog_post_id: blogPostId,
            user_id: user.id,
            content: `**Changes Requested:**\n\n${feedback}`,
            comment_type: 'change_request'
        });

        return NextResponse.json({
            success: true,
            changeRequest,
            message: 'Changes requested successfully. Post has been returned to editor.'
        });

    } catch (error: any) {
        console.error('Error in change request POST:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
