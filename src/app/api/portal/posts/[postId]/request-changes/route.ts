import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/portal/posts/[postId]/request-changes
export async function POST(
    request: Request,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;
        const body = await request.json();
        const { changeRequest, severity = 'medium' } = body;

        if (!changeRequest || !changeRequest.trim()) {
            return NextResponse.json(
                { success: false, error: 'Change request is required' },
                { status: 400 }
            );
        }

        const createdBy = 'client-user-id'; // TODO: Get from auth session

        // Update post status to editing
        const { data: post, error: postError } = await supabaseAdmin
            .from('blog_posts')
            .update({
                status: 'editing',
                needs_revision: true
            })
            .eq('id', postId)
            .select()
            .single();

        if (postError) throw postError;

        // Create review task
        const { data: task, error: taskError } = await supabaseAdmin
            .from('review_tasks')
            .insert({
                blog_post_id: postId,
                type: 'client_change_request',
                description: changeRequest.trim(),
                severity,
                status: 'open',
                created_by: createdBy
            })
            .select()
            .single();

        if (taskError) throw taskError;

        // Log activity
        await supabaseAdmin.from('activity_log').insert({
            user_id: createdBy,
            action: 'changes_requested',
            resource_type: 'blog_post',
            resource_id: postId,
            details: { task_id: task.id, severity }
        });

        console.log(`Change request created for post ${postId}:`, changeRequest);

        // TODO: Notify merchant via email/webhook

        return NextResponse.json({
            success: true,
            post,
            task,
            message: 'Changes requested successfully'
        });
    } catch (error) {
        console.error('Error requesting changes:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to request changes' },
            { status: 500 }
        );
    }
}
