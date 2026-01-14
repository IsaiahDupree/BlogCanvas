/**
 * API Route: Outline Options Management
 * GET: Fetch all outline options for a post
 * POST: Generate 3 outline options
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runOutlineAgentWithOptions } from '@/lib/agents/outline';
import { createOpenAIProvider } from '@/lib/agents/openai-provider';

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const supabase = await createClient();
    const postId = params.postId;

    // Fetch outline options
    const { data: options, error } = await supabase
      .from('outline_options')
      .select('*')
      .eq('blog_post_id', postId)
      .order('option_number', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ options: options || [] });
  } catch (error: any) {
    console.error('Error fetching outline options:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch outline options' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const supabase = await createClient();
    const postId = params.postId;

    // Fetch blog post details
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        client:clients(
          id,
          client_profile:client_profiles(
            product_service_summary,
            target_audience
          )
        )
      `)
      .eq('id', postId)
      .single();

    if (postError) throw postError;
    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Get research data if available
    const researchData = post.research_context as any;

    // Create provider
    const provider = createOpenAIProvider();

    // Generate 3 outline options
    const result = await runOutlineAgentWithOptions(provider, {
      topic: post.topic,
      targetKeyword: post.target_keyword || post.topic,
      wordCountGoal: post.word_count_goal || 1500,
      researchData: researchData,
      clientProfile: {
        productServiceSummary: (post.client as any)?.client_profile?.product_service_summary || '',
        targetAudience: (post.client as any)?.client_profile?.target_audience || ''
      }
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate outline options' },
        { status: 500 }
      );
    }

    // Delete existing options
    await supabase
      .from('outline_options')
      .delete()
      .eq('blog_post_id', postId);

    // Store all 3 options in database
    const optionsToInsert = result.data.options.map((outline, index) => ({
      blog_post_id: postId,
      option_number: index + 1,
      outline_data: outline,
      total_estimated_words: outline.totalEstimatedWords,
      is_selected: false
    }));

    const { data: savedOptions, error: insertError } = await supabase
      .from('outline_options')
      .insert(optionsToInsert)
      .select();

    if (insertError) throw insertError;

    // Create agent run record
    await supabase.from('agent_runs').insert({
      blog_post_id: postId,
      agent_name: 'outline_options',
      status: 'succeeded',
      input_summary: {
        topic: post.topic,
        targetKeyword: post.target_keyword,
        optionsGenerated: 3
      },
      output_summary: {
        optionsCount: result.data.options.length,
        totalWords: result.data.options.map(o => o.totalEstimatedWords)
      },
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      options: savedOptions,
      totalGenerated: result.data.totalGenerated
    });
  } catch (error: any) {
    console.error('Error generating outline options:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate outline options' },
      { status: 500 }
    );
  }
}
