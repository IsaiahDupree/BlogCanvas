import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { createIPFilter } from '@/lib/security/ip-filter';
import { createClient } from '@/lib/supabase/server';

/**
 * Get IP allowlist rules for current vendor
 * GET /api/vendor/ip-allowlist
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    const supabase = await createClient();

    // Get vendor ID for current user
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

    const ipFilter = createIPFilter();
    const rules = await ipFilter.getRules(vendor.id);

    return NextResponse.json({
      success: true,
      enabled: vendor.ip_allowlist_enabled || false,
      rules,
    });
  } catch (error: any) {
    console.error('Error fetching IP allowlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch IP allowlist' },
      { status: 500 }
    );
  }
}

/**
 * Add a new IP allowlist rule
 * POST /api/vendor/ip-allowlist
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    const supabase = await createClient();
    const body = await request.json();

    const { ip_address, label, description } = body;

    if (!ip_address) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      );
    }

    // Validate IP address format (basic validation)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(ip_address)) {
      return NextResponse.json(
        { error: 'Invalid IP address format. Use format: 192.168.1.1 or 192.168.1.0/24' },
        { status: 400 }
      );
    }

    // Get vendor ID for current user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const ipFilter = createIPFilter();
    const rule = await ipFilter.addRule(
      vendor.id,
      ip_address,
      label,
      description,
      user.id
    );

    if (!rule) {
      return NextResponse.json(
        { error: 'Failed to create IP allowlist rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rule,
    });
  } catch (error: any) {
    console.error('Error creating IP allowlist rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create IP allowlist rule' },
      { status: 500 }
    );
  }
}

/**
 * Toggle IP allowlist feature
 * PATCH /api/vendor/ip-allowlist
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    const supabase = await createClient();
    const body = await request.json();

    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled field must be a boolean' },
        { status: 400 }
      );
    }

    // Get vendor ID for current user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const ipFilter = createIPFilter();
    const success = await ipFilter.toggleAllowlist(vendor.id, enabled);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to toggle IP allowlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enabled,
    });
  } catch (error: any) {
    console.error('Error toggling IP allowlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to toggle IP allowlist' },
      { status: 500 }
    );
  }
}
