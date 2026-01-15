import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

/**
 * GET /api/blog-posts/[id]/pipeline-status
 * Get current pipeline status for a blog post
 *
 * PRD feat-120: Pipeline status tracking per post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Fetch pipeline status
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        pipeline_stage,
        pipeline_progress,
        pipeline_status,
        pipeline_eta_seconds,
        pipeline_error,
        pipeline_started_at,
        pipeline_completed_at,
        pipeline_paused,
        status
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching pipeline status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        stage: data.pipeline_stage || 'idle',
        progress: data.pipeline_progress || 0,
        status: data.pipeline_status || 'idle',
        etaSeconds: data.pipeline_eta_seconds,
        error: data.pipeline_error,
        startedAt: data.pipeline_started_at,
        completedAt: data.pipeline_completed_at,
        paused: data.pipeline_paused || false,
        postStatus: data.status
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/blog-posts/[id]/pipeline-status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/blog-posts/[id]/pipeline-status
 * Update pipeline status for a blog post
 *
 * PRD feat-120: Pipeline status tracking per post
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const {
      stage,
      progress,
      status,
      etaSeconds,
      error: pipelineError,
      paused
    } = body;

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (stage !== undefined) {
      updates.pipeline_stage = stage;
    }

    if (progress !== undefined) {
      if (progress < 0 || progress > 100) {
        return NextResponse.json(
          { error: 'Progress must be between 0 and 100' },
          { status: 400 }
        );
      }
      updates.pipeline_progress = progress;
    }

    if (status !== undefined) {
      updates.pipeline_status = status;

      // Set timestamps based on status
      if (status === 'running' && !updates.pipeline_started_at) {
        updates.pipeline_started_at = new Date().toISOString();
      }
      if (status === 'completed' || status === 'failed') {
        updates.pipeline_completed_at = new Date().toISOString();
      }
    }

    if (etaSeconds !== undefined) {
      updates.pipeline_eta_seconds = etaSeconds;
    }

    if (pipelineError !== undefined) {
      updates.pipeline_error = pipelineError;
    }

    if (paused !== undefined) {
      updates.pipeline_paused = paused;
    }

    // Update the blog post
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select(`
        id,
        pipeline_stage,
        pipeline_progress,
        pipeline_status,
        pipeline_eta_seconds,
        pipeline_error,
        pipeline_started_at,
        pipeline_completed_at,
        pipeline_paused
      `)
      .single();

    if (error) {
      console.error('Error updating pipeline status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        stage: data.pipeline_stage,
        progress: data.pipeline_progress,
        status: data.pipeline_status,
        etaSeconds: data.pipeline_eta_seconds,
        error: data.pipeline_error,
        startedAt: data.pipeline_started_at,
        completedAt: data.pipeline_completed_at,
        paused: data.pipeline_paused
      }
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/blog-posts/[id]/pipeline-status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

