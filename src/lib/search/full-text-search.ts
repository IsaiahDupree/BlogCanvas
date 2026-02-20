/**
 * Full-text search using Supabase's built-in PostgreSQL FTS
 */

import { createClient } from '@/lib/supabase/server'
import { logSearchQuery } from '@/lib/analytics/search-analytics'

export interface SearchResult {
  id: string
  title: string
  excerpt: string
  type: 'blog_post' | 'client' | 'website' | 'topic'
  score: number
  url?: string
}

/**
 * Search blog posts using full-text search
 */
export async function searchBlogPosts(
  query: string,
  vendorId: string,
  limit: number = 20,
  trackAnalytics: boolean = true
): Promise<SearchResult[]> {
  const startTime = Date.now()
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('search_blog_posts', {
      search_query: query,
      vendor_id_filter: vendorId,
      result_limit: limit
    })

  if (error) {
    console.error('Search error:', error)
    return []
  }

  const results = (data || []).map((row: any) => ({
    id: row.id,
    title: row.topic || 'Untitled',
    excerpt: row.draft?.substring(0, 200) || '',
    type: 'blog_post' as const,
    score: row.rank || 0,
    url: `/vendor/posts/${row.id}`
  }))

  // Track search analytics
  if (trackAnalytics) {
    const searchDuration = Date.now() - startTime
    await logSearchQuery({
      vendor_id: vendorId,
      query,
      result_count: results.length,
      entity_type: 'blog_post',
      had_results: results.length > 0,
      search_duration_ms: searchDuration
    })
  }

  return results
}

/**
 * Search clients using full-text search
 */
export async function searchClients(
  query: string,
  vendorId: string,
  limit: number = 20,
  trackAnalytics: boolean = true
): Promise<SearchResult[]> {
  const startTime = Date.now()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, notes')
    .eq('vendor_id', vendorId)
    .textSearch('name', query, {
      type: 'websearch',
      config: 'english'
    })
    .limit(limit)

  if (error) {
    console.error('Client search error:', error)
    return []
  }

  const results = (data || []).map((row: any) => ({
    id: row.id,
    title: row.name,
    excerpt: row.notes?.substring(0, 200) || '',
    type: 'client' as const,
    score: 1,
    url: `/vendor/clients/${row.id}`
  }))

  // Track search analytics
  if (trackAnalytics) {
    const searchDuration = Date.now() - startTime
    await logSearchQuery({
      vendor_id: vendorId,
      query,
      result_count: results.length,
      entity_type: 'client',
      had_results: results.length > 0,
      search_duration_ms: searchDuration
    })
  }

  return results
}

/**
 * Search websites
 */
export async function searchWebsites(
  query: string,
  vendorId: string,
  limit: number = 20,
  trackAnalytics: boolean = true
): Promise<SearchResult[]> {
  const startTime = Date.now()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('websites')
    .select(`
      id,
      domain,
      primary_keyword,
      client:clients(name)
    `)
    .eq('vendor_id', vendorId)
    .or(`domain.ilike.%${query}%,primary_keyword.ilike.%${query}%`)
    .limit(limit)

  if (error) {
    console.error('Website search error:', error)
    return []
  }

  const results = (data || []).map((row: any) => ({
    id: row.id,
    title: row.domain,
    excerpt: row.primary_keyword || '',
    type: 'website' as const,
    score: 1,
    url: `/vendor/websites/${row.id}`
  }))

  // Track search analytics
  if (trackAnalytics) {
    const searchDuration = Date.now() - startTime
    await logSearchQuery({
      vendor_id: vendorId,
      query,
      result_count: results.length,
      entity_type: 'website',
      had_results: results.length > 0,
      search_duration_ms: searchDuration
    })
  }

  return results
}

/**
 * Universal search across all entity types
 */
export async function universalSearch(
  query: string,
  vendorId: string,
  limit: number = 30
): Promise<SearchResult[]> {
  const startTime = Date.now()

  // Search all entity types in parallel (don't track individual searches)
  const [blogPosts, clients, websites] = await Promise.all([
    searchBlogPosts(query, vendorId, limit / 3, false),
    searchClients(query, vendorId, limit / 3, false),
    searchWebsites(query, vendorId, limit / 3, false)
  ])

  // Combine and sort by score
  const allResults = [...blogPosts, ...clients, ...websites]
  const results = allResults.sort((a, b) => b.score - a.score).slice(0, limit)

  // Track universal search analytics
  const searchDuration = Date.now() - startTime
  await logSearchQuery({
    vendor_id: vendorId,
    query,
    result_count: results.length,
    entity_type: 'universal',
    had_results: results.length > 0,
    search_duration_ms: searchDuration
  })

  return results
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSearchSuggestions(
  query: string,
  vendorId: string,
  limit: number = 5
): Promise<string[]> {
  const supabase = await createClient()

  // Get top matching blog post topics
  const { data } = await supabase
    .from('blog_posts')
    .select('topic')
    .eq('vendor_id', vendorId)
    .ilike('topic', `%${query}%`)
    .limit(limit)

  return (data || []).map(row => row.topic).filter(Boolean)
}
