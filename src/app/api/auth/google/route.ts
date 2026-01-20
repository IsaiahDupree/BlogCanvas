/**
 * Google OAuth initiation endpoint
 * Redirects vendor to Google OAuth consent screen
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthorizationUrl } from '@/lib/google/oauth';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/vendor/login?error=unauthorized`);
    }

    // Get vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/vendor/register?error=no_vendor_profile`);
    }

    // Generate authorization URL with vendor ID in state
    const authUrl = getAuthorizationUrl(vendor.id);

    return NextResponse.redirect(authUrl);

  } catch (error: any) {
    console.error('[Google OAuth] Error initiating OAuth:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/vendor/settings/calendar?error=oauth_failed`
    );
  }
}
