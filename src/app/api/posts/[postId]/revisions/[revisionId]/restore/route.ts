import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
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

    // 1. Fetch the revision to restore
    const { data: revision, error: revisionError } = await supabase
      .from('blog_post_revisions')
      .select('*')
      .eq('id', revisionId)
      .eq('blog_post_id', postId)
      .single();

    if (revisionError || !revision) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }

    // 2. Fetch the current post
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // 3. Create a backup revision of the current state before restoring
    const { error: backupError } = await supabase
      .from('blog_post_revisions')
      .insert({
        blog_post_id: postId,
        revision_type: 'human_edit',
        content: {
          content: post.content,
          title: post.title,
          meta_description: post.meta_description,
        },
        content_text: post.content || '',
        created_by: user.id,
        created_by_type: 'user',
        notes: `Backup before restoring revision ${revisionId}`,
      });

    if (backupError) {
      console.error('Error creating backup revision:', backupError);
      return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
    }

    // 4. Restore the content from the revision
    const restoredContent = revision.content as any;

    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        content: restoredContent.content || restoredContent.text || revision.content_text,
        title: restoredContent.title || post.title,
        meta_description: restoredContent.meta_description || post.meta_description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (updateError) {
      console.error('Error restoring post:', updateError);
      return NextResponse.json({ error: 'Failed to restore post' }, { status: 500 });
    }

    // 5. Create a new revision to track the restore action
    const { error: restoreRevisionError } = await supabase
      .from('blog_post_revisions')
      .insert({
        blog_post_id: postId,
        revision_type: 'human_edit',
        content: restoredContent,
        content_text: restoredContent.content || restoredContent.text || revision.content_text,
        created_by: user.id,
        created_by_type: 'user',
        notes: `Restored from revision ${revisionId} (${revision.revision_type} from ${new Date(revision.created_at).toLocaleString()})`,
      });

    if (restoreRevisionError) {
      console.error('Error creating restore revision:', restoreRevisionError);
      // Don't fail the request, restore was successful
    }

    return NextResponse.json({
      success: true,
      message: 'Revision restored successfully',
    });

  } catch (error) {
    console.error('Error in POST /api/posts/[postId]/revisions/[revisionId]/restore:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
