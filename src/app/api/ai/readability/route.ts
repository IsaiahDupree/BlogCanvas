import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runReadabilityAgent, quickReadabilityScore, optimizeReadability } from '@/lib/agents/readability';

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
      content,
      blogPostId,
      action = 'analyze', // 'analyze' | 'quick' | 'optimize'
      targetAudience,
      targetGradeLevel = 8,
      saveOptimized = false
    } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Quick score (no AI)
    if (action === 'quick') {
      const result = quickReadabilityScore(content);
      return NextResponse.json({
        success: true,
        score: result.score,
        grade: result.grade,
        metrics: result.metrics
      });
    }

    // Full analysis with AI
    if (action === 'analyze') {
      const result = await runReadabilityAgent({
        content,
        targetAudience,
        targetGradeLevel,
        optimize: false
      });

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        score: result.data?.score,
        grade: result.data?.grade,
        metrics: result.data?.metrics,
        targetAudienceMatch: result.data?.targetAudienceMatch,
        issues: result.data?.issues,
        improvements: result.data?.improvements,
        summary: result.data?.summary
      });
    }

    // Optimize content
    if (action === 'optimize') {
      const result = await optimizeReadability(content, targetGradeLevel);

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 });
      }

      // Save optimized content if requested
      if (saveOptimized && blogPostId && result.data) {
        await supabase
          .from('blog_posts')
          .update({ 
            content: result.data.content,
            updated_at: new Date().toISOString()
          })
          .eq('id', blogPostId);

        // Save revision
        await supabase.from('blog_post_revisions').insert({
          blog_post_id: blogPostId,
          revision_type: 'ai_readability_optimization',
          content: result.data.content,
          created_by: 'system',
          metadata: {
            originalScore: result.data.originalScore,
            optimizedScore: result.data.optimizedScore
          }
        });
      }

      return NextResponse.json({
        success: true,
        originalScore: result.data?.originalScore,
        optimizedScore: result.data?.optimizedScore,
        optimizedContent: result.data?.content,
        improvement: (result.data?.optimizedScore || 0) - (result.data?.originalScore || 0)
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action. Use: analyze, quick, or optimize' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('Readability analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
