/**
 * Metrics Collector Tests
 */

import {
  generateMockMetrics,
  calculatePerformanceScore,
  compareMetrics,
  PostMetrics
} from '../metrics-collector';

describe('generateMockMetrics', () => {
  it('should return metrics object with all required fields', () => {
    const metrics = generateMockMetrics(30);

    expect(metrics).toHaveProperty('impressions');
    expect(metrics).toHaveProperty('clicks');
    expect(metrics).toHaveProperty('ctr');
    expect(metrics).toHaveProperty('avgPosition');
    expect(metrics).toHaveProperty('pageviews');
    expect(metrics).toHaveProperty('uniqueUsers');
    expect(metrics).toHaveProperty('avgSessionDuration');
    expect(metrics).toHaveProperty('bounceRate');
    expect(metrics).toHaveProperty('organicTraffic');
    expect(metrics).toHaveProperty('estimatedValue');
  });

  it('should increase metrics over time (maturity)', () => {
    const day7Metrics = generateMockMetrics(7);
    const day90Metrics = generateMockMetrics(90);

    // On average, day 90 should have more impressions
    // Run multiple times to account for randomness
    let day7Total = 0;
    let day90Total = 0;
    
    for (let i = 0; i < 100; i++) {
      day7Total += generateMockMetrics(7).impressions;
      day90Total += generateMockMetrics(90).impressions;
    }

    expect(day90Total / 100).toBeGreaterThan(day7Total / 100);
  });

  it('should improve position over time', () => {
    // Average over multiple runs
    let day7PositionTotal = 0;
    let day90PositionTotal = 0;

    for (let i = 0; i < 100; i++) {
      day7PositionTotal += generateMockMetrics(7).avgPosition;
      day90PositionTotal += generateMockMetrics(90).avgPosition;
    }

    // Lower position = better (closer to 1)
    expect(day90PositionTotal / 100).toBeLessThan(day7PositionTotal / 100);
  });

  it('should have bounce rate decrease over time', () => {
    let day7BounceTotal = 0;
    let day90BounceTotal = 0;

    for (let i = 0; i < 100; i++) {
      day7BounceTotal += generateMockMetrics(7).bounceRate || 0;
      day90BounceTotal += generateMockMetrics(90).bounceRate || 0;
    }

    expect(day90BounceTotal / 100).toBeLessThan(day7BounceTotal / 100);
  });

  it('should calculate estimated value based on traffic', () => {
    const metrics = generateMockMetrics(30);
    
    // Estimated value should be approximately organicTraffic * $2
    // Allow for rounding differences
    expect(metrics.estimatedValue).toBeGreaterThan(0);
    expect(metrics.estimatedValue).toBeCloseTo(metrics.organicTraffic! * 2, -1);
  });
});

describe('calculatePerformanceScore', () => {
  it('should return a score between 0 and 100', () => {
    const metrics: PostMetrics = {
      impressions: 500,
      clicks: 25,
      ctr: 0.05,
      avgPosition: 15
    };

    const score = calculatePerformanceScore(metrics);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should give higher score for better position', () => {
    const goodPosition: PostMetrics = {
      impressions: 500,
      clicks: 25,
      ctr: 0.05,
      avgPosition: 5
    };

    const badPosition: PostMetrics = {
      impressions: 500,
      clicks: 25,
      ctr: 0.05,
      avgPosition: 50
    };

    const goodScore = calculatePerformanceScore(goodPosition);
    const badScore = calculatePerformanceScore(badPosition);

    expect(goodScore).toBeGreaterThan(badScore);
  });

  it('should give higher score for better CTR', () => {
    const goodCtr: PostMetrics = {
      impressions: 500,
      clicks: 50,
      ctr: 0.10,
      avgPosition: 20
    };

    const badCtr: PostMetrics = {
      impressions: 500,
      clicks: 5,
      ctr: 0.01,
      avgPosition: 20
    };

    const goodScore = calculatePerformanceScore(goodCtr);
    const badScore = calculatePerformanceScore(badCtr);

    expect(goodScore).toBeGreaterThan(badScore);
  });

  it('should give higher score for more impressions', () => {
    const moreImpressions: PostMetrics = {
      impressions: 2000,
      clicks: 100,
      ctr: 0.05,
      avgPosition: 20
    };

    const fewerImpressions: PostMetrics = {
      impressions: 100,
      clicks: 5,
      ctr: 0.05,
      avgPosition: 20
    };

    const moreScore = calculatePerformanceScore(moreImpressions);
    const fewerScore = calculatePerformanceScore(fewerImpressions);

    expect(moreScore).toBeGreaterThan(fewerScore);
  });

  it('should cap score at 100', () => {
    const excellentMetrics: PostMetrics = {
      impressions: 10000,
      clicks: 1000,
      ctr: 0.10,
      avgPosition: 1
    };

    const score = calculatePerformanceScore(excellentMetrics);

    expect(score).toBeLessThanOrEqual(100);
  });

  it('should give base score of 50 for zero metrics', () => {
    const zeroMetrics: PostMetrics = {
      impressions: 0,
      clicks: 0,
      ctr: 0,
      avgPosition: 100
    };

    const score = calculatePerformanceScore(zeroMetrics);

    expect(score).toBeGreaterThanOrEqual(50);
  });
});

describe('compareMetrics', () => {
  it('should identify improving trend', () => {
    const current: PostMetrics = {
      impressions: 1000,
      clicks: 100,
      ctr: 0.1,
      avgPosition: 10
    };

    const previous: PostMetrics = {
      impressions: 500,
      clicks: 25,
      ctr: 0.05,
      avgPosition: 30
    };

    const comparison = compareMetrics(current, previous);

    expect(comparison.trend).toBe('improving');
    expect(comparison.impressionsChange).toBeGreaterThan(0);
    expect(comparison.clicksChange).toBeGreaterThan(0);
    expect(comparison.positionChange).toBeGreaterThan(0); // Positive = improvement
  });

  it('should identify declining trend', () => {
    const current: PostMetrics = {
      impressions: 200,
      clicks: 10,
      ctr: 0.05,
      avgPosition: 40
    };

    const previous: PostMetrics = {
      impressions: 1000,
      clicks: 100,
      ctr: 0.1,
      avgPosition: 10
    };

    const comparison = compareMetrics(current, previous);

    expect(comparison.trend).toBe('declining');
    expect(comparison.impressionsChange).toBeLessThan(0);
    expect(comparison.clicksChange).toBeLessThan(0);
  });

  it('should identify stable trend', () => {
    const current: PostMetrics = {
      impressions: 500,
      clicks: 50,
      ctr: 0.1,
      avgPosition: 20
    };

    const previous: PostMetrics = {
      impressions: 480,
      clicks: 48,
      ctr: 0.1,
      avgPosition: 21
    };

    const comparison = compareMetrics(current, previous);

    expect(comparison.trend).toBe('stable');
  });

  it('should calculate percentage changes correctly', () => {
    const current: PostMetrics = {
      impressions: 1000,
      clicks: 100,
      ctr: 0.1,
      avgPosition: 10
    };

    const previous: PostMetrics = {
      impressions: 500,
      clicks: 50,
      ctr: 0.1,
      avgPosition: 20
    };

    const comparison = compareMetrics(current, previous);

    expect(comparison.impressionsChange).toBe(100); // 100% increase
    expect(comparison.clicksChange).toBe(100); // 100% increase
    expect(comparison.positionChange).toBe(10); // Improved by 10 positions
  });

  it('should handle zero previous impressions', () => {
    const current: PostMetrics = {
      impressions: 100,
      clicks: 10,
      ctr: 0.1,
      avgPosition: 20
    };

    const previous: PostMetrics = {
      impressions: 0,
      clicks: 0,
      ctr: 0,
      avgPosition: 0
    };

    const comparison = compareMetrics(current, previous);

    expect(comparison.impressionsChange).toBe(0);
    expect(comparison.clicksChange).toBe(0);
  });
});
