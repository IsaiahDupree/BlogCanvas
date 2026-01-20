// Offer Page database operations

import { supabase } from '@/lib/supabase';
import type { OfferPage, OfferPageCreateInput, OfferPageUpdateInput } from '@/types/offer-page';

/**
 * Get all offer pages for a vendor
 */
export async function getVendorOfferPages(vendorId: string): Promise<OfferPage[]> {
  const { data, error } = await supabase
    .from('offer_pages')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching offer pages:', error);
    return [];
  }

  return data || [];
}

/**
 * Get published offer pages for a vendor
 */
export async function getPublishedOfferPages(vendorId: string): Promise<OfferPage[]> {
  const { data, error } = await supabase
    .from('offer_pages')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching published offer pages:', error);
    return [];
  }

  return data || [];
}

/**
 * Get offer page by ID
 */
export async function getOfferPageById(pageId: string): Promise<OfferPage | null> {
  const { data, error } = await supabase
    .from('offer_pages')
    .select('*')
    .eq('id', pageId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching offer page:', error);
    return null;
  }

  return data;
}

/**
 * Get offer page by vendor handle and slug (for public viewing)
 */
export async function getOfferPageBySlug(
  vendorHandle: string,
  slug: string
): Promise<OfferPage | null> {
  // First get vendor by handle
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id')
    .eq('handle', vendorHandle.toLowerCase())
    .single();

  if (vendorError || !vendor) {
    console.error('Vendor not found:', vendorError);
    return null;
  }

  // Then get the offer page
  const { data, error } = await supabase
    .from('offer_pages')
    .select('*')
    .eq('vendor_id', vendor.id)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching offer page by slug:', error);
    return null;
  }

  return data;
}

/**
 * Check if slug is available for a vendor
 */
export async function isSlugAvailable(vendorId: string, slug: string, excludePageId?: string): Promise<boolean> {
  let query = supabase
    .from('offer_pages')
    .select('id')
    .eq('vendor_id', vendorId)
    .eq('slug', slug.toLowerCase());

  if (excludePageId) {
    query = query.neq('id', excludePageId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error checking slug availability:', error);
    return false;
  }

  return !data;
}

/**
 * Create a new offer page
 */
export async function createOfferPage(input: OfferPageCreateInput): Promise<OfferPage | null> {
  // Validate slug format
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(input.slug)) {
    throw new Error('Slug can only contain lowercase letters, numbers, and hyphens');
  }

  // Check if slug is available
  const available = await isSlugAvailable(input.vendor_id, input.slug);
  if (!available) {
    throw new Error('Slug is already taken');
  }

  const { data, error } = await supabase
    .from('offer_pages')
    .insert({
      vendor_id: input.vendor_id,
      title: input.title,
      slug: input.slug.toLowerCase(),
      description: input.description,
      blocks: input.blocks || [],
      meta_title: input.meta_title || input.title,
      meta_description: input.meta_description || input.description,
      og_image_url: input.og_image_url,
      is_published: false,
      view_count: 0
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating offer page:', error);
    throw error;
  }

  return data;
}

/**
 * Update offer page
 */
export async function updateOfferPage(
  pageId: string,
  input: OfferPageUpdateInput
): Promise<OfferPage | null> {
  const updateData: any = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.blocks !== undefined) updateData.blocks = input.blocks;
  if (input.meta_title !== undefined) updateData.meta_title = input.meta_title;
  if (input.meta_description !== undefined) updateData.meta_description = input.meta_description;
  if (input.og_image_url !== undefined) updateData.og_image_url = input.og_image_url;
  if (input.is_published !== undefined) updateData.is_published = input.is_published;

  // Handle slug update with validation
  if (input.slug !== undefined) {
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(input.slug)) {
      throw new Error('Slug can only contain lowercase letters, numbers, and hyphens');
    }

    // Get vendor_id for this page
    const page = await getOfferPageById(pageId);
    if (!page) {
      throw new Error('Page not found');
    }

    // Check if slug is available
    const available = await isSlugAvailable(page.vendor_id, input.slug, pageId);
    if (!available) {
      throw new Error('Slug is already taken');
    }

    updateData.slug = input.slug.toLowerCase();
  }

  // Set published_at when publishing
  if (input.is_published === true) {
    updateData.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('offer_pages')
    .update(updateData)
    .eq('id', pageId)
    .select()
    .single();

  if (error) {
    console.error('Error updating offer page:', error);
    throw error;
  }

  return data;
}

/**
 * Delete offer page
 */
export async function deleteOfferPage(pageId: string): Promise<boolean> {
  const { error } = await supabase
    .from('offer_pages')
    .delete()
    .eq('id', pageId);

  if (error) {
    console.error('Error deleting offer page:', error);
    return false;
  }

  return true;
}

/**
 * Publish offer page
 */
export async function publishOfferPage(pageId: string): Promise<OfferPage | null> {
  return updateOfferPage(pageId, { is_published: true });
}

/**
 * Unpublish offer page
 */
export async function unpublishOfferPage(pageId: string): Promise<OfferPage | null> {
  return updateOfferPage(pageId, { is_published: false });
}

/**
 * Increment page view count
 */
export async function incrementPageViews(pageId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_page_views', { page_id: pageId });

  if (error) {
    console.error('Error incrementing page views:', error);
  }
}
