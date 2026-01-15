import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

/**
 * POST /api/blog-posts/[id]/pipeline-status/pause
 * Pause or resume the pipeline for a blog post
 *
 * PRD feat-120: Pipeline status tracking per post - Allow pause/resume
 */
export async function POST(
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
    const { action } = body; // 'pause' or 'resume'

    if (!action || !['pause', 'resume'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "pause" or "resume"' },
        { status: 400 }
      );
    }

    const updates: any = {
      pipeline_paused: action === 'pause',
      pipeline_status: action === 'pause' ? 'paused' : 'running',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select(`
        id,
        pipeline_stage,
        pipeline_progress,
        pipeline_status,
        pipeline_paused
      `)
      .single();

    if (error) {
      console.error('Error pausing/resuming pipeline:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        stage: data.pipeline_stage,
        progress: data.pipeline_progress,
        status: data.pipeline_status,
        paused: data.pipeline_paused
      },
      message: action === 'pause' ? 'Pipeline paused' : 'Pipeline resumed'
    });
  } catch (error: any) {
    console.error('Error in POST /api/blog-posts/[id]/pipeline-status/pause:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
