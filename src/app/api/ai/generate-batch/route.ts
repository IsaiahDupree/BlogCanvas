import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runBlogGenerationPipeline, BlogGenerationInput } from '@/lib/agents/blog-pipeline';

export const maxDuration = 300;

interface BatchJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  topic: string;
  targetKeyword: string;
  progress: number;
  result?: any;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      batchId,
      topics,
      clientId,
      wordCountGoal = 1500,
      options = {}
    } = body;

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json({ 
        error: 'Topics array is required' 
      }, { status: 400 });
    }

    // Get client profile
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
          productServiceSummary: brandGuide?.product_service_summary || client.industry,
          targetAudience: brandGuide?.target_audience || 'Business professionals',
          brandVoice: brandGuide?.tone_profile?.voice || ['Professional', 'Helpful'],
          brandTone: brandGuide?.tone_profile?.tone || 'Professional'
        };
      }
    }

    // Create batch jobs
    const jobs: BatchJob[] = topics.map((topic: any, index: number) => ({
      id: `job_${index}`,
      status: 'pending' as const,
      topic: typeof topic === 'string' ? topic : topic.topic,
      targetKeyword: typeof topic === 'string' ? topic : topic.targetKeyword || topic.topic,
      progress: 0
    }));

    const results: BatchJob[] = [];
    let completedCount = 0;

    // Process jobs sequentially (could be parallelized with limits)
    for (const job of jobs) {
      job.status = 'processing';
      
      try {
        const pipelineInput: BlogGenerationInput = {
          topic: job.topic,
          targetKeyword: job.targetKeyword,
          wordCountGoal,
          clientProfile,
          options: {
            generateMultipleOutlines: false,
            skipFactCheck: options.skipFactCheck || false,
            skipEnhancement: options.skipEnhancement || false,
            usePremiumModel: options.usePremiumModel || false
          }
        };

        const result = await runBlogGenerationPipeline(pipelineInput);

        if (result.success && result.blogPost) {
          job.status = 'completed';
          job.progress = 100;
          job.result = {
            title: result.blogPost.title,
            slug: result.blogPost.slug,
            wordCount: result.blogPost.wordCount,
            seoScore: result.blogPost.seoScore,
            factCheckScore: result.blogPost.factCheckScore
          };

          // Save to database if batchId provided
          if (batchId) {
            const { data: newPost } = await supabase
              .from('blog_posts')
              .insert({
                content_batch_id: batchId,
                title: result.blogPost.title,
                slug: result.blogPost.slug,
                meta_description: result.blogPost.metaDescription,
                target_keyword: job.targetKeyword,
                content: result.blogPost.content,
                word_count: result.blogPost.wordCount,
                seo_quality_score: result.blogPost.seoScore,
                status: 'draft'
              })
              .select()
              .single();

            if (newPost) {
              await supabase.from('blog_post_revisions').insert({
                blog_post_id: newPost.id,
                revision_type: 'ai_batch_generation',
                content: result.blogPost.content,
                created_by: 'system'
              });

              job.result.blogPostId = newPost.id;
            }
          }
        } else {
          job.status = 'failed';
          job.error = result.error || 'Generation failed';
        }
      } catch (error: any) {
        job.status = 'failed';
        job.error = error.message;
      }

      completedCount++;
      results.push({ ...job });
    }

    // Update batch status if batchId provided
    if (batchId) {
      const successCount = results.filter(j => j.status === 'completed').length;
      const failedCount = results.filter(j => j.status === 'failed').length;

      await supabase
        .from('content_batches')
        .update({
          status: failedCount === 0 ? 'completed' : 'partial',
          completed_posts: successCount,
          total_posts: topics.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId);
    }

    const successCount = results.filter(j => j.status === 'completed').length;
    const failedCount = results.filter(j => j.status === 'failed').length;

    return NextResponse.json({
      success: true,
      summary: {
        total: topics.length,
        completed: successCount,
        failed: failedCount
      },
      jobs: results
    });

  } catch (error: any) {
    console.error('Batch generation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
