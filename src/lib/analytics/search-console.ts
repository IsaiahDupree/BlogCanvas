/**
 * Google Search Console integration
 * Fetches SEO metrics like impressions, clicks, and rankings
 */

import { google } from 'googleapis'

// Initialize Search Console API client
function getSearchConsoleClient() {
  if (!process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL) {
    throw new Error('GOOGLE_SEARCH_CONSOLE_SITE_URL not configured')
  }

  const auth = new google.auth.GoogleAuth({
    credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
      : undefined,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
  })

  return google.searchconsole({ version: 'v1', auth })
}

export interface SearchConsoleMetrics {
  impressions: number
  clicks: number
  avg_position: number
  ctr: number
  organic_traffic: number
}

/**
 * Fetch Search Console metrics for a specific page
 */
export async function fetchSearchConsoleMetrics(
  pageUrl: string,
  startDate: string = '7daysAgo',
  endDate: string = 'today'
): Promise<SearchConsoleMetrics> {
  try {
    const searchConsole = getSearchConsoleClient()
    const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL!

    // Convert relative dates to actual dates
    const actualStartDate = convertRelativeDate(startDate)
    const actualEndDate = convertRelativeDate(endDate)

    // Query Search Console API
    const response = await searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: actualStartDate,
        endDate: actualEndDate,
        dimensions: ['page'],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'page',
                operator: 'contains',
                expression: new URL(pageUrl).pathname
              }
            ]
          }
        ],
        rowLimit: 1,
        aggregationType: 'auto'
      }
    })

    const rows = response.data.rows || []
    if (rows.length === 0) {
      return {
        impressions: 0,
        clicks: 0,
        avg_position: 0,
        ctr: 0,
        organic_traffic: 0
      }
    }

    const firstRow = rows[0]

    return {
      impressions: firstRow.impressions || 0,
      clicks: firstRow.clicks || 0,
      avg_position: firstRow.position || 0,
      ctr: firstRow.ctr || 0,
      organic_traffic: firstRow.clicks || 0 // Organic traffic = clicks from search
    }
  } catch (error: any) {
    console.error('Error fetching Search Console metrics:', error)

    // If API is not configured, return zeros instead of throwing
    if (error.message?.includes('not configured')) {
      console.warn('Google Search Console not configured, returning zero metrics')
      return {
        impressions: 0,
        clicks: 0,
        avg_position: 0,
        ctr: 0,
        organic_traffic: 0
      }
    }

    throw error
  }
}

/**
 * Convert relative date strings to YYYY-MM-DD format
 */
function convertRelativeDate(relativeDate: string): string {
  const now = new Date()

  if (relativeDate === 'today') {
    return formatDate(now)
  }

  if (relativeDate === 'yesterday') {
    now.setDate(now.getDate() - 1)
    return formatDate(now)
  }

  // Handle "NdaysAgo" format
  const daysAgoMatch = relativeDate.match(/^(\d+)daysAgo$/)
  if (daysAgoMatch) {
    const daysAgo = parseInt(daysAgoMatch[1])
    now.setDate(now.getDate() - daysAgo)
    return formatDate(now)
  }

  // If already in YYYY-MM-DD format, return as is
  return relativeDate
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Fetch top keywords for a page from Search Console
 */
export async function fetchTopKeywordsForPage(
  pageUrl: string,
  limit: number = 10
): Promise<Array<{ keyword: string; clicks: number; impressions: number; position: number }>> {
  try {
    const searchConsole = getSearchConsoleClient()
    const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL!

    const response = await searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: convertRelativeDate('30daysAgo'),
        endDate: convertRelativeDate('today'),
        dimensions: ['query'],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'page',
                operator: 'contains',
                expression: new URL(pageUrl).pathname
              }
            ]
          }
        ],
        rowLimit: limit,
        aggregationType: 'auto'
      }
    })

    const rows = response.data.rows || []

    return rows.map(row => ({
      keyword: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      position: row.position || 0
    }))
  } catch (error: any) {
    console.error('Error fetching top keywords:', error)
    return []
  }
}
