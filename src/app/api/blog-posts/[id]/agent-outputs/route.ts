import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/blog-posts/[id]/agent-outputs
 * Fetches all agent outputs for a specific blog post in chronological order
 *
 * PRD feat-121: Timeline component showing all agent outputs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: blogPostId } = await params;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch agent outputs ordered by creation time
    const { data: agentOutputs, error } = await supabase
      .from('agent_outputs')
      .select('*')
      .eq('blog_post_id', blogPostId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching agent outputs:', error);
      return NextResponse.json({
        error: 'Failed to fetch agent outputs',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      agentOutputs: agentOutputs || []
    });

  } catch (error: any) {
    console.error('Agent outputs fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
