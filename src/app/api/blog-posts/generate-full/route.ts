import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runBlogGenerationPipeline, BlogGenerationInput } from '@/lib/agents/blog-pipeline';

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

    // Get client profile if clientId provided
    let clientProfile: BlogGenerationInput['clientProfile'] = {
      productServiceSummary: 'General business',
      targetAudience: 'Business professionals'
    };

    if (clientId) {
      const { data: client } = await supabase
        .from('clients')
        .select('*, brand_guides(*)')
        .eq('id', clientId)
        .single();

      if (client) {
        const brandGuide = client.brand_guides?.[0];
        clientProfile = {
          productServiceSummary: brandGuide?.product_service_summary || client.industry || 'General business',
          targetAudience: brandGuide?.target_audience || 'Business professionals',
          brandVoice: brandGuide?.tone_profile?.voice || ['Professional', 'Helpful'],
          brandTone: brandGuide?.tone_profile?.tone || 'Professional'
        };
      }
    }

    // Run the full blog generation pipeline
    const pipelineInput: BlogGenerationInput = {
      topic,
      targetKeyword: targetKeyword || topic,
      wordCountGoal,
      clientProfile,
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

      // Save revision
      await supabase.from('blog_post_revisions').insert({
        blog_post_id: blogPostId,
        revision_type: 'ai_full_generation',
        content: result.blogPost.content,
        created_by: 'system',
        metadata: {
          seoScore: result.blogPost.seoScore,
          factCheckScore: result.blogPost.factCheckScore,
          enhancementScore: result.blogPost.enhancementScore,
          steps: result.steps,
          duration: result.totalDuration
        }
      });
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
      } else if (newPost) {
        // Save initial revision
        await supabase.from('blog_post_revisions').insert({
          blog_post_id: newPost.id,
          revision_type: 'ai_full_generation',
          content: result.blogPost.content,
          created_by: 'system'
        });
      }
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
