/**
 * Projected SEO Score Calculation
 *
 * Computes the projected SEO score after content batch execution
 * based on baseline audit scores and planned/in-progress blog posts.
 */

export interface BlogPostImpact {
  id: string
  title: string
  status: string
  seo_quality_score: number | null
  impact_weight: number
  projected_contribution: number
}

export interface ProjectedSEOResult {
  baseline_score: number
  current_projected_score: number
  target_score: number
  total_planned_posts: number
  completed_posts: number
  approved_posts: number
  published_posts: number
  post_impacts: BlogPostImpact[]
  score_breakdown: {
    baseline: number
    from_published: number
    from_approved: number
    from_completed: number
    from_in_progress: number
  }
}

/**
 * Status-based impact weights
 *
 * Published posts have full impact (1.0)
 * Approved posts have high impact (0.9) - ready to publish
 * Completed posts have medium impact (0.7) - in review
 * In-progress posts have low impact (0.4) - still being written
 * Other statuses have minimal impact (0.1)
 */
const STATUS_WEIGHTS: Record<string, number> = {
  published: 1.0,
  approved: 0.9,
  client_review: 0.85,
  editor_review: 0.75,
  ai_drafting: 0.4,
  outline: 0.2,
  draft: 0.1,
}

/**
 * Get impact weight based on post status
 */
function getImpactWeight(status: string): number {
  return STATUS_WEIGHTS[status] || 0.1
}

/**
 * Calculate the SEO score impact from a single blog post
 *
 * Formula: (post_seo_score / 100) * status_weight * impact_factor
 *
 * Impact factor = 0.5 (each post contributes up to 0.5 points to overall score)
 * This prevents a single post from having too large an impact
 */
function calculatePostImpact(
  seoQualityScore: number | null,
  status: string
): number {
  if (!seoQualityScore) return 0

  const normalizedScore = seoQualityScore / 100 // Convert 0-100 to 0-1
  const weight = getImpactWeight(status)
  const impactFactor = 0.5 // Each post can contribute up to 0.5 points

  return normalizedScore * weight * impactFactor
}

/**
 * Calculate projected SEO score for a content batch
 *
 * Takes baseline score from audit and adds weighted contributions from all posts
 */
export function calculateProjectedSEO(
  baselineScore: number,
  targetScore: number,
  posts: Array<{
    id: string
    title: string
    status: string
    seo_quality_score: number | null
  }>
): ProjectedSEOResult {
  const breakdown = {
    baseline: baselineScore,
    from_published: 0,
    from_approved: 0,
    from_completed: 0,
    from_in_progress: 0,
  }

  // Calculate impact for each post
  const post_impacts: BlogPostImpact[] = posts.map((post) => {
    const impact_weight = getImpactWeight(post.status)
    const projected_contribution = calculatePostImpact(
      post.seo_quality_score,
      post.status
    )

    // Add to appropriate category in breakdown
    if (post.status === 'published') {
      breakdown.from_published += projected_contribution
    } else if (post.status === 'approved') {
      breakdown.from_approved += projected_contribution
    } else if (post.status === 'editor_review' || post.status === 'client_review') {
      breakdown.from_completed += projected_contribution
    } else {
      breakdown.from_in_progress += projected_contribution
    }

    return {
      id: post.id,
      title: post.title,
      status: post.status,
      seo_quality_score: post.seo_quality_score,
      impact_weight,
      projected_contribution,
    }
  })

  // Calculate current projected score
  const current_projected_score = Math.min(
    100,
    baselineScore +
      breakdown.from_published +
      breakdown.from_approved +
      breakdown.from_completed +
      breakdown.from_in_progress
  )

  // Count posts by status
  const completed_posts = posts.filter(
    (p) => p.status === 'editor_review' || p.status === 'client_review'
  ).length
  const approved_posts = posts.filter((p) => p.status === 'approved').length
  const published_posts = posts.filter((p) => p.status === 'published').length

  return {
    baseline_score: baselineScore,
    current_projected_score: Math.round(current_projected_score * 10) / 10, // Round to 1 decimal
    target_score: targetScore,
    total_planned_posts: posts.length,
    completed_posts,
    approved_posts,
    published_posts,
    post_impacts,
    score_breakdown: breakdown,
  }
}

/**
 * Estimate required post count to reach target score
 *
 * Assumes posts with average SEO quality score of 80
 */
export function estimatePostsForTarget(
  currentScore: number,
  targetScore: number,
  avgPostQuality: number = 80
): number {
  const scoreGap = targetScore - currentScore
  if (scoreGap <= 0) return 0

  // Calculate impact of one average-quality published post
  const singlePostImpact = calculatePostImpact(avgPostQuality, 'published')

  // Estimate posts needed
  const estimatedPosts = Math.ceil(scoreGap / singlePostImpact)

  return estimatedPosts
}
