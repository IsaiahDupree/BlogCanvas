import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/publishing/status - Get publishing status for posts
 * Query params:
 * - batchId: Filter by content batch
 * - clientId: Filter by client
 * - status: Filter by publish status (published, scheduled, failed)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const batchId = searchParams.get('batchId');
        const clientId = searchParams.get('clientId');
        const statusFilter = searchParams.get('status');

        let query = supabaseAdmin
            .from('blog_posts')
            .select(`
                id,
                topic,
                status,
                cms_publish_info,
                created_at,
                updated_at,
                content_batch:content_batches(id, name),
                client:clients(id, name)
            `)
            .not('cms_publish_info', 'is', null);

        // Apply filters
        if (batchId) {
            query = query.eq('content_batch_id', batchId);
        }
        if (clientId) {
            query = query.eq('client_id', clientId);
        }

        const { data: posts, error } = await query;

        if (error) {
            throw error;
        }

        // Process posts to extract publish status
        const processedPosts = (posts || []).map(post => {
            const publishInfo = post.cms_publish_info as any || {};
            const publishStatus = getPublishStatus(post.status, publishInfo);

            return {
                id: post.id,
                topic: post.topic,
                status: post.status,
                publishStatus: publishStatus,
                wordpressId: publishInfo.post_id,
                publishedUrl: publishInfo.url,
                publishedAt: publishInfo.published_at,
                scheduledFor: publishInfo.scheduled_for,
                error: publishInfo.error,
                errorDetails: publishInfo.error_details,
                lastAttempt: publishInfo.last_attempt,
                batch: post.content_batch,
                client: post.client,
                createdAt: post.created_at,
                updatedAt: post.updated_at
            };
        });

        // Filter by publish status if specified
        let filteredPosts = processedPosts;
        if (statusFilter) {
            filteredPosts = processedPosts.filter(p => p.publishStatus === statusFilter);
        }

        // Calculate summary stats
        const stats = {
            total: filteredPosts.length,
            published: filteredPosts.filter(p => p.publishStatus === 'published').length,
            scheduled: filteredPosts.filter(p => p.publishStatus === 'scheduled').length,
            failed: filteredPosts.filter(p => p.publishStatus === 'failed').length,
            draft: filteredPosts.filter(p => p.publishStatus === 'draft').length
        };

        return NextResponse.json({
            success: true,
            posts: filteredPosts,
            stats
        });

    } catch (error: any) {
        console.error('Error fetching publish status:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Determine publish status from post status and CMS publish info
 */
function getPublishStatus(
    postStatus: string,
    publishInfo: any
): 'published' | 'scheduled' | 'failed' | 'draft' | 'unknown' {
    if (publishInfo.error) {
        return 'failed';
    }

    if (publishInfo.scheduled_for || publishInfo.status === 'future') {
        return 'scheduled';
    }

    if (publishInfo.post_id && publishInfo.url) {
        return 'published';
    }

    if (publishInfo.status === 'draft') {
        return 'draft';
    }

    return 'unknown';
}

