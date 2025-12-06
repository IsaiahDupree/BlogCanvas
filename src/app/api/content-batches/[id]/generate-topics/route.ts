import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/content-batches/[id]/generate-topics - Auto-generate topics from gaps and clusters
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: batchId } = await params;

        // Get batch details
        const { data: batch, error: batchError } = await supabaseAdmin
            .from('content_batches')
            .select('*, website:websites(*)')
            .eq('id', batchId)
            .single();

        if (batchError || !batch) {
            return NextResponse.json(
                { success: false, error: 'Batch not found' },
                { status: 404 }
            );
        }

        const websiteId = batch.website_id;
        const topics: any[] = [];

        // 1. Generate topics from content gaps
        const { data: gaps } = await supabaseAdmin
            .from('content_gaps')
            .select('*')
            .eq('website_id', websiteId)
            .eq('status', 'open')
            .order('severity', { ascending: true }); // High severity first

        for (const gap of gaps || []) {
            // Create 1-2 blog posts per gap
            const postCount = gap.severity === 'high' ? 2 : 1;

            for (let i = 0; i < postCount; i++) {
                topics.push({
                    content_batch_id: batchId,
                    topic: `${gap.title} - Solution Guide ${i + 1}`,
                    target_keyword: gap.title.toLowerCase(),
                    target_audience: 'General',
                    word_count_goal: gap.severity === 'high' ? 1500 : 1000,
                    tone_of_voice: 'professional',
                    goal: gap.suggested_action,
                    status: 'planned'
                });
            }
        }

        // 2. Generate topics from uncovered clusters
        const { data: clusters } = await supabaseAdmin
            .from('topic_clusters')
            .select('*')
            .eq('website_id', websiteId)
            .eq('currently_covered', false)
            .order('estimated_traffic', { ascending: false }); // High traffic first

        for (const cluster of clusters || []) {
            // Create recommended number of posts for this cluster
            const postCount = Math.min(cluster.recommended_article_count, 8);

            for (let i = 0; i < postCount; i++) {
                const topicVariations = [
                    `Complete Guide to ${cluster.name}`,
                    `${cluster.name}: Best Practices`,
                    `How to Master ${cluster.name}`,
                    `${cluster.name} for Beginners`,
                    `Advanced ${cluster.name} Strategies`,
                    `Common ${cluster.name} Mistakes to Avoid`,
                    `${cluster.name}: Tips and Tricks`,
                    `The Ultimate ${cluster.name} Checklist`
                ];

                topics.push({
                    content_batch_id: batchId,
                    topic_cluster_id: cluster.id,
                    topic: topicVariations[i] || `${cluster.name} - Article ${i + 1}`,
                    target_keyword: cluster.primary_keyword,
                    target_audience: cluster.search_intent === 'commercial' ? 'Decision Makers' : 'General',
                    word_count_goal: 1200,
                    tone_of_voice: 'professional',
                    goal: `Cover ${cluster.name} cluster keywords`,
                    status: 'planned'
                });
            }
        }

        // Limit to batch total_posts if specified
        let finalTopics = topics;
        if (batch.total_posts && topics.length > batch.total_posts) {
            finalTopics = topics.slice(0, batch.total_posts);
        }

        // Insert topics as blog posts
        const { data: createdPosts, error: insertError } = await supabaseAdmin
            .from('blog_posts')
            .insert(finalTopics)
            .select();

        if (insertError) {
            console.error('Error creating topics:', insertError);
            return NextResponse.json(
                { success: false, error: 'Failed to generate topics' },
                { status: 500 }
            );
        }

        // Update batch total
        await supabaseAdmin
            .from('content_batches')
            .update({ total_posts: createdPosts?.length || 0 })
            .eq('id', batchId);

        return NextResponse.json({
            success: true,
            topics: createdPosts,
            count: createdPosts?.length || 0
        });

    } catch (error) {
        console.error('Error generating topics:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
