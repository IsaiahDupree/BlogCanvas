import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { publishToWordPress, bulkPublishToWordPress, scheduleWordPressPost } from '@/lib/wordpress/publisher';

// POST /api/blog-posts/[id]/publish - Publish single post to WordPress
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { websiteUrl, schedule, publishDate } = body;

        // Get post with client and website info
        const { data: post, error: postError } = await supabaseAdmin
            .from('blog_posts')
            .select(`
                *,
                client:clients(id),
                content_batch:content_batches(
                    website_id,
                    website:websites(url, domain)
                )
            `)
            .eq('id', id)
            .single();

        if (postError || !post) {
            return NextResponse.json(
                { success: false, error: 'Post not found' },
                { status: 404 }
            );
        }

        const targetUrl = websiteUrl || (post.content_batch as any)?.website?.url;
        const clientId = (post.client as any)?.id || post.client_id;

        if (!targetUrl && !clientId) {
            return NextResponse.json(
                { success: false, error: 'Website URL or client ID required' },
                { status: 400 }
            );
        }

        // Get publish options from body
        const { status = 'draft', scheduleDate } = body;

        // Schedule or publish immediately
        if (schedule && publishDate) {
            const result = await publishToWordPress(
                id,
                targetUrl,
                undefined,
                {
                    status: 'draft' as any, // Will be set to 'future' internally
                    scheduleDate: new Date(publishDate),
                    clientId: clientId
                }
            );
            return NextResponse.json(result);
        } else {
            const result = await publishToWordPress(
                id,
                targetUrl,
                undefined,
                {
                    status: (status as 'draft' | 'publish' | 'pending') || 'draft',
                    clientId: clientId
                }
            );
            return NextResponse.json(result);
        }

    } catch (error: any) {
        console.error('Publish error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
