/**
 * GET /api/r/:code - Referral redirect with tracking
 * Public endpoint for referral link clicks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getReferralCodeBySlug } from '@/lib/referrals/generate';
import { trackReferralClick, hashIpAddress, setReferralCookie } from '@/lib/referrals/track';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    // Get referral code
    const referralCode = await getReferralCodeBySlug(code);

    if (!referralCode) {
      // Redirect to home if code not found
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Check if code is active and not expired
    if (!referralCode.is_active) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (referralCode.expires_at && new Date(referralCode.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Get tracking data
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    // Get UTM parameters
    const searchParams = request.nextUrl.searchParams;
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');

    // Track click (don't await to avoid slowing redirect)
    trackReferralClick({
      referral_code_id: referralCode.id,
      ip_hash: ip ? hashIpAddress(ip) : undefined,
      user_agent: userAgent,
      landing_page: '/',
      referrer_url: referer || undefined,
      utm_source: utmSource || undefined,
      utm_medium: utmMedium || undefined,
      utm_campaign: utmCampaign || undefined,
    }).catch((error) => {
      console.error('Error tracking referral click:', error);
    });

    // Build redirect URL with UTM params preserved
    const redirectUrl = new URL('/', request.url);
    if (utmSource) redirectUrl.searchParams.set('utm_source', utmSource);
    if (utmMedium) redirectUrl.searchParams.set('utm_medium', utmMedium);
    if (utmCampaign) redirectUrl.searchParams.set('utm_campaign', utmCampaign);
    redirectUrl.searchParams.set('ref', code);

    // Create response with redirect
    const response = NextResponse.redirect(redirectUrl);

    // Set referral cookie for attribution (30 days)
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    response.cookies.set('ref_code', code, {
      expires,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Error processing referral redirect:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
