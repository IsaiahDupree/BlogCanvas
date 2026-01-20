// Offer database operations

import { supabase } from '@/lib/supabase';
import type { Offer, OfferCreateInput, OfferUpdateInput } from '@/types/offer';

/**
 * Get all offers for a vendor
 */
export async function getVendorOffers(vendorId: string): Promise<Offer[]> {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching offers:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all active offers for a vendor
 */
export async function getActiveOffers(vendorId: string): Promise<Offer[]> {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active offers:', error);
    return [];
  }

  return data || [];
}

/**
 * Get offers for a specific page
 */
export async function getPageOffers(pageId: string): Promise<Offer[]> {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('page_id', pageId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching page offers:', error);
    return [];
  }

  return data || [];
}

/**
 * Get offer by ID
 */
export async function getOfferById(offerId: string): Promise<Offer | null> {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('id', offerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching offer:', error);
    return null;
  }

  return data;
}

/**
 * Get offer with add-ons
 */
export async function getOfferWithAddons(offerId: string) {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      addons:offer_addons(*)
    `)
    .eq('id', offerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching offer with addons:', error);
    return null;
  }

  return data;
}

/**
 * Create a new offer
 */
export async function createOffer(input: OfferCreateInput): Promise<Offer | null> {
  const { data, error } = await supabase
    .from('offers')
    .insert({
      page_id: input.page_id,
      vendor_id: input.vendor_id,
      name: input.name,
      description: input.description,
      offer_type: input.offer_type,
      base_price: input.base_price,
      currency: input.currency || 'USD',
      billing_period: input.billing_period,
      is_quote_mode: input.is_quote_mode || false,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating offer:', error);
    throw error;
  }

  return data;
}

/**
 * Update offer
 */
export async function updateOffer(
  offerId: string,
  input: OfferUpdateInput
): Promise<Offer | null> {
  const updateData: any = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.offer_type !== undefined) updateData.offer_type = input.offer_type;
  if (input.base_price !== undefined) updateData.base_price = input.base_price;
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.billing_period !== undefined) updateData.billing_period = input.billing_period;
  if (input.is_quote_mode !== undefined) updateData.is_quote_mode = input.is_quote_mode;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from('offers')
    .update(updateData)
    .eq('id', offerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating offer:', error);
    throw error;
  }

  return data;
}

/**
 * Delete offer
 */
export async function deleteOffer(offerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('offers')
    .delete()
    .eq('id', offerId);

  if (error) {
    console.error('Error deleting offer:', error);
    return false;
  }

  return true;
}

/**
 * Activate offer
 */
export async function activateOffer(offerId: string): Promise<Offer | null> {
  return updateOffer(offerId, { is_active: true });
}

/**
 * Deactivate offer
 */
export async function deactivateOffer(offerId: string): Promise<Offer | null> {
  return updateOffer(offerId, { is_active: false });
}

/**
 * Link Stripe product to offer
 */
export async function linkStripeProduct(
  offerId: string,
  stripeProductId: string,
  stripePriceId: string
): Promise<Offer | null> {
  const { data, error } = await supabase
    .from('offers')
    .update({
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId
    })
    .eq('id', offerId)
    .select()
    .single();

  if (error) {
    console.error('Error linking Stripe product:', error);
    throw error;
  }

  return data;
}
