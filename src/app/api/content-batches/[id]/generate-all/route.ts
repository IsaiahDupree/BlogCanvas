import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateBlogPost, saveGeneratedContent } from '@/lib/ai/content-generator';

// POST /api/content-batches/[id]/generate-all - Generate content for all posts in a batch
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: batchId } = await params;
        const body = await request.json();
        const { provider = 'anthropic', maxConcurrent = 3 } = body;

        // Get batch and verify it exists
        const { data: batch, error: batchError } = await supabaseAdmin
            .from('content_batches')
            .select('id, status, total_posts')
            .eq('id', batchId)
            .single();

        if (batchError || !batch) {
            return NextResponse.json(
                { success: false, error: 'Batch not found' },
                { status: 404 }
            );
        }

        // Get all planned posts in this batch
        const { data: posts, error: postsError } = await supabaseAdmin
            .from('blog_posts')
            .select('id, topic, status')
            .eq('content_batch_id', batchId)
            .in('status', ['planned', 'failed']);

        if (postsError || !posts || posts.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No posts to generate' },
                { status: 400 }
            );
        }

        // Update batch status
        await supabaseAdmin
            .from('content_batches')
            .update({ status: 'generating' })
            .eq('id', batchId);

        // Process posts in batches with concurrency limit
        const results = {
            total: posts.length,
            succeeded: 0,
            failed: 0,
            errors: [] as any[]
        };

        // Process in chunks
        for (let i = 0; i < posts.length; i += maxConcurrent) {
            const chunk = posts.slice(i, i + maxConcurrent);

            const chunkResults = await Promise.allSettled(
                chunk.map(async (post) => {
                    try {
                        // Update post status
                        await supabaseAdmin
                            .from('blog_posts')
                            .update({ status: 'generating' })
                            .eq('id', post.id);

                        // Generate content
                        const { content, qualityScore } = await generateBlogPost(post.id, provider);

                        // Save content
                        await saveGeneratedContent(post.id, content, qualityScore);

                        results.succeeded++;
                        return { postId: post.id, success: true };
                    } catch (error: any) {
                        // Mark as failed
                        await supabaseAdmin
                            .from('blog_posts')
                            .update({
                                status: 'failed',
                                metadata: { error: error.message }
                            })
                            .eq('id', post.id);

                        results.failed++;
                        results.errors.push({
                            postId: post.id,
                            topic: post.topic,
                            error: error.message
                        });
                        return { postId: post.id, success: false, error: error.message };
                    }
                })
            );

            // Small delay between chunks to avoid rate limiting
            if (i + maxConcurrent < posts.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Update batch status
        const finalStatus = results.failed === 0 ? 'completed' :
            results.succeeded === 0 ? 'failed' : 'partial';

        await supabaseAdmin
            .from('content_batches')
            .update({
                status: finalStatus,
                posts_completed: results.succeeded
            })
            .eq('id', batchId);

        return NextResponse.json({
            success: true,
            results: {
                total: results.total,
                succeeded: results.succeeded,
                failed: results.failed,
                errors: results.errors
            },
            batchStatus: finalStatus
        });

    } catch (error: any) {
        console.error('Error in batch generation:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate batch' },
            { status: 500 }
        );
    }
}

// GET /api/content-batches/[id]/progress - Get generation progress
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: batchId } = await params;

        // Get batch details
        const { data: batch } = await supabaseAdmin
            .from('content_batches')
            .select('*')
            .eq('id', batchId)
            .single();

        if (!batch) {
            return NextResponse.json(
                { success: false, error: 'Batch not found' },
                { status: 404 }
            );
        }

        // Get post status counts
        const { data: posts } = await supabaseAdmin
            .from('blog_posts')
            .select('id, status, seo_quality_score')
            .eq('content_batch_id', batchId);

        const statusCounts = {
            planned: 0,
            generating: 0,
            draft: 0,
            failed: 0
        };

        const qualityScores: number[] = [];

        posts?.forEach(post => {
            if (post.status in statusCounts) {
                statusCounts[post.status as keyof typeof statusCounts]++;
            }
            if (post.seo_quality_score) {
                qualityScores.push(post.seo_quality_score);
            }
        });

        const avgQualityScore = qualityScores.length > 0
            ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
            : 0;

        const totalPosts = posts?.length || 0;
        const completedPosts = statusCounts.draft;
        const progressPercent = totalPosts > 0
            ? Math.round((completedPosts / totalPosts) * 100)
            : 0;

        return NextResponse.json({
            success: true,
            progress: {
                total: totalPosts,
                completed: completedPosts,
                generating: statusCounts.generating,
                failed: statusCounts.failed,
                pending: statusCounts.planned,
                percent: progressPercent,
                avgQualityScore
            },
            batch
        });

    } catch (error) {
        console.error('Error fetching progress:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch progress' },
            { status: 500 }
        );
    }
}
