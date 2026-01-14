/**
 * SEO Forecast Engine
 * Calculates projected SEO improvements based on content strategy
 */

export interface ForecastInput {
  currentScore: number;
  targetScore: number;
  currentTopicCoverage: number; // percentage
  topicGaps: number;
  currentMonthlyTraffic: number;
  industryAvgCtr: number; // typically 0.02-0.05
  avgKeywordDifficulty: number; // 0-100
}

export interface ForecastOutput {
  recommendedPosts: number;
  recommendedTimeline: number; // months
  postsPerMonth: number;
  projectedTrafficIncrease: number; // percentage
  projectedNewKeywords: number;
  projectedMonthlyTraffic: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  monthlyProjections: MonthlyProjection[];
  assumptions: string[];
}

export interface MonthlyProjection {
  month: number;
  projectedScore: number;
  projectedTraffic: number;
  cumulativePosts: number;
  newKeywords: number;
}

/**
 * Calculate SEO forecast based on inputs
 */
export function calculateForecast(input: ForecastInput): ForecastOutput {
  const {
    currentScore,
    targetScore,
    currentTopicCoverage,
    topicGaps,
    currentMonthlyTraffic,
    industryAvgCtr,
    avgKeywordDifficulty
  } = input;

  // Validate inputs
  const validCurrentScore = Math.max(0, Math.min(100, currentScore));
  const validTargetScore = Math.max(validCurrentScore, Math.min(100, targetScore));
  const scoreDiff = validTargetScore - validCurrentScore;

  // Calculate difficulty factor (harder keywords = more posts needed)
  const difficultyFactor = 1 + (avgKeywordDifficulty / 100) * 0.5; // 1.0 - 1.5x

  // Base calculation: ~2 posts per SEO point improvement
  const basePostsNeeded = Math.ceil(scoreDiff * 2 * difficultyFactor);

  // Adjust based on topic gaps
  const postsFromGaps = Math.min(topicGaps, Math.ceil(scoreDiff * 1.5));
  const recommendedPosts = Math.max(basePostsNeeded, postsFromGaps, 1);

  // Timeline calculation (aim for 6-12 posts per month max)
  const idealPostsPerMonth = 8;
  const recommendedTimeline = Math.max(3, Math.ceil(recommendedPosts / idealPostsPerMonth));
  const postsPerMonth = Math.ceil(recommendedPosts / recommendedTimeline);

  // Traffic projections
  const avgTrafficPerPost = 500 * (1 - avgKeywordDifficulty / 200); // 250-500 based on difficulty
  const projectedNewTraffic = recommendedPosts * avgTrafficPerPost * industryAvgCtr * 30; // monthly
  const projectedTrafficIncrease = currentMonthlyTraffic > 0 
    ? Math.round((projectedNewTraffic / currentMonthlyTraffic) * 100)
    : 100;
  const projectedMonthlyTraffic = currentMonthlyTraffic + projectedNewTraffic;

  // Keyword projections (assume 70% of posts rank for target keyword)
  const projectedNewKeywords = Math.round(recommendedPosts * 0.7);

  // Generate monthly projections
  const monthlyProjections = generateMonthlyProjections(
    validCurrentScore,
    validTargetScore,
    currentMonthlyTraffic,
    recommendedPosts,
    recommendedTimeline,
    avgTrafficPerPost,
    industryAvgCtr
  );

  // Confidence level based on data quality
  let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
  if (scoreDiff <= 15 && avgKeywordDifficulty <= 50) {
    confidenceLevel = 'high';
  } else if (scoreDiff >= 30 || avgKeywordDifficulty >= 70) {
    confidenceLevel = 'low';
  }

  // Generate assumptions
  const assumptions = generateAssumptions(input, recommendedPosts, recommendedTimeline);

  return {
    recommendedPosts,
    recommendedTimeline,
    postsPerMonth,
    projectedTrafficIncrease,
    projectedNewKeywords,
    projectedMonthlyTraffic: Math.round(projectedMonthlyTraffic),
    confidenceLevel,
    monthlyProjections,
    assumptions
  };
}

/**
 * Generate month-by-month projections
 */
function generateMonthlyProjections(
  currentScore: number,
  targetScore: number,
  currentTraffic: number,
  totalPosts: number,
  months: number,
  avgTrafficPerPost: number,
  ctr: number
): MonthlyProjection[] {
  const projections: MonthlyProjection[] = [];
  const scoreDiff = targetScore - currentScore;
  const postsPerMonth = Math.ceil(totalPosts / months);

  for (let month = 1; month <= months; month++) {
    const progress = month / months;
    
    // Score increases follow a logarithmic curve (faster gains early)
    const scoreProgress = Math.log(1 + progress * 2) / Math.log(3);
    const projectedScore = Math.round(currentScore + (scoreDiff * scoreProgress));

    // Traffic increases linearly with content, but has a delay factor
    const delayFactor = Math.min(1, (month - 1) / 2); // Takes 2 months to start seeing traffic
    const cumulativePosts = Math.min(postsPerMonth * month, totalPosts);
    const newTrafficFromPosts = cumulativePosts * avgTrafficPerPost * ctr * 30 * delayFactor;
    const projectedTraffic = Math.round(currentTraffic + newTrafficFromPosts);

    // New keywords ranking (delayed effect)
    const newKeywords = Math.round(cumulativePosts * 0.7 * delayFactor);

    projections.push({
      month,
      projectedScore: Math.min(projectedScore, targetScore),
      projectedTraffic,
      cumulativePosts,
      newKeywords
    });
  }

  return projections;
}

/**
 * Generate forecast assumptions
 */
function generateAssumptions(
  input: ForecastInput,
  recommendedPosts: number,
  timeline: number
): string[] {
  const assumptions: string[] = [];

  assumptions.push(`Publishing ${Math.ceil(recommendedPosts / timeline)} quality blog posts per month`);
  assumptions.push('Each post targets a unique keyword from identified gaps');
  assumptions.push('Content follows SEO best practices (1500+ words, proper structure)');
  assumptions.push('Posts are indexed within 1-2 weeks of publishing');
  
  if (input.avgKeywordDifficulty > 50) {
    assumptions.push('Higher difficulty keywords may take 3-6 months to rank');
  } else {
    assumptions.push('Lower difficulty keywords typically rank within 2-3 months');
  }

  assumptions.push('No major algorithm updates or competitor changes');
  assumptions.push('Consistent internal linking between new and existing content');

  return assumptions;
}

/**
 * Calculate posts needed for specific score improvement
 */
export function calculatePostsForScore(
  currentScore: number,
  targetScore: number,
  avgDifficulty: number = 50
): number {
  const scoreDiff = Math.max(0, targetScore - currentScore);
  const difficultyFactor = 1 + (avgDifficulty / 100) * 0.5;
  return Math.ceil(scoreDiff * 2 * difficultyFactor);
}

/**
 * Calculate estimated timeline for score improvement
 */
export function calculateTimeline(
  postsNeeded: number,
  postsPerMonth: number = 8
): number {
  return Math.max(3, Math.ceil(postsNeeded / postsPerMonth));
}

/**
 * Get score improvement ranges
 */
export function getScoreRanges(): { min: number; max: number; label: string; description: string }[] {
  return [
    { min: 0, max: 30, label: 'Poor', description: 'Significant content gaps, limited visibility' },
    { min: 31, max: 50, label: 'Below Average', description: 'Some coverage, room for improvement' },
    { min: 51, max: 65, label: 'Average', description: 'Decent foundation, competitive in some areas' },
    { min: 66, max: 80, label: 'Good', description: 'Strong coverage, ranking for key terms' },
    { min: 81, max: 90, label: 'Excellent', description: 'Comprehensive coverage, industry leader' },
    { min: 91, max: 100, label: 'Outstanding', description: 'Dominant position, authority site' }
  ];
}

/**
 * Get difficulty descriptions
 */
export function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 20) return 'Very Easy';
  if (difficulty <= 40) return 'Easy';
  if (difficulty <= 60) return 'Moderate';
  if (difficulty <= 80) return 'Hard';
  return 'Very Hard';
}
