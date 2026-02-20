/**
 * Usage Tracking Service
 *
 * Tracks feature usage per vendor with tier-based limits:
 * - Enforces usage limits
 * - Records usage events
 * - Provides upgrade prompts
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type UsageLimitType =
  | 'clients'
  | 'offers'
  | 'blog_posts'
  | 'team_members'
  | 'ai_requests'
  | 'email_sends'
  | 'custom_domains'

export type UsageEventType =
  | 'client_created'
  | 'offer_created'
  | 'blog_post_created'
  | 'storage_added'
  | 'team_member_added'
  | 'ai_request'
  | 'email_sent'
  | 'api_call'

export interface UsageLimitCheck {
  allowed: boolean
  unlimited?: boolean
  current?: number
  limit?: number
  remaining?: number
  tier?: string
  upgrade_required?: boolean
  error?: string
}

export interface TierLimit {
  id: string
  tier: string
  name: string
  description?: string
  max_clients: number
  max_offers: number
  max_blog_posts: number
  max_storage_mb: number
  max_team_members: number
  max_ai_requests_per_month: number
  max_email_sends_per_month: number
  max_custom_domains: number
  custom_branding: boolean
  white_label: boolean
  api_access: boolean
  priority_support: boolean
  advanced_analytics: boolean
  monthly_price_usd: number
  annual_price_usd: number
}

export interface CurrentUsage {
  clients_count: number
  offers_count: number
  blog_posts_count: number
  storage_used_mb: number
  team_members_count: number
  ai_requests_count: number
  email_sends_count: number
  api_calls_count: number
}

/**
 * Check if a vendor can perform an action based on their tier limits
 */
export async function checkUsageLimit(
  vendorId: string,
  limitType: UsageLimitType
): Promise<UsageLimitCheck> {
  try {
    const { data, error } = await supabase.rpc('check_usage_limit', {
      vendor_id_param: vendorId,
      limit_type: limitType
    })

    if (error) {
      console.error('Error checking usage limit:', error)
      return {
        allowed: false,
        error: 'Failed to check usage limit'
      }
    }

    return data as UsageLimitCheck
  } catch (error) {
    console.error('Error checking usage limit:', error)
    return {
      allowed: false,
      error: 'Failed to check usage limit'
    }
  }
}

/**
 * Record a usage event
 */
export async function recordUsageEvent(
  vendorId: string,
  eventType: UsageEventType,
  quantity: number = 1,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('record_usage_event', {
      vendor_id_param: vendorId,
      event_type_param: eventType,
      quantity_param: quantity,
      metadata_param: metadata
    })

    if (error) {
      console.error('Error recording usage event:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Error recording usage event:', error)
    return false
  }
}

/**
 * Get current usage for a vendor
 */
export async function getCurrentUsage(vendorId: string): Promise<CurrentUsage | null> {
  try {
    const { data, error } = await supabase.rpc('get_current_usage', {
      vendor_id_param: vendorId
    })

    if (error) {
      console.error('Error getting current usage:', error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error('Error getting current usage:', error)
    return null
  }
}

/**
 * Get all tier limits
 */
export async function getAllTierLimits(): Promise<TierLimit[]> {
  const { data, error } = await supabase
    .from('tier_limits')
    .select('*')
    .order('monthly_price_usd')

  if (error) {
    console.error('Error fetching tier limits:', error)
    return []
  }

  return data || []
}

/**
 * Get tier limits for a specific tier
 */
export async function getTierLimits(tier: string): Promise<TierLimit | null> {
  const { data, error } = await supabase
    .from('tier_limits')
    .select('*')
    .eq('tier', tier)
    .single()

  if (error) {
    console.error('Error fetching tier limits:', error)
    return null
  }

  return data
}

/**
 * Get vendor's current tier
 */
export async function getVendorTier(vendorId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('vendors')
    .select('tier')
    .eq('id', vendorId)
    .single()

  if (error) {
    console.error('Error fetching vendor tier:', error)
    return null
  }

  return data?.tier || 'free'
}

/**
 * Update vendor's tier
 */
export async function updateVendorTier(vendorId: string, tier: string): Promise<boolean> {
  const { error } = await supabase
    .from('vendors')
    .update({ tier })
    .eq('id', vendorId)

  if (error) {
    console.error('Error updating vendor tier:', error)
    return false
  }

  return true
}

/**
 * Check if vendor has access to a feature based on tier
 */
export async function hasFeatureAccess(
  vendorId: string,
  feature: 'custom_branding' | 'white_label' | 'api_access' | 'priority_support' | 'advanced_analytics'
): Promise<boolean> {
  try {
    const tier = await getVendorTier(vendorId)
    if (!tier) return false

    const limits = await getTierLimits(tier)
    if (!limits) return false

    return limits[feature] === true
  } catch (error) {
    console.error('Error checking feature access:', error)
    return false
  }
}

/**
 * Get usage statistics for a vendor
 */
export async function getUsageStats(
  vendorId: string,
  periodStart?: Date,
  periodEnd?: Date
): Promise<{
  usage: CurrentUsage | null
  limits: TierLimit | null
  tier: string | null
  percentages: Record<string, number>
}> {
  try {
    const tier = await getVendorTier(vendorId)
    const limits = tier ? await getTierLimits(tier) : null
    const usage = await getCurrentUsage(vendorId)

    const percentages: Record<string, number> = {}

    if (usage && limits) {
      if (limits.max_clients !== -1) {
        percentages.clients = (usage.clients_count / limits.max_clients) * 100
      }
      if (limits.max_offers !== -1) {
        percentages.offers = (usage.offers_count / limits.max_offers) * 100
      }
      if (limits.max_blog_posts !== -1) {
        percentages.blog_posts = (usage.blog_posts_count / limits.max_blog_posts) * 100
      }
      if (limits.max_ai_requests_per_month !== -1) {
        percentages.ai_requests = (usage.ai_requests_count / limits.max_ai_requests_per_month) * 100
      }
      if (limits.max_email_sends_per_month !== -1) {
        percentages.email_sends = (usage.email_sends_count / limits.max_email_sends_per_month) * 100
      }
    }

    return {
      usage,
      limits,
      tier,
      percentages
    }
  } catch (error) {
    console.error('Error getting usage stats:', error)
    return {
      usage: null,
      limits: null,
      tier: null,
      percentages: {}
    }
  }
}

/**
 * Helper to enforce usage limits before creating resources
 * Throws an error if limit is exceeded
 */
export async function enforceUsageLimit(
  vendorId: string,
  limitType: UsageLimitType
): Promise<void> {
  const check = await checkUsageLimit(vendorId, limitType)

  if (!check.allowed) {
    if (check.upgrade_required) {
      throw new Error(
        `You've reached the ${limitType} limit for your ${check.tier} plan. Please upgrade to continue.`
      )
    } else {
      throw new Error(check.error || 'Usage limit check failed')
    }
  }
}

// Export for convenience
export const usageTracking = {
  checkLimit: checkUsageLimit,
  recordEvent: recordUsageEvent,
  getCurrentUsage,
  getAllTierLimits,
  getTierLimits,
  getVendorTier,
  updateVendorTier,
  hasFeatureAccess,
  getUsageStats,
  enforceLimit: enforceUsageLimit
}
