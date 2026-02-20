/**
 * Email Bounce Webhook Handler
 * POST /api/email/bounces - Handle bounce/complaint webhooks from email providers
 *
 * Supports:
 * - Resend webhooks
 * - SendGrid webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  processBounceEvent,
  parseResendWebhookEvent,
  parseSendGridWebhookEvent,
} from '@/lib/email-bounce-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Determine which provider sent the webhook
    const provider = request.headers.get('x-provider') || 'resend'; // Default to resend

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    // Parse the webhook event based on provider
    let bounceEvent;

    if (provider === 'resend') {
      bounceEvent = parseResendWebhookEvent(body);
    } else if (provider === 'sendgrid') {
      bounceEvent = parseSendGridWebhookEvent(body);
    } else {
      return NextResponse.json(
        { error: 'Unsupported email provider' },
        { status: 400 }
      );
    }

    if (!bounceEvent) {
      // Not a bounce/complaint event, or invalid payload
      return NextResponse.json({
        success: true,
        message: 'Event ignored (not a bounce or complaint)',
      });
    }

    // Process the bounce event
    const result = await processBounceEvent(
      supabaseUrl,
      supabaseServiceKey,
      bounceEvent
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to process bounce event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email: bounceEvent.email,
      bounce_type: bounceEvent.bounce_type,
      suppressed: result.suppressed,
      message: result.suppressed
        ? 'Email suppressed due to bounce/complaint'
        : 'Bounce logged successfully',
    });
  } catch (error: any) {
    console.error('Error handling bounce webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to handle bounce webhook' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: 'bounce-handler',
    message: 'POST bounce/complaint webhooks to this endpoint',
    supported_providers: ['resend', 'sendgrid'],
  });
}
