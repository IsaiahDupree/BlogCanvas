import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runOutlineAgent, OutlineAgentInput } from '@/lib/agents/outline';
import { createOpenAIProvider } from '@/lib/agents/openai-provider';

export const maxDuration = 180;

/**
 * POST /api/ai/agents/outline
 * Creates structured content outline with H2/H3 structure, FAQs, and table ideas
 *
 * PRD feat-119: AI Pipeline - Outline Agent Endpoint
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
      topic,
      targetKeyword,
      wordCountGoal,
      clientProfile,
      research,
      researchData,
      blogPostId,
      saveToDatabase = true
    } = body;

    // Validate required inputs
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }
    if (!targetKeyword) {
      return NextResponse.json({ error: 'Target keyword is required' }, { status: 400 });
    }
    if (!wordCountGoal || wordCountGoal < 300) {
      return NextResponse.json({ error: 'Word count goal must be at least 300' }, { status: 400 });
    }

    // Prepare input for outline agent
    const input: OutlineAgentInput = {
      topic,
      targetKeyword,
      wordCountGoal,
      research: research || researchData,
      clientProfile: clientProfile || {
        productServiceSummary: '',
        targetAudience: ''
      }
    };

    // Create LLM provider
    const provider = createOpenAIProvider({ model: 'gpt-4o-mini' });

    // Run outline agent
    const result = await runOutlineAgent(provider, input);

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
        agent_name: 'outline',
        agent_version: '1.0',
        input: input,
        output: result.data,
        duration_ms: duration,
        model_used: provider.name,
        token_count: null, // OpenAI SDK doesn't expose token count easily
        status: 'completed',
        error_message: null
      });

      // Also save as revision
      await supabase.from('blog_post_revisions').insert({
        blog_post_id: blogPostId,
        revision_type: 'outline',
        content: { outline: result.data },
        content_text: JSON.stringify(result.data, null, 2),
        created_by_type: 'system',
        notes: 'AI-generated outline'
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      duration,
      agent: 'outline',
      model: provider.name
    });

  } catch (error: any) {
    console.error('Outline agent error:', error);

    // Log failed execution if blogPostId provided
    const body = await request.json().catch(() => ({}));
    if (body.blogPostId && body.saveToDatabase !== false) {
      try {
        const supabase = await createClient();
        await supabase.from('agent_outputs').insert({
          blog_post_id: body.blogPostId,
          agent_name: 'outline',
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
