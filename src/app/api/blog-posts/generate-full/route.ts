import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runBlogGenerationPipeline, BlogGenerationInput } from '@/lib/agents/blog-pipeline';
import { getSharedClientContext, formatContextForAI } from '@/lib/brand/shared-context';

export const maxDuration = 300; // 5 minutes for full generation

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      topic, 
      targetKeyword, 
      wordCountGoal = 1500,
      clientId,
      websiteId,
      batchId,
      blogPostId,
      options = {}
    } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Get client profile if clientId provided - FULL BRAND CONTEXT via unified service
    let clientProfile: BlogGenerationInput['clientProfile'] = {
      productServiceSummary: 'General business',
      targetAudience: 'Business professionals'
    };

    // Store the full shared context for potential future use
    let sharedContext = null;

    if (clientId) {
      try {
        // Use the unified getSharedClientContext service
        sharedContext = await getSharedClientContext(clientId);

        // Map the shared context to the clientProfile format expected by the pipeline
        clientProfile = {
          // Basic Info
          clientName: sharedContext.clientName,

          // Brand Snapshot - Core
          productServiceSummary: sharedContext.productsServices.length > 0
            ? sharedContext.productsServices.map((ps: any) => ps.name || ps.description).join(', ')
            : 'General business',
          targetAudience: sharedContext.targetAudiences.length > 0
            ? sharedContext.targetAudiences.map((ta: any) => ta.name || ta.description).join(', ')
            : 'Business professionals',
          positioning: sharedContext.brandGuide.tagline || '',

          // Tone & Voice
          brandVoice: sharedContext.voiceAndTone.voiceTraits,
          brandTone: sharedContext.voiceAndTone.voiceTraits.length > 0
            ? sharedContext.voiceAndTone.voiceTraits[0]
            : 'Professional',

          // Brand Messaging
          tagline: sharedContext.brandGuide.tagline || undefined,
          keyMessages: [], // TODO: Extract from messaging hierarchy
          valuePropositions: sharedContext.valuePropositions,

          // Competitive Context - Using donts as differentiators proxy
          competitors: [],
          keyDifferentiators: sharedContext.valuePropositions,

          // Content Guidelines
          keywordsToInclude: sharedContext.stylesToKeep.preferredPatterns,
          keywordsToAvoid: sharedContext.stylesToAvoid.wordPatterns,
          topicsToAvoid: sharedContext.donts,
          styleNotes: formatContextForAI(sharedContext)
        };
      } catch (error) {
        console.error('Failed to fetch shared client context:', error);
        // Fall back to defaults if context fetch fails
      }
    }

    // Run the full blog generation pipeline
    // feat-172: Pass full brandContext instead of just clientProfile
    const pipelineInput: BlogGenerationInput = {
      topic,
      targetKeyword: targetKeyword || topic,
      wordCountGoal,
      blogPostId: blogPostId || undefined, // Pass blogPostId for revision tracking
      supabaseClient: supabase as any, // Pass supabase client for revision tracking
      clientProfile, // Keep for backwards compatibility
      brandContext: sharedContext || undefined, // feat-172: Pass full brand context
      options: {
        generateMultipleOutlines: options.generateMultipleOutlines || false,
        skipFactCheck: options.skipFactCheck || false,
        skipEnhancement: options.skipEnhancement || false,
        usePremiumModel: options.usePremiumModel || false
      }
    };

    const result = await runBlogGenerationPipeline(pipelineInput);

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error,
        steps: result.steps,
        duration: result.totalDuration
      }, { status: 500 });
    }

    // If blogPostId provided, update the existing blog post
    if (blogPostId && result.blogPost) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          title: result.blogPost.title,
          slug: result.blogPost.slug,
          meta_description: result.blogPost.metaDescription,
          content: result.blogPost.content,
          word_count: result.blogPost.wordCount,
          seo_quality_score: result.blogPost.seoScore,
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', blogPostId);

      if (updateError) {
        console.error('Failed to update blog post:', updateError);
      }

      // Note: Individual stage revisions (outline, draft, seo_pass, fact_check, enhancement)
      // are automatically saved by the pipeline orchestrator
    }

    // If batchId provided and no blogPostId, create a new blog post
    if (batchId && !blogPostId && result.blogPost) {
      const { data: newPost, error: createError } = await supabase
        .from('blog_posts')
        .insert({
          content_batch_id: batchId,
          title: result.blogPost.title,
          slug: result.blogPost.slug,
          meta_description: result.blogPost.metaDescription,
          target_keyword: targetKeyword || topic,
          content: result.blogPost.content,
          word_count: result.blogPost.wordCount,
          seo_quality_score: result.blogPost.seoScore,
          status: 'draft'
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create blog post:', createError);
      }
      // Note: Revisions are saved during pipeline execution if blogPostId was provided
      // For new posts, we'd need to re-run pipeline or save revisions post-creation
    }

    return NextResponse.json({
      success: true,
      blogPost: result.blogPost,
      research: result.research,
      outline: result.outline,
      outlineOptions: result.outlineOptions,
      seoMetadata: result.seoMetadata,
      factCheck: result.factCheck,
      enhancements: result.enhancements,
      voiceTone: result.voiceTone,
      steps: result.steps,
      duration: result.totalDuration
    });

  } catch (error: any) {
    console.error('Blog generation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Blog generation failed' 
    }, { status: 500 });
  }
}
