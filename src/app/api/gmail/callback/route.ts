import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gmailService } from '@/lib/gmail-service';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the user ID
    const error = searchParams.get('error');

    if (error) {
      // User denied access or error occurred
      return NextResponse.redirect(
        new URL(`/app/settings/gmail?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/app/settings/gmail?error=missing_code', request.url)
      );
    }

    const userId = state;

    // Exchange code for tokens
    const tokens = await gmailService.exchangeCodeForTokens(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL('/app/settings/gmail?error=no_tokens', request.url)
      );
    }

    // Get user's email address using the access token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: tokens.access_token });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const gmailAddress = userInfo.data.email;

    if (!gmailAddress) {
      return NextResponse.redirect(
        new URL('/app/settings/gmail?error=no_email', request.url)
      );
    }

    // Get vendor_id from user's profile
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('vendor_id')
      .eq('id', userId)
      .single();

    const vendorId = profile?.vendor_id;

    if (!vendorId) {
      return NextResponse.redirect(
        new URL('/app/settings/gmail?error=no_vendor', request.url)
      );
    }

    // Save connection to database
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600000); // Default 1 hour

    await gmailService.saveConnection(
      userId,
      vendorId,
      gmailAddress,
      tokens.access_token,
      tokens.refresh_token,
      expiresAt
    );

    // Redirect back to settings page with success
    return NextResponse.redirect(
      new URL('/app/settings/gmail?success=true', request.url)
    );
  } catch (error: any) {
    console.error('Gmail callback error:', error);
    return NextResponse.redirect(
      new URL(`/app/settings/gmail?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
