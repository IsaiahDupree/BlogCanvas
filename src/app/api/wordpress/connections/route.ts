import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WordPressClient } from '@/lib/wordpress/client';

// Simple encryption for storing passwords (in production, use proper encryption)
function encryptPassword(password: string): string {
  return Buffer.from(password).toString('base64');
}

function decryptPassword(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

// GET - List WordPress connections
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('vendor_id')
      .eq('id', user.id)
      .single();

    if (!profile?.vendor_id) {
      return NextResponse.json({ error: 'No vendor profile' }, { status: 403 });
    }

    const { data: connections, error } = await supabase
      .from('wordpress_connections')
      .select(`
        id,
        site_url,
        site_name,
        username,
        is_active,
        connection_status,
        connection_error,
        last_connected_at,
        created_at,
        client:clients(id, name)
      `)
      .eq('vendor_id', profile.vendor_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      connections: connections || []
    });

  } catch (error: any) {
    console.error('Get WordPress connections error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// POST - Create new WordPress connection
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('vendor_id')
      .eq('id', user.id)
      .single();

    if (!profile?.vendor_id) {
      return NextResponse.json({ error: 'No vendor profile' }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, siteUrl, username, applicationPassword } = body;

    if (!siteUrl || !username || !applicationPassword) {
      return NextResponse.json({ 
        error: 'Missing required fields: siteUrl, username, applicationPassword' 
      }, { status: 400 });
    }

    // Test the connection first
    const client = new WordPressClient({
      siteUrl,
      username,
      applicationPassword
    });

    const testResult = await client.testConnection();

    // Create the connection record
    const { data: connection, error } = await supabase
      .from('wordpress_connections')
      .insert({
        vendor_id: profile.vendor_id,
        client_id: clientId || null,
        site_url: siteUrl,
        site_name: testResult.siteName,
        username,
        application_password_encrypted: encryptPassword(applicationPassword),
        is_active: true,
        connection_status: testResult.success ? 'connected' : 'failed',
        connection_error: testResult.error || null,
        last_connected_at: testResult.success ? new Date().toISOString() : null,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      connection,
      testResult
    });

  } catch (error: any) {
    console.error('Create WordPress connection error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
