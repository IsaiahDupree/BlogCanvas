import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const supabase = await createClient();
    const { postId } = await params;

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all revisions for this post, ordered by created_at descending (newest first)
    const { data: revisions, error } = await supabase
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
      .eq('blog_post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching revisions:', error);
      return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
    }

    return NextResponse.json({ revisions });

  } catch (error) {
    console.error('Error in GET /api/posts/[postId]/revisions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const supabase = await createClient();
    const { postId } = await params;

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { revision_type, content, content_text, notes } = body;

    // Validate required fields
    if (!revision_type || !content) {
      return NextResponse.json(
        { error: 'revision_type and content are required' },
        { status: 400 }
      );
    }

    // Create new revision
    const { data: revision, error } = await supabase
      .from('blog_post_revisions')
      .insert({
        blog_post_id: postId,
        revision_type,
        content,
        content_text: content_text || null,
        created_by: user.id,
        created_by_type: 'user',
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating revision:', error);
      return NextResponse.json({ error: 'Failed to create revision' }, { status: 500 });
    }

    return NextResponse.json({ revision }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/posts/[postId]/revisions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
