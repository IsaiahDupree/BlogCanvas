import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; revisionId: string }> }
) {
  try {
    const supabase = await createClient();
    const { postId, revisionId } = await params;

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch specific revision
    const { data: revision, error } = await supabase
      .from('blog_post_revisions')
      .select(`
        id,
        blog_post_id,
        revision_type,
        content,
        content_text,
        created_by,
        created_by_type,
        notes,
        created_at
      `)
      .eq('id', revisionId)
      .eq('blog_post_id', postId)
      .single();

    if (error) {
      console.error('Error fetching revision:', error);
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }

    return NextResponse.json({ revision });

  } catch (error) {
    console.error('Error in GET /api/posts/[postId]/revisions/[revisionId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
