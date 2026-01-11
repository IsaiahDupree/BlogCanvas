/**
 * Subscription Plans API
 * GET - List all subscription plans for the vendor
 * POST - Create a new subscription plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSubscriptionPlan } from '@/lib/stripe/subscription-manager';
import { isStripeConfigured } from '@/lib/stripe/stripe-client';

/**
 * GET /api/subscriptions/plans
 * List all subscription plans for the authenticated vendor
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

    // Get subscription plans
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (plansError) {
      throw plansError;
    }

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch plans' }, { status: 500 });
  }
}

/**
 * POST /api/subscriptions/plans
 * Create a new subscription plan
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
    const { name, description, amount, currency, interval, intervalCount, metadata } = body;

    // Validation
    if (!name || !amount || !interval) {
      return NextResponse.json(
        { error: 'Missing required fields: name, amount, interval' },
        { status: 400 }
      );
    }

    if (!['month', 'year', 'week'].includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid interval. Must be month, year, or week.' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    // Create plan
    const plan = await createSubscriptionPlan({
      vendorId: user.id,
      name,
      description,
      amount,
      currency: currency || 'usd',
      interval,
      intervalCount: intervalCount || 1,
      metadata: metadata || {},
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json({ error: error.message || 'Failed to create plan' }, { status: 500 });
  }
}
