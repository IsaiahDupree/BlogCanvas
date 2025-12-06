import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/content-batches/[id]/posts - Get batch with all posts
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get batch
        const { data: batch, error: batchError } = await supabaseAdmin
            .from('content_batches')
            .select('*')
            .eq('id', id)
            .single();

        if (batchError || !batch) {
            return NextResponse.json(
                { success: false, error: 'Batch not found' },
                { status: 404 }
            );
        }

        // Get all posts in batch
        const { data: posts, error: postsError } = await supabaseAdmin
            .from('blog_posts')
            .select('id, topic, target_keyword, status, seo_quality_score, created_at')
            .eq('content_batch_id', id)
            .order('created_at', { ascending: true });

        if (postsError) {
            console.error('Error fetching posts:', postsError);
        }

        return NextResponse.json({
            success: true,
            batch,
            posts: posts || []
        });

    } catch (error) {
        console.error('Error fetching batch details:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch batch details' },
            { status: 500 }
        );
    }
}
