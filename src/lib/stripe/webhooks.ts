// Stripe webhook event handlers

import { stripe } from './client';
import { supabase } from '@/lib/supabase';
import type Stripe from 'stripe';

/**
 * Handle checkout.session.completed event
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  try {
    const metadata = session.metadata;

    if (!metadata?.offer_id || !metadata?.vendor_id) {
      console.error('Missing required metadata in checkout session');
      return;
    }

    // Extract customer information
    const customerEmail = session.customer_email || session.customer_details?.email;
    const customerName = session.customer_details?.name;

    // Create or get client
    let clientId: string;

    const { data: existingClient } = await supabase
      .from('vendor_clients')
      .select('id')
      .eq('email', customerEmail)
      .eq('vendor_id', metadata.vendor_id)
      .single();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      // Create new client
      const { data: newClient, error } = await supabase
        .from('vendor_clients')
        .insert({
          vendor_id: metadata.vendor_id,
          email: customerEmail,
          full_name: customerName,
          status: 'active',
        })
        .select('id')
        .single();

      if (error || !newClient) {
        console.error('Error creating client:', error);
        return;
      }

      clientId = newClient.id;
    }

    // Create workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('vendor_workspaces')
      .insert({
        vendor_id: metadata.vendor_id,
        client_id: clientId,
        name: `${customerName || customerEmail}'s Workspace`,
        status: 'active',
      })
      .select('id')
      .single();

    if (workspaceError || !workspace) {
      console.error('Error creating workspace:', workspaceError);
      return;
    }

    // Create order
    const amount = session.amount_total ? session.amount_total / 100 : 0;
    const currency = session.currency?.toUpperCase() || 'USD';

    const { data: order, error: orderError } = await supabase
      .from('vendor_orders')
      .insert({
        vendor_id: metadata.vendor_id,
        client_id: clientId,
        workspace_id: workspace.id,
        offer_id: metadata.offer_id,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        amount,
        currency,
        status: 'completed',
        payment_method: 'stripe',
      })
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return;
    }

    // Create order items for addons
    if (metadata.addon_ids) {
      const addonIds = metadata.addon_ids.split(',').filter(Boolean);

      for (const addonId of addonIds) {
        // Get addon details
        const { data: addon } = await supabase
          .from('offer_addons')
          .select('*')
          .eq('id', addonId)
          .single();

        if (addon) {
          await supabase
            .from('vendor_order_items')
            .insert({
              order_id: order.id,
              addon_id: addon.id,
              name: addon.name,
              price: addon.price,
              currency: addon.currency,
            });
        }
      }
    }

    // Create subscription record if applicable
    if (session.subscription) {
      await supabase
        .from('vendor_subscriptions')
        .insert({
          vendor_id: metadata.vendor_id,
          client_id: clientId,
          order_id: order.id,
          stripe_subscription_id: session.subscription as string,
          status: 'active',
        });
    }

    console.log('Checkout completed successfully', {
      orderId: order.id,
      workspaceId: workspace.id,
    });

    // TODO: Send "Your portal is ready" email
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

/**
 * Handle subscription updated event
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  try {
    const { data, error } = await supabase
      .from('vendor_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription:', error);
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

/**
 * Handle subscription deleted event
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  try {
    const { data, error } = await supabase
      .from('vendor_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error canceling subscription:', error);
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

/**
 * Handle payment failed event
 */
export async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    // Update order status to failed
    const { data, error } = await supabase
      .from('vendor_orders')
      .update({
        status: 'failed',
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating failed payment:', error);
    }

    // TODO: Send payment failed email to customer
  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}
