import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/clients/[clientId]/posts - Create new post for client
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;
        const body = await request.json();

        const {
            topic,
            targetKeyword,
            contentType,
            wordCountGoal,
            targetAudience,
            includeFAQs,
            includeTable,
            includeComparison
        } = body;

        if (!topic) {
            return NextResponse.json(
                { success: false, error: 'Topic is required' },
                { status: 400 }
            );
        }

        const createdBy = 'merchant-user-id'; // TODO: Get from auth session

        // Insert post into Supabase
        const { data: post, error } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                client_id: clientId,
                topic,
                target_keyword: targetKeyword || '',
                content_type: contentType || 'how-to',
                word_count_goal: wordCountGoal || 1500,
                target_audience: targetAudience || '',
                status: 'researching', // Will trigger AI pipeline
                include_faqs: includeFAQs || false,
                include_table: includeTable || false,
                include_comparison: includeComparison || false,
                created_by: createdBy
            })
            .select()
            .single();

        if (error) throw error;

        // Log activity
        await supabaseAdmin.from('activity_log').insert({
            user_id: createdBy,
            action: 'post_created',
            resource_type: 'blog_post',
            resource_id: post.id,
            details: { topic, client_id: clientId }
        });

        console.log('Post created:', post);

        // TODO: Trigger AI pipeline via background job/queue
        // simulateAIPipeline(post.id);

        return NextResponse.json({
            success: true,
            post,
            message: 'Post created successfully. AI pipeline started.',
            redirectUrl: `/app/clients/${clientId}/posts/${post.id}/pipeline`
        });
    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create post' },
            { status: 500 }
        );
    }
}

// GET /api/clients/[clientId]/posts - List posts for client
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;

        // Fetch posts from Supabase
        const { data: posts, error } = await supabaseAdmin
            .from('blog_posts')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            posts
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch posts' },
            { status: 500 }
        );
    }
}
