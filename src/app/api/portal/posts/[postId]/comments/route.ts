import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/portal/posts/[postId]/comments
export async function GET(
    request: Request,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;

        // Fetch comments from Supabase with threading info
        const { data: comments, error } = await supabaseAdmin
            .from('comments')
            .select(`
                *,
                author:user_id (
                    id,
                    email
                ),
                profiles:user_id (
                    full_name,
                    role
                ),
                resolved_by_user:resolved_by (
                    id,
                    email
                ),
                resolved_by_profile:resolved_by (
                    full_name
                ),
                replies:comments!parent_comment_id(count)
            `)
            .eq('blog_post_id', postId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Build threaded structure
        const commentMap = new Map();
        const rootComments: any[] = [];

        // First pass: create all comment objects
        comments.forEach(c => {
            const comment = {
                id: c.id,
                blog_post_id: c.blog_post_id,
                parent_comment_id: c.parent_comment_id,
                author_id: c.user_id,
                author_name: c.profiles?.full_name || c.author_name || 'Unknown',
                author_role: c.profiles?.role || 'client',
                content: c.content,
                mentioned_user_ids: c.mentioned_user_ids || [],
                is_resolved: c.is_resolved || false,
                resolved_by: c.resolved_by,
                resolved_by_name: c.resolved_by_profile?.full_name || null,
                resolved_at: c.resolved_at,
                created_at: c.created_at,
                updated_at: c.updated_at,
                reply_count: c.replies?.[0]?.count || 0,
                replies: []
            };
            commentMap.set(c.id, comment);
        });

        // Second pass: build tree structure
        commentMap.forEach(comment => {
            if (comment.parent_comment_id) {
                const parent = commentMap.get(comment.parent_comment_id);
                if (parent) {
                    parent.replies.push(comment);
                }
            } else {
                rootComments.push(comment);
            }
        });

        return NextResponse.json({
            success: true,
            comments: rootComments
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
        const { content, parent_comment_id } = body;

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

        // Extract @mentions from content (e.g., @username or @user_id)
        const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
        const mentions = [...content.matchAll(mentionRegex)].map(match => match[1]);

        // For now, we'll store mention text - in production, you'd resolve usernames to IDs
        const mentionedUserIds: string[] = [];

        // Insert comment into Supabase
        const { data: comment, error } = await supabaseAdmin
            .from('comments')
            .insert({
                blog_post_id: postId,
                parent_comment_id: parent_comment_id || null,
                user_id: authorId,
                author_name: authorName,
                content: content.trim(),
                mentioned_user_ids: mentionedUserIds
            })
            .select()
            .single();

        if (error) throw error;

        // Create mention records for notifications
        if (mentionedUserIds.length > 0) {
            await supabaseAdmin.from('comment_mentions').insert(
                mentionedUserIds.map(userId => ({
                    comment_id: comment.id,
                    mentioned_user_id: userId,
                    notification_sent: false
                }))
            );

            // TODO: Send notifications to mentioned users
        }

        // Log activity
        await supabaseAdmin.from('activity_log').insert({
            user_id: authorId,
            action: parent_comment_id ? 'reply_added' : 'comment_added',
            resource_type: 'blog_post',
            resource_id: postId,
            details: {
                comment_id: comment.id,
                parent_comment_id: parent_comment_id,
                mentions_count: mentionedUserIds.length
            }
        });

        console.log(`Comment added to post ${postId}`);

        return NextResponse.json({
            success: true,
            comment,
            message: parent_comment_id ? 'Reply added successfully' : 'Comment added successfully'
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add comment' },
            { status: 500 }
        );
    }
}

// PATCH /api/portal/posts/[postId]/comments?commentId=xxx
// For updating comment resolution status
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;
        const { searchParams } = new URL(request.url);
        const commentId = searchParams.get('commentId');
        const body = await request.json();
        const { is_resolved } = body;

        if (!commentId) {
            return NextResponse.json(
                { success: false, error: 'Comment ID is required' },
                { status: 400 }
            );
        }

        // Get current user
        const { requireClient } = await import('@/lib/supabase/server');
        let userId: string | null = null;

        try {
            const profile = await requireClient();
            userId = profile.user.id;
        } catch (error) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Update comment resolution status
        const updateData: any = { is_resolved };
        if (is_resolved) {
            updateData.resolved_by = userId;
            updateData.resolved_at = new Date().toISOString();
        } else {
            updateData.resolved_by = null;
            updateData.resolved_at = null;
        }

        const { data: comment, error } = await supabaseAdmin
            .from('comments')
            .update(updateData)
            .eq('id', commentId)
            .eq('blog_post_id', postId)
            .select()
            .single();

        if (error) throw error;

        // Log activity
        await supabaseAdmin.from('activity_log').insert({
            user_id: userId,
            action: is_resolved ? 'comment_resolved' : 'comment_reopened',
            resource_type: 'comment',
            resource_id: commentId,
            details: { blog_post_id: postId }
        });

        console.log(`Comment ${commentId} ${is_resolved ? 'resolved' : 'reopened'}`);

        return NextResponse.json({
            success: true,
            comment,
            message: `Comment ${is_resolved ? 'resolved' : 'reopened'} successfully`
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update comment' },
            { status: 500 }
        );
    }
}
