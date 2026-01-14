import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export const API_SCOPES = {
  'clients:read': 'Read client data',
  'clients:write': 'Create and modify clients',
  'content:read': 'Read blog posts and content',
  'content:write': 'Create and modify blog posts',
  'publish': 'Publish content to CMS',
  'analytics:read': 'Read analytics data',
  'billing:read': 'Read invoices and billing data',
  'billing:write': 'Create invoices and manage billing',
} as const;

export type ApiScope = keyof typeof API_SCOPES;

interface GenerateApiKeyOptions {
  expiresAt?: Date;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  rateLimitPerDay?: number;
}

interface ApiKeyRecord {
  id: string;
  vendor_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: string[];
  is_active: boolean;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export async function generateApiKey(
  vendorId: string,
  name: string,
  scopes: string[],
  options: GenerateApiKeyOptions = {}
): Promise<{ key: string; apiKey: ApiKeyRecord }> {
  const supabase = await createClient();

  // Generate a secure random API key
  const keyBytes = crypto.randomBytes(32);
  const key = `bc_${keyBytes.toString('base64url')}`;
  
  // Create a hash of the key for storage
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  
  // Store only the first 8 characters as prefix for identification
  const keyPrefix = key.substring(0, 11); // "bc_" + 8 chars

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      vendor_id: vendorId,
      name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes,
      is_active: true,
      rate_limit_per_minute: options.rateLimitPerMinute || 60,
      rate_limit_per_hour: options.rateLimitPerHour || 1000,
      rate_limit_per_day: options.rateLimitPerDay || 10000,
      expires_at: options.expiresAt?.toISOString() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create API key: ${error.message}`);
  }

  return { key, apiKey: data };
}

export async function listApiKeys(vendorId: string): Promise<ApiKeyRecord[]> {
  const supabase = await createClient();

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

export async function getApiKey(keyId: string, vendorId: string): Promise<ApiKeyRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('id', keyId)
    .eq('vendor_id', vendorId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get API key: ${error.message}`);
  }

  return data;
}

export async function updateApiKey(
  keyId: string,
  vendorId: string,
  updates: Partial<Pick<ApiKeyRecord, 'name' | 'scopes' | 'is_active' | 'rate_limit_per_minute' | 'rate_limit_per_hour' | 'rate_limit_per_day'>>
): Promise<ApiKeyRecord> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('api_keys')
    .update(updates)
    .eq('id', keyId)
    .eq('vendor_id', vendorId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update API key: ${error.message}`);
  }

  return data;
}

export async function deleteApiKey(keyId: string, vendorId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('vendor_id', vendorId);

  if (error) {
    throw new Error(`Failed to delete API key: ${error.message}`);
  }
}

export async function validateApiKey(key: string): Promise<{ valid: boolean; apiKey?: ApiKeyRecord; error?: string }> {
  const supabase = await createClient();

  // Hash the provided key
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  // Find the API key by hash
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Check if key is active
  if (!data.is_active) {
    return { valid: false, error: 'API key is inactive' };
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return { valid: true, apiKey: data };
}

export async function recordApiKeyUsage(
  keyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('api_key_usage').insert({
    api_key_id: keyId,
    endpoint,
    method,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
  });
}

export async function getApiKeyUsageStats(
  keyId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  requestsByEndpoint: Record<string, number>;
  requestsByMethod: Record<string, number>;
}> {
  const supabase = await createClient();

  let query = supabase
    .from('api_key_usage')
    .select('*')
    .eq('api_key_id', keyId);

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get usage stats: ${error.message}`);
  }

  const records = data || [];
  const totalRequests = records.length;
  const successfulRequests = records.filter(r => r.status_code >= 200 && r.status_code < 400).length;
  const failedRequests = records.filter(r => r.status_code >= 400).length;
  const avgResponseTime = totalRequests > 0
    ? records.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / totalRequests
    : 0;

  const requestsByEndpoint: Record<string, number> = {};
  const requestsByMethod: Record<string, number> = {};

  for (const record of records) {
    requestsByEndpoint[record.endpoint] = (requestsByEndpoint[record.endpoint] || 0) + 1;
    requestsByMethod[record.method] = (requestsByMethod[record.method] || 0) + 1;
  }

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    avgResponseTime,
    requestsByEndpoint,
    requestsByMethod,
  };
}
