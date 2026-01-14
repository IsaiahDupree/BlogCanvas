/**
 * SEO Forecast Engine Tests
 */

import {
  calculateForecast,
  calculatePostsForScore,
  calculateTimeline,
  getScoreRanges,
  getDifficultyLabel,
  ForecastInput,
  ForecastOutput
} from '../forecast-engine';

describe('calculateForecast', () => {
  const baseInput: ForecastInput = {
    currentScore: 50,
    targetScore: 75,
    currentTopicCoverage: 40,
    topicGaps: 20,
    currentMonthlyTraffic: 1000,
    industryAvgCtr: 0.03,
    avgKeywordDifficulty: 50
  };

  it('should return all required forecast fields', () => {
    const forecast = calculateForecast(baseInput);

    expect(forecast).toHaveProperty('recommendedPosts');
    expect(forecast).toHaveProperty('recommendedTimeline');
    expect(forecast).toHaveProperty('postsPerMonth');
    expect(forecast).toHaveProperty('projectedTrafficIncrease');
    expect(forecast).toHaveProperty('projectedNewKeywords');
    expect(forecast).toHaveProperty('projectedMonthlyTraffic');
    expect(forecast).toHaveProperty('confidenceLevel');
    expect(forecast).toHaveProperty('monthlyProjections');
    expect(forecast).toHaveProperty('assumptions');
  });

  it('should recommend more posts for larger score gaps', () => {
    const smallGap = calculateForecast({ ...baseInput, targetScore: 60 });
    const largeGap = calculateForecast({ ...baseInput, targetScore: 90 });

    expect(largeGap.recommendedPosts).toBeGreaterThan(smallGap.recommendedPosts);
  });

  it('should recommend more posts for higher difficulty keywords', () => {
    const easyKeywords = calculateForecast({ ...baseInput, avgKeywordDifficulty: 20 });
    const hardKeywords = calculateForecast({ ...baseInput, avgKeywordDifficulty: 80 });

    expect(hardKeywords.recommendedPosts).toBeGreaterThan(easyKeywords.recommendedPosts);
  });

  it('should calculate minimum timeline of 3 months', () => {
    const smallProject = calculateForecast({
      ...baseInput,
      targetScore: 55 // Small 5-point increase
    });

    expect(smallProject.recommendedTimeline).toBeGreaterThanOrEqual(3);
  });

  it('should calculate posts per month based on total posts and timeline', () => {
    const forecast = calculateForecast(baseInput);

    expect(forecast.postsPerMonth).toBe(
      Math.ceil(forecast.recommendedPosts / forecast.recommendedTimeline)
    );
  });

  it('should project traffic increase as percentage', () => {
    const forecast = calculateForecast(baseInput);

    expect(forecast.projectedTrafficIncrease).toBeGreaterThan(0);
    expect(typeof forecast.projectedTrafficIncrease).toBe('number');
  });

  it('should project ~70% of posts ranking for keywords', () => {
    const forecast = calculateForecast(baseInput);

    expect(forecast.projectedNewKeywords).toBe(
      Math.round(forecast.recommendedPosts * 0.7)
    );
  });

  it('should return high confidence for small gaps and easy keywords', () => {
    const easyForecast = calculateForecast({
      ...baseInput,
      targetScore: 60, // 10 point increase
      avgKeywordDifficulty: 30
    });

    expect(easyForecast.confidenceLevel).toBe('high');
  });

  it('should return low confidence for large gaps or hard keywords', () => {
    const hardForecast = calculateForecast({
      ...baseInput,
      targetScore: 90, // 40 point increase
      avgKeywordDifficulty: 75
    });

    expect(hardForecast.confidenceLevel).toBe('low');
  });

  it('should generate monthly projections for entire timeline', () => {
    const forecast = calculateForecast(baseInput);

    expect(forecast.monthlyProjections).toHaveLength(forecast.recommendedTimeline);
  });

  it('should have monthly projections show increasing scores', () => {
    const forecast = calculateForecast(baseInput);
    const projections = forecast.monthlyProjections;

    for (let i = 1; i < projections.length; i++) {
      expect(projections[i].projectedScore).toBeGreaterThanOrEqual(
        projections[i - 1].projectedScore
      );
    }
  });

  it('should have final projection score near target score', () => {
    const forecast = calculateForecast(baseInput);
    const finalProjection = forecast.monthlyProjections[forecast.monthlyProjections.length - 1];

    expect(finalProjection.projectedScore).toBeLessThanOrEqual(baseInput.targetScore);
    expect(finalProjection.projectedScore).toBeGreaterThanOrEqual(baseInput.targetScore - 5);
  });

  it('should include assumptions array', () => {
    const forecast = calculateForecast(baseInput);

    expect(Array.isArray(forecast.assumptions)).toBe(true);
    expect(forecast.assumptions.length).toBeGreaterThan(0);
  });

  it('should handle edge case where target equals current', () => {
    const noChange = calculateForecast({
      ...baseInput,
      targetScore: 50 // Same as current
    });

    // Should still recommend at least 1 post
    expect(noChange.recommendedPosts).toBeGreaterThanOrEqual(1);
  });

  it('should handle zero current traffic', () => {
    const noTraffic = calculateForecast({
      ...baseInput,
      currentMonthlyTraffic: 0
    });

    expect(noTraffic.projectedTrafficIncrease).toBe(100);
    expect(noTraffic.projectedMonthlyTraffic).toBeGreaterThan(0);
  });

  it('should clamp scores to valid range', () => {
    const invalidInput = calculateForecast({
      ...baseInput,
      currentScore: -10,
      targetScore: 150
    });

    expect(invalidInput.monthlyProjections[0].projectedScore).toBeGreaterThanOrEqual(0);
    expect(
      invalidInput.monthlyProjections[invalidInput.monthlyProjections.length - 1].projectedScore
    ).toBeLessThanOrEqual(100);
  });
});

describe('calculatePostsForScore', () => {
  it('should return 0 posts for no score improvement', () => {
    const posts = calculatePostsForScore(70, 70);
    expect(posts).toBe(0);
  });

  it('should calculate ~2 posts per score point at baseline difficulty', () => {
    const posts = calculatePostsForScore(50, 60, 50);
    // 10 point diff * 2 * 1.25 difficulty factor = 25 posts
    expect(posts).toBeGreaterThanOrEqual(20);
    expect(posts).toBeLessThanOrEqual(30);
  });

  it('should require more posts for harder keywords', () => {
    const easyPosts = calculatePostsForScore(50, 70, 20);
    const hardPosts = calculatePostsForScore(50, 70, 80);

    expect(hardPosts).toBeGreaterThan(easyPosts);
  });

  it('should return at least 1 post for any positive improvement', () => {
    const posts = calculatePostsForScore(50, 51);
    expect(posts).toBeGreaterThanOrEqual(1);
  });
});

describe('calculateTimeline', () => {
  it('should return minimum 3 months', () => {
    const timeline = calculateTimeline(5, 8);
    expect(timeline).toBeGreaterThanOrEqual(3);
  });

  it('should divide posts by posts per month', () => {
    const timeline = calculateTimeline(48, 8);
    expect(timeline).toBe(6);
  });

  it('should round up for partial months', () => {
    const timeline = calculateTimeline(50, 8);
    expect(timeline).toBe(7); // 50/8 = 6.25, rounded up
  });

  it('should use default 8 posts per month', () => {
    const timeline = calculateTimeline(24);
    expect(timeline).toBe(3);
  });
});

describe('getScoreRanges', () => {
  it('should return 6 score ranges', () => {
    const ranges = getScoreRanges();
    expect(ranges).toHaveLength(6);
  });

  it('should cover full 0-100 range', () => {
    const ranges = getScoreRanges();
    expect(ranges[0].min).toBe(0);
    expect(ranges[ranges.length - 1].max).toBe(100);
  });

  it('should have contiguous ranges', () => {
    const ranges = getScoreRanges();
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i].min).toBe(ranges[i - 1].max + 1);
    }
  });

  it('should include label and description for each range', () => {
    const ranges = getScoreRanges();
    ranges.forEach(range => {
      expect(range.label).toBeDefined();
      expect(range.description).toBeDefined();
      expect(typeof range.label).toBe('string');
      expect(typeof range.description).toBe('string');
    });
  });
});

describe('getDifficultyLabel', () => {
  it('should return "Very Easy" for difficulty <= 20', () => {
    expect(getDifficultyLabel(10)).toBe('Very Easy');
    expect(getDifficultyLabel(20)).toBe('Very Easy');
  });

  it('should return "Easy" for difficulty 21-40', () => {
    expect(getDifficultyLabel(30)).toBe('Easy');
    expect(getDifficultyLabel(40)).toBe('Easy');
  });

  it('should return "Moderate" for difficulty 41-60', () => {
    expect(getDifficultyLabel(50)).toBe('Moderate');
    expect(getDifficultyLabel(60)).toBe('Moderate');
  });

  it('should return "Hard" for difficulty 61-80', () => {
    expect(getDifficultyLabel(70)).toBe('Hard');
    expect(getDifficultyLabel(80)).toBe('Hard');
  });

  it('should return "Very Hard" for difficulty > 80', () => {
    expect(getDifficultyLabel(85)).toBe('Very Hard');
    expect(getDifficultyLabel(100)).toBe('Very Hard');
  });
});
