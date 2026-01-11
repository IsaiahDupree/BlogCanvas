/**
 * Subscription Detail API
 * GET - Get subscription details
 * PATCH - Update subscription (change plan)
 * DELETE - Cancel subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  cancelSubscription,
  reactivateSubscription,
  updateSubscriptionPlan,
} from '@/lib/stripe/subscription-manager';
import { isStripeConfigured } from '@/lib/stripe/stripe-client';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/subscriptions/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscription with client and plan details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*, client:client_id(*), plan:subscription_plan_id(*)')
      .eq('id', id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Verify access (vendor or client)
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', subscription.client_id)
      .single();

    if (!client || (client.owner_id !== user.id && subscription.client_id !== user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/subscriptions/[id]
 * Update subscription (change plan or reactivate)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
    }

    const { id } = await params;
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
    const { action, newPlanId } = body;

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*, client:client_id(*)')
      .eq('id', id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Verify vendor access
    const client = subscription.client as any;
    if (client.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Handle different actions
    if (action === 'reactivate') {
      const result = await reactivateSubscription(id);
      return NextResponse.json({ subscription: result, message: 'Subscription reactivated' });
    } else if (action === 'change_plan') {
      if (!newPlanId) {
        return NextResponse.json({ error: 'newPlanId is required for change_plan' }, { status: 400 });
      }
      const result = await updateSubscriptionPlan(id, newPlanId);
      return NextResponse.json({ subscription: result, message: 'Subscription plan updated' });
    } else {
      return NextResponse.json({ error: 'Invalid action. Use reactivate or change_plan' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subscriptions/[id]
 * Cancel subscription
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
    }

    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const cancelImmediately = searchParams.get('immediate') === 'true';

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*, client:client_id(*)')
      .eq('id', id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Verify vendor access
    const client = subscription.client as any;
    if (client.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Cancel subscription
    await cancelSubscription(id, cancelImmediately);

    return NextResponse.json({
      success: true,
      message: cancelImmediately
        ? 'Subscription canceled immediately'
        : 'Subscription will cancel at period end',
    });
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
