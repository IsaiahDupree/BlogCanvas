import { NextRequest, NextResponse } from 'next/server';
import { publishToWordPress } from '@/lib/wordpress/publisher';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/publishing/retry - Retry publishing a failed post
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { postId, websiteUrl, status = 'draft' } = body;

        if (!postId) {
            return NextResponse.json(
                { success: false, error: 'Post ID required' },
                { status: 400 }
            );
        }

        // Get post with client info
        const { data: post, error: postError } = await supabaseAdmin
            .from('blog_posts')
            .select(`
                *,
                client:clients(id)
            `)
            .eq('id', postId)
            .single();

        if (postError || !post) {
            return NextResponse.json(
                { success: false, error: 'Post not found' },
                { status: 404 }
            );
        }

        const clientId = (post.client as any)?.id || post.client_id;

        // Retry publishing
        const result = await publishToWordPress(
            postId,
            websiteUrl,
            undefined,
            {
                status: status as 'draft' | 'publish' | 'pending',
                clientId: clientId
            }
        );

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error retrying publish:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

