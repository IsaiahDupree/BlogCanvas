import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/gsc/connections - Get all GSC connections for current user
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: connections, error } = await supabaseAdmin
      .from('gsc_connections')
      .select(`
        *,
        client:clients(id, name),
        website:websites(id, url, name)
      `)
      .eq('vendor_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Remove sensitive data before sending to client
    const safeConnections = connections?.map((conn) => ({
      ...conn,
      client_secret_gsc: undefined,
      refresh_token: undefined,
      access_token: undefined,
    }));

    return NextResponse.json({
      success: true,
      connections: safeConnections || [],
    });
  } catch (error: any) {
    console.error('Error fetching GSC connections:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gsc/connections - Create new GSC connection
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      site_url,
      property_name,
      client_id_gsc,
      client_secret_gsc,
      refresh_token,
      website_id,
      client_id,
    } = body;

    // Validate required fields
    if (!site_url || !client_id_gsc || !client_secret_gsc || !refresh_token) {
      return NextResponse.json(
        { error: 'Missing required fields: site_url, client_id_gsc, client_secret_gsc, refresh_token' },
        { status: 400 }
      );
    }

    // Check if connection already exists for this site
    const { data: existing } = await supabaseAdmin
      .from('gsc_connections')
      .select('id')
      .eq('vendor_id', session.user.id)
      .eq('site_url', site_url)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Connection already exists for this site URL' },
        { status: 409 }
      );
    }

    // Create connection
    const { data: connection, error } = await supabaseAdmin
      .from('gsc_connections')
      .insert({
        vendor_id: session.user.id,
        site_url,
        property_name: property_name || null,
        client_id_gsc,
        client_secret_gsc, // TODO: Encrypt before storing
        refresh_token, // TODO: Encrypt before storing
        website_id: website_id || null,
        client_id: client_id || null,
        status: 'active',
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      connection: {
        ...connection,
        client_secret_gsc: undefined,
        refresh_token: undefined,
      },
    });
  } catch (error: any) {
    console.error('Error creating GSC connection:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
