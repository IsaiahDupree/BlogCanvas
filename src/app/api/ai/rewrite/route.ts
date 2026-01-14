import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  rewriteContent, 
  transformTone, 
  summarizeContent, 
  expandContent, 
  generateContentDiff,
  generateSectionRevisions,
  RewriteOptions 
} from '@/lib/agents/content-rewriter';

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
      action = 'rewrite', // 'rewrite' | 'tone' | 'summarize' | 'expand' | 'sections' | 'diff'
      content,
      blogPostId,
      
      // Rewrite options
      mode = 'improve',
      targetKeyword,
      targetWordCount,
      preserveStructure = true,
      targetAudience,
      brandVoice,
      
      // Tone transformation
      targetTone,
      
      // Summarize options
      summaryLength = 'medium',
      
      // Expand options
      expansionFactor = 2,
      focusAreas,
      
      // Section revision
      revisionTypes = ['grammar', 'clarity', 'seo'],
      
      // Diff
      revisedContent,
      
      // Save options
      saveRevision = true
    } = body;

    if (!content && action !== 'diff') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Content rewriting
    if (action === 'rewrite') {
      const options: RewriteOptions = {
        mode,
        targetKeyword,
        targetWordCount,
        preserveStructure,
        targetAudience,
        brandVoice
      };

      const result = await rewriteContent(content, options);

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 });
      }

      // Save revision to database
      if (saveRevision && blogPostId && result.data) {
        await saveRevisionToDb(supabase, blogPostId, result.data.rewrittenContent, {
          type: `ai_rewrite_${mode}`,
          originalWordCount: result.data.originalWordCount,
          newWordCount: result.data.newWordCount,
          changePercentage: result.data.changePercentage,
          improvements: result.data.improvements
        });
      }

      return NextResponse.json({
        success: true,
        action: 'rewrite',
        mode,
        ...result.data
      });
    }

    // Tone transformation
    if (action === 'tone') {
      if (!targetTone) {
        return NextResponse.json({ 
          error: 'targetTone is required for tone transformation' 
        }, { status: 400 });
      }

      const result = await transformTone(content, targetTone);

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 });
      }

      if (saveRevision && blogPostId && result.data) {
        await saveRevisionToDb(supabase, blogPostId, result.data.transformedContent, {
          type: `ai_tone_${targetTone}`,
          originalTone: result.data.originalTone,
          targetTone: result.data.targetTone,
          confidenceScore: result.data.confidenceScore
        });
      }

      return NextResponse.json({
        success: true,
        action: 'tone',
        ...result.data
      });
    }

    // Summarize content
    if (action === 'summarize') {
      const result = await summarizeContent(content, summaryLength);

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'summarize',
        length: summaryLength,
        ...result.data
      });
    }

    // Expand content
    if (action === 'expand') {
      const result = await expandContent(content, expansionFactor, focusAreas);

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 });
      }

      if (saveRevision && blogPostId && result.data) {
        await saveRevisionToDb(supabase, blogPostId, result.data.transformedContent, {
          type: 'ai_expansion',
          expansionFactor,
          originalWordCount: result.data.originalWordCount,
          newWordCount: result.data.newWordCount
        });
      }

      return NextResponse.json({
        success: true,
        action: 'expand',
        ...result.data
      });
    }

    // Section-by-section revisions
    if (action === 'sections') {
      const result = await generateSectionRevisions(content, revisionTypes);

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'sections',
        revisions: result.data,
        totalRevisions: result.data?.length || 0
      });
    }

    // Generate diff between original and revised
    if (action === 'diff') {
      if (!content || !revisedContent) {
        return NextResponse.json({ 
          error: 'Both content and revisedContent are required for diff' 
        }, { status: 400 });
      }

      const diff = generateContentDiff(content, revisedContent);

      return NextResponse.json({
        success: true,
        action: 'diff',
        ...diff
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action. Use: rewrite, tone, summarize, expand, sections, or diff' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('Rewrite error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

async function saveRevisionToDb(
  supabase: any,
  blogPostId: string,
  content: string,
  metadata: any
) {
  try {
    // Update blog post content
    await supabase
      .from('blog_posts')
      .update({ 
        content,
        word_count: content.split(/\s+/).length,
        updated_at: new Date().toISOString()
      })
      .eq('id', blogPostId);

    // Save revision history
    await supabase.from('blog_post_revisions').insert({
      blog_post_id: blogPostId,
      revision_type: metadata.type,
      content,
      created_by: 'system',
      metadata
    });
  } catch (error) {
    console.error('Failed to save revision:', error);
  }
}
