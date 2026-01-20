// Vendor database operations

import { supabase, supabaseAdmin } from '@/lib/supabase';
import type { Vendor, VendorCreateInput, VendorUpdateInput } from '@/types/vendor';

/**
 * Get vendor by ID
 */
export async function getVendorById(vendorId: string): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .single();

  if (error) {
    console.error('Error fetching vendor:', error);
    return null;
  }

  return data;
}

/**
 * Get vendor by handle
 */
export async function getVendorByHandle(handle: string): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('handle', handle.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching vendor by handle:', error);
    return null;
  }

  return data;
}

/**
 * Get vendor by user ID
 */
export async function getVendorByUserId(userId: string): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching vendor by user ID:', error);
    return null;
  }

  return data;
}

/**
 * Check if handle is available
 */
export async function isHandleAvailable(handle: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('vendors')
    .select('id')
    .eq('handle', handle.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('Error checking handle availability:', error);
    return false;
  }

  return !data;
}

/**
 * Create a new vendor
 */
export async function createVendor(
  userId: string,
  input: VendorCreateInput
): Promise<Vendor | null> {
  // Validate handle format (alphanumeric, hyphens, underscores only)
  const handleRegex = /^[a-z0-9_-]+$/;
  if (!handleRegex.test(input.handle)) {
    throw new Error('Handle can only contain lowercase letters, numbers, hyphens, and underscores');
  }

  // Check if handle is available
  const available = await isHandleAvailable(input.handle);
  if (!available) {
    throw new Error('Handle is already taken');
  }

  const { data, error } = await supabase
    .from('vendors')
    .insert({
      user_id: userId,
      handle: input.handle.toLowerCase(),
      business_name: input.business_name,
      email: input.email,
      full_name: input.full_name,
      phone: input.phone,
      bio: input.bio,
      brand_color: input.brand_color || '#000000',
      timezone: input.timezone || 'UTC',
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating vendor:', error);
    throw error;
  }

  // Create vendor member record (owner)
  await supabase
    .from('vendor_members')
    .insert({
      vendor_id: data.id,
      user_id: userId,
      role: 'owner'
    });

  return data;
}

/**
 * Update vendor
 */
export async function updateVendor(
  vendorId: string,
  input: VendorUpdateInput
): Promise<Vendor | null> {
  // If updating handle, validate and check availability
  if (input.handle) {
    const handleRegex = /^[a-z0-9_-]+$/;
    if (!handleRegex.test(input.handle)) {
      throw new Error('Handle can only contain lowercase letters, numbers, hyphens, and underscores');
    }

    // Check if handle is available (exclude current vendor)
    const { data: existing } = await supabase
      .from('vendors')
      .select('id')
      .eq('handle', input.handle.toLowerCase())
      .neq('id', vendorId)
      .maybeSingle();

    if (existing) {
      throw new Error('Handle is already taken');
    }

    input.handle = input.handle.toLowerCase();
  }

  const { data, error } = await supabase
    .from('vendors')
    .update(input)
    .eq('id', vendorId)
    .select()
    .single();

  if (error) {
    console.error('Error updating vendor:', error);
    throw error;
  }

  return data;
}

/**
 * Delete vendor (soft delete by updating status)
 */
export async function deleteVendor(vendorId: string): Promise<boolean> {
  const { error } = await supabase
    .from('vendors')
    .update({ status: 'deleted' })
    .eq('id', vendorId);

  if (error) {
    console.error('Error deleting vendor:', error);
    return false;
  }

  return true;
}

/**
 * Get all vendors (admin only)
 */
export async function getAllVendors(): Promise<Vendor[]> {
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .select('*')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all vendors:', error);
    return [];
  }

  return data || [];
}
