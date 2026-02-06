/**
 * Google Analytics 4 (GA4) integration
 * Fetches page metrics using Google Analytics Data API
 */

import { google } from 'googleapis'

// Initialize Analytics Data API client
function getAnalyticsClient() {
  if (!process.env.GOOGLE_ANALYTICS_PROPERTY_ID) {
    throw new Error('GOOGLE_ANALYTICS_PROPERTY_ID not configured')
  }

  // Use service account credentials or OAuth2
  const auth = new google.auth.GoogleAuth({
    credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
      : undefined,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly']
  })

  return google.analyticsdata({ version: 'v1beta', auth })
}

export interface GAPageMetrics {
  pageviews: number
  unique_visitors: number
  avg_time_on_page: number
  bounce_rate: number
}

/**
 * Fetch page metrics from Google Analytics 4
 */
export async function fetchGA4PageMetrics(
  pageUrl: string,
  startDate: string = '7daysAgo',
  endDate: string = 'today'
): Promise<GAPageMetrics> {
  try {
    const analyticsData = getAnalyticsClient()
    const propertyId = `properties/${process.env.GOOGLE_ANALYTICS_PROPERTY_ID}`

    // Run a report for the specific page
    const response = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
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
              matchType: 'CONTAINS',
              value: new URL(pageUrl).pathname
            }
          }
        }
      }
    })

    const rows = response.data.rows || []
    if (rows.length === 0) {
      // No data found for this page
      return {
        pageviews: 0,
        unique_visitors: 0,
        avg_time_on_page: 0,
        bounce_rate: 0
      }
    }

    const firstRow = rows[0]
    const metricValues = firstRow.metricValues || []

    return {
      pageviews: parseInt(metricValues[0]?.value || '0'),
      unique_visitors: parseInt(metricValues[1]?.value || '0'),
      avg_time_on_page: parseFloat(metricValues[2]?.value || '0'),
      bounce_rate: parseFloat(metricValues[3]?.value || '0')
    }
  } catch (error: any) {
    console.error('Error fetching GA4 metrics:', error)

    // If API is not configured, return zeros instead of throwing
    if (error.message?.includes('not configured')) {
      console.warn('Google Analytics not configured, returning zero metrics')
      return {
        pageviews: 0,
        unique_visitors: 0,
        avg_time_on_page: 0,
        bounce_rate: 0
      }
    }

    throw error
  }
}

/**
 * Fetch page metrics for multiple URLs in batch
 */
export async function fetchBatchGA4Metrics(
  pageUrls: string[],
  startDate: string = '7daysAgo',
  endDate: string = 'today'
): Promise<Map<string, GAPageMetrics>> {
  const results = new Map<string, GAPageMetrics>()

  // Process in batches to avoid rate limits
  const batchSize = 10
  for (let i = 0; i < pageUrls.length; i += batchSize) {
    const batch = pageUrls.slice(i, i + batchSize)
    const promises = batch.map(async (url) => {
      const metrics = await fetchGA4PageMetrics(url, startDate, endDate)
      results.set(url, metrics)
    })
    await Promise.all(promises)
  }

  return results
}
