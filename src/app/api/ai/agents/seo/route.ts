import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runSEOAgent, SEOAgentInput } from '@/lib/agents/seo';
import { createOpenAIProvider } from '@/lib/agents/openai-provider';

export const maxDuration = 180;

/**
 * POST /api/ai/agents/seo
 * Optimizes content for search engines without compromising readability
 *
 * PRD feat-119: AI Pipeline - SEO Agent Endpoint
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      fullDraftContent,
      topic,
      targetKeyword,
      wordCount,
      existingContent,
      blogPostId,
      saveToDatabase = true
    } = body;

    // Validate required inputs
    if (!fullDraftContent) {
      return NextResponse.json({ error: 'Full draft content is required' }, { status: 400 });
    }
    if (!targetKeyword) {
      return NextResponse.json({ error: 'Target keyword is required' }, { status: 400 });
    }

    // Prepare input for SEO agent
    const input: SEOAgentInput = {
      fullDraftContent,
      topic,
      targetKeyword,
      wordCount,
      existingContent
    };

    // Create LLM provider
    const provider = createOpenAIProvider({ model: 'gpt-4o-mini' });

    // Run SEO agent
    const result = await runSEOAgent(provider, input);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

    const duration = Date.now() - startTime;

    // Save to agent_outputs table if blogPostId provided
    if (blogPostId && saveToDatabase) {
      await supabase.from('agent_outputs').insert({
        blog_post_id: blogPostId,
        agent_name: 'seo',
        agent_version: '1.0',
        input: input,
        output: result.data,
        duration_ms: duration,
        model_used: provider.name,
        token_count: null,
        status: 'completed',
        error_message: null
      });

      // Also save as revision
      await supabase.from('blog_post_revisions').insert({
        blog_post_id: blogPostId,
        revision_type: 'seo_pass',
        content: { seo: result.data },
        content_text: JSON.stringify(result.data, null, 2),
        created_by_type: 'system',
        notes: 'AI-generated SEO optimization'
      });

      // Update blog post with SEO metadata if available
      if (result.data) {
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        if (result.data.title) {
          updateData.title = result.data.title;
        }
        if (result.data.slug) {
          updateData.slug = result.data.slug;
        }
        if (result.data.metaDescription) {
          updateData.meta_description = result.data.metaDescription;
        }

        await supabase
          .from('blog_posts')
          .update(updateData)
          .eq('id', blogPostId);
      }
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      duration,
      agent: 'seo',
      model: provider.name
    });

  } catch (error: any) {
    console.error('SEO agent error:', error);

    // Log failed execution if blogPostId provided
    const body = await request.json().catch(() => ({}));
    if (body.blogPostId && body.saveToDatabase !== false) {
      try {
        const supabase = await createClient();
        await supabase.from('agent_outputs').insert({
          blog_post_id: body.blogPostId,
          agent_name: 'seo',
          agent_version: '1.0',
          input: body,
          output: null,
          duration_ms: Date.now() - startTime,
          model_used: 'gpt-4o-mini',
          token_count: null,
          status: 'failed',
          error_message: error.message
        });
      } catch (logError) {
        console.error('Failed to log error to agent_outputs:', logError);
      }
    }

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
