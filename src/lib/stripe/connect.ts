// Stripe Connect integration for vendor payouts

import { stripe, STRIPE_CONNECT_CONFIG } from './client';
import { supabase } from '@/lib/supabase';

/**
 * Create Stripe Connect account for a vendor
 */
export async function createConnectAccount(
  vendorId: string,
  email: string,
  businessName: string
): Promise<string> {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_type: 'individual',
      company: {
        name: businessName,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'manual',
          },
        },
      },
      metadata: {
        vendor_id: vendorId,
      },
    });

    // Save Stripe account ID to vendor record
    await supabase
      .from('vendors')
      .update({ stripe_account_id: account.id })
      .eq('id', vendorId);

    return account.id;
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    throw error;
  }
}

/**
 * Create Stripe Connect account link for onboarding
 */
export async function createAccountLink(
  stripeAccountId: string,
  refreshUrl?: string,
  returnUrl?: string
): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848';

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl || `${baseUrl}/vendor/settings/payments?refresh=true`,
      return_url: returnUrl || `${baseUrl}/vendor/settings/payments?success=true`,
      type: 'account_onboarding',
    });

    return accountLink.url;
  } catch (error) {
    console.error('Error creating account link:', error);
    throw error;
  }
}

/**
 * Get Stripe Connect account status
 */
export async function getConnectAccountStatus(stripeAccountId: string) {
  try {
    const account = await stripe.accounts.retrieve(stripeAccountId);

    return {
      id: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requiresAction: !account.details_submitted || !account.charges_enabled,
      email: account.email,
      country: account.country,
    };
  } catch (error) {
    console.error('Error retrieving account status:', error);
    throw error;
  }
}

/**
 * Create Stripe Connect login link for dashboard access
 */
export async function createLoginLink(stripeAccountId: string): Promise<string> {
  try {
    const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
    return loginLink.url;
  } catch (error) {
    console.error('Error creating login link:', error);
    throw error;
  }
}

/**
 * Delete Stripe Connect account
 */
export async function deleteConnectAccount(stripeAccountId: string): Promise<boolean> {
  try {
    await stripe.accounts.del(stripeAccountId);
    return true;
  } catch (error) {
    console.error('Error deleting account:', error);
    return false;
  }
}

/**
 * Check if vendor has completed Stripe onboarding
 */
export async function isOnboardingComplete(vendorId: string): Promise<boolean> {
  try {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('stripe_account_id')
      .eq('id', vendorId)
      .single();

    if (!vendor?.stripe_account_id) {
      return false;
    }

    const status = await getConnectAccountStatus(vendor.stripe_account_id);
    return status.chargesEnabled && status.detailsSubmitted;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}
