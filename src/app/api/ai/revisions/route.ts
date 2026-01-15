import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  compareRevisions, 
  analyzeRevisionTimeline, 
  suggestNextRevision,
  mergeRevisions,
  smartRollback,
  RevisionVersion 
} from '@/lib/agents/revision-history';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      action = 'list', // 'list' | 'compare' | 'timeline' | 'suggest' | 'merge' | 'rollback'
      blogPostId,
      versionAId,
      versionBId,
      targetVersionId,
      content,
      revisionIds,
      preserveElements,
      targetGoals
    } = body;

    if (!blogPostId && action !== 'compare') {
      return NextResponse.json({ error: 'blogPostId is required' }, { status: 400 });
    }

    // List all revisions for a blog post
    if (action === 'list') {
      const { data: revisions, error } = await supabase
        .from('blog_post_revisions')
        .select('*')
        .eq('blog_post_id', blogPostId)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ 
          success: false, 
          error: error.message 
        }, { status: 500 });
      }

      const versions: RevisionVersion[] = (revisions || []).map((r: any, i: number) => ({
        id: r.id,
        version: revisions!.length - i,
        content: r.content,
        wordCount: r.content?.split(/\s+/).length || 0,
        createdAt: r.created_at,
        createdBy: r.created_by === 'system' ? 'ai' : 'user',
        revisionType: r.revision_type || 'manual',
        metadata: r.metadata
      }));

      return NextResponse.json({
        success: true,
        action: 'list',
        totalVersions: versions.length,
        revisions: versions
      });
    }

    // Compare two revisions
    if (action === 'compare') {
      if (!versionAId || !versionBId) {
        return NextResponse.json({ 
          error: 'versionAId and versionBId are required' 
        }, { status: 400 });
      }

      const { data: revisionA } = await supabase
        .from('blog_post_revisions')
        .select('*')
        .eq('id', versionAId)
        .single();

      const { data: revisionB } = await supabase
        .from('blog_post_revisions')
        .select('*')
        .eq('id', versionBId)
        .single();

      if (!revisionA || !revisionB) {
        return NextResponse.json({ 
          error: 'One or both revisions not found' 
        }, { status: 404 });
      }

      const versionA: RevisionVersion = {
        id: revisionA.id,
        version: 1,
        content: revisionA.content,
        wordCount: revisionA.content?.split(/\s+/).length || 0,
        createdAt: revisionA.created_at,
        createdBy: revisionA.created_by === 'system' ? 'ai' : 'user',
        revisionType: revisionA.revision_type
      };

      const versionB: RevisionVersion = {
        id: revisionB.id,
        version: 2,
        content: revisionB.content,
        wordCount: revisionB.content?.split(/\s+/).length || 0,
        createdAt: revisionB.created_at,
        createdBy: revisionB.created_by === 'system' ? 'ai' : 'user',
        revisionType: revisionB.revision_type
      };

      const result = await compareRevisions(versionA, versionB);

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'compare',
        ...result.data
      });
    }

    // Analyze revision timeline
    if (action === 'timeline') {
      const { data: revisions } = await supabase
        .from('blog_post_revisions')
        .select('*')
        .eq('blog_post_id', blogPostId)
        .order('created_at', { ascending: true });

      const versions: RevisionVersion[] = (revisions || []).map((r: any, i: number) => ({
        id: r.id,
        version: i + 1,
        content: r.content,
        wordCount: r.content?.split(/\s+/).length || 0,
        createdAt: r.created_at,
        createdBy: r.created_by === 'system' ? 'ai' : 'user',
        revisionType: r.revision_type || 'manual'
      }));

      const timeline = analyzeRevisionTimeline(versions);

      return NextResponse.json({
        success: true,
        action: 'timeline',
        ...timeline
      });
    }

    // Suggest next revision
    if (action === 'suggest') {
      // Get current content
      let currentContent = content;
      if (!currentContent) {
        const { data: post } = await supabase
          .from('blog_posts')
          .select('content')
          .eq('id', blogPostId)
          .single();
        currentContent = post?.content;
      }

      if (!currentContent) {
        return NextResponse.json({ 
          error: 'No content found' 
        }, { status: 404 });
      }

      // Get revision history
      const { data: revisions } = await supabase
        .from('blog_post_revisions')
        .select('*')
        .eq('blog_post_id', blogPostId)
        .order('created_at', { ascending: false })
        .limit(10);

      const versions: RevisionVersion[] = (revisions || []).map((r: any, i: number) => ({
        id: r.id,
        version: i + 1,
        content: r.content,
        wordCount: r.content?.split(/\s+/).length || 0,
        createdAt: r.created_at,
        createdBy: r.created_by === 'system' ? 'ai' : 'user',
        revisionType: r.revision_type
      }));

      const result = await suggestNextRevision(currentContent, versions, targetGoals);

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'suggest',
        suggestions: result.data
      });
    }

    // Merge multiple revisions
    if (action === 'merge') {
      if (!revisionIds || revisionIds.length < 2) {
        return NextResponse.json({ 
          error: 'At least 2 revisionIds are required for merge' 
        }, { status: 400 });
      }

      // Get base content
      const { data: post } = await supabase
        .from('blog_posts')
        .select('content')
        .eq('id', blogPostId)
        .single();

      if (!post?.content) {
        return NextResponse.json({ 
          error: 'Blog post not found' 
        }, { status: 404 });
      }

      // Get revisions
      const { data: revisions } = await supabase
        .from('blog_post_revisions')
        .select('*')
        .in('id', revisionIds);

      const revisionsToMerge = (revisions || []).map((r: any, i: number) => ({
        content: r.content,
        priority: revisionIds.length - revisionIds.indexOf(r.id)
      }));

      const result = await mergeRevisions(post.content, revisionsToMerge);

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 });
      }

      // Save merged content
      await supabase
        .from('blog_posts')
        .update({ 
          content: result.data?.mergedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', blogPostId);

      await supabase.from('blog_post_revisions').insert({
        blog_post_id: blogPostId,
        revision_type: 'human_edit',
        content: { text: result.data?.mergedContent },
        content_text: result.data?.mergedContent,
        created_by_type: 'system',
        notes: `Merged revisions: ${revisionIds.join(', ')} - ${result.data?.changesIncorporated || 'Changes incorporated'}`
      });

      return NextResponse.json({
        success: true,
        action: 'merge',
        ...result.data
      });
    }

    // Rollback to previous version
    if (action === 'rollback') {
      if (!targetVersionId) {
        return NextResponse.json({ 
          error: 'targetVersionId is required for rollback' 
        }, { status: 400 });
      }

      // Get current content
      const { data: post } = await supabase
        .from('blog_posts')
        .select('content')
        .eq('id', blogPostId)
        .single();

      // Get target version
      const { data: targetRevision } = await supabase
        .from('blog_post_revisions')
        .select('*')
        .eq('id', targetVersionId)
        .single();

      if (!targetRevision) {
        return NextResponse.json({ 
          error: 'Target revision not found' 
        }, { status: 404 });
      }

      const targetVersion: RevisionVersion = {
        id: targetRevision.id,
        version: 1,
        content: targetRevision.content,
        wordCount: targetRevision.content?.split(/\s+/).length || 0,
        createdAt: targetRevision.created_at,
        createdBy: 'ai',
        revisionType: targetRevision.revision_type
      };

      const result = await smartRollback(
        post?.content || '',
        targetVersion,
        preserveElements
      );

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 });
      }

      // Apply rollback
      await supabase
        .from('blog_posts')
        .update({ 
          content: result.data?.rolledBackContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', blogPostId);

      await supabase.from('blog_post_revisions').insert({
        blog_post_id: blogPostId,
        revision_type: 'human_edit',
        content: { text: result.data?.rolledBackContent },
        content_text: result.data?.rolledBackContent,
        created_by_type: 'system',
        notes: `Rollback to version ${targetVersionId} - Preserved elements: ${result.data?.preservedElements || 'none'}`
      });

      return NextResponse.json({
        success: true,
        action: 'rollback',
        ...result.data
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action. Use: list, compare, timeline, suggest, merge, or rollback' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('Revision error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
