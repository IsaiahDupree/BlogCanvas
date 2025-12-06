import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateBlogPost, saveGeneratedContent } from '@/lib/ai/content-generator';

// POST /api/blog-posts/[id]/generate - Generate content for a single blog post
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { provider = 'anthropic' } = body;

        // Check if post exists
        const { data: post, error: postError } = await supabaseAdmin
            .from('blog_posts')
            .select('id, status, topic')
            .eq('id', id)
            .single();

        if (postError || !post) {
            return NextResponse.json(
                { success: false, error: 'Blog post not found' },
                { status: 404 }
            );
        }

        // Update status to generating
        await supabaseAdmin
            .from('blog_posts')
            .update({ status: 'generating' })
            .eq('id', id);

        try {
            // Generate content
            const { content, qualityScore } = await generateBlogPost(id, provider);

            // Save content and create revision
            await saveGeneratedContent(id, content, qualityScore);

            return NextResponse.json({
                success: true,
                post: {
                    id,
                    content,
                    qualityScore
                }
            });

        } catch (genError: any) {
            // Update status to failed
            await supabaseAdmin
                .from('blog_posts')
                .update({
                    status: 'failed',
                    metadata: { error: genError.message }
                })
                .eq('id', id);

            throw genError;
        }

    } catch (error: any) {
        console.error('Error generating blog post:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate content' },
            { status: 500 }
        );
    }
}
