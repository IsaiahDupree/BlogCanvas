/**
 * Webhook Processing Cron Endpoint
 * POST /api/webhooks/process - Process pending webhook deliveries
 *
 * This endpoint should be called by a cron job every 1-5 minutes
 * Can use Vercel Cron, GitHub Actions, or external cron service
 */

import { NextRequest, NextResponse } from 'next/server';
import { processPendingDeliveries } from '@/lib/webhook-service';

export async function POST(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    // Process up to 50 deliveries per run
    const stats = await processPendingDeliveries(
      supabaseUrl,
      supabaseServiceKey,
      50
    );

    return NextResponse.json({
      success: true,
      stats,
      message: `Processed ${stats.processed} deliveries: ${stats.succeeded} succeeded, ${stats.failed} failed, ${stats.retrying} retrying`,
    });
  } catch (error: any) {
    console.error('Error processing webhook deliveries:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process deliveries' },
      { status: 500 }
    );
  }
}

// Allow GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: 'webhook-processor',
    message: 'Use POST to trigger processing',
  });
}
