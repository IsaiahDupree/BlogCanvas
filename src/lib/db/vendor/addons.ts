// Offer Add-on database operations

import { supabase } from '@/lib/supabase';
import type { OfferAddon, OfferAddonCreateInput, OfferAddonUpdateInput } from '@/types/offer';

/**
 * Get all add-ons for an offer
 */
export async function getOfferAddons(offerId: string): Promise<OfferAddon[]> {
  const { data, error } = await supabase
    .from('offer_addons')
    .select('*')
    .eq('offer_id', offerId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching offer add-ons:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all active add-ons for an offer
 */
export async function getActiveOfferAddons(offerId: string): Promise<OfferAddon[]> {
  const { data, error } = await supabase
    .from('offer_addons')
    .select('*')
    .eq('offer_id', offerId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching active offer add-ons:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all add-ons for a vendor
 */
export async function getVendorAddons(vendorId: string): Promise<OfferAddon[]> {
  const { data, error } = await supabase
    .from('offer_addons')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vendor add-ons:', error);
    return [];
  }

  return data || [];
}

/**
 * Get add-on by ID
 */
export async function getAddonById(addonId: string): Promise<OfferAddon | null> {
  const { data, error } = await supabase
    .from('offer_addons')
    .select('*')
    .eq('id', addonId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching add-on:', error);
    return null;
  }

  return data;
}

/**
 * Create a new add-on
 */
export async function createAddon(input: OfferAddonCreateInput): Promise<OfferAddon | null> {
  const { data, error } = await supabase
    .from('offer_addons')
    .insert({
      offer_id: input.offer_id,
      vendor_id: input.vendor_id,
      name: input.name,
      description: input.description,
      addon_type: input.addon_type,
      price: input.price,
      currency: input.currency || 'USD',
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating add-on:', error);
    throw error;
  }

  return data;
}

/**
 * Update add-on
 */
export async function updateAddon(
  addonId: string,
  input: OfferAddonUpdateInput
): Promise<OfferAddon | null> {
  const updateData: any = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.addon_type !== undefined) updateData.addon_type = input.addon_type;
  if (input.price !== undefined) updateData.price = input.price;
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from('offer_addons')
    .update(updateData)
    .eq('id', addonId)
    .select()
    .single();

  if (error) {
    console.error('Error updating add-on:', error);
    throw error;
  }

  return data;
}

/**
 * Delete add-on
 */
export async function deleteAddon(addonId: string): Promise<boolean> {
  const { error } = await supabase
    .from('offer_addons')
    .delete()
    .eq('id', addonId);

  if (error) {
    console.error('Error deleting add-on:', error);
    return false;
  }

  return true;
}

/**
 * Activate add-on
 */
export async function activateAddon(addonId: string): Promise<OfferAddon | null> {
  return updateAddon(addonId, { is_active: true });
}

/**
 * Deactivate add-on
 */
export async function deactivateAddon(addonId: string): Promise<OfferAddon | null> {
  return updateAddon(addonId, { is_active: false });
}

/**
 * Link Stripe product to add-on
 */
export async function linkStripeProductToAddon(
  addonId: string,
  stripeProductId: string,
  stripePriceId: string
): Promise<OfferAddon | null> {
  const { data, error } = await supabase
    .from('offer_addons')
    .update({
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId
    })
    .eq('id', addonId)
    .select()
    .single();

  if (error) {
    console.error('Error linking Stripe product to add-on:', error);
    throw error;
  }

  return data;
}

/**
 * Get add-ons by type for a vendor
 */
export async function getAddonsByType(vendorId: string, addonType: string): Promise<OfferAddon[]> {
  const { data, error } = await supabase
    .from('offer_addons')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('addon_type', addonType)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching add-ons by type:', error);
    return [];
  }

  return data || [];
}
