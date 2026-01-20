/**
 * Google OAuth callback endpoint
 * Handles OAuth redirect and stores tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTokensFromCode, getAuthenticatedClient } from '@/lib/google/oauth';
import { getCalendar } from '@/lib/google/calendar';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Contains vendor_id
    const error = searchParams.get('error');

    if (error) {
      console.error('[Google OAuth Callback] OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/vendor/settings/calendar?error=oauth_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/vendor/settings/calendar?error=invalid_callback`
      );
    }

    const vendorId = state;

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Get calendar info
    let calendarInfo;
    try {
      calendarInfo = await getCalendar(
        tokens.access_token,
        tokens.refresh_token || ''
      );
    } catch (calError) {
      console.error('[Google OAuth Callback] Error fetching calendar:', calError);
      calendarInfo = { id: 'primary', summary: 'Primary Calendar' };
    }

    // Store tokens in database
    const supabase = await createClient();

    const { error: dbError } = await supabase
      .from('vendor_calendar_integrations')
      .upsert({
        vendor_id: vendorId,
        provider: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        calendar_id: calendarInfo?.id || 'primary',
        calendar_name: calendarInfo?.summary || 'Primary Calendar',
        is_active: true,
        last_sync_at: new Date().toISOString()
      }, {
        onConflict: 'vendor_id,provider'
      });

    if (dbError) {
      console.error('[Google OAuth Callback] Database error:', dbError);
      throw dbError;
    }

    // Redirect to calendar settings with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/vendor/settings/calendar?success=true`
    );

  } catch (error: any) {
    console.error('[Google OAuth Callback] Error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/vendor/settings/calendar?error=callback_failed`
    );
  }
}
