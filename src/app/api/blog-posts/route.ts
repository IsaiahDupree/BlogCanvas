import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/blog-posts - Get all blog posts
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const batchId = searchParams.get('batchId');
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('blog_posts')
            .select('id, topic, status, seo_quality_score, target_keyword, content_batch_id, created_at')
            .order('created_at', { ascending: false });

        if (batchId) {
            query = query.eq('content_batch_id', batchId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data: posts, error } = await query;

        if (error) {
            console.error('Error fetching posts:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch posts' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            posts: posts || []
        });

    } catch (error) {
        console.error('Error in blog posts API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
