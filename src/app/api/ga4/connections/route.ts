import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { testGA4Connection } from '@/lib/analytics/google-analytics-4';

/**
 * GET /api/ga4/connections
 * List all GA4 connections for the current user's vendor/client
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's vendor_id from client_profiles
    const { data: profile } = await supabase
      .from('client_profiles')
      .select('vendor_id, client_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch GA4 connections
    let query = supabase
      .from('ga4_connections')
      .select(`
        *,
        client:clients(name),
        website:websites(url, name)
      `)
      .order('created_at', { ascending: false });

    // Filter by vendor or client
    if (profile.vendor_id) {
      query = query.eq('vendor_id', profile.vendor_id);
    } else if (profile.client_id) {
      query = query.eq('client_id', profile.client_id);
    }

    const { data: connections, error } = await query;

    if (error) {
      console.error('Error fetching GA4 connections:', error);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    // Remove sensitive credentials from response
    const sanitizedConnections = connections?.map((conn) => ({
      ...conn,
      service_account_credentials: undefined, // Don't expose credentials
    }));

    return NextResponse.json({ connections: sanitizedConnections });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ga4/connections
 * Create a new GA4 connection
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's vendor_id
    const { data: profile } = await supabase
      .from('client_profiles')
      .select('vendor_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.vendor_id) {
      return NextResponse.json(
        { error: 'Only vendors can create GA4 connections' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      client_id,
      website_id,
      property_id,
      service_account_email,
      service_account_credentials,
    } = body;

    // Validate required fields
    if (!property_id || !service_account_email || !service_account_credentials) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse service account JSON if it's a string
    let credentials = service_account_credentials;
    if (typeof credentials === 'string') {
      try {
        credentials = JSON.parse(credentials);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid service account JSON' },
          { status: 400 }
        );
      }
    }

    // Test connection before saving
    const testResult = await testGA4Connection({
      propertyId: property_id,
      serviceAccountEmail: service_account_email,
      serviceAccountCredentials: credentials,
    });

    if (!testResult.success) {
      return NextResponse.json(
        {
          error: 'Connection test failed',
          details: testResult.error,
        },
        { status: 400 }
      );
    }

    // Create connection
    const { data: connection, error } = await supabase
      .from('ga4_connections')
      .insert({
        vendor_id: profile.vendor_id,
        client_id,
        website_id,
        property_id,
        property_name: testResult.propertyName,
        service_account_email,
        service_account_credentials: credentials,
        status: 'active',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating GA4 connection:', error);
      return NextResponse.json(
        { error: 'Failed to create connection' },
        { status: 500 }
      );
    }

    // Remove credentials from response
    const sanitizedConnection = {
      ...connection,
      service_account_credentials: undefined,
    };

    return NextResponse.json({
      connection: sanitizedConnection,
      message: 'GA4 connection created successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
