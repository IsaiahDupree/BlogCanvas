import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { calculateBlogPostSEOScore, getSEOQualityGrade } from '@/lib/analysis/blog-post-seo-score';

/**
 * GET /api/blog-posts/[id]/seo-score
 * Calculate and return SEO quality score for a blog post
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the blog post
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, final_html, target_keyword, topic, seo_metadata, word_count_goal, seo_quality_score')
      .eq('id', id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // Calculate the SEO score
    const scoreResult = calculateBlogPostSEOScore({
      final_html: post.final_html,
      target_keyword: post.target_keyword,
      topic: post.topic,
      seo_metadata: post.seo_metadata as any,
      word_count_goal: post.word_count_goal,
    });

    const grade = getSEOQualityGrade(scoreResult.score);

    return NextResponse.json({
      id: post.id,
      score: scoreResult.score,
      grade,
      breakdown: scoreResult.breakdown,
      issues: scoreResult.issues,
      recommendations: scoreResult.recommendations,
      current_score: post.seo_quality_score,
    });
  } catch (error: any) {
    console.error('Error calculating SEO score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate SEO score', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blog-posts/[id]/seo-score
 * Calculate and save SEO quality score for a blog post
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the blog post
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, final_html, target_keyword, topic, seo_metadata, word_count_goal')
      .eq('id', id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // Calculate the SEO score
    const scoreResult = calculateBlogPostSEOScore({
      final_html: post.final_html,
      target_keyword: post.target_keyword,
      topic: post.topic,
      seo_metadata: post.seo_metadata as any,
      word_count_goal: post.word_count_goal,
    });

    // Update the blog post with the new score
    const { data: updatedPost, error: updateError } = await supabase
      .from('blog_posts')
      .update({ seo_quality_score: scoreResult.score })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update blog post: ${updateError.message}`);
    }

    const grade = getSEOQualityGrade(scoreResult.score);

    return NextResponse.json({
      id: post.id,
      score: scoreResult.score,
      grade,
      breakdown: scoreResult.breakdown,
      issues: scoreResult.issues,
      recommendations: scoreResult.recommendations,
      updated: true,
    });
  } catch (error: any) {
    console.error('Error calculating and saving SEO score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate and save SEO score', details: error.message },
      { status: 500 }
    );
  }
}
