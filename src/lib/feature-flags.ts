/**
 * Feature Flags Service
 *
 * Provides feature flag functionality with:
 * - Remote configuration
 * - Gradual rollout (percentage-based)
 * - Entity-specific overrides
 * - Usage logging for analytics
 */

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description?: string
  enabled: boolean
  rollout_percentage: number
  targeting_rules?: any[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface FeatureFlagOverride {
  id: string
  feature_flag_id: string
  entity_type: 'user' | 'vendor' | 'client'
  entity_id: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export type EntityType = 'user' | 'vendor' | 'client'

/**
 * Check if a feature is enabled for an entity
 * Uses database function for consistency
 */
export async function isFeatureEnabled(
  flagKey: string,
  entityType?: EntityType,
  entityId?: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_feature_enabled', {
      flag_key: flagKey,
      entity_type_param: entityType || null,
      entity_id_param: entityId || null
    })

    if (error) {
      console.error('Error checking feature flag:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Error checking feature flag:', error)
    return false
  }
}

/**
 * Get all feature flags
 */
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching feature flags:', error)
    return []
  }

  return data || []
}

/**
 * Get a specific feature flag by key
 */
export async function getFeatureFlag(key: string): Promise<FeatureFlag | null> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('key', key)
    .single()

  if (error) {
    console.error('Error fetching feature flag:', error)
    return null
  }

  return data
}

/**
 * Create a new feature flag
 */
export async function createFeatureFlag(
  flag: Omit<FeatureFlag, 'id' | 'created_at' | 'updated_at'>
): Promise<FeatureFlag | null> {
  const { data, error } = await supabase
    .from('feature_flags')
    .insert(flag)
    .select()
    .single()

  if (error) {
    console.error('Error creating feature flag:', error)
    return null
  }

  return data
}

/**
 * Update a feature flag
 */
export async function updateFeatureFlag(
  id: string,
  updates: Partial<Omit<FeatureFlag, 'id' | 'created_at' | 'updated_at'>>
): Promise<FeatureFlag | null> {
  const { data, error } = await supabase
    .from('feature_flags')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating feature flag:', error)
    return null
  }

  return data
}

/**
 * Delete a feature flag
 */
export async function deleteFeatureFlag(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('feature_flags')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting feature flag:', error)
    return false
  }

  return true
}

/**
 * Set feature flag enabled state
 */
export async function setFeatureFlagEnabled(
  key: string,
  enabled: boolean
): Promise<boolean> {
  const flag = await getFeatureFlag(key)
  if (!flag) return false

  const updated = await updateFeatureFlag(flag.id, { enabled })
  return updated !== null
}

/**
 * Set feature flag rollout percentage
 */
export async function setFeatureFlagRollout(
  key: string,
  percentage: number
): Promise<boolean> {
  if (percentage < 0 || percentage > 100) {
    console.error('Rollout percentage must be between 0 and 100')
    return false
  }

  const flag = await getFeatureFlag(key)
  if (!flag) return false

  const updated = await updateFeatureFlag(flag.id, { rollout_percentage: percentage })
  return updated !== null
}

/**
 * Get overrides for a feature flag
 */
export async function getFeatureFlagOverrides(
  flagId: string
): Promise<FeatureFlagOverride[]> {
  const { data, error } = await supabase
    .from('feature_flag_overrides')
    .select('*')
    .eq('feature_flag_id', flagId)

  if (error) {
    console.error('Error fetching feature flag overrides:', error)
    return []
  }

  return data || []
}

/**
 * Create or update an override for an entity
 */
export async function setFeatureFlagOverride(
  flagKey: string,
  entityType: EntityType,
  entityId: string,
  enabled: boolean
): Promise<boolean> {
  try {
    // Get feature flag
    const flag = await getFeatureFlag(flagKey)
    if (!flag) return false

    // Upsert override
    const { error } = await supabase
      .from('feature_flag_overrides')
      .upsert({
        feature_flag_id: flag.id,
        entity_type: entityType,
        entity_id: entityId,
        enabled
      }, {
        onConflict: 'feature_flag_id,entity_type,entity_id'
      })

    if (error) {
      console.error('Error setting feature flag override:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error setting feature flag override:', error)
    return false
  }
}

/**
 * Remove an override for an entity
 */
export async function removeFeatureFlagOverride(
  flagKey: string,
  entityType: EntityType,
  entityId: string
): Promise<boolean> {
  try {
    const flag = await getFeatureFlag(flagKey)
    if (!flag) return false

    const { error } = await supabase
      .from('feature_flag_overrides')
      .delete()
      .eq('feature_flag_id', flag.id)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    if (error) {
      console.error('Error removing feature flag override:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error removing feature flag override:', error)
    return false
  }
}

/**
 * Get feature flag usage statistics
 */
export async function getFeatureFlagStats(
  flagKey: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  total_checks: number
  enabled_count: number
  disabled_count: number
  enabled_percentage: number
}> {
  try {
    const flag = await getFeatureFlag(flagKey)
    if (!flag) {
      return {
        total_checks: 0,
        enabled_count: 0,
        disabled_count: 0,
        enabled_percentage: 0
      }
    }

    let query = supabase
      .from('feature_flag_logs')
      .select('enabled', { count: 'exact' })
      .eq('feature_flag_id', flag.id)

    if (startDate) {
      query = query.gte('checked_at', startDate.toISOString())
    }

    if (endDate) {
      query = query.lte('checked_at', endDate.toISOString())
    }

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching feature flag stats:', error)
      return {
        total_checks: 0,
        enabled_count: 0,
        disabled_count: 0,
        enabled_percentage: 0
      }
    }

    const enabled_count = data?.filter(log => log.enabled).length || 0
    const disabled_count = (count || 0) - enabled_count
    const enabled_percentage = count ? (enabled_count / count) * 100 : 0

    return {
      total_checks: count || 0,
      enabled_count,
      disabled_count,
      enabled_percentage: Math.round(enabled_percentage * 100) / 100
    }
  } catch (error) {
    console.error('Error fetching feature flag stats:', error)
    return {
      total_checks: 0,
      enabled_count: 0,
      disabled_count: 0,
      enabled_percentage: 0
    }
  }
}

/**
 * React hook for using feature flags in components
 */
export function useFeatureFlag(flagKey: string, entityType?: EntityType, entityId?: string) {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    isFeatureEnabled(flagKey, entityType, entityId).then(result => {
      setEnabled(result)
      setLoading(false)
    })
  }, [flagKey, entityType, entityId])

  return { enabled, loading }
}

// Export for server-side usage
export const featureFlags = {
  isEnabled: isFeatureEnabled,
  getAll: getAllFeatureFlags,
  get: getFeatureFlag,
  create: createFeatureFlag,
  update: updateFeatureFlag,
  delete: deleteFeatureFlag,
  setEnabled: setFeatureFlagEnabled,
  setRollout: setFeatureFlagRollout,
  getOverrides: getFeatureFlagOverrides,
  setOverride: setFeatureFlagOverride,
  removeOverride: removeFeatureFlagOverride,
  getStats: getFeatureFlagStats
}
