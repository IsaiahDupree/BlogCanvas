import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { diffLines, diffWords, Change } from 'diff';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; revisionId: string }> }
) {
  try {
    const supabase = await createClient();
    const { postId, revisionId } = await params;
    const { searchParams } = new URL(request.url);
    const compareWith = searchParams.get('compareWith'); // Optional: compare with specific revision

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch the target revision
    const { data: targetRevision, error: targetError } = await supabase
      .from('blog_post_revisions')
      .select('*')
      .eq('id', revisionId)
      .eq('blog_post_id', postId)
      .single();

    if (targetError || !targetRevision) {
      return NextResponse.json({ error: 'Target revision not found' }, { status: 404 });
    }

    let compareRevision;

    if (compareWith) {
      // Compare with specific revision
      const { data, error } = await supabase
        .from('blog_post_revisions')
        .select('*')
        .eq('id', compareWith)
        .eq('blog_post_id', postId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Comparison revision not found' }, { status: 404 });
      }

      compareRevision = data;
    } else {
      // Compare with previous revision (get the next older revision)
      const { data, error } = await supabase
        .from('blog_post_revisions')
        .select('*')
        .eq('blog_post_id', postId)
        .lt('created_at', targetRevision.created_at)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // No previous revision, compare with empty
        compareRevision = {
          content: { content: '', title: '', meta_description: '' },
          content_text: '',
        };
      } else {
        compareRevision = data;
      }
    }

    // 2. Extract text from both revisions
    const targetContent = extractContentText(targetRevision);
    const compareContent = extractContentText(compareRevision);

    // 3. Generate diff
    const lineDiff = diffLines(compareContent.content, targetContent.content);
    const titleDiff = diffWords(compareContent.title, targetContent.title);
    const metaDiff = diffWords(compareContent.meta_description, targetContent.meta_description);

    return NextResponse.json({
      diff: {
        content: lineDiff,
        title: titleDiff,
        meta_description: metaDiff,
      },
      targetRevision: {
        id: targetRevision.id,
        type: targetRevision.revision_type,
        created_at: targetRevision.created_at,
        created_by_type: targetRevision.created_by_type,
      },
      compareRevision: compareRevision.id ? {
        id: compareRevision.id,
        type: compareRevision.revision_type,
        created_at: compareRevision.created_at,
        created_by_type: compareRevision.created_by_type,
      } : null,
    });

  } catch (error) {
    console.error('Error in GET /api/posts/[postId]/revisions/[revisionId]/diff:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to extract text from revision content
function extractContentText(revision: any): { content: string; title: string; meta_description: string } {
  if (!revision.content) {
    return {
      content: revision.content_text || '',
      title: '',
      meta_description: '',
    };
  }

  const content = typeof revision.content === 'string'
    ? JSON.parse(revision.content)
    : revision.content;

  return {
    content: content.content || content.text || revision.content_text || '',
    title: content.title || '',
    meta_description: content.meta_description || '',
  };
}
