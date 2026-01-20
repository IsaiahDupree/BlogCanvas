/**
 * Referral Link Generation
 * REF-002: Generate referral links
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ReferralCode,
  CreateReferralCode,
  GenerateReferralLinkResponse,
} from '@/types/referral';

/**
 * Generate a unique referral code
 */
export async function generateReferralCode(baseText?: string): Promise<string> {
  const supabase = await createClient();

  // Call the database function to generate unique code
  const { data, error } = await supabase.rpc('generate_referral_code', {
    base_text: baseText || null,
  });

  if (error) {
    console.error('Error generating referral code:', error);
    throw new Error('Failed to generate referral code');
  }

  return data as string;
}

/**
 * Create or get referral code for a vendor
 */
export async function getOrCreateVendorReferralCode(
  vendorId: string,
  customSlug?: string
): Promise<GenerateReferralLinkResponse> {
  const supabase = await createClient();

  // Check if vendor already has a code
  const { data: existingCode, error: fetchError } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('is_active', true)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    throw fetchError;
  }

  if (existingCode) {
    // Update custom slug if provided and different
    if (customSlug && customSlug !== existingCode.custom_slug) {
      const { data: updated, error: updateError } = await supabase
        .from('referral_codes')
        .update({ custom_slug: customSlug })
        .eq('id', existingCode.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        code: updated as ReferralCode,
        full_url: buildReferralUrl(updated.code, updated.custom_slug),
      };
    }

    return {
      code: existingCode as ReferralCode,
      full_url: buildReferralUrl(existingCode.code, existingCode.custom_slug),
    };
  }

  // Get vendor referral program
  const { data: program, error: programError } = await supabase
    .from('referral_programs')
    .select('id')
    .eq('program_type', 'vendor')
    .eq('is_active', true)
    .single();

  if (programError || !program) {
    throw new Error('Vendor referral program not found');
  }

  // Get vendor handle for base code
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('handle, business_name')
    .eq('id', vendorId)
    .single();

  if (vendorError) throw vendorError;

  // Generate code based on vendor handle
  const code = await generateReferralCode(vendor?.handle || vendor?.business_name);

  // Create new referral code
  const { data: newCode, error: createError } = await supabase
    .from('referral_codes')
    .insert({
      program_id: program.id,
      vendor_id: vendorId,
      code,
      custom_slug: customSlug || null,
      is_active: true,
    })
    .select()
    .single();

  if (createError) throw createError;

  return {
    code: newCode as ReferralCode,
    full_url: buildReferralUrl(newCode.code, newCode.custom_slug),
  };
}

/**
 * Create or get referral code for an affiliate
 */
export async function getOrCreateAffiliateReferralCode(
  affiliateId: string,
  customSlug?: string
): Promise<GenerateReferralLinkResponse> {
  const supabase = await createClient();

  // Check if affiliate already has a code
  const { data: existingCode, error: fetchError } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .eq('is_active', true)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  if (existingCode) {
    // Update custom slug if provided
    if (customSlug && customSlug !== existingCode.custom_slug) {
      const { data: updated, error: updateError } = await supabase
        .from('referral_codes')
        .update({ custom_slug: customSlug })
        .eq('id', existingCode.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        code: updated as ReferralCode,
        full_url: buildReferralUrl(updated.code, updated.custom_slug),
      };
    }

    return {
      code: existingCode as ReferralCode,
      full_url: buildReferralUrl(existingCode.code, existingCode.custom_slug),
    };
  }

  // Get affiliate program
  const { data: program, error: programError } = await supabase
    .from('referral_programs')
    .select('id')
    .eq('program_type', 'affiliate')
    .eq('is_active', true)
    .single();

  if (programError || !program) {
    throw new Error('Affiliate program not found');
  }

  // Get affiliate info for base code
  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('company_name, contact_name')
    .eq('id', affiliateId)
    .single();

  if (affiliateError) throw affiliateError;

  // Generate code based on affiliate name
  const code = await generateReferralCode(
    affiliate?.company_name || affiliate?.contact_name
  );

  // Create new referral code
  const { data: newCode, error: createError } = await supabase
    .from('referral_codes')
    .insert({
      program_id: program.id,
      affiliate_id: affiliateId,
      code,
      custom_slug: customSlug || null,
      is_active: true,
    })
    .select()
    .single();

  if (createError) throw createError;

  return {
    code: newCode as ReferralCode,
    full_url: buildReferralUrl(newCode.code, newCode.custom_slug),
  };
}

/**
 * Create or get referral code for a client
 */
export async function getOrCreateClientReferralCode(
  clientId: string
): Promise<GenerateReferralLinkResponse> {
  const supabase = await createClient();

  // Check if client already has a code
  const { data: existingCode, error: fetchError } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  if (existingCode) {
    return {
      code: existingCode as ReferralCode,
      full_url: buildReferralUrl(existingCode.code, existingCode.custom_slug),
    };
  }

  // Get client referral program
  const { data: program, error: programError } = await supabase
    .from('referral_programs')
    .select('id')
    .eq('program_type', 'client')
    .eq('is_active', true)
    .single();

  if (programError || !program) {
    throw new Error('Client referral program not found');
  }

  // Generate code
  const code = await generateReferralCode();

  // Create new referral code
  const { data: newCode, error: createError } = await supabase
    .from('referral_codes')
    .insert({
      program_id: program.id,
      client_id: clientId,
      code,
      is_active: true,
    })
    .select()
    .single();

  if (createError) throw createError;

  return {
    code: newCode as ReferralCode,
    full_url: buildReferralUrl(newCode.code, newCode.custom_slug),
  };
}

/**
 * Build full referral URL
 */
function buildReferralUrl(code: string, customSlug?: string | null): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.com';
  const slug = customSlug || code;
  return `${baseUrl}/r/${slug}`;
}

/**
 * Get referral code by code string
 */
export async function getReferralCodeByCode(
  code: string
): Promise<ReferralCode | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as ReferralCode;
}

/**
 * Get referral code by custom slug
 */
export async function getReferralCodeBySlug(
  slug: string
): Promise<ReferralCode | null> {
  const supabase = await createClient();

  // Try by custom slug first
  const { data: bySlug, error: slugError } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('custom_slug', slug)
    .eq('is_active', true)
    .single();

  if (!slugError && bySlug) {
    return bySlug as ReferralCode;
  }

  // Fall back to code
  return getReferralCodeByCode(slug);
}

/**
 * Deactivate referral code
 */
export async function deactivateReferralCode(codeId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('referral_codes')
    .update({ is_active: false })
    .eq('id', codeId);

  if (error) throw error;
}

/**
 * Validate custom slug
 */
export function validateCustomSlug(slug: string): {
  valid: boolean;
  error?: string;
} {
  // Must be 3-30 characters, alphanumeric and hyphens only
  if (slug.length < 3 || slug.length > 30) {
    return {
      valid: false,
      error: 'Slug must be between 3 and 30 characters',
    };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      valid: false,
      error: 'Slug can only contain lowercase letters, numbers, and hyphens',
    };
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    return {
      valid: false,
      error: 'Slug cannot start or end with a hyphen',
    };
  }

  if (slug.includes('--')) {
    return {
      valid: false,
      error: 'Slug cannot contain consecutive hyphens',
    };
  }

  // Reserved slugs
  const reserved = ['admin', 'api', 'app', 'dashboard', 'vendor', 'client', 'portal'];
  if (reserved.includes(slug)) {
    return {
      valid: false,
      error: 'This slug is reserved',
    };
  }

  return { valid: true };
}
