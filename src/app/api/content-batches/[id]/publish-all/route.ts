import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { bulkPublishToWordPress } from '@/lib/wordpress/publisher';

// POST /api/content-batches/[id]/publish-all - Bulk publish all approved posts
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: batchId } = await params;
        const body = await request.json();
        const { websiteUrl, postIds, status = 'draft' } = body;

        // Get batch to find client and website
        const { data: batch, error: batchError } = await supabaseAdmin
            .from('content_batches')
            .select(`
                *,
                client:clients(id),
                website:websites(url, domain)
            `)
            .eq('id', batchId)
            .single();

        if (batchError || !batch) {
            return NextResponse.json(
                { success: false, error: 'Batch not found' },
                { status: 404 }
            );
        }

        const targetUrl = websiteUrl || (batch.website as any)?.url;
        const clientId = (batch.client as any)?.id || batch.client_id;

        if (!targetUrl && !clientId) {
            return NextResponse.json(
                { success: false, error: 'Website URL or client ID required' },
                { status: 400 }
            );
        }

        // Get approved posts if postIds not provided
        let postsToPublish = postIds;
        if (!postsToPublish || postsToPublish.length === 0) {
            const { data: approvedPosts } = await supabaseAdmin
                .from('blog_posts')
                .select('id')
                .eq('content_batch_id', batchId)
                .in('status', ['approved', 'ready_for_review']);

            postsToPublish = approvedPosts?.map(p => p.id) || [];
        }

        if (postsToPublish.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No posts to publish' },
                { status: 400 }
            );
        }

        const results = await bulkPublishToWordPress(
            postsToPublish,
            targetUrl,
            undefined,
            {
                status: status as 'draft' | 'publish' | 'pending',
                clientId: clientId
            }
        );

        // Update batch stats
        await supabaseAdmin
            .from('content_batches')
            .update({
                posts_published: (batch.posts_published || 0) + results.succeeded,
                updated_at: new Date().toISOString()
            })
            .eq('id', batchId);

        return NextResponse.json({
            success: true,
            ...results
        });

    } catch (error: any) {
        console.error('Bulk publish error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
