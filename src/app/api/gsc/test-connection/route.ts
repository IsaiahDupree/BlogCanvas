import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/gsc/test-connection - Test GSC connection
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { site_url, client_id_gsc, client_secret_gsc, refresh_token } = body;

    // Validate required fields
    if (!site_url || !client_id_gsc || !client_secret_gsc || !refresh_token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Test the connection by getting access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: client_id_gsc,
        client_secret: client_secret_gsc,
        refresh_token: refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(`OAuth token error: ${errorData.error_description || errorData.error}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Test Search Console API access
    const testEndpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site_url)}`;

    const siteResponse = await fetch(testEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!siteResponse.ok) {
      const errorData = await siteResponse.json();
      throw new Error(
        `Search Console API error: ${errorData.error?.message || 'Site not found or not verified'}`
      );
    }

    const siteData = await siteResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Connection successful!',
      site_url: siteData.siteUrl,
      permission_level: siteData.permissionLevel,
    });
  } catch (error: any) {
    console.error('Error testing GSC connection:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
