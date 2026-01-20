// Vendor client database operations

import { supabase } from '@/lib/supabase';
import type { VendorClient, VendorClientCreateInput } from '@/types/client';

/**
 * Get all clients for a vendor
 */
export async function getVendorClients(vendorId: string): Promise<VendorClient[]> {
  const { data, error } = await supabase
    .from('vendor_clients')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }

  return data || [];
}

/**
 * Get client by ID
 */
export async function getClientById(clientId: string): Promise<VendorClient | null> {
  const { data, error } = await supabase
    .from('vendor_clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching client:', error);
    return null;
  }

  return data;
}

/**
 * Get client by email for a vendor
 */
export async function getClientByEmail(
  vendorId: string,
  email: string
): Promise<VendorClient | null> {
  const { data, error } = await supabase
    .from('vendor_clients')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching client by email:', error);
    return null;
  }

  return data;
}

/**
 * Create a new client
 */
export async function createClient(
  input: VendorClientCreateInput
): Promise<VendorClient | null> {
  const { data, error } = await supabase
    .from('vendor_clients')
    .insert({
      vendor_id: input.vendor_id,
      email: input.email,
      full_name: input.full_name,
      phone: input.phone,
      first_page_id: input.first_page_id,
      utm_source: input.utm_source,
      utm_medium: input.utm_medium,
      utm_campaign: input.utm_campaign,
      status: 'lead',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw error;
  }

  return data;
}

/**
 * Update client
 */
export async function updateClient(
  clientId: string,
  updates: Partial<VendorClient>
): Promise<VendorClient | null> {
  const { data, error } = await supabase
    .from('vendor_clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw error;
  }

  return data;
}

/**
 * Update client status
 */
export async function updateClientStatus(
  clientId: string,
  status: 'lead' | 'customer' | 'churned'
): Promise<VendorClient | null> {
  return updateClient(clientId, { status });
}

/**
 * Link user to client
 */
export async function linkUserToClient(
  clientId: string,
  userId: string
): Promise<VendorClient | null> {
  return updateClient(clientId, { user_id: userId });
}

/**
 * Get or create client
 */
export async function getOrCreateClient(
  vendorId: string,
  email: string,
  additionalData?: Partial<VendorClientCreateInput>
): Promise<VendorClient> {
  // Try to get existing client
  const existing = await getClientByEmail(vendorId, email);

  if (existing) {
    return existing;
  }

  // Create new client
  const client = await createClient({
    vendor_id: vendorId,
    email,
    ...additionalData,
  });

  if (!client) {
    throw new Error('Failed to create client');
  }

  return client;
}

/**
 * Get clients by status
 */
export async function getClientsByStatus(
  vendorId: string,
  status: 'lead' | 'customer' | 'churned'
): Promise<VendorClient[]> {
  const { data, error } = await supabase
    .from('vendor_clients')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients by status:', error);
    return [];
  }

  return data || [];
}

/**
 * Search clients
 */
export async function searchClients(
  vendorId: string,
  query: string
): Promise<VendorClient[]> {
  const { data, error } = await supabase
    .from('vendor_clients')
    .select('*')
    .eq('vendor_id', vendorId)
    .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error searching clients:', error);
    return [];
  }

  return data || [];
}

/**
 * Get client count by status
 */
export async function getClientCountByStatus(
  vendorId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('vendor_clients')
    .select('status')
    .eq('vendor_id', vendorId);

  if (error) {
    console.error('Error fetching client count:', error);
    return { lead: 0, customer: 0, churned: 0 };
  }

  const counts = { lead: 0, customer: 0, churned: 0 };

  data?.forEach((client) => {
    counts[client.status as keyof typeof counts]++;
  });

  return counts;
}
