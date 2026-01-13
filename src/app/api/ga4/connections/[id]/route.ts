import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/ga4/connections/[id]
 * Get a single GA4 connection
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch connection (RLS will handle authorization)
    const { data: connection, error } = await supabase
      .from('ga4_connections')
      .select(`
        *,
        client:clients(name),
        website:websites(url, name)
      `)
      .eq('id', id)
      .single();

    if (error || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Remove credentials from response
    const sanitizedConnection = {
      ...connection,
      service_account_credentials: undefined,
    };

    return NextResponse.json({ connection: sanitizedConnection });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ga4/connections/[id]
 * Update a GA4 connection
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { status, property_name } = body;

    // Update connection (RLS will handle authorization)
    const { data: connection, error } = await supabase
      .from('ga4_connections')
      .update({
        status,
        property_name,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating GA4 connection:', error);
      return NextResponse.json(
        { error: 'Failed to update connection' },
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
      message: 'Connection updated successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ga4/connections/[id]
 * Delete a GA4 connection
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete connection (RLS will handle authorization)
    const { error } = await supabase
      .from('ga4_connections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting GA4 connection:', error);
      return NextResponse.json(
        { error: 'Failed to delete connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Connection deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
