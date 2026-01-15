import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runRevisionAgent, quickProofread, seoRevision, fullOptimization } from '@/lib/agents/revision';

export const maxDuration = 180;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      content,
      blogPostId,
      targetKeyword,
      revisionType = 'full', // 'quick', 'seo', 'full', 'custom'
      revisionGoals,
      brandVoice,
      targetAudience,
      preserveStructure = false,
      saveRevision = true
    } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    let result;

    switch (revisionType) {
      case 'quick':
        result = await quickProofread(content);
        break;
      case 'seo':
        result = await seoRevision(content, targetKeyword || '');
        break;
      case 'full':
        result = await fullOptimization(
          content,
          targetKeyword || '',
          brandVoice || ['Professional', 'Helpful'],
          targetAudience || 'Business professionals'
        );
        break;
      case 'custom':
        result = await runRevisionAgent({
          content,
          targetKeyword,
          revisionGoals: revisionGoals || ['grammar', 'clarity'],
          brandVoice,
          targetAudience,
          preserveStructure
        });
        break;
      default:
        result = await quickProofread(content);
    }

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

    // Save revision to database if blogPostId provided
    if (blogPostId && saveRevision && result.data) {
      // Update the blog post
      await supabase
        .from('blog_posts')
        .update({
          content: result.data.revisedContent,
          word_count: result.data.revisedWordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', blogPostId);

      // Save revision history
      // Map revision types to standard types
      const standardRevisionType = revisionType === 'seo' ? 'seo_pass' : 'human_edit';

      await supabase.from('blog_post_revisions').insert({
        blog_post_id: blogPostId,
        revision_type: standardRevisionType,
        content: { text: result.data.revisedContent },
        content_text: result.data.revisedContent,
        created_by_type: 'system',
        notes: `${revisionType} revision - ${result.data.summary || 'Content optimization'}`
      });
    }

    return NextResponse.json({
      success: true,
      revisedContent: result.data?.revisedContent,
      originalWordCount: result.data?.originalWordCount,
      revisedWordCount: result.data?.revisedWordCount,
      improvementScore: result.data?.improvementScore,
      changes: result.data?.changes,
      suggestions: result.data?.suggestions,
      summary: result.data?.summary
    });

  } catch (error: any) {
    console.error('Content revision error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
