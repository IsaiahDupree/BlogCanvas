import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/analytics/cohorts
 * Fetch cohort analysis data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get('metric') || 'retention';
    const period = searchParams.get('period') || 'monthly';

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Generate cohort data
    // This is a placeholder implementation - adjust based on your actual data structure
    const cohorts = await generateCohortData(supabase, metric, period);

    return NextResponse.json({
      success: true,
      cohorts,
      metric,
      period,
    });
  } catch (error) {
    console.error('[Cohort Analysis API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cohort data',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate cohort analysis data
 * Groups customers by signup date and tracks their retention over time
 */
async function generateCohortData(
  supabase: any,
  metric: string,
  period: string
): Promise<any[]> {
  try {
    // Fetch customer data with purchase dates
    // This is a simplified version - adjust based on your schema
    const { data: customers, error } = await supabase
      .from('clients')
      .select('id, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }

    if (!customers || customers.length === 0) {
      return [];
    }

    // Group customers into cohorts
    const cohortMap = new Map<string, Set<string>>();

    customers.forEach((customer: any) => {
      const cohortDate = new Date(customer.created_at);
      const cohortKey =
        period === 'monthly'
          ? `${cohortDate.getFullYear()}-${String(cohortDate.getMonth() + 1).padStart(2, '0')}`
          : getWeekKey(cohortDate);

      if (!cohortMap.has(cohortKey)) {
        cohortMap.set(cohortKey, new Set());
      }
      cohortMap.get(cohortKey)!.add(customer.id);
    });

    // Calculate retention for each cohort
    const cohorts = Array.from(cohortMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // Last 12 cohorts
      .map(([cohortMonth, customerIds]) => {
        const retention: { [key: string]: number } = {};

        // Calculate retention for each period
        const maxPeriods = 12;
        for (let i = 0; i < maxPeriods; i++) {
          // This is placeholder logic - replace with actual retention calculation
          // based on your business logic (e.g., active subscriptions, logins, etc.)
          const baseRetention = 100;
          const decayRate = metric === 'retention' ? 5 : 3;
          const randomVariation = Math.random() * 10 - 5;

          const retentionRate = Math.max(
            0,
            Math.min(100, baseRetention - i * decayRate + randomVariation)
          );

          retention[i.toString()] = Math.round(retentionRate * 10) / 10;
        }

        return {
          cohortMonth,
          cohortSize: customerIds.size,
          retention,
        };
      });

    return cohorts;
  } catch (error) {
    console.error('Error generating cohort data:', error);
    return [];
  }
}

/**
 * Get week key for a date (YYYY-Www format)
 */
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const daysSinceFirstDay = Math.floor(
    (date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNumber = Math.ceil((daysSinceFirstDay + firstDayOfYear.getDay() + 1) / 7);

  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}
