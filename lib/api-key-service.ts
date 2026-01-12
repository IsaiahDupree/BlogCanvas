/**
 * API Key Service
 * Handles generation, validation, and management of API keys
 */

import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client for API key operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface ApiKey {
  id: string;
  vendor_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyUsage {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface RateLimitStatus {
  minute_count: number;
  hour_count: number;
  day_count: number;
  minute_limit: number;
  hour_limit: number;
  day_limit: number;
  is_allowed: boolean;
  exceeded_window?: 'minute' | 'hour' | 'day';
}

/**
 * Generate a new API key
 * Format: bc_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (40 chars total)
 */
export async function generateApiKey(
  vendorId: string,
  name: string,
  scopes: string[],
  options: {
    expiresAt?: Date;
    rateLimitPerMinute?: number;
    rateLimitPerHour?: number;
    rateLimitPerDay?: number;
  } = {}
): Promise<{ key: string; apiKey: ApiKey }> {
  // Generate random key: bc_live_ + 32 random characters
  const randomPart = randomBytes(16).toString('hex'); // 32 hex chars
  const fullKey = `bc_live_${randomPart}`;
  const keyPrefix = fullKey.substring(0, 16); // bc_live_12345678

  // Hash the key for storage
  const keyHash = await bcrypt.hash(fullKey, 10);

  // Insert into database
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      vendor_id: vendorId,
      name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes,
      expires_at: options.expiresAt?.toISOString(),
      rate_limit_per_minute: options.rateLimitPerMinute ?? 60,
      rate_limit_per_hour: options.rateLimitPerHour ?? 1000,
      rate_limit_per_day: options.rateLimitPerDay ?? 10000,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create API key: ${error.message}`);
  }

  return {
    key: fullKey,
    apiKey: data,
  };
}

/**
 * Validate an API key and return the associated key record
 */
export async function validateApiKey(key: string): Promise<ApiKey | null> {
  if (!key.startsWith('bc_live_')) {
    return null;
  }

  const keyPrefix = key.substring(0, 16);

  // Find API keys with matching prefix
  const { data: candidates, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_prefix', keyPrefix)
    .eq('is_active', true);

  if (error || !candidates || candidates.length === 0) {
    return null;
  }

  // Check each candidate by comparing hash
  for (const candidate of candidates) {
    const isValid = await bcrypt.compare(key, candidate.key_hash);
    if (isValid) {
      // Check expiration
      if (candidate.expires_at) {
        const expiresAt = new Date(candidate.expires_at);
        if (expiresAt < new Date()) {
          return null; // Expired
        }
      }

      // Update last_used_at
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', candidate.id);

      return candidate;
    }
  }

  return null;
}

/**
 * Check rate limit for an API key
 */
export async function checkRateLimit(apiKeyId: string): Promise<RateLimitStatus> {
  const { data, error } = await supabase.rpc('get_api_key_rate_limits', {
    p_api_key_id: apiKeyId,
  });

  if (error || !data || data.length === 0) {
    throw new Error('Failed to check rate limit');
  }

  const limits = data[0];

  // Check each window
  if (limits.minute_count >= limits.minute_limit) {
    return {
      ...limits,
      is_allowed: false,
      exceeded_window: 'minute',
    };
  }

  if (limits.hour_count >= limits.hour_limit) {
    return {
      ...limits,
      is_allowed: false,
      exceeded_window: 'hour',
    };
  }

  if (limits.day_count >= limits.day_limit) {
    return {
      ...limits,
      is_allowed: false,
      exceeded_window: 'day',
    };
  }

  return {
    ...limits,
    is_allowed: true,
  };
}

/**
 * Increment rate limit counters for an API key
 */
export async function incrementRateLimit(apiKeyId: string): Promise<void> {
  const now = new Date();
  const minuteStart = new Date(now);
  minuteStart.setSeconds(0, 0);
  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  // Increment all three windows
  await Promise.all([
    supabase.rpc('increment_rate_limit_bucket', {
      p_api_key_id: apiKeyId,
      p_window_type: 'minute',
      p_window_start: minuteStart.toISOString(),
    }),
    supabase.rpc('increment_rate_limit_bucket', {
      p_api_key_id: apiKeyId,
      p_window_type: 'hour',
      p_window_start: hourStart.toISOString(),
    }),
    supabase.rpc('increment_rate_limit_bucket', {
      p_api_key_id: apiKeyId,
      p_window_type: 'day',
      p_window_start: dayStart.toISOString(),
    }),
  ]);
}

/**
 * Log API key usage
 */
export async function logApiKeyUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await supabase.from('api_key_usage').insert({
    api_key_id: apiKeyId,
    endpoint,
    method,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
}

/**
 * Get API key usage statistics
 */
export async function getApiKeyUsageStats(
  apiKeyId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time_ms: number;
  requests_by_endpoint: Record<string, number>;
  requests_by_day: Record<string, number>;
}> {
  const { data, error } = await supabase.rpc('get_api_key_usage_stats', {
    p_api_key_id: apiKeyId,
    p_start_date: startDate?.toISOString(),
    p_end_date: endDate?.toISOString(),
  });

  if (error || !data || data.length === 0) {
    return {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      avg_response_time_ms: 0,
      requests_by_endpoint: {},
      requests_by_day: {},
    };
  }

  return data[0];
}

/**
 * List all API keys for a vendor
 */
export async function listApiKeys(vendorId: string): Promise<ApiKey[]> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list API keys: ${error.message}`);
  }

  return data || [];
}

/**
 * Get an API key by ID
 */
export async function getApiKey(apiKeyId: string): Promise<ApiKey | null> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('id', apiKeyId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Update an API key
 */
export async function updateApiKey(
  apiKeyId: string,
  updates: {
    name?: string;
    scopes?: string[];
    is_active?: boolean;
    expires_at?: Date | null;
    rate_limit_per_minute?: number;
    rate_limit_per_hour?: number;
    rate_limit_per_day?: number;
  }
): Promise<ApiKey> {
  const updateData: any = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.scopes !== undefined) updateData.scopes = updates.scopes;
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
  if (updates.expires_at !== undefined) {
    updateData.expires_at = updates.expires_at?.toISOString() || null;
  }
  if (updates.rate_limit_per_minute !== undefined) {
    updateData.rate_limit_per_minute = updates.rate_limit_per_minute;
  }
  if (updates.rate_limit_per_hour !== undefined) {
    updateData.rate_limit_per_hour = updates.rate_limit_per_hour;
  }
  if (updates.rate_limit_per_day !== undefined) {
    updateData.rate_limit_per_day = updates.rate_limit_per_day;
  }

  const { data, error } = await supabase
    .from('api_keys')
    .update(updateData)
    .eq('id', apiKeyId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update API key: ${error.message}`);
  }

  return data;
}

/**
 * Delete (revoke) an API key
 */
export async function deleteApiKey(apiKeyId: string): Promise<void> {
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', apiKeyId);

  if (error) {
    throw new Error(`Failed to delete API key: ${error.message}`);
  }
}

/**
 * Available API scopes
 */
export const API_SCOPES = {
  // Posts
  'posts:read': 'Read blog posts',
  'posts:write': 'Create and update blog posts',
  'posts:delete': 'Delete blog posts',

  // Batches
  'batches:read': 'Read content batches',
  'batches:write': 'Create and update content batches',
  'batches:delete': 'Delete content batches',

  // Clients
  'clients:read': 'Read client information',
  'clients:write': 'Create and update clients',

  // Websites
  'websites:read': 'Read website information',
  'websites:write': 'Create and update websites',

  // Analytics
  'analytics:read': 'Read analytics data',

  // Reports
  'reports:read': 'Read reports',
  'reports:generate': 'Generate new reports',

  // Newsletters
  'newsletters:read': 'Read newsletters',
  'newsletters:write': 'Create and send newsletters',

  // Webhooks (for webhook endpoints)
  'webhooks:receive': 'Receive webhook events',
} as const;

export type ApiScope = keyof typeof API_SCOPES;
