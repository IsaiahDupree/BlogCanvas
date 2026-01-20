/**
 * Database operations for vendor calendar integrations
 */

import { createClient } from '@/lib/supabase/server';
import { refreshAccessToken } from '@/lib/google/oauth';

export interface CalendarIntegration {
  id: string;
  vendor_id: string;
  provider: 'google' | 'microsoft' | 'apple';
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  calendar_id: string | null;
  calendar_name: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get vendor's calendar integration
 */
export async function getVendorCalendarIntegration(
  vendorId: string,
  provider: 'google' | 'microsoft' | 'apple' = 'google'
): Promise<CalendarIntegration | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vendor_calendar_integrations')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('provider', provider)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('[Calendar DB] Error fetching integration:', error);
    return null;
  }

  return data;
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(
  vendorId: string,
  provider: 'google' | 'microsoft' | 'apple' = 'google'
): Promise<string | null> {
  const integration = await getVendorCalendarIntegration(vendorId, provider);

  if (!integration) {
    return null;
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = integration.token_expires_at ? new Date(integration.token_expires_at) : null;

  if (expiresAt && expiresAt > now) {
    // Token is still valid
    return integration.access_token;
  }

  // Token is expired, refresh it
  if (!integration.refresh_token) {
    console.error('[Calendar DB] No refresh token available');
    return null;
  }

  try {
    const newTokens = await refreshAccessToken(integration.refresh_token);

    // Update tokens in database
    const supabase = await createClient();
    await supabase
      .from('vendor_calendar_integrations')
      .update({
        access_token: newTokens.access_token!,
        refresh_token: newTokens.refresh_token || integration.refresh_token,
        token_expires_at: newTokens.expiry_date ? new Date(newTokens.expiry_date).toISOString() : null,
        last_sync_at: new Date().toISOString()
      })
      .eq('id', integration.id);

    return newTokens.access_token!;

  } catch (error) {
    console.error('[Calendar DB] Error refreshing token:', error);
    return null;
  }
}

/**
 * Disconnect calendar integration
 */
export async function disconnectCalendarIntegration(
  vendorId: string,
  provider: 'google' | 'microsoft' | 'apple' = 'google'
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('vendor_calendar_integrations')
    .update({ is_active: false })
    .eq('vendor_id', vendorId)
    .eq('provider', provider);

  if (error) {
    console.error('[Calendar DB] Error disconnecting integration:', error);
    return false;
  }

  return true;
}

/**
 * Update sync status
 */
export async function updateSyncStatus(
  integrationId: string,
  syncError: string | null = null
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('vendor_calendar_integrations')
    .update({
      last_sync_at: new Date().toISOString(),
      sync_error: syncError
    })
    .eq('id', integrationId);

  if (error) {
    console.error('[Calendar DB] Error updating sync status:', error);
    return false;
  }

  return true;
}
