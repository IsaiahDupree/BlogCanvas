import { projectSEOScore, getRecommendedTarget, calculateCadence } from '@/lib/analysis/score-projection'

describe('Score Projection', () => {
  describe('projectSEOScore', () => {
    it('should calculate realistic projection for small improvement', () => {
      const result = projectSEOScore(
        42, // current score
        55, // target score
        5,  // gap count
        3,  // uncovered clusters
        10  // current post count
      )

      expect(result.current_score).toBe(42)
      expect(result.target_score).toBe(55)
      expect(result.score_increase).toBe(13)
      expect(result.recommended_posts).toBeGreaterThan(0)
      expect(result.timeline_months).toBeGreaterThan(0)
      expect(result.confidence).toMatch(/high|medium|low/)
    })

    it('should handle large score jump with appropriate timeline', () => {
      const result = projectSEOScore(
        30, // low current score
        80, // high target
        15, // many gaps
        10, // many uncovered clusters
        5   // few current posts
      )

      expect(result.score_increase).toBe(50)
      expect(result.recommended_posts).toBeGreaterThan (30)
      expect(result.timeline_months).toBeGreaterThan(6)
      expect(result.confidence).toBe('low')
    })

    it('should have high confidence for modest improvements', () => {
      const result = projectSEOScore(
        65, // decent current score
        75, // reasonable target
        3,  // few gaps
        2,  // few uncovered clusters
        20  // good post count
      )

      expect(result.confidence).toBe('high')
      expect(result.timeline_months).toBeLessThan(6)
    })

    it('should handle edge case: already at target', () => {
      const result = projectSEOScore(
        80, // current = target
        80, // target
        0,  // no gaps
        0,  // no uncovered clusters
        50  // many posts
      )

      expect(result.score_increase).toBe(0)
      expect(result.recommended_posts).toBe(0)
    })
  })

  describe('getRecommendedTarget', () => {
    it('should recommend 60-70 for very low scores', () => {
      const target = getRecommendedTarget(25)
      expect(target).toBeGreaterThanOrEqual(60)
      expect(target).toBeLessThanOrEqual(70)
    })

    it('should recommend 75-85 for mid-range scores', () => {
      const target = getRecommendedTarget(55)
      expect(target).toBeGreaterThanOrEqual(75)
      expect(target).toBeLessThanOrEqual(85)
    })

    it('should recommend modest improvement for high scores', () => {
      const target = getRecommendedTarget(80)
      expect(target).toBeGreaterThanOrEqual(85)
      expect(target).toBeLessThanOrEqual(95)
    })
  })

  describe('calculateCadence', () => {
    it('should calculate weekly cadence for normal timeline', () => {
      const cadence = calculateCadence(24, 3) // 24 posts in 3 months
      
      expect(cadence.posts_per_week).toBe(2)
      expect(cadence.posts_per_month).toBe(8)
    })

    it('should handle daily posting for aggressive timelines', () => {
      const cadence = calculateCadence(100, 2) // 100 posts in 2 months
      
      expect(cadence.posts_per_week).toBeGreaterThan(10)
    })

    it('should handle slow posting schedules', () => {
      const cadence = calculateCadence(6, 12) // 6 posts in 12 months
      
      expect(cadence.posts_per_month).toBeLessThanOrEqual(1)
    })
  })
})
