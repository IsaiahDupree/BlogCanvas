// Vendor workspace database operations

import { supabase } from '@/lib/supabase';
import type {
  VendorWorkspace,
  VendorWorkspaceCreateInput,
  VendorWorkspaceUpdateInput
} from '@/types/client';

/**
 * Get all workspaces for a vendor
 */
export async function getVendorWorkspaces(vendorId: string): Promise<VendorWorkspace[]> {
  const { data, error } = await supabase
    .from('vendor_workspaces')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching workspaces:', error);
    return [];
  }

  return data || [];
}

/**
 * Get workspace by ID
 */
export async function getWorkspaceById(workspaceId: string): Promise<VendorWorkspace | null> {
  const { data, error } = await supabase
    .from('vendor_workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching workspace:', error);
    return null;
  }

  return data;
}

/**
 * Get workspace with client and offer details
 */
export async function getWorkspaceWithDetails(workspaceId: string) {
  const { data, error } = await supabase
    .from('vendor_workspaces')
    .select(`
      *,
      client:vendor_clients(*),
      offer:offers(*),
      page:offer_pages(*)
    `)
    .eq('id', workspaceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching workspace with details:', error);
    return null;
  }

  return data;
}

/**
 * Get workspaces for a client
 */
export async function getClientWorkspaces(clientId: string): Promise<VendorWorkspace[]> {
  const { data, error } = await supabase
    .from('vendor_workspaces')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client workspaces:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new workspace
 */
export async function createWorkspace(
  input: VendorWorkspaceCreateInput
): Promise<VendorWorkspace | null> {
  const { data, error } = await supabase
    .from('vendor_workspaces')
    .insert({
      vendor_id: input.vendor_id,
      client_id: input.client_id,
      offer_id: input.offer_id,
      page_id: input.page_id,
      name: input.name,
      status: input.status || 'onboarding',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating workspace:', error);
    throw error;
  }

  return data;
}

/**
 * Update workspace
 */
export async function updateWorkspace(
  workspaceId: string,
  updates: VendorWorkspaceUpdateInput
): Promise<VendorWorkspace | null> {
  const { data, error } = await supabase
    .from('vendor_workspaces')
    .update(updates)
    .eq('id', workspaceId)
    .select()
    .single();

  if (error) {
    console.error('Error updating workspace:', error);
    throw error;
  }

  return data;
}

/**
 * Update workspace status
 */
export async function updateWorkspaceStatus(
  workspaceId: string,
  status: 'onboarding' | 'active' | 'completed' | 'paused' | 'cancelled'
): Promise<VendorWorkspace | null> {
  const updates: VendorWorkspaceUpdateInput = { status };

  // If completing, set completed_at
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  return updateWorkspace(workspaceId, updates);
}

/**
 * Get workspaces by status
 */
export async function getWorkspacesByStatus(
  vendorId: string,
  status: 'onboarding' | 'active' | 'completed' | 'paused' | 'cancelled'
): Promise<VendorWorkspace[]> {
  const { data, error } = await supabase
    .from('vendor_workspaces')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching workspaces by status:', error);
    return [];
  }

  return data || [];
}

/**
 * Get active workspaces count
 */
export async function getActiveWorkspacesCount(vendorId: string): Promise<number> {
  const { count, error } = await supabase
    .from('vendor_workspaces')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching active workspaces count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get workspace count by status
 */
export async function getWorkspaceCountByStatus(
  vendorId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('vendor_workspaces')
    .select('status')
    .eq('vendor_id', vendorId);

  if (error) {
    console.error('Error fetching workspace count:', error);
    return { onboarding: 0, active: 0, completed: 0, paused: 0, cancelled: 0 };
  }

  const counts = {
    onboarding: 0,
    active: 0,
    completed: 0,
    paused: 0,
    cancelled: 0
  };

  data?.forEach((workspace) => {
    counts[workspace.status as keyof typeof counts]++;
  });

  return counts;
}

/**
 * Archive workspace (mark as completed)
 */
export async function archiveWorkspace(workspaceId: string): Promise<VendorWorkspace | null> {
  return updateWorkspaceStatus(workspaceId, 'completed');
}

/**
 * Pause workspace
 */
export async function pauseWorkspace(workspaceId: string): Promise<VendorWorkspace | null> {
  return updateWorkspaceStatus(workspaceId, 'paused');
}

/**
 * Resume workspace (from paused to active)
 */
export async function resumeWorkspace(workspaceId: string): Promise<VendorWorkspace | null> {
  return updateWorkspaceStatus(workspaceId, 'active');
}

/**
 * Cancel workspace
 */
export async function cancelWorkspace(workspaceId: string): Promise<VendorWorkspace | null> {
  return updateWorkspaceStatus(workspaceId, 'cancelled');
}
