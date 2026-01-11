/**
 * Subscriptions API
 * GET - List subscriptions (filtered by client or vendor)
 * POST - Create a new subscription for a client
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSubscription } from '@/lib/stripe/subscription-manager';
import { isStripeConfigured } from '@/lib/stripe/stripe-client';

/**
 * GET /api/subscriptions?clientId=...
 * List subscriptions
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
      .from('subscriptions')
      .select('*, client:client_id(*), plan:subscription_plan_id(*)')
      .order('created_at', { ascending: false });

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
      // Get subscriptions for all clients owned by vendor
      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .eq('owner_id', user.id);

      if (clients && clients.length > 0) {
        const clientIds = clients.map((c) => c.id);
        query = query.in('client_id', clientIds);
      } else {
        // No clients, return empty
        return NextResponse.json({ subscriptions: [] });
      }
    }

    const { data: subscriptions, error: subsError } = await query;

    if (subsError) {
      throw subsError;
    }

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions
 * Create a new subscription for a client
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
    const { clientId, planId, trialDays } = body;

    // Validation
    if (!clientId || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, planId' },
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

    // Create subscription
    const subscription = await createSubscription({
      clientId,
      planId,
      trialDays: trialDays || undefined,
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
