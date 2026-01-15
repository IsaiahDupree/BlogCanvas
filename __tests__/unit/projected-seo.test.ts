import { calculateProjectedSEO, estimatePostsForTarget } from '@/lib/analysis/projected-seo'

describe('Projected SEO Score Calculation', () => {
  test('calculates baseline correctly', () => {
    const result = calculateProjectedSEO(60, 75, [])

    expect(result.baseline_score).toBe(60)
    expect(result.current_projected_score).toBe(60)
    expect(result.target_score).toBe(75)
    expect(result.total_planned_posts).toBe(0)
  })

  test('adds impact from published posts', () => {
    const posts = [
      { id: '1', title: 'Post 1', status: 'published', seo_quality_score: 80 },
      { id: '2', title: 'Post 2', status: 'published', seo_quality_score: 90 },
    ]

    const result = calculateProjectedSEO(60, 75, posts)

    expect(result.total_planned_posts).toBe(2)
    expect(result.published_posts).toBe(2)
    expect(result.current_projected_score).toBeGreaterThan(60)
    expect(result.score_breakdown.from_published).toBeGreaterThan(0)
  })

  test('weights approved posts lower than published', () => {
    const publishedPosts = [
      { id: '1', title: 'Post 1', status: 'published', seo_quality_score: 80 },
    ]

    const approvedPosts = [
      { id: '1', title: 'Post 1', status: 'approved', seo_quality_score: 80 },
    ]

    const publishedResult = calculateProjectedSEO(60, 75, publishedPosts)
    const approvedResult = calculateProjectedSEO(60, 75, approvedPosts)

    expect(publishedResult.current_projected_score).toBeGreaterThan(
      approvedResult.current_projected_score
    )
  })

  test('calculates breakdown by status', () => {
    const posts = [
      { id: '1', title: 'Post 1', status: 'published', seo_quality_score: 80 },
      { id: '2', title: 'Post 2', status: 'approved', seo_quality_score: 80 },
      { id: '3', title: 'Post 3', status: 'editor_review', seo_quality_score: 80 },
      { id: '4', title: 'Post 4', status: 'ai_drafting', seo_quality_score: 80 },
    ]

    const result = calculateProjectedSEO(60, 75, posts)

    expect(result.score_breakdown.from_published).toBeGreaterThan(0)
    expect(result.score_breakdown.from_approved).toBeGreaterThan(0)
    expect(result.score_breakdown.from_completed).toBeGreaterThan(0)
    expect(result.score_breakdown.from_in_progress).toBeGreaterThan(0)
  })

  test('does not exceed 100 score', () => {
    const posts = Array(100).fill(null).map((_, i) => ({
      id: `${i}`,
      title: `Post ${i}`,
      status: 'published',
      seo_quality_score: 100,
    }))

    const result = calculateProjectedSEO(90, 100, posts)

    expect(result.current_projected_score).toBeLessThanOrEqual(100)
  })

  test('handles null seo_quality_score', () => {
    const posts = [
      { id: '1', title: 'Post 1', status: 'published', seo_quality_score: null },
      { id: '2', title: 'Post 2', status: 'approved', seo_quality_score: 80 },
    ]

    const result = calculateProjectedSEO(60, 75, posts)

    // Should not crash and should only count post with score
    expect(result.current_projected_score).toBeGreaterThan(60)
  })

  test('estimates posts needed for target', () => {
    const postsNeeded = estimatePostsForTarget(60, 75, 80)

    expect(postsNeeded).toBeGreaterThan(0)
    expect(typeof postsNeeded).toBe('number')
  })

  test('returns 0 posts if already at target', () => {
    const postsNeeded = estimatePostsForTarget(75, 75, 80)

    expect(postsNeeded).toBe(0)
  })

  test('per-post impact details are included', () => {
    const posts = [
      { id: '1', title: 'Post 1', status: 'published', seo_quality_score: 80 },
      { id: '2', title: 'Post 2', status: 'approved', seo_quality_score: 90 },
    ]

    const result = calculateProjectedSEO(60, 75, posts)

    expect(result.post_impacts).toHaveLength(2)
    expect(result.post_impacts[0].id).toBe('1')
    expect(result.post_impacts[0].impact_weight).toBe(1.0) // published
    expect(result.post_impacts[0].projected_contribution).toBeGreaterThan(0)

    expect(result.post_impacts[1].id).toBe('2')
    expect(result.post_impacts[1].impact_weight).toBe(0.9) // approved
    expect(result.post_impacts[1].projected_contribution).toBeGreaterThan(0)
  })
})
