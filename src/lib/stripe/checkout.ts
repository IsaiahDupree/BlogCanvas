// Stripe checkout session creation

import { stripe, STRIPE_CONNECT_CONFIG } from './client';
import { getOfferWithAddons } from '@/lib/db/vendor/offers';
import type { Offer, OfferAddon } from '@/types/offer';

export interface CheckoutSessionInput {
  offerId: string;
  vendorId: string;
  vendorStripeAccountId: string;
  addonIds?: string[];
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

/**
 * Calculate total price including addons
 */
function calculateTotal(offer: Offer, addons: OfferAddon[]): number {
  let total = offer.base_price;

  for (const addon of addons) {
    if (addon.is_active) {
      total += addon.price;
    }
  }

  return Math.round(total * 100); // Convert to cents
}

/**
 * Create a Stripe checkout session for an offer
 */
export async function createCheckoutSession(
  input: CheckoutSessionInput
): Promise<{ sessionId: string; url: string }> {
  try {
    // Get offer with addons
    const offerData = await getOfferWithAddons(input.offerId);

    if (!offerData) {
      throw new Error('Offer not found');
    }

    const offer = offerData as Offer & { addons: OfferAddon[] };

    // Filter selected addons
    const selectedAddons = offer.addons?.filter(
      addon => input.addonIds?.includes(addon.id) && addon.is_active
    ) || [];

    // Build line items
    const lineItems: any[] = [];

    // Main offer line item
    if (offer.offer_type === 'one_time' || offer.offer_type === 'book_call') {
      lineItems.push({
        price_data: {
          currency: offer.currency.toLowerCase(),
          product_data: {
            name: offer.name,
            description: offer.description,
          },
          unit_amount: Math.round(offer.base_price * 100),
        },
        quantity: 1,
      });
    } else if (offer.offer_type === 'subscription' || offer.offer_type === 'retainer') {
      // For subscriptions, use Stripe Price ID if available
      if (offer.stripe_price_id) {
        lineItems.push({
          price: offer.stripe_price_id,
          quantity: 1,
        });
      } else {
        // Create price on-the-fly
        lineItems.push({
          price_data: {
            currency: offer.currency.toLowerCase(),
            product_data: {
              name: offer.name,
              description: offer.description,
            },
            unit_amount: Math.round(offer.base_price * 100),
            recurring: {
              interval: offer.billing_period || 'monthly',
            },
          },
          quantity: 1,
        });
      }
    }

    // Add addon line items
    for (const addon of selectedAddons) {
      lineItems.push({
        price_data: {
          currency: addon.currency.toLowerCase(),
          product_data: {
            name: `Add-on: ${addon.name}`,
            description: addon.description,
          },
          unit_amount: Math.round(addon.price * 100),
        },
        quantity: 1,
      });
    }

    // Calculate platform fee (10% of total)
    const total = calculateTotal(offer, selectedAddons);
    const platformFee = Math.round(total * (STRIPE_CONNECT_CONFIG.platformFeePercentage / 100));

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848';

    const sessionParams: any = {
      mode: offer.offer_type === 'subscription' || offer.offer_type === 'retainer'
        ? 'subscription'
        : 'payment',
      line_items: lineItems,
      success_url: input.successUrl || `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: input.cancelUrl || `${baseUrl}/checkout/cancel`,
      metadata: {
        offer_id: input.offerId,
        vendor_id: input.vendorId,
        addon_ids: input.addonIds?.join(',') || '',
        ...input.metadata,
      },
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: input.vendorStripeAccountId,
        },
      },
    };

    // Add customer email if provided
    if (input.customerEmail) {
      sessionParams.customer_email = input.customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      sessionId: session.id,
      url: session.url!,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Get checkout session details
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'payment_intent', 'subscription'],
    });

    return session;
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw error;
  }
}

/**
 * Create a Stripe Product for an offer (for better tracking)
 */
export async function createStripeProduct(
  offer: Offer,
  vendorStripeAccountId: string
): Promise<{ productId: string; priceId: string }> {
  try {
    // Create product
    const product = await stripe.products.create(
      {
        name: offer.name,
        description: offer.description,
        metadata: {
          offer_id: offer.id,
          vendor_id: offer.vendor_id,
        },
      },
      {
        stripeAccount: vendorStripeAccountId,
      }
    );

    // Create price
    const priceParams: any = {
      product: product.id,
      currency: offer.currency.toLowerCase(),
      unit_amount: Math.round(offer.base_price * 100),
    };

    if (offer.offer_type === 'subscription' || offer.offer_type === 'retainer') {
      priceParams.recurring = {
        interval: offer.billing_period || 'monthly',
      };
    }

    const price = await stripe.prices.create(priceParams, {
      stripeAccount: vendorStripeAccountId,
    });

    return {
      productId: product.id,
      priceId: price.id,
    };
  } catch (error) {
    console.error('Error creating Stripe product:', error);
    throw error;
  }
}
