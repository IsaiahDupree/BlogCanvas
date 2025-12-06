/**
 * Google Search Console API Integration
 * 
 * This module provides functions to interact with Google Search Console API
 * to collect search performance data for blog posts.
 * 
 * Setup:
 * 1. Create a Google Cloud Project
 * 2. Enable Search Console API
 * 3. Create OAuth 2.0 credentials
 * 4. Store credentials in environment variables:
 *    - GOOGLE_SEARCH_CONSOLE_CLIENT_ID
 *    - GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET
 *    - GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN (obtained via OAuth flow)
 */

import { PostMetrics } from './analytics-collector';

export interface GSCConfig {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    siteUrl: string; // Verified site URL in Search Console
}

/**
 * Get access token from refresh token
 */
async function getAccessToken(config: GSCConfig): Promise<string | null> {
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                refresh_token: config.refreshToken,
                grant_type: 'refresh_token',
            }),
        });

        if (!response.ok) {
            console.error('Failed to get access token:', await response.text());
            return null;
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
}

/**
 * Query Google Search Console API for URL performance
 */
export async function querySearchConsole(
    url: string,
    startDate: Date,
    endDate: Date,
    config: GSCConfig
): Promise<PostMetrics | null> {
    const accessToken = await getAccessToken(config);
    if (!accessToken) {
        return null;
    }

    // Format dates for API (YYYY-MM-DD)
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Query Search Console API
    try {
        const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.siteUrl)}/searchAnalytics/query`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                startDate: startDateStr,
                endDate: endDateStr,
                dimensions: ['page'],
                dimensionFilterGroups: [{
                    filters: [{
                        dimension: 'page',
                        expression: url,
                        operator: 'equals'
                    }]
                }],
                rowLimit: 1
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Search Console API error:', error);
            return null;
        }

        const data = await response.json();
        
        // Parse response
        if (!data.rows || data.rows.length === 0) {
            return {
                impressions: 0,
                clicks: 0,
                ctr: 0,
                avg_position: 0,
                seo_score: 0
            };
        }

        const row = data.rows[0];
        
        return {
            impressions: row.impressions || 0,
            clicks: row.clicks || 0,
            ctr: row.ctr ? row.ctr * 100 : 0, // Convert to percentage
            avg_position: row.position || 0,
            seo_score: calculateSEOScoreFromGSC(row),
            raw_metrics: {
                query_data: data.rows,
                date_range: {
                    start: startDateStr,
                    end: endDateStr
                }
            }
        };

    } catch (error) {
        console.error('Error querying Search Console:', error);
        return null;
    }
}

/**
 * Calculate SEO score from Google Search Console data
 */
function calculateSEOScoreFromGSC(row: any): number {
    // Position score (0-50): Better position = higher score
    const position = row.position || 100;
    const positionScore = Math.max(0, 50 - (position - 1) * 0.5);
    
    // CTR score (0-30): Higher CTR = higher score
    const ctr = row.ctr || 0;
    const ctrScore = Math.min(30, ctr * 1000); // Scale CTR to 0-30
    
    // Impressions score (0-20): More impressions = higher score (capped)
    const impressions = row.impressions || 0;
    const impressionsScore = Math.min(20, impressions / 100);
    
    return Math.round(positionScore + ctrScore + impressionsScore);
}

/**
 * Get GSC config from environment or database
 */
export async function getGSCConfig(siteUrl: string): Promise<GSCConfig | null> {
    // Check environment variables first
    const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN;

    if (clientId && clientSecret && refreshToken) {
        return {
            clientId,
            clientSecret,
            refreshToken,
            siteUrl
        };
    }

    // TODO: Fetch from database (store per-client GSC credentials)
    // const { data } = await supabaseAdmin
    //     .from('client_integrations')
    //     .select('gsc_credentials')
    //     .eq('site_url', siteUrl)
    //     .single();

    return null;
}

