import { NextRequest, NextResponse } from 'next/server';
import { sendMetaCAPIEvent, generateEventId } from '@/lib/tracking/meta-capi';

/**
 * API route for sending Meta Conversions API events
 * This allows client-side code to trigger server-side Meta tracking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      event_name,
      event_source_url,
      user_data,
      custom_data,
      event_id,
      action_source = 'website',
    } = body;

    if (!event_name || !event_source_url) {
      return NextResponse.json(
        { error: 'Missing required fields: event_name, event_source_url' },
        { status: 400 }
      );
    }

    // Get client IP and user agent from headers
    const clientIpAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined;
    const clientUserAgent = request.headers.get('user-agent') || undefined;

    // Merge user data with IP/UA from request
    const enrichedUserData = {
      ...user_data,
      clientIpAddress,
      clientUserAgent,
    };

    const finalEventId = event_id || generateEventId();

    const success = await sendMetaCAPIEvent({
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: finalEventId,
      event_source_url,
      action_source,
      user_data: enrichedUserData,
      custom_data,
    });

    if (success) {
      return NextResponse.json({
        success: true,
        event_id: finalEventId,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send event to Meta CAPI' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Meta CAPI API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
