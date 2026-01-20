import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { createIPFilter } from '@/lib/security/ip-filter';

/**
 * Get security metrics for vendor dashboard
 * GET /api/vendor/security/metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    const supabase = await createClient();

    // Get vendor ID
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, ip_allowlist_enabled')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const vendorId = vendor.id;

    // Get audit logs count
    const { count: auditCount } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId);

    // Get failed logins in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: failedLoginsCount } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('action_type', 'auth')
      .eq('success', false)
      .gte('created_at', sevenDaysAgo.toISOString());

    // Get IP blocks in last 7 days
    const { count: ipBlocksCount } = await supabase
      .from('ip_block_log')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .gte('created_at', sevenDaysAgo.toISOString());

    // Get active IP rules count
    const { count: activeRulesCount } = await supabase
      .from('ip_allowlists')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('enabled', true);

    // Get latest audit log
    const { data: latestAudit } = await supabase
      .from('audit_logs')
      .select('created_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Check if 2FA is enabled for user
    const { data: userData } = await supabase
      .from('auth.users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get top blocked IPs
    const ipFilter = createIPFilter();
    const blockStats = await ipFilter.getBlockStats(vendorId, 7);

    const metrics = {
      audit_logs_count: auditCount || 0,
      failed_logins_7d: failedLoginsCount || 0,
      ip_blocks_7d: ipBlocksCount || 0,
      active_ip_rules: activeRulesCount || 0,
      two_factor_enabled: false, // TODO: Check actual 2FA status from user metadata
      last_audit_log: latestAudit?.created_at || null,
      recent_blocks: blockStats.top_blocked_ips,
      ip_allowlist_enabled: vendor.ip_allowlist_enabled || false,
    };

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error('Error fetching security metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch security metrics' },
      { status: 500 }
    );
  }
}
