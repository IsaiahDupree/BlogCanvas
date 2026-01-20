// WL-001: Custom Domain Database Functions

import { createClient } from '@/lib/supabase';
import type {
  CustomDomain,
  CreateCustomDomainInput,
  UpdateCustomDomainInput,
  DomainVerificationLog,
} from '@/types/custom-domain';
import { randomBytes } from 'crypto';

/**
 * Generate a random verification token
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Get all custom domains for a vendor
 */
export async function getVendorDomains(vendorId: string): Promise<CustomDomain[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('custom_domains')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vendor domains:', error);
    throw error;
  }

  return data as CustomDomain[];
}

/**
 * Get a specific custom domain by ID
 */
export async function getCustomDomain(domainId: string): Promise<CustomDomain | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('custom_domains')
    .select('*')
    .eq('id', domainId)
    .single();

  if (error) {
    console.error('Error fetching custom domain:', error);
    return null;
  }

  return data as CustomDomain;
}

/**
 * Get a custom domain by domain name
 */
export async function getCustomDomainByName(domain: string): Promise<CustomDomain | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('custom_domains')
    .select('*')
    .eq('domain', domain.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching custom domain by name:', error);
    return null;
  }

  return data as CustomDomain;
}

/**
 * Get primary domain for a vendor
 */
export async function getPrimaryDomain(vendorId: string): Promise<CustomDomain | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('custom_domains')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('is_primary', true)
    .eq('is_active', true)
    .eq('verification_status', 'verified')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching primary domain:', error);
    return null;
  }

  return data as CustomDomain;
}

/**
 * Create a new custom domain
 */
export async function createCustomDomain(
  vendorId: string,
  input: CreateCustomDomainInput
): Promise<CustomDomain> {
  const supabase = createClient();

  // Generate verification token
  const verificationToken = generateVerificationToken();

  // Normalize domain
  const normalizedDomain = input.domain.toLowerCase().trim();

  // Generate DNS record values
  const txtName = `_blogcanvas-verification.${normalizedDomain}`;
  const txtValue = verificationToken;
  const cnameName = input.subdomain || 'www';
  const cnameValue = 'cname.blogcanvas.com'; // TODO: Update with actual CNAME target

  const { data, error } = await supabase
    .from('custom_domains')
    .insert({
      vendor_id: vendorId,
      domain: normalizedDomain,
      subdomain: input.subdomain,
      verification_token: verificationToken,
      verification_method: input.verification_method || 'txt',
      verification_status: 'pending',
      txt_name: txtName,
      txt_value: txtValue,
      cname_name: cnameName,
      cname_value: cnameValue,
      ssl_status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating custom domain:', error);
    throw error;
  }

  // Log the creation
  await logDomainVerification(data.id, 'domain_created', 'pending', {
    domain: normalizedDomain,
    method: input.verification_method || 'txt',
  });

  return data as CustomDomain;
}

/**
 * Update custom domain
 */
export async function updateCustomDomain(
  domainId: string,
  vendorId: string,
  input: UpdateCustomDomainInput
): Promise<CustomDomain> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('custom_domains')
    .update(input)
    .eq('id', domainId)
    .eq('vendor_id', vendorId)
    .select()
    .single();

  if (error) {
    console.error('Error updating custom domain:', error);
    throw error;
  }

  return data as CustomDomain;
}

/**
 * Delete custom domain
 */
export async function deleteCustomDomain(
  domainId: string,
  vendorId: string
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('custom_domains')
    .delete()
    .eq('id', domainId)
    .eq('vendor_id', vendorId);

  if (error) {
    console.error('Error deleting custom domain:', error);
    return false;
  }

  return true;
}

/**
 * Update verification status
 */
export async function updateVerificationStatus(
  domainId: string,
  status: 'pending' | 'verifying' | 'verified' | 'failed',
  verifiedAt?: Date
): Promise<void> {
  const supabase = createClient();

  const updates: any = {
    verification_status: status,
  };

  if (verifiedAt) {
    updates.verified_at = verifiedAt.toISOString();
  }

  const { error } = await supabase
    .from('custom_domains')
    .update(updates)
    .eq('id', domainId);

  if (error) {
    console.error('Error updating verification status:', error);
    throw error;
  }
}

/**
 * Update SSL status
 */
export async function updateSSLStatus(
  domainId: string,
  status: 'pending' | 'provisioning' | 'active' | 'failed' | 'expired',
  sslIssuedAt?: Date,
  sslExpiresAt?: Date
): Promise<void> {
  const supabase = createClient();

  const updates: any = {
    ssl_status: status,
  };

  if (sslIssuedAt) {
    updates.ssl_issued_at = sslIssuedAt.toISOString();
  }

  if (sslExpiresAt) {
    updates.ssl_expires_at = sslExpiresAt.toISOString();
  }

  const { error } = await supabase
    .from('custom_domains')
    .update(updates)
    .eq('id', domainId);

  if (error) {
    console.error('Error updating SSL status:', error);
    throw error;
  }
}

/**
 * Log domain verification action
 */
export async function logDomainVerification(
  customDomainId: string,
  action: string,
  status: string,
  details?: Record<string, any>,
  errorMessage?: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('domain_verification_logs')
    .insert({
      custom_domain_id: customDomainId,
      action,
      status,
      details,
      error_message: errorMessage,
    });

  if (error) {
    console.error('Error logging domain verification:', error);
  }
}

/**
 * Get verification logs for a domain
 */
export async function getDomainVerificationLogs(
  domainId: string
): Promise<DomainVerificationLog[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('domain_verification_logs')
    .select('*')
    .eq('custom_domain_id', domainId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching verification logs:', error);
    return [];
  }

  return data as DomainVerificationLog[];
}

/**
 * Check if domain is available (not already registered)
 */
export async function isDomainAvailable(domain: string): Promise<boolean> {
  const normalizedDomain = domain.toLowerCase().trim();
  const existingDomain = await getCustomDomainByName(normalizedDomain);
  return existingDomain === null;
}

/**
 * Get active verified domains (for routing)
 */
export async function getActiveVerifiedDomains(): Promise<CustomDomain[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('custom_domains')
    .select('*')
    .eq('is_active', true)
    .eq('verification_status', 'verified')
    .eq('ssl_status', 'active');

  if (error) {
    console.error('Error fetching active domains:', error);
    return [];
  }

  return data as CustomDomain[];
}
