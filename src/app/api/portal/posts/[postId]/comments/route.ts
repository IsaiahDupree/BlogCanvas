import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/portal/posts/[postId]/comments
export async function GET(
    request: Request,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;

        // Fetch comments from Supabase
        const { data: comments, error } = await supabaseAdmin
            .from('comments')
            .select(`
                *,
                profiles:author_id (
                    full_name,
                    role
                )
            `)
            .eq('blog_post_id', postId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Transform data for frontend
        const transformedComments = comments.map(c => ({
            id: c.id,
            blog_post_id: c.blog_post_id,
            author_id: c.author_id,
            author_name: c.profiles?.full_name || 'Unknown',
            author_role: c.profiles?.role || 'client',
            content: c.content,
            created_at: c.created_at
        }));

        return NextResponse.json({
            success: true,
            comments: transformedComments
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch comments' },
            { status: 500 }
        );
    }
}

// POST /api/portal/posts/[postId]/comments
export async function POST(
    request: Request,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;
        const body = await request.json();
        const { content } = body;

        if (!content || !content.trim()) {
            return NextResponse.json(
                { success: false, error: 'Comment content is required' },
                { status: 400 }
            );
        }

        // Get current user from session
        const { getServerUserProfile, requireClient } = await import('@/lib/supabase/server');
        
        let authorId: string | null = null;
        let authorName: string | null = null;
        
        try {
            const profile = await requireClient();
            authorId = profile.user.id;
            authorName = profile.profile?.full_name || profile.user.email || 'Client';
        } catch (error) {
            // Not authenticated - allow anonymous comments with author_name
            // This allows comments from non-authenticated users if needed
        }

        // Insert comment into Supabase
        const { data: comment, error } = await supabaseAdmin
            .from('comments')
            .insert({
                blog_post_id: postId,
                user_id: authorId,
                author_name: authorName,
                content: content.trim()
            })
            .select()
            .single();

        if (error) throw error;

        // Log activity
        await supabaseAdmin.from('activity_log').insert({
            user_id: authorId,
            action: 'comment_added',
            resource_type: 'blog_post',
            resource_id: postId,
            details: { comment_id: comment.id }
        });

        console.log(`Comment added to post ${postId}`);

        // TODO: Notify merchant

        return NextResponse.json({
            success: true,
            comment,
            message: 'Comment added successfully'
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add comment' },
            { status: 500 }
        );
    }
}
