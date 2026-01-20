import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { createIPFilter } from '@/lib/security/ip-filter';
import { createClient } from '@/lib/supabase/server';

/**
 * Update an IP allowlist rule
 * PATCH /api/vendor/ip-allowlist/[ruleId]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { user } = await requireAuth();
    const supabase = await createClient();
    const body = await request.json();
    const { ruleId } = await params;

    const { ip_address, label, description, enabled } = body;

    // Verify the rule belongs to the current vendor
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Verify rule ownership
    const { data: rule } = await supabase
      .from('ip_allowlists')
      .select('vendor_id')
      .eq('id', ruleId)
      .single();

    if (!rule || rule.vendor_id !== vendor.id) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    // Validate IP if provided
    if (ip_address) {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
      if (!ipRegex.test(ip_address)) {
        return NextResponse.json(
          { error: 'Invalid IP address format' },
          { status: 400 }
        );
      }
    }

    const ipFilter = createIPFilter();
    const updates: any = {};
    if (ip_address !== undefined) updates.ip_address = ip_address;
    if (label !== undefined) updates.label = label;
    if (description !== undefined) updates.description = description;
    if (enabled !== undefined) updates.enabled = enabled;

    const success = await ipFilter.updateRule(ruleId, updates);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error updating IP rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update IP rule' },
      { status: 500 }
    );
  }
}

/**
 * Delete an IP allowlist rule
 * DELETE /api/vendor/ip-allowlist/[ruleId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { user } = await requireAuth();
    const supabase = await createClient();
    const { ruleId } = await params;

    // Verify the rule belongs to the current vendor
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Verify rule ownership
    const { data: rule } = await supabase
      .from('ip_allowlists')
      .select('vendor_id')
      .eq('id', ruleId)
      .single();

    if (!rule || rule.vendor_id !== vendor.id) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    const ipFilter = createIPFilter();
    const success = await ipFilter.deleteRule(ruleId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting IP rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete IP rule' },
      { status: 500 }
    );
  }
}
