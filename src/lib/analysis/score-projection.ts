/**
 * Score Projection Library
 * Functions for projecting SEO score improvements and recommendations
 */

interface ProjectionResult {
    current_score: number;
    target_score: number;
    score_increase: number;
    recommended_posts: number;
    timeline_months: number;
    confidence: 'high' | 'medium' | 'low';
    monthly_cadence: number;
}

/**
 * Project SEO score improvement based on content plan
 */
export function projectSEOScore(
    currentScore: number,
    targetScore: number,
    gapCount: number = 0,
    uncoveredClusters: number = 0,
    currentPostCount: number = 0
): ProjectionResult {
    const scoreIncrease = Math.max(0, targetScore - currentScore);

    if (scoreIncrease === 0) {
        return {
            current_score: currentScore,
            target_score: targetScore,
            score_increase: 0,
            recommended_posts: 0,
            timeline_months: 0,
            confidence: 'high',
            monthly_cadence: 0
        };
    }

    // Calculate recommended posts based on score gap and clusters
    const basePostsPerPoint = 1.5; // ~1.5 posts per point increase
    const clusterBonus = uncoveredClusters * 3; // 3 posts per uncovered cluster
    const gapBonus = gapCount * 0.5; // 0.5 posts per gap

    const recommendedPosts = Math.ceil(
        (scoreIncrease * basePostsPerPoint) + clusterBonus + gapBonus
    );

    // Calculate timeline based on recommended cadence
    const monthlyCadence = 8; // Default 8 posts/month
    const timelineMonths = Math.ceil(recommendedPosts / monthlyCadence);

    // Determine confidence
    let confidence: 'high' | 'medium' | 'low';
    if (scoreIncrease <= 15 && gapCount <= 5) {
        confidence = 'high';
    } else if (scoreIncrease <= 25 && gapCount <= 10) {
        confidence = 'medium';
    } else {
        confidence = 'low';
    }

    return {
        current_score: currentScore,
        target_score: targetScore,
        score_increase: scoreIncrease,
        recommended_posts: recommendedPosts,
        timeline_months: timelineMonths,
        confidence,
        monthly_cadence: monthlyCadence
    };
}

/**
 * Get recommended target score based on current score
 */
export function getRecommendedTarget(currentScore: number): number {
    // Recommend achievable improvement based on starting point
    if (currentScore < 40) {
        return Math.min(70, currentScore + 25);
    } else if (currentScore < 60) {
        return Math.min(80, currentScore + 18);
    } else if (currentScore < 75) {
        return Math.min(85, currentScore + 12);
    } else if (currentScore < 85) {
        return Math.min(92, currentScore + 8);
    } else {
        return Math.min(98, currentScore + 5);
    }
}

/**
 * Calculate recommended number of posts for score improvement
 */
export function calculateRecommendedPosts(
    currentScore: number,
    targetScore: number,
    gapCount: number
): number {
    const scoreDiff = Math.max(0, targetScore - currentScore);

    // Base calculation: more posts for larger score jumps
    const basePosts = Math.ceil(scoreDiff * 1.5);

    // Additional posts for gaps
    const gapPosts = Math.ceil(gapCount * 1.2);

    return basePosts + gapPosts;
}

/**
 * Estimate timeline in months based on post count and cadence
 */
export function estimateTimelineMonths(
    totalPosts: number,
    postsPerMonth: number
): number {
    if (postsPerMonth <= 0) return 0;
    return Math.ceil(totalPosts / postsPerMonth);
}

/**
 * Generate detailed projection with milestones
 */
export function generateDetailedProjection(
    currentScore: number,
    targetScore: number,
    gapCount: number,
    postsPerMonth: number = 8
): {
    projection: ProjectionResult;
    milestones: Array<{ month: number; expected_score: number; posts_completed: number }>;
} {
    const projection = projectSEOScore(currentScore, targetScore, gapCount);
    const milestones: Array<{ month: number; expected_score: number; posts_completed: number }> = [];

    const scorePerPost = projection.score_increase / projection.recommended_posts;

    for (let month = 1; month <= projection.timeline_months; month++) {
        const postsCompleted = Math.min(month * postsPerMonth, projection.recommended_posts);
        const expectedScore = Math.round(currentScore + (postsCompleted * scorePerPost));

        milestones.push({
            month,
            expected_score: Math.min(expectedScore, targetScore),
            posts_completed: postsCompleted
        });
    }

    return { projection, milestones };
}

/**
 * Calculate recommended cadence based on budget and timeline
 */
export function calculateCadence(
    totalPosts: number,
    targetMonths: number,
    maxPostsPerMonth: number = 12
): number {
    if (targetMonths <= 0) return 0;
    const calculated = Math.ceil(totalPosts / targetMonths);
    return Math.min(calculated, maxPostsPerMonth);
}

/**
 * Generate a complete forecast document
 */
export function generateForecast(
    currentScore: number,
    targetScore: number,
    gapCount: number,
    websiteName: string = 'Website'
): {
    title: string;
    summary: string;
    projection: ProjectionResult;
    recommendations: string[];
} {
    const projection = projectSEOScore(currentScore, targetScore, gapCount);

    return {
        title: `SEO Forecast for ${websiteName}`,
        summary: `Moving from SEO score ${currentScore} to ${targetScore} requires approximately ${projection.recommended_posts} blog posts over ${projection.timeline_months} months.`,
        projection,
        recommendations: [
            `Publish ${projection.monthly_cadence} posts per month`,
            `Focus on high-priority content gaps first`,
            `Monitor SEO score monthly to track progress`,
            `Review and update existing content for quick wins`
        ]
    };
}
