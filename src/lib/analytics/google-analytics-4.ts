/**
 * Google Analytics 4 (GA4) Data API Integration
 *
 * This module provides functions to interact with GA4 Data API v1 (beta)
 * to collect page-level traffic metrics for blog posts.
 *
 * Setup:
 * 1. Create a Google Cloud Project
 * 2. Enable Google Analytics Data API v1
 * 3. Create a Service Account with Viewer permissions
 * 4. Grant service account access to GA4 property
 * 5. Store service account JSON key in ga4_connections table
 *
 * Documentation: https://developers.google.com/analytics/devguides/reporting/data/v1
 */

import { supabaseAdmin } from '@/lib/supabase';

export interface GA4Config {
  propertyId: string; // GA4 Property ID (e.g., "123456789")
  serviceAccountEmail: string;
  serviceAccountCredentials: any; // Service account JSON key
}

export interface GA4Metrics {
  pageViews: number;
  uniqueUsers: number;
  sessions: number;
  averageEngagementTime: number; // seconds
  bounceRate: number; // percentage
  scrollDepth?: number; // percentage
  conversions?: number;
  rawData?: any;
}

/**
 * Get access token from service account credentials
 */
async function getServiceAccountToken(credentials: any): Promise<string | null> {
  try {
    // Create JWT for service account
    const jwt = await createServiceAccountJWT(credentials);

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      console.error('Failed to get service account token:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting service account token:', error);
    return null;
  }
}

/**
 * Create JWT for service account authentication
 */
async function createServiceAccountJWT(credentials: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Note: This is a simplified version. In production, use a proper JWT library
  // that supports RS256 signing with private keys (e.g., 'jsonwebtoken' package)
  const { sign } = await import('jsonwebtoken');

  return sign(payload, credentials.private_key, {
    algorithm: 'RS256',
    header,
  });
}

/**
 * Query GA4 Data API for page-level metrics
 */
export async function queryGA4Metrics(
  pagePath: string,
  startDate: Date,
  endDate: Date,
  config: GA4Config
): Promise<GA4Metrics | null> {
  const accessToken = await getServiceAccountToken(config.serviceAccountCredentials);
  if (!accessToken) {
    console.error('Failed to get GA4 access token');
    return null;
  }

  // Format dates for API (YYYY-MM-DD)
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  try {
    const apiUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${config.propertyId}:runReport`;

    const requestBody = {
      dateRanges: [{
        startDate: startDateStr,
        endDate: endDateStr,
      }],
      dimensions: [
        { name: 'pagePath' }
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'conversions' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'EXACT',
            value: pagePath
          }
        }
      },
      limit: 1
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('GA4 API error:', error);
      return null;
    }

    const data = await response.json();

    // Parse response
    if (!data.rows || data.rows.length === 0) {
      return {
        pageViews: 0,
        uniqueUsers: 0,
        sessions: 0,
        averageEngagementTime: 0,
        bounceRate: 0,
        conversions: 0,
      };
    }

    const row = data.rows[0];
    const metricValues = row.metricValues;

    return {
      pageViews: parseInt(metricValues[0]?.value || '0'),
      uniqueUsers: parseInt(metricValues[1]?.value || '0'),
      sessions: parseInt(metricValues[2]?.value || '0'),
      averageEngagementTime: parseFloat(metricValues[3]?.value || '0'),
      bounceRate: parseFloat(metricValues[4]?.value || '0') * 100, // Convert to percentage
      conversions: parseInt(metricValues[5]?.value || '0'),
      rawData: data,
    };

  } catch (error) {
    console.error('Error querying GA4:', error);
    return null;
  }
}

/**
 * Get GA4 config from database
 */
export async function getGA4Config(websiteId: string): Promise<GA4Config | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ga4_connections')
      .select('property_id, service_account_email, service_account_credentials')
      .eq('website_id', websiteId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return null;
    }

    return {
      propertyId: data.property_id,
      serviceAccountEmail: data.service_account_email,
      serviceAccountCredentials: data.service_account_credentials,
    };
  } catch (error) {
    console.error('Error getting GA4 config:', error);
    return null;
  }
}

/**
 * Test GA4 connection
 */
export async function testGA4Connection(config: GA4Config): Promise<{
  success: boolean;
  error?: string;
  propertyName?: string;
}> {
  try {
    const accessToken = await getServiceAccountToken(config.serviceAccountCredentials);
    if (!accessToken) {
      return {
        success: false,
        error: 'Failed to authenticate with service account',
      };
    }

    // Try to get property metadata
    const metadataUrl = `https://analyticsadmin.googleapis.com/v1beta/properties/${config.propertyId}`;
    const response = await fetch(metadataUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to access GA4 property: ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      propertyName: data.displayName || data.name,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Query GA4 for conversion goal metrics
 */
async function queryGA4ConversionGoals(
  pagePath: string,
  startDate: Date,
  endDate: Date,
  config: GA4Config,
  goalEventNames: string[]
): Promise<Record<string, number>> {
  if (goalEventNames.length === 0) {
    return {};
  }

  const accessToken = await getServiceAccountToken(config.serviceAccountCredentials);
  if (!accessToken) {
    return {};
  }

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  try {
    const apiUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${config.propertyId}:runReport`;

    const requestBody = {
      dateRanges: [{
        startDate: startDateStr,
        endDate: endDateStr,
      }],
      dimensions: [
        { name: 'eventName' },
        { name: 'pagePath' }
      ],
      metrics: [
        { name: 'eventCount' }
      ],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'pagePath',
                stringFilter: {
                  matchType: 'EXACT',
                  value: pagePath
                }
              }
            },
            {
              orGroup: {
                expressions: goalEventNames.map(eventName => ({
                  filter: {
                    fieldName: 'eventName',
                    stringFilter: {
                      matchType: 'EXACT',
                      value: eventName
                    }
                  }
                }))
              }
            }
          ]
        }
      },
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('GA4 conversion goals API error:', await response.text());
      return {};
    }

    const data = await response.json();

    // Parse results into { eventName: count } map
    const goalConversions: Record<string, number> = {};
    if (data.rows) {
      for (const row of data.rows) {
        const eventName = row.dimensionValues[0]?.value;
        const count = parseInt(row.metricValues[0]?.value || '0');
        if (eventName) {
          goalConversions[eventName] = count;
        }
      }
    }

    return goalConversions;
  } catch (error) {
    console.error('Error querying GA4 conversion goals:', error);
    return {};
  }
}

/**
 * Sync GA4 metrics for a blog post
 */
export async function syncGA4MetricsForPost(
  blogPostId: string,
  websiteId: string,
  pagePath: string,
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get GA4 config
    const config = await getGA4Config(websiteId);
    if (!config) {
      return {
        success: false,
        error: 'No active GA4 connection found for this website',
      };
    }

    // Query GA4 metrics
    const metrics = await queryGA4Metrics(pagePath, startDate, endDate, config);
    if (!metrics) {
      return {
        success: false,
        error: 'Failed to fetch metrics from GA4',
      };
    }

    // Get conversion goals for this website
    const { data: goals } = await supabaseAdmin
      .from('conversion_goals')
      .select('id, ga4_event_name')
      .eq('website_id', websiteId)
      .eq('is_active', true)
      .eq('goal_type', 'event')
      .not('ga4_event_name', 'is', null);

    // Query goal-specific conversions
    let goalConversions: Record<string, number> = {};
    if (goals && goals.length > 0) {
      const eventNames = goals
        .map(g => g.ga4_event_name)
        .filter((name): name is string => name !== null);

      const eventCounts = await queryGA4ConversionGoals(
        pagePath,
        startDate,
        endDate,
        config,
        eventNames
      );

      // Map event names back to goal IDs
      goalConversions = {};
      for (const goal of goals) {
        if (goal.ga4_event_name && eventCounts[goal.ga4_event_name]) {
          goalConversions[goal.id] = eventCounts[goal.ga4_event_name];
        }
      }
    }

    // Save to database (merge with existing metrics)
    const snapshotDate = endDate;
    const { error } = await supabaseAdmin
      .from('blog_post_metrics')
      .upsert({
        blog_post_id: blogPostId,
        snapshot_date: snapshotDate.toISOString(),
        page_views: metrics.pageViews,
        unique_users: metrics.uniqueUsers,
        sessions: metrics.sessions,
        avg_engagement_time: metrics.averageEngagementTime,
        bounce_rate: metrics.bounceRate,
        conversions: metrics.conversions,
        goal_conversions: goalConversions,
        ga4_data: metrics.rawData,
        // Preserve existing GSC data if it exists
      }, {
        onConflict: 'blog_post_id,snapshot_date',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error saving GA4 metrics:', error);
      return {
        success: false,
        error: 'Failed to save metrics to database',
      };
    }

    // Update last sync timestamp
    await supabaseAdmin
      .from('ga4_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
        last_sync_error: null,
      })
      .eq('website_id', websiteId);

    return { success: true };
  } catch (error) {
    console.error('Error syncing GA4 metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
