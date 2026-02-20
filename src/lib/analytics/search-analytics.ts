/**
 * Search Analytics - Track search queries, no-results, and popular searches
 * Implements VENDOR-WC-133: Search analytics
 */

import { supabaseAdmin } from '@/lib/supabase'

export interface SearchAnalyticsEvent {
  vendor_id: string
  user_id?: string
  query: string
  result_count: number
  entity_type?: 'blog_post' | 'client' | 'website' | 'universal'
  had_results: boolean
  clicked_result_id?: string
  clicked_result_type?: string
  search_duration_ms?: number
}

/**
 * Log a search query event
 */
export async function logSearchQuery(event: SearchAnalyticsEvent): Promise<void> {
  try {
    await supabaseAdmin.from('search_analytics').insert({
      vendor_id: event.vendor_id,
      user_id: event.user_id,
      query: event.query.toLowerCase().trim(),
      result_count: event.result_count,
      entity_type: event.entity_type,
      had_results: event.had_results,
      clicked_result_id: event.clicked_result_id,
      clicked_result_type: event.clicked_result_type,
      search_duration_ms: event.search_duration_ms,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log search query:', error)
    // Don't throw - analytics shouldn't break user experience
  }
}

/**
 * Get no-result queries (queries that returned zero results)
 */
export async function getNoResultQueries(
  vendorId: string,
  limit: number = 50
): Promise<Array<{ query: string; count: number; last_searched: string }>> {
  const { data, error } = await supabaseAdmin
    .rpc('get_no_result_searches', {
      vendor_id_filter: vendorId,
      result_limit: limit
    })

  if (error) {
    console.error('Error fetching no-result queries:', error)
    return []
  }

  return data || []
}

/**
 * Get popular search queries
 */
export async function getPopularSearches(
  vendorId: string,
  limit: number = 50,
  days: number = 30
): Promise<Array<{ query: string; search_count: number; avg_results: number }>> {
  const { data, error } = await supabaseAdmin
    .rpc('get_popular_searches', {
      vendor_id_filter: vendorId,
      days_back: days,
      result_limit: limit
    })

  if (error) {
    console.error('Error fetching popular searches:', error)
    return []
  }

  return data || []
}

/**
 * Get search analytics summary
 */
export async function getSearchAnalyticsSummary(
  vendorId: string,
  days: number = 30
): Promise<{
  total_searches: number
  unique_queries: number
  no_result_count: number
  no_result_rate: number
  avg_results_per_search: number
  top_queries: Array<{ query: string; count: number }>
}> {
  const { data, error } = await supabaseAdmin
    .rpc('get_search_analytics_summary', {
      vendor_id_filter: vendorId,
      days_back: days
    })

  if (error) {
    console.error('Error fetching search analytics summary:', error)
    return {
      total_searches: 0,
      unique_queries: 0,
      no_result_count: 0,
      no_result_rate: 0,
      avg_results_per_search: 0,
      top_queries: []
    }
  }

  return data || {
    total_searches: 0,
    unique_queries: 0,
    no_result_count: 0,
    no_result_rate: 0,
    avg_results_per_search: 0,
    top_queries: []
  }
}

/**
 * Track when a user clicks on a search result
 */
export async function logSearchResultClick(
  vendorId: string,
  query: string,
  resultId: string,
  resultType: string
): Promise<void> {
  try {
    await supabaseAdmin.from('search_result_clicks').insert({
      vendor_id: vendorId,
      query: query.toLowerCase().trim(),
      result_id: resultId,
      result_type: resultType,
      clicked_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log search result click:', error)
  }
}
