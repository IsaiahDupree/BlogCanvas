// Stripe client initialization

import Stripe from 'stripe';

let stripeClient: Stripe | undefined;

/**
 * Resolves Stripe only when a payment operation actually runs. This keeps
 * unrelated routes buildable in environments that do not enable payments,
 * while still failing closed for every payment request without a real key.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }

  stripeClient ??= new Stripe(key, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  });

  return stripeClient;
}

// Backwards-compatible lazy client for existing Stripe modules. The proxy does
// not manufacture a credential or a client; it resolves the real client only
// when an operation accesses it.
export const stripe = new Proxy({} as Stripe, {
  get(_target, property, receiver) {
    const value = Reflect.get(getStripe(), property, receiver);
    return typeof value === 'function' ? value.bind(getStripe()) : value;
  },
});

// Stripe Connect configuration
export const STRIPE_CONNECT_CONFIG = {
  // Platform fee percentage (you can adjust this)
  platformFeePercentage: 10,

  // Stripe Connect OAuth scopes
  scopes: ['read_write'] as const,

  // OAuth redirect URIs
  redirectUri: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/callback`
    : 'http://localhost:4848/api/stripe/connect/callback',
};

export function getStripePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  }
  return key;
}
