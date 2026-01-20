// Stripe client initialization

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
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
