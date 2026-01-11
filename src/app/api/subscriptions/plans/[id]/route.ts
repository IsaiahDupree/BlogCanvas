/**
 * Subscription Plan Detail API
 * GET - Get subscription plan details
 * PATCH - Update subscription plan
 * DELETE - Deactivate subscription plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, isStripeConfigured } from '@/lib/stripe/stripe-client';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/subscriptions/plans/[id]
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

    // Get plan
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', id)
      .eq('vendor_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch (error: any) {
    console.error('Error fetching subscription plan:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch plan' }, { status: 500 });
  }
}

/**
 * PATCH /api/subscriptions/plans/[id]
 * Update plan metadata (not price/interval, those require new plan)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured.' },
        { status: 503 }
      );
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
    const { name, description, is_active } = body;

    // Get plan
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', id)
      .eq('vendor_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Update Stripe product if name or description changed
    if (name || description) {
      await stripe.products.update(plan.stripe_product_id, {
        name: name || plan.name,
        description: description || plan.description,
      });
    }

    // Update Stripe price active status if changed
    if (typeof is_active === 'boolean' && is_active !== plan.is_active) {
      await stripe.prices.update(plan.stripe_price_id, {
        active: is_active,
      });
    }

    // Update database
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (typeof is_active === 'boolean') updateData.is_active = is_active;

    const { data: updatedPlan, error: updateError } = await supabase
      .from('subscription_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ plan: updatedPlan });
  } catch (error: any) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json({ error: error.message || 'Failed to update plan' }, { status: 500 });
  }
}

/**
 * DELETE /api/subscriptions/plans/[id]
 * Deactivate subscription plan
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured.' },
        { status: 503 }
      );
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

    // Get plan
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', id)
      .eq('vendor_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Archive Stripe price (can't delete prices with active subscriptions)
    await stripe.prices.update(plan.stripe_price_id, {
      active: false,
    });

    // Deactivate in database
    const { error: updateError } = await supabase
      .from('subscription_plans')
      .update({ is_active: false })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, message: 'Plan deactivated' });
  } catch (error: any) {
    console.error('Error deleting subscription plan:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete plan' }, { status: 500 });
  }
}
