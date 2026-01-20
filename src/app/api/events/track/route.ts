import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, updateFunnelStats, updateAttribution } from '@/lib/db/events';
import type { TrackEventInput } from '@/types/analytics';

/**
 * Track vendor events (page views, clicks, checkouts, etc.)
 * POST /api/events/track
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      event_name,
      event_type,
      vendor_id,
      page_id,
      client_id,
      workspace_id,
      session_id,
      user_id,
      user_type,
      properties,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      referrer
    } = body;

    if (!event_name || !event_type) {
      return NextResponse.json(
        { success: false, error: 'event_name and event_type are required' },
        { status: 400 }
      );
    }

    // Get IP and user agent for tracking
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    // Prepare event input
    const eventInput: TrackEventInput = {
      event_name,
      event_type,
      vendor_id,
      page_id,
      client_id,
      workspace_id,
      session_id,
      user_id,
      user_type,
      properties: {
        ...properties,
        ip_address: ip,
        user_agent: userAgent
      },
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      referrer
    };

    // Track the event
    const result = await trackEvent(eventInput);

    if (!result.success) {
      console.error('[Events API] Error tracking event:', result.error);
      // Don't fail - just log the error
      return NextResponse.json({
        success: true,
        message: 'Event tracking failed but request succeeded'
      });
    }

    // Update funnel stats for page events
    if (event_type === 'page' && vendor_id && page_id && session_id) {
      const funnelStepMap: Record<string, 'viewed_page' | 'scrolled_50' | 'played_vsl' | 'clicked_cta' | 'started_checkout' | 'completed_checkout'> = {
        'page_view': 'viewed_page',
        'scroll_depth': 'scrolled_50',
        'vsl_play': 'played_vsl',
        'cta_click_primary': 'clicked_cta',
        'cta_click_secondary': 'clicked_cta'
      };

      const funnelStep = funnelStepMap[event_name];
      if (funnelStep) {
        await updateFunnelStats(vendor_id, session_id, page_id, funnelStep);
      }
    }

    // Update funnel stats for checkout events
    if (event_type === 'checkout' && vendor_id && page_id && session_id) {
      if (event_name === 'checkout_start') {
        await updateFunnelStats(vendor_id, session_id, page_id, 'started_checkout');
      } else if (event_name === 'checkout_complete') {
        await updateFunnelStats(vendor_id, session_id, page_id, 'completed_checkout');
      }
    }

    // Update attribution
    if (vendor_id && page_id && session_id) {
      await updateAttribution(session_id, vendor_id, page_id, {
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        referrer
      });
    }

    return NextResponse.json({
      success: true,
      event: result.event
    });

  } catch (error: any) {
    console.error('[Events API] Error:', error);
    // Don't fail the request if event tracking fails
    return NextResponse.json({
      success: true,
      message: 'Event tracking failed but request succeeded'
    });
  }
}
