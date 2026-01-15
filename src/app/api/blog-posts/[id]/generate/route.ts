import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { BlogGenerationInput } from '@/lib/agents/blog-pipeline';
import { runPipelineWithQualityGates, PipelineOrchestratorOptions } from '@/lib/agents/pipeline-orchestrator';
import { parseSearchIntent } from '@/lib/search-intent';

// POST /api/blog-posts/[id]/generate - Generate content for a single blog post using full AI pipeline
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            usePremiumModel = false,
            qualityGates = {},
            overrideQualityGates = false
        } = body;

        // Fetch post with all needed data
        const { data: post, error: postError } = await supabaseAdmin
            .from('blog_posts')
            .select(`
                id,
                status,
                topic,
                target_keyword,
                word_count_goal,
                search_intent,
                client_id,
                clients (
                    brand_name,
                    industry,
                    brand_guides (
                        brand_voice,
                        brand_tone,
                        formality_level,
                        playfulness_level,
                        tagline,
                        key_messages,
                        value_propositions,
                        target_audience,
                        positioning,
                        keywords_to_include,
                        keywords_to_avoid,
                        topics_to_avoid,
                        style_notes
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (postError || !post) {
            return NextResponse.json(
                { success: false, error: 'Blog post not found' },
                { status: 404 }
            );
        }

        // Update status to ai_drafting (PRD status)
        await supabaseAdmin
            .from('blog_posts')
            .update({ status: 'ai_drafting', updated_at: new Date().toISOString() })
            .eq('id', id);

        try {
            // Build client profile from brand guide
            const brandGuide = post.clients?.brand_guides?.[0];
            const clientProfile: BlogGenerationInput['clientProfile'] = {
                clientName: post.clients?.brand_name || 'Client',
                industry: post.clients?.industry,
                productServiceSummary: brandGuide?.positioning || '',
                targetAudience: brandGuide?.target_audience || 'Business professionals',
                positioning: brandGuide?.positioning,
                brandVoice: brandGuide?.brand_voice || ['Professional', 'Helpful'],
                brandTone: brandGuide?.brand_tone || 'Professional',
                formalityLevel: brandGuide?.formality_level,
                playfulnessLevel: brandGuide?.playfulness_level,
                tagline: brandGuide?.tagline,
                keyMessages: brandGuide?.key_messages || [],
                valuePropositions: brandGuide?.value_propositions || [],
                keywordsToInclude: brandGuide?.keywords_to_include || [],
                keywordsToAvoid: brandGuide?.keywords_to_avoid || [],
                topicsToAvoid: brandGuide?.topics_to_avoid || [],
                styleNotes: brandGuide?.style_notes
            };

            // Run the full AI pipeline with quality gates (feat-116, feat-117)
            const pipelineInput: BlogGenerationInput = {
                topic: post.topic || 'Article Topic',
                targetKeyword: post.target_keyword || '',
                wordCountGoal: post.word_count_goal || 1500,
                searchIntent: parseSearchIntent(post.search_intent) || undefined,
                clientProfile,
                options: {
                    usePremiumModel,
                    skipFactCheck: false,
                    skipEnhancement: false
                }
            };

            const orchestratorOptions: PipelineOrchestratorOptions = {
                qualityGates,
                overrides: {
                    skipQualityGates: overrideQualityGates
                },
                maxRetries: 2,
                retryFailedSteps: true
            };

            const result = await runPipelineWithQualityGates(pipelineInput, orchestratorOptions);

            if (!result.success) {
                throw new Error(result.error || 'Pipeline execution failed');
            }

            // Save the complete generated content
            const finalContent = result.blogPost!.content;
            const seoScore = result.blogPost!.seoScore;

            await supabaseAdmin
                .from('blog_posts')
                .update({
                    content: finalContent,
                    seo_quality_score: seoScore,
                    status: 'editor_review', // PRD: Move to editor review after AI completes
                    metadata: {
                        wordCount: result.blogPost!.wordCount,
                        factCheckScore: result.blogPost!.factCheckScore,
                        enhancementScore: result.blogPost!.enhancementScore,
                        pipelineSteps: result.steps,
                        totalDuration: result.totalDuration
                    },
                    generated_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            // Save revisions for audit trail (per PRD requirement)
            const revisions = [
                { type: 'outline', content: JSON.stringify(result.outline) },
                { type: 'draft', content: finalContent },
                { type: 'seo_pass', content: JSON.stringify(result.seoMetadata) },
                { type: 'fact_check', content: JSON.stringify(result.factCheck) },
                { type: 'enhancement', content: JSON.stringify(result.enhancements) }
            ];

            for (const revision of revisions) {
                await supabaseAdmin
                    .from('blog_post_revisions')
                    .insert({
                        blog_post_id: id,
                        revision_type: revision.type,
                        content: revision.content,
                        created_at: new Date().toISOString()
                    });
            }

            return NextResponse.json({
                success: true,
                post: {
                    id,
                    content: finalContent,
                    seoScore: seoScore,
                    wordCount: result.blogPost!.wordCount,
                    factCheckScore: result.blogPost!.factCheckScore,
                    enhancementScore: result.blogPost!.enhancementScore
                },
                pipeline: {
                    steps: result.steps,
                    totalDuration: result.totalDuration,
                    qualityGates: result.qualityGates,
                    retries: result.retries
                }
            });

        } catch (genError: any) {
            console.error('Pipeline generation error:', genError);

            // Update status to failed
            await supabaseAdmin
                .from('blog_posts')
                .update({
                    status: 'failed',
                    metadata: { error: genError.message, failedAt: new Date().toISOString() },
                    updated_at: new Date().toISOString()
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
