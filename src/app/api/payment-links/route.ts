/**
 * Payment Links API
 * GET - List payment links for the vendor
 * POST - Create a new payment link
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentLink } from '@/lib/stripe/invoice-manager';
import { isStripeConfigured } from '@/lib/stripe/stripe-client';

/**
 * GET /api/payment-links?clientId=...
 * List payment links
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

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
      .from('payment_links')
      .select('*, client:client_id(*)')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: paymentLinks, error: linksError } = await query;

    if (linksError) {
      throw linksError;
    }

    return NextResponse.json({ paymentLinks });
  } catch (error: any) {
    console.error('Error fetching payment links:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment links' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payment-links
 * Create a new payment link
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
    const { clientId, amount, currency, description, expiresAt, metadata } = body;

    // Validation
    if (!amount || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, description' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    // If clientId provided, verify it belongs to vendor
    if (clientId) {
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
    }

    // Parse expiration date
    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : undefined;

    // Create payment link
    const paymentLink = await createPaymentLink({
      vendorId: user.id,
      clientId: clientId || undefined,
      amount,
      currency: currency || 'usd',
      description,
      expiresAt: parsedExpiresAt,
      metadata: metadata || {},
    });

    return NextResponse.json({ paymentLink }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating payment link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment link' },
      { status: 500 }
    );
  }
}
