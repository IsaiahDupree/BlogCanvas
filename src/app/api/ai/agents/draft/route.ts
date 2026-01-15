import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runDraftAgent, DraftAgentInput } from '@/lib/agents/draft';
import { createOpenAIProvider } from '@/lib/agents/openai-provider';
import { OutlineSection } from '@/lib/agents/types';

export const maxDuration = 180;

/**
 * POST /api/ai/agents/draft
 * Writes complete blog post content following an outline
 *
 * PRD feat-119: AI Pipeline - Drafting Agent Endpoint
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
      section,
      topic,
      targetKeyword,
      marketingContext,
      previousSections,
      researchData,
      clientProfile,
      blogPostId,
      saveToDatabase = true
    } = body;

    // Validate required inputs
    if (!section) {
      return NextResponse.json({ error: 'Section outline is required' }, { status: 400 });
    }
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Prepare input for draft agent
    const input: DraftAgentInput = {
      section: section as OutlineSection,
      topic,
      targetKeyword,
      marketingContext,
      previousSections,
      researchData,
      clientProfile
    };

    // Create LLM provider
    const provider = createOpenAIProvider({ model: 'gpt-4o' });

    // Run draft agent
    const result = await runDraftAgent(provider, input);

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
        agent_name: 'draft',
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
        revision_type: 'draft',
        content: { draft: result.data },
        content_text: result.data?.content || '',
        created_by_type: 'system',
        notes: `AI-generated draft for section: ${section.title}`
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      duration,
      agent: 'draft',
      model: provider.name
    });

  } catch (error: any) {
    console.error('Draft agent error:', error);

    // Log failed execution if blogPostId provided
    const body = await request.json().catch(() => ({}));
    if (body.blogPostId && body.saveToDatabase !== false) {
      try {
        const supabase = await createClient();
        await supabase.from('agent_outputs').insert({
          blog_post_id: body.blogPostId,
          agent_name: 'draft',
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
