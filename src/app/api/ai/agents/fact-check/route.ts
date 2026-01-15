import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runFactCheckAgent, FactCheckAgentInput } from '@/lib/agents/fact-check';
import { createOpenAIProvider } from '@/lib/agents/openai-provider';

export const maxDuration = 180;

/**
 * POST /api/ai/agents/fact-check
 * Verifies claims and adds credible sources
 *
 * PRD feat-119: AI Pipeline - Fact-Check Agent Endpoint
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
      sectionContents,
      topic,
      targetKeyword,
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

    // Prepare input for fact-check agent
    const input: FactCheckAgentInput = {
      fullDraftContent,
      sectionContents,
      topic,
      targetKeyword
    };

    // Create LLM provider
    const provider = createOpenAIProvider({ model: 'gpt-4o' });

    // Run fact-check agent
    const result = await runFactCheckAgent(provider, input);

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
        agent_name: 'fact_check',
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
        revision_type: 'fact_check',
        content: { factCheck: result.data },
        content_text: JSON.stringify(result.data, null, 2),
        created_by_type: 'system',
        notes: `AI fact-check: ${result.data?.factCheckScore || 0}/100 score, ${result.data?.totalClaims || 0} claims analyzed`
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      duration,
      agent: 'fact_check',
      model: provider.name
    });

  } catch (error: any) {
    console.error('Fact-check agent error:', error);

    // Log failed execution if blogPostId provided
    const body = await request.json().catch(() => ({}));
    if (body.blogPostId && body.saveToDatabase !== false) {
      try {
        const supabase = await createClient();
        await supabase.from('agent_outputs').insert({
          blog_post_id: body.blogPostId,
          agent_name: 'fact_check',
          agent_version: '1.0',
          input: body,
          output: null,
          duration_ms: Date.now() - startTime,
          model_used: 'gpt-4o',
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
