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

        // Get current user from session
        const { getServerUserProfile, requireClient } = await import('@/lib/supabase/server');
        
        let createdBy: string;
        try {
            const profile = await requireClient();
            createdBy = profile.user.id;
        } catch (error) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Update post status to editing
        const updateData: any = {
            status: 'editing'
        }
        
        // Add needs_revision if column exists
        try {
            updateData.needs_revision = true
        } catch (e) {
            // Column might not exist - that's okay
        }
        
        const { data: post, error: postError } = await supabaseAdmin
            .from('blog_posts')
            .update(updateData)
            .eq('id', postId)
            .select()
            .single();

        if (postError) throw postError;

        // Create review task
        const { data: task, error: taskError } = await supabaseAdmin
            .from('review_tasks')
            .insert({
                blog_post_id: postId,
                description: changeRequest.trim(),
                status: 'pending',
                assigned_to: createdBy
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
