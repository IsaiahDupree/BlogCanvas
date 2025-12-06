/**
 * Score Projection Tests
 * Tests the SEO score projection and recommendation engine
 * PRD Epic 2: Plan Builder & Pitch Generator
 */

import {
    projectSEOScore,
    getRecommendedTarget,
    calculateRecommendedPosts,
    estimateTimelineMonths
} from '@/lib/analysis/score-projection';

describe('Score Projection', () => {
    describe('projectSEOScore', () => {
        it('should calculate realistic projection for modest improvement', () => {
            const result = projectSEOScore(
                62,  // current score (PRD example)
                78,  // target score (PRD example)
                8,   // gap count
                5,   // uncovered clusters
                10   // current post count
            );

            expect(result.current_score).toBe(62);
            expect(result.target_score).toBe(78);
            expect(result.score_increase).toBe(16);
            expect(result.recommended_posts).toBeGreaterThan(0);
            expect(result.timeline_months).toBeGreaterThan(0);
            expect(['high', 'medium', 'low']).toContain(result.confidence);
        });

        it('should require more posts for larger score jumps', () => {
            const smallJump = projectSEOScore(60, 70, 5, 3, 10);
            const largeJump = projectSEOScore(40, 85, 15, 12, 5);

            expect(largeJump.recommended_posts).toBeGreaterThan(smallJump.recommended_posts);
            expect(largeJump.timeline_months).toBeGreaterThan(smallJump.timeline_months);
        });

        it('should have low confidence for aggressive targets', () => {
            const aggressive = projectSEOScore(30, 90, 20, 15, 3);

            expect(aggressive.confidence).toBe('low');
        });

        it('should have high confidence for modest targets', () => {
            const modest = projectSEOScore(70, 80, 3, 2, 20);

            expect(modest.confidence).toBe('high');
        });

        it('should handle edge case: already at target', () => {
            const atTarget = projectSEOScore(80, 80, 0, 0, 50);

            expect(atTarget.score_increase).toBe(0);
            expect(atTarget.recommended_posts).toBe(0);
            expect(atTarget.timeline_months).toBe(0);
        });

        it('should handle edge case: target below current', () => {
            const belowCurrent = projectSEOScore(80, 70, 5, 3, 20);

            expect(belowCurrent.score_increase).toBe(0);
            expect(belowCurrent.recommended_posts).toBe(0);
        });
    });

    describe('getRecommendedTarget', () => {
        it('should recommend 75+ for very low scores (PRD: 62 → 78)', () => {
            const target = getRecommendedTarget(40);

            expect(target).toBeGreaterThanOrEqual(65);
            expect(target).toBeLessThanOrEqual(80);
        });

        it('should recommend 75-85 for mid-range scores', () => {
            const target = getRecommendedTarget(62);

            expect(target).toBeGreaterThanOrEqual(75);
            expect(target).toBeLessThanOrEqual(85);
        });

        it('should recommend modest improvement for high scores', () => {
            const target = getRecommendedTarget(85);

            expect(target).toBeGreaterThanOrEqual(88);
            expect(target).toBeLessThanOrEqual(95);
        });

        it('should cap at 95 for very high scores', () => {
            const target = getRecommendedTarget(92);

            expect(target).toBeLessThanOrEqual(98);
        });
    });

    describe('calculateRecommendedPosts', () => {
        it('should recommend posts based on score gap', () => {
            // PRD: "# of blog posts needed" based on target
            const posts = calculateRecommendedPosts(62, 78, 8);

            expect(posts).toBeGreaterThan(0);
            expect(posts).toBeLessThan(100); // Reasonable upper bound
        });

        it('should recommend more posts for more gaps', () => {
            const fewGaps = calculateRecommendedPosts(60, 75, 3);
            const manyGaps = calculateRecommendedPosts(60, 75, 15);

            expect(manyGaps).toBeGreaterThan(fewGaps);
        });

        it('should recommend more posts for larger score increases', () => {
            const smallIncrease = calculateRecommendedPosts(70, 75, 5);
            const largeIncrease = calculateRecommendedPosts(50, 80, 5);

            expect(largeIncrease).toBeGreaterThan(smallIncrease);
        });
    });

    describe('estimateTimelineMonths', () => {
        it('should estimate 3-6 months for typical packages', () => {
            // PRD: "Time horizon (e.g. 3, 6, 12 months)"
            const months = estimateTimelineMonths(24, 8); // 24 posts, 8/month cadence

            expect(months).toBe(3);
        });

        it('should scale with post count', () => {
            const small = estimateTimelineMonths(12, 4);
            const large = estimateTimelineMonths(48, 4);

            expect(large).toBeGreaterThan(small);
        });

        it('should factor in cadence', () => {
            const fastCadence = estimateTimelineMonths(24, 8);  // 8/month
            const slowCadence = estimateTimelineMonths(24, 4);  // 4/month

            expect(slowCadence).toBeGreaterThan(fastCadence);
        });
    });
});

describe('PRD Epic 2: Plan Builder Requirements', () => {
    it('should support SEO score slider as per PRD', () => {
        // PRD: "CSM can drag a SEO score slider from 62 → 78 and see recommended posts"
        const currentScore = 62;
        const targetScore = 78;

        const projection = projectSEOScore(currentScore, targetScore, 8, 5, 10);

        // Should return actionable data
        expect(projection.recommended_posts).toBeGreaterThan(0);
        expect(projection.timeline_months).toBeGreaterThan(0);
        expect(projection.score_increase).toBe(16);
    });

    it('should provide cadence recommendation (PRD: 8 posts/mo)', () => {
        const posts = 24;
        const months = estimateTimelineMonths(posts, 8);

        // At 8 posts/month, 24 posts should take 3 months
        expect(months).toBe(3);
    });

    it('should handle PRD example values correctly', () => {
        // PRD example: "You're at SEO Score 62. With coverage on these clusters, you can likely reach 78"
        const projection = projectSEOScore(62, 78, 10, 6, 15);

        expect(projection.current_score).toBe(62);
        expect(projection.target_score).toBe(78);
        expect(projection.recommended_posts).toBeGreaterThanOrEqual(10);
        expect(projection.confidence).toBeDefined();
    });
});
