/**
 * Subscription Manager
 * Handles Stripe subscription creation, updates, and cancellation
 */

import { stripe, formatAmountForStripe } from './stripe-client';
import { createClient } from '@/lib/supabase/server';

export interface CreateSubscriptionParams {
  clientId: string;
  planId: string;
  trialDays?: number;
}

export interface CreatePlanParams {
  vendorId: string;
  name: string;
  description?: string;
  amount: number; // in dollars
  currency?: string;
  interval: 'month' | 'year' | 'week';
  intervalCount?: number;
  metadata?: Record<string, string>;
}

/**
 * Create a subscription plan (Stripe Product + Price)
 */
export async function createSubscriptionPlan(params: CreatePlanParams) {
  const supabase = await createClient();

  // Create Stripe product
  const product = await stripe.products.create({
    name: params.name,
    description: params.description,
    metadata: {
      vendor_id: params.vendorId,
      ...params.metadata,
    },
  });

  // Create Stripe price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: formatAmountForStripe(params.amount, params.currency || 'usd'),
    currency: params.currency || 'usd',
    recurring: {
      interval: params.interval,
      interval_count: params.intervalCount || 1,
    },
    metadata: {
      vendor_id: params.vendorId,
    },
  });

  // Save to database
  const { data, error } = await supabase
    .from('subscription_plans')
    .insert({
      vendor_id: params.vendorId,
      stripe_price_id: price.id,
      stripe_product_id: product.id,
      name: params.name,
      description: params.description,
      amount: formatAmountForStripe(params.amount, params.currency || 'usd'),
      currency: params.currency || 'usd',
      interval: params.interval,
      interval_count: params.intervalCount || 1,
      is_active: true,
      metadata: params.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save subscription plan: ${error.message}`);
  }

  return data;
}

/**
 * Create a subscription for a client
 */
export async function createSubscription(params: CreateSubscriptionParams) {
  const supabase = await createClient();

  // Get client info
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*, owner:owner_id(*)')
    .eq('id', params.clientId)
    .single();

  if (clientError || !client) {
    throw new Error('Client not found');
  }

  // Get subscription plan
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', params.planId)
    .single();

  if (planError || !plan) {
    throw new Error('Subscription plan not found');
  }

  // Create or get Stripe customer
  let stripeCustomerId = client.stripe_customer_id;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: client.company_name,
      email: client.contact_email,
      metadata: {
        client_id: client.id,
        vendor_id: client.owner_id,
      },
    });

    stripeCustomerId = customer.id;

    // Update client with Stripe customer ID
    await supabase
      .from('clients')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', client.id);
  }

  // Create Stripe subscription
  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: stripeCustomerId,
    items: [{ price: plan.stripe_price_id }],
    metadata: {
      client_id: client.id,
      vendor_id: client.owner_id,
      plan_id: plan.id,
    },
  };

  if (params.trialDays) {
    subscriptionParams.trial_period_days = params.trialDays;
  }

  const stripeSubscription = await stripe.subscriptions.create(subscriptionParams);

  // Save to database
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      client_id: client.id,
      subscription_plan_id: plan.id,
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: stripeCustomerId,
      status: stripeSubscription.status,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      trial_start: stripeSubscription.trial_start
        ? new Date(stripeSubscription.trial_start * 1000).toISOString()
        : null,
      trial_end: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000).toISOString()
        : null,
    })
    .select()
    .single();

  if (subError) {
    // Rollback Stripe subscription if database fails
    await stripe.subscriptions.cancel(stripeSubscription.id);
    throw new Error(`Failed to save subscription: ${subError.message}`);
  }

  return subscription;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelImmediately: boolean = false
) {
  const supabase = await createClient();

  // Get subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single();

  if (subError || !subscription) {
    throw new Error('Subscription not found');
  }

  // Cancel in Stripe
  const canceledSubscription = cancelImmediately
    ? await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
    : await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

  // Update database
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: canceledSubscription.status,
      cancel_at_period_end: canceledSubscription.cancel_at_period_end,
      canceled_at: canceledSubscription.canceled_at
        ? new Date(canceledSubscription.canceled_at * 1000).toISOString()
        : null,
    })
    .eq('id', subscriptionId);

  if (updateError) {
    throw new Error(`Failed to update subscription: ${updateError.message}`);
  }

  return canceledSubscription;
}

/**
 * Reactivate a canceled subscription (if still in current period)
 */
export async function reactivateSubscription(subscriptionId: string) {
  const supabase = await createClient();

  // Get subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single();

  if (subError || !subscription) {
    throw new Error('Subscription not found');
  }

  // Reactivate in Stripe
  const reactivatedSubscription = await stripe.subscriptions.update(
    subscription.stripe_subscription_id,
    {
      cancel_at_period_end: false,
    }
  );

  // Update database
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: reactivatedSubscription.status,
      cancel_at_period_end: false,
      canceled_at: null,
    })
    .eq('id', subscriptionId);

  if (updateError) {
    throw new Error(`Failed to update subscription: ${updateError.message}`);
  }

  return reactivatedSubscription;
}

/**
 * Update subscription (change plan)
 */
export async function updateSubscriptionPlan(subscriptionId: string, newPlanId: string) {
  const supabase = await createClient();

  // Get current subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single();

  if (subError || !subscription) {
    throw new Error('Subscription not found');
  }

  // Get new plan
  const { data: newPlan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', newPlanId)
    .single();

  if (planError || !newPlan) {
    throw new Error('New subscription plan not found');
  }

  // Get current Stripe subscription
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripe_subscription_id
  );

  // Update subscription items in Stripe
  const updatedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    items: [
      {
        id: stripeSubscription.items.data[0].id,
        price: newPlan.stripe_price_id,
      },
    ],
    proration_behavior: 'create_prorations',
  });

  // Update database
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      subscription_plan_id: newPlan.id,
      status: updatedSubscription.status,
    })
    .eq('id', subscriptionId);

  if (updateError) {
    throw new Error(`Failed to update subscription: ${updateError.message}`);
  }

  return updatedSubscription;
}
