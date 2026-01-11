/**
 * Invoices API
 * GET - List invoices (filtered by client)
 * POST - Create and send a new invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createInvoice } from '@/lib/stripe/invoice-manager';
import { isStripeConfigured } from '@/lib/stripe/stripe-client';

/**
 * GET /api/invoices?clientId=...&status=...
 * List invoices
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query
    let query = supabase
      .from('invoices')
      .select('*, client:client_id(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (clientId) {
      // Verify access to client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }

      query = query.eq('client_id', clientId);
    } else {
      // Get invoices for all clients owned by vendor
      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .eq('owner_id', user.id);

      if (clients && clients.length > 0) {
        const clientIds = clients.map((c) => c.id);
        query = query.in('client_id', clientIds);
      } else {
        // No clients, return empty
        return NextResponse.json({ invoices: [], total: 0 });
      }
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: invoices, error: invoicesError, count } = await query;

    if (invoicesError) {
      throw invoicesError;
    }

    return NextResponse.json({ invoices, total: count || 0 });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices
 * Create and send a new invoice
 */
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to environment.' },
        { status: 503 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, amount, currency, description, dueDate, items, metadata } = body;

    // Validation
    if (!clientId || (!amount && !items) || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, (amount or items), description' },
        { status: 400 }
      );
    }

    // Verify client belongs to vendor
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('owner_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      );
    }

    // Parse due date
    const parsedDueDate = dueDate ? new Date(dueDate) : undefined;

    // Create invoice
    const invoice = await createInvoice({
      clientId,
      amount: amount || 0,
      currency: currency || 'usd',
      description,
      dueDate: parsedDueDate,
      items: items || undefined,
      metadata: metadata || {},
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
