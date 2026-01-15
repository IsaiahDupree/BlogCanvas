import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const revisionType = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100' },
        { status: 400 }
      );
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
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
      `, { count: 'exact' })
      .eq('blog_post_id', id)
      .order('created_at', { ascending: false });

    // Apply revision type filter if provided
    if (revisionType) {
      query = query.eq('revision_type', revisionType);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: revisions, error, count } = await query;

    if (error) {
      console.error('Error fetching revisions:', error);
      return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0;
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      revisions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/blog-posts/[id]/revisions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the blog post exists
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
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

    // Validate revision_type
    const validTypes = ['outline', 'draft', 'seo_pass', 'fact_check', 'human_edit', 'enhancement', 'ai_generated'];
    if (!validTypes.includes(revision_type)) {
      return NextResponse.json(
        { error: `Invalid revision_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create new revision
    const { data: revision, error } = await supabase
      .from('blog_post_revisions')
      .insert({
        blog_post_id: id,
        revision_type,
        content,
        content_text: content_text || '',
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
    console.error('Error in POST /api/blog-posts/[id]/revisions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
