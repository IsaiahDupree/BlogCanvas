/**
 * API Key Usage Statistics Endpoint
 * GET /api/api-keys/[id]/usage - Get usage statistics for an API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getApiKey, getApiKeyUsageStats } from '@/lib/api-key-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's vendor_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('vendor_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.vendor_id) {
      return NextResponse.json(
        { error: 'User not associated with a vendor' },
        { status: 403 }
      );
    }

    // Get the API key
    const apiKey = await getApiKey(id);

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Verify ownership
    if (apiKey.vendor_id !== profile.vendor_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters for date range
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;

    // Get usage statistics
    const stats = await getApiKeyUsageStats(id, startDate, endDate);

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Error getting API key usage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get API key usage' },
      { status: 500 }
    );
  }
}
