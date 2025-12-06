import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/content-batches - List all content batches
export async function GET(request: NextRequest) {
    try {
        const { data: batches, error } = await supabaseAdmin
            .from('content_batches')
            .select(`
                *,
                website:websites(url, domain)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            batches: batches || []
        });
    } catch (error) {
        console.error('Error fetching batches:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch batches' },
            { status: 500 }
        );
    }
}

// POST /api/content-batches - Create new content batch
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            websiteId,
            clientId,
            name,
            goalScoreFrom,
            goalScoreTo,
            startDate,
            endDate,
            totalPosts
        } = body;

        if (!websiteId || !name) {
            return NextResponse.json(
                { success: false, error: 'Website ID and name are required' },
                { status: 400 }
            );
        }

        // Create batch
        const { data: batch, error } = await supabaseAdmin
            .from('content_batches')
            .insert({
                website_id: websiteId,
                client_id: clientId,
                name,
                goal_score_from: goalScoreFrom,
                goal_score_to: goalScoreTo,
                start_date: startDate,
                end_date: endDate,
                total_posts: totalPosts,
                status: 'planned',
                posts_approved: 0,
                posts_completed: 0,
                posts_published: 0
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating batch:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to create batch' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            batch
        });

    } catch (error) {
        console.error('Error in batch creation:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
