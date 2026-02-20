import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getErrorRateStats, getTopErrorEndpoints, getErrorTrend } from '@/lib/monitoring/error-rate';

/**
 * GET /api/monitoring/error-rate
 * Get error rate statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and has admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const endpoint = searchParams.get('endpoint') || undefined;

    // Default to last 24 hours
    const endDate = endParam ? new Date(endParam) : new Date();
    const startDate = startParam
      ? new Date(startParam)
      : new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

    // Get error rate statistics
    const stats = await getErrorRateStats(startDate, endDate, endpoint);

    // Get top error endpoints
    const topEndpoints = await getTopErrorEndpoints(startDate, endDate, 10);

    // Get error trend (hourly)
    const trend = await getErrorTrend(startDate, endDate, 60);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        topEndpoints,
        trend,
      },
    });
  } catch (error) {
    console.error('Error getting error rate stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
