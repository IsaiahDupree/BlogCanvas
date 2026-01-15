import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/content-batches/[id]/overdue - Get overdue posts and alerts for a batch
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get overdue posts from the view
        const { data: overduePosts, error: overdueError } = await supabaseAdmin
            .from('overdue_blog_posts')
            .select('*')
            .eq('content_batch_id', id);

        if (overdueError) {
            console.error('Error fetching overdue posts:', overdueError);
        }

        // Get overdue count stats
        const { data: counts, error: countError } = await supabaseAdmin
            .rpc('get_overdue_count', { p_batch_id: id });

        if (countError) {
            console.error('Error fetching overdue counts:', countError);
        }

        const stats = counts && counts[0] ? counts[0] : {
            past_due_count: 0,
            at_risk_count: 0,
            missed_window_count: 0,
            total_alerts: 0
        };

        return NextResponse.json({
            success: true,
            overdue_posts: overduePosts || [],
            stats
        });

    } catch (error) {
        console.error('Error fetching overdue posts:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch overdue posts' },
            { status: 500 }
        );
    }
}
