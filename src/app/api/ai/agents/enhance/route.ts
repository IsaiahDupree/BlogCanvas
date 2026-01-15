import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runEnhancementAgent, EnhancementAgentInput } from '@/lib/agents/enhancement';
import { createOpenAIProvider } from '@/lib/agents/openai-provider';

export const maxDuration = 180;

/**
 * POST /api/ai/agents/enhance
 * Adds visual and structural elements to improve engagement
 *
 * PRD feat-119: AI Pipeline - Enhancement Agent Endpoint
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
      sectionKeys,
      wordCount,
      blogPostId,
      saveToDatabase = true
    } = body;

    // Validate required inputs
    if (!fullDraftContent) {
      return NextResponse.json({ error: 'Full draft content is required' }, { status: 400 });
    }
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }
    if (!targetKeyword) {
      return NextResponse.json({ error: 'Target keyword is required' }, { status: 400 });
    }

    // Prepare input for enhancement agent
    const input: EnhancementAgentInput = {
      fullDraftContent,
      topic,
      targetKeyword,
      sectionKeys: sectionKeys || [],
      wordCount: wordCount || 0
    };

    // Create LLM provider
    const provider = createOpenAIProvider({ model: 'gpt-4o-mini' });

    // Run enhancement agent
    const result = await runEnhancementAgent(provider, input);

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
        agent_name: 'enhance',
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
        revision_type: 'enhancement',
        content: { enhancement: result.data },
        content_text: JSON.stringify(result.data, null, 2),
        created_by_type: 'system',
        notes: `AI enhancement: ${result.data?.tables?.length || 0} tables, ${result.data?.images?.length || 0} images, ${result.data?.bulletLists?.length || 0} bullet lists`
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      duration,
      agent: 'enhance',
      model: provider.name
    });

  } catch (error: any) {
    console.error('Enhancement agent error:', error);

    // Log failed execution if blogPostId provided
    const body = await request.json().catch(() => ({}));
    if (body.blogPostId && body.saveToDatabase !== false) {
      try {
        const supabase = await createClient();
        await supabase.from('agent_outputs').insert({
          blog_post_id: body.blogPostId,
          agent_name: 'enhance',
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
