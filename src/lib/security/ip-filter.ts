/**
 * IP Allowlist Service
 *
 * Provides IP-based access control for enhanced security.
 * Vendors can restrict access to their resources by IP address or CIDR range.
 */

import { createClient } from '@supabase/supabase-js';

export interface IPAllowlistRule {
  id: string;
  vendor_id: string;
  ip_address: string;
  label?: string;
  description?: string;
  enabled: boolean;
  added_by?: string;
  last_matched_at?: string;
  match_count: number;
  created_at: string;
  updated_at: string;
}

export interface IPBlockLog {
  id: string;
  vendor_id: string;
  ip_address: string;
  endpoint: string;
  method: string;
  user_agent?: string;
  reason: string;
  created_at: string;
}

export class IPFilterService {
  private supabase: any;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    // Use service role key for IP filtering (bypasses RLS)
    const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!;

    this.supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }

  /**
   * Check if an IP is allowed for a vendor
   */
  async isIPAllowed(vendorId: string, ipAddress: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('is_ip_allowed', {
          p_vendor_id: vendorId,
          p_ip_address: ipAddress,
        });

      if (error) {
        console.error('Error checking IP allowlist:', error);
        // Fail open - allow access if there's an error
        return true;
      }

      return data === true;
    } catch (err) {
      console.error('IP filter error:', err);
      // Fail open
      return true;
    }
  }

  /**
   * Log a blocked IP attempt
   */
  async logBlockedAccess(
    vendorId: string,
    ipAddress: string,
    endpoint: string,
    method: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    try {
      await this.supabase
        .rpc('log_ip_block', {
          p_vendor_id: vendorId,
          p_ip_address: ipAddress,
          p_endpoint: endpoint,
          p_method: method,
          p_user_agent: userAgent || null,
          p_reason: reason || 'IP not in allowlist',
        });
    } catch (err) {
      console.error('Failed to log blocked access:', err);
      // Silently fail - logging shouldn't break the request
    }
  }

  /**
   * Update match statistics for an IP
   */
  async updateMatchStats(ipAddress: string, vendorId: string): Promise<void> {
    try {
      await this.supabase
        .rpc('update_ip_match_stats', {
          p_ip_address: ipAddress,
          p_vendor_id: vendorId,
        });
    } catch (err) {
      console.error('Failed to update match stats:', err);
      // Silently fail
    }
  }

  /**
   * Add an IP allowlist rule
   */
  async addRule(
    vendorId: string,
    ipAddress: string,
    label?: string,
    description?: string,
    addedBy?: string
  ): Promise<IPAllowlistRule | null> {
    try {
      const { data, error } = await this.supabase
        .from('ip_allowlists')
        .insert({
          vendor_id: vendorId,
          ip_address: ipAddress,
          label,
          description,
          added_by: addedBy,
          enabled: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding IP rule:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to add IP rule:', err);
      return null;
    }
  }

  /**
   * Get all rules for a vendor
   */
  async getRules(vendorId: string): Promise<IPAllowlistRule[]> {
    try {
      const { data, error } = await this.supabase
        .from('ip_allowlists')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching IP rules:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch IP rules:', err);
      return [];
    }
  }

  /**
   * Update a rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<Pick<IPAllowlistRule, 'ip_address' | 'label' | 'description' | 'enabled'>>
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('ip_allowlists')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ruleId);

      if (error) {
        console.error('Error updating IP rule:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to update IP rule:', err);
      return false;
    }
  }

  /**
   * Delete a rule
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('ip_allowlists')
        .delete()
        .eq('id', ruleId);

      if (error) {
        console.error('Error deleting IP rule:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to delete IP rule:', err);
      return false;
    }
  }

  /**
   * Toggle allowlist feature for a vendor
   */
  async toggleAllowlist(vendorId: string, enabled: boolean): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('vendors')
        .update({ ip_allowlist_enabled: enabled })
        .eq('id', vendorId);

      if (error) {
        console.error('Error toggling allowlist:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to toggle allowlist:', err);
      return false;
    }
  }

  /**
   * Get block logs for a vendor
   */
  async getBlockLogs(
    vendorId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<IPBlockLog[]> {
    try {
      const { data, error } = await this.supabase
        .from('ip_block_log')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching block logs:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch block logs:', err);
      return [];
    }
  }

  /**
   * Get block log statistics
   */
  async getBlockStats(vendorId: string, days: number = 7): Promise<{
    total_blocks: number;
    unique_ips: number;
    top_blocked_ips: Array<{ ip_address: string; count: number }>;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('ip_block_log')
        .select('ip_address')
        .eq('vendor_id', vendorId)
        .gte('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Error fetching block stats:', error);
        return { total_blocks: 0, unique_ips: 0, top_blocked_ips: [] };
      }

      const logs = data || [];
      const ipCounts: Record<string, number> = {};

      logs.forEach((log: any) => {
        ipCounts[log.ip_address] = (ipCounts[log.ip_address] || 0) + 1;
      });

      const uniqueIPs = Object.keys(ipCounts).length;
      const topBlockedIPs = Object.entries(ipCounts)
        .map(([ip, count]) => ({ ip_address: ip, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        total_blocks: logs.length,
        unique_ips: uniqueIPs,
        top_blocked_ips: topBlockedIPs,
      };
    } catch (err) {
      console.error('Failed to fetch block stats:', err);
      return { total_blocks: 0, unique_ips: 0, top_blocked_ips: [] };
    }
  }
}

/**
 * Extract IP address from request
 */
export function getClientIP(request: Request): string | undefined {
  // Try common headers for proxy/load balancer scenarios
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return undefined;
}

/**
 * Middleware wrapper for IP filtering
 */
export function withIPFilter(
  handler: (request: Request, context: any) => Promise<Response>,
  getVendorId: (request: Request, context: any) => string | undefined
) {
  return async (request: Request, context: any): Promise<Response> => {
    const vendorId = getVendorId(request, context);

    if (!vendorId) {
      // No vendor ID, allow request
      return handler(request, context);
    }

    const clientIP = getClientIP(request);

    if (!clientIP) {
      // Can't determine IP, allow request (fail open)
      return handler(request, context);
    }

    const ipFilter = new IPFilterService();
    const isAllowed = await ipFilter.isIPAllowed(vendorId, clientIP);

    if (!isAllowed) {
      // Log the blocked attempt
      const url = new URL(request.url);
      await ipFilter.logBlockedAccess(
        vendorId,
        clientIP,
        url.pathname,
        request.method,
        request.headers.get('user-agent') || undefined
      );

      return new Response(
        JSON.stringify({
          error: 'Access denied',
          message: 'Your IP address is not authorized to access this resource',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update match statistics
    ipFilter.updateMatchStats(clientIP, vendorId).catch(err => {
      console.error('Failed to update match stats:', err);
    });

    return handler(request, context);
  };
}

/**
 * Create a standard IP filter service instance
 */
export function createIPFilter(): IPFilterService {
  return new IPFilterService();
}
