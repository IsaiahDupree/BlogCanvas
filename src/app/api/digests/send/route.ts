/**
 * Digest Email Sending Endpoint
 * POST /api/digests/send - Send digest emails
 *
 * This endpoint should be called by a cron job:
 * - Daily: Every day at 8am
 * - Weekly: Every Monday at 8am
 * - Monthly: First day of month at 8am
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendDigests, DigestFrequency } from '@/lib/digest-email-service';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get frequency from query params
    const { searchParams } = new URL(request.url);
    const frequency = searchParams.get('frequency') as DigestFrequency;

    if (!frequency || !['daily', 'weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency. Must be: daily, weekly, or monthly' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const resendApiKey = process.env.RESEND_API_KEY!;

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      return NextResponse.json(
        { error: 'Missing required environment variables' },
        { status: 500 }
      );
    }

    const results = await sendDigests(
      supabaseUrl,
      supabaseServiceKey,
      resendApiKey,
      frequency
    );

    return NextResponse.json({
      success: true,
      frequency,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
      message: `Sent ${results.sent} ${frequency} digests, ${results.failed} failed`,
    });
  } catch (error: any) {
    console.error('Error sending digest emails:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send digests' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: 'digest-sender',
    message: 'Use POST with ?frequency=daily|weekly|monthly to trigger digests',
    example: 'POST /api/digests/send?frequency=daily',
  });
}
