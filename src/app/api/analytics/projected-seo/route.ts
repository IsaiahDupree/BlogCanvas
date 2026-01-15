import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateProjectedSEO } from '@/lib/analysis/projected-seo'

/**
 * GET /api/analytics/projected-seo
 *
 * Calculate projected SEO score for a website or content batch
 *
 * Query params:
 * - website_id: UUID (required if batch_id not provided)
 * - batch_id: UUID (required if website_id not provided)
 *
 * Returns:
 * - baseline_score: Current SEO score from latest audit
 * - current_projected_score: Projected score with current post progress
 * - target_score: Goal score from batch (if batch_id provided)
 * - post_impacts: Array of per-post impact details
 * - score_breakdown: Breakdown by post status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const website_id = searchParams.get('website_id')
    const batch_id = searchParams.get('batch_id')

    if (!website_id && !batch_id) {
      return NextResponse.json(
        { error: 'Either website_id or batch_id is required' },
        { status: 400 }
      )
    }

    // If batch_id provided, get website_id from batch
    let resolvedWebsiteId = website_id
    let targetScore = 75 // Default target

    if (batch_id) {
      const { data: batch, error: batchError } = await supabase
        .from('content_batches')
        .select('website_id, goal_score_to')
        .eq('id', batch_id)
        .single()

      if (batchError || !batch) {
        return NextResponse.json(
          { error: 'Content batch not found' },
          { status: 404 }
        )
      }

      resolvedWebsiteId = batch.website_id
      targetScore = batch.goal_score_to || targetScore
    }

    // Get latest audit for baseline score
    const { data: latestAudit, error: auditError } = await supabase
      .from('seo_audits')
      .select('baseline_score, audit_date')
      .eq('website_id', resolvedWebsiteId)
      .order('audit_date', { ascending: false })
      .limit(1)
      .single()

    if (auditError || !latestAudit) {
      return NextResponse.json(
        {
          error: 'No SEO audit found for this website',
          suggestion: 'Run an SEO audit first',
        },
        { status: 404 }
      )
    }

    const baselineScore = latestAudit.baseline_score || 0

    // Get all blog posts for the website (or batch)
    let postsQuery = supabase
      .from('blog_posts')
      .select('id, title, status, seo_quality_score')
      .eq('website_id', resolvedWebsiteId)

    if (batch_id) {
      postsQuery = postsQuery.eq('content_batch_id', batch_id)
    }

    const { data: posts, error: postsError } = await postsQuery

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return NextResponse.json(
        { error: 'Failed to fetch blog posts' },
        { status: 500 }
      )
    }

    // Calculate projected SEO score
    const result = calculateProjectedSEO(
      baselineScore,
      targetScore,
      posts || []
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error calculating projected SEO:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
