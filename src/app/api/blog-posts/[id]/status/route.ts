import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// PATCH /api/blog-posts/[id]/status - Update post status (enhanced with feedback)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, feedback } = body;

        const validStatuses = [
            'planned', 'generating', 'draft', 'in_review', 'approved',
            'client_review', 'client_approved', 'client_rejected',
            'scheduled', 'published', 'failed'
        ];

        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Invalid status' },
                { status: 400 }
            );
        }

        // Prepare update data
        const updateData: any = {
            status,
            updated_at: new Date().toISOString()
        };

        // If feedback provided, store in metadata
        if (feedback) {
            const { data: currentPost } = await supabaseAdmin
                .from('blog_posts')
                .select('metadata')
                .eq('id', id)
                .single();

            updateData.metadata = {
                ...(currentPost?.metadata || {}),
                client_feedback: feedback,
                feedback_date: new Date().toISOString()
            };
        }

        const { data: post, error } = await supabaseAdmin
            .from('blog_posts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating status:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to update status' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            post
        });

    } catch (error) {
        console.error('Error in status update:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
