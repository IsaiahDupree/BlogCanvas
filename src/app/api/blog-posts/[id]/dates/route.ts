import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Update blog post dates (due_date, publish_window)
 * PATCH /api/blog-posts/[id]/dates
 *
 * Body: {
 *   due_date?: string | null,
 *   publish_window_start?: string | null,
 *   publish_window_end?: string | null
 * }
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { due_date, publish_window_start, publish_window_end } = body;

        // Validate window dates if both provided
        if (publish_window_start && publish_window_end) {
            const startDate = new Date(publish_window_start);
            const endDate = new Date(publish_window_end);

            if (endDate < startDate) {
                return NextResponse.json(
                    { success: false, error: 'Publish window end date must be after start date' },
                    { status: 400 }
                );
            }
        }

        // Build update object
        const updates: any = {
            updated_at: new Date().toISOString()
        };

        if ('due_date' in body) {
            updates.due_date = due_date;
        }
        if ('publish_window_start' in body) {
            updates.publish_window_start = publish_window_start;
        }
        if ('publish_window_end' in body) {
            updates.publish_window_end = publish_window_end;
        }

        // Update the blog post
        const { data: post, error: updateError } = await supabaseAdmin
            .from('blog_posts')
            .update(updates)
            .eq('id', id)
            .select('id, due_date, publish_window_start, publish_window_end')
            .single();

        if (updateError) {
            console.error('Error updating blog post dates:', updateError);
            return NextResponse.json(
                { success: false, error: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            post
        });

    } catch (error: any) {
        console.error('Error in blog post dates update:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update dates' },
            { status: 500 }
        );
    }
}
