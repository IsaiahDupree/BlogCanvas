/**
 * Metrics Collection Service
 * Collects analytics data from Google Search Console and GA4
 */

export interface PostMetrics {
  // Search Console metrics
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
  
  // GA4 metrics (if connected)
  pageviews?: number;
  uniqueUsers?: number;
  avgSessionDuration?: number;
  bounceRate?: number;
  
  // Calculated metrics
  organicTraffic?: number;
  estimatedValue?: number;
}

export interface SearchConsoleCredentials {
  accessToken: string;
  refreshToken: string;
  siteUrl: string;
}

export interface GA4Credentials {
  accessToken: string;
  refreshToken: string;
  propertyId: string;
}

/**
 * Fetch metrics from Google Search Console
 */
export async function fetchSearchConsoleMetrics(
  credentials: SearchConsoleCredentials,
  pageUrl: string,
  startDate: string,
  endDate: string
): Promise<Partial<PostMetrics>> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/webmasters/v3/sites/' +
      encodeURIComponent(credentials.siteUrl) +
      '/searchAnalytics/query',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ['page'],
          dimensionFilterGroups: [{
            filters: [{
              dimension: 'page',
              operator: 'equals',
              expression: pageUrl
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Search Console API error: ${error}`);
    }

    const data = await response.json();
    
    if (data.rows && data.rows.length > 0) {
      const row = data.rows[0];
      return {
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: row.ctr || 0,
        avgPosition: row.position || 0
      };
    }

    return {
      impressions: 0,
      clicks: 0,
      ctr: 0,
      avgPosition: 0
    };
  } catch (error) {
    console.error('Search Console fetch error:', error);
    throw error;
  }
}

/**
 * Fetch metrics from GA4
 */
export async function fetchGA4Metrics(
  credentials: GA4Credentials,
  pageUrl: string,
  startDate: string,
  endDate: string
): Promise<Partial<PostMetrics>> {
  try {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${credentials.propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'totalUsers' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' }
          ],
          dimensionFilter: {
            filter: {
              fieldName: 'pagePath',
              stringFilter: {
                matchType: 'EXACT',
                value: new URL(pageUrl).pathname
              }
            }
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GA4 API error: ${error}`);
    }

    const data = await response.json();
    
    if (data.rows && data.rows.length > 0) {
      const values = data.rows[0].metricValues;
      return {
        pageviews: parseInt(values[0]?.value || '0'),
        uniqueUsers: parseInt(values[1]?.value || '0'),
        avgSessionDuration: parseFloat(values[2]?.value || '0'),
        bounceRate: parseFloat(values[3]?.value || '0')
      };
    }

    return {};
  } catch (error) {
    console.error('GA4 fetch error:', error);
    throw error;
  }
}

/**
 * Collect all metrics for a post
 */
export async function collectPostMetrics(
  postUrl: string,
  searchConsoleCredentials?: SearchConsoleCredentials,
  ga4Credentials?: GA4Credentials,
  daysBack: number = 30
): Promise<PostMetrics> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let metrics: PostMetrics = {
    impressions: 0,
    clicks: 0,
    ctr: 0,
    avgPosition: 0
  };

  // Fetch Search Console metrics
  if (searchConsoleCredentials) {
    try {
      const scMetrics = await fetchSearchConsoleMetrics(
        searchConsoleCredentials,
        postUrl,
        startDate,
        endDate
      );
      metrics = { ...metrics, ...scMetrics };
    } catch (error) {
      console.error('Failed to fetch Search Console metrics:', error);
    }
  }

  // Fetch GA4 metrics
  if (ga4Credentials) {
    try {
      const gaMetrics = await fetchGA4Metrics(
        ga4Credentials,
        postUrl,
        startDate,
        endDate
      );
      metrics = { ...metrics, ...gaMetrics };
    } catch (error) {
      console.error('Failed to fetch GA4 metrics:', error);
    }
  }

  // Calculate organic traffic (clicks from search)
  metrics.organicTraffic = metrics.clicks;

  // Estimate value (assuming $2 CPC average)
  metrics.estimatedValue = metrics.clicks * 2;

  return metrics;
}

/**
 * Generate mock metrics for testing/demo
 */
export function generateMockMetrics(daysSincePublish: number): PostMetrics {
  // Simulate typical blog post performance curve
  const maturityFactor = Math.min(1, daysSincePublish / 90); // Takes ~90 days to mature
  const randomFactor = 0.8 + Math.random() * 0.4; // 80-120% variance
  
  const baseImpressions = 500 * maturityFactor * randomFactor;
  const baseCtr = 0.02 + (maturityFactor * 0.03); // CTR improves over time
  
  return {
    impressions: Math.round(baseImpressions),
    clicks: Math.round(baseImpressions * baseCtr),
    ctr: baseCtr,
    avgPosition: 50 - (maturityFactor * 30) + (Math.random() * 10), // Position improves
    pageviews: Math.round(baseImpressions * baseCtr * 1.5), // Some direct traffic too
    uniqueUsers: Math.round(baseImpressions * baseCtr * 1.2),
    avgSessionDuration: 120 + Math.random() * 180, // 2-5 minutes
    bounceRate: 0.6 - (maturityFactor * 0.2), // Bounce rate decreases
    organicTraffic: Math.round(baseImpressions * baseCtr),
    estimatedValue: Math.round(baseImpressions * baseCtr * 2)
  };
}

/**
 * Calculate performance score from metrics
 */
export function calculatePerformanceScore(metrics: PostMetrics): number {
  let score = 50; // Base score
  
  // Impressions contribution (up to 15 points)
  score += Math.min(15, metrics.impressions / 100);
  
  // CTR contribution (up to 15 points)
  score += Math.min(15, metrics.ctr * 300);
  
  // Position contribution (up to 20 points)
  if (metrics.avgPosition <= 10) score += 20;
  else if (metrics.avgPosition <= 20) score += 15;
  else if (metrics.avgPosition <= 30) score += 10;
  else if (metrics.avgPosition <= 50) score += 5;
  
  return Math.min(100, Math.round(score));
}

/**
 * Compare metrics between two periods
 */
export function compareMetrics(
  current: PostMetrics,
  previous: PostMetrics
): {
  impressionsChange: number;
  clicksChange: number;
  positionChange: number;
  trend: 'improving' | 'stable' | 'declining';
} {
  const impressionsChange = previous.impressions > 0 
    ? ((current.impressions - previous.impressions) / previous.impressions) * 100
    : 0;
    
  const clicksChange = previous.clicks > 0
    ? ((current.clicks - previous.clicks) / previous.clicks) * 100
    : 0;
    
  const positionChange = previous.avgPosition - current.avgPosition; // Positive = improvement
  
  // Determine trend
  let trend: 'improving' | 'stable' | 'declining';
  const avgChange = (impressionsChange + clicksChange) / 2;
  
  if (avgChange > 10 || positionChange > 5) {
    trend = 'improving';
  } else if (avgChange < -10 || positionChange < -5) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }
  
  return {
    impressionsChange,
    clicksChange,
    positionChange,
    trend
  };
}
