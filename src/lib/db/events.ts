// Database functions for event tracking and analytics

import { supabase } from '@/lib/supabase';
import type {
  VendorEvent,
  TrackEventInput,
  VendorAttribution,
  VendorFunnelStats,
  FunnelMetrics,
  VendorDailyRollup,
  VendorPageDailyRollup
} from '@/types/analytics';

// ============================================================================
// EVENT TRACKING
// ============================================================================

/**
 * Track a vendor event
 */
export async function trackEvent(input: TrackEventInput): Promise<{ success: boolean; event?: VendorEvent; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('vendor_event_log')
      .insert({
        event_name: input.event_name,
        event_type: input.event_type,
        vendor_id: input.vendor_id,
        page_id: input.page_id,
        client_id: input.client_id,
        workspace_id: input.workspace_id,
        session_id: input.session_id,
        user_id: input.user_id,
        user_type: input.user_type,
        properties: input.properties || {},
        utm_source: input.utm_source,
        utm_medium: input.utm_medium,
        utm_campaign: input.utm_campaign,
        utm_content: input.utm_content,
        utm_term: input.utm_term,
        referrer: input.referrer
      })
      .select()
      .single();

    if (error) {
      console.error('[trackEvent] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, event: data as VendorEvent };
  } catch (error: any) {
    console.error('[trackEvent] Exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get events for a vendor
 */
export async function getVendorEvents(
  vendorId: string,
  options?: {
    pageId?: string;
    eventType?: string;
    eventName?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ success: boolean; events?: VendorEvent[]; error?: string }> {
  try {
    let query = supabase
      .from('vendor_event_log')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (options?.pageId) {
      query = query.eq('page_id', options.pageId);
    }

    if (options?.eventType) {
      query = query.eq('event_type', options.eventType);
    }

    if (options?.eventName) {
      query = query.eq('event_name', options.eventName);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[getVendorEvents] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, events: data as VendorEvent[] };
  } catch (error: any) {
    console.error('[getVendorEvents] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// FUNNEL TRACKING
// ============================================================================

/**
 * Update funnel stats for a session
 */
export async function updateFunnelStats(
  vendorId: string,
  sessionId: string,
  pageId: string,
  step: 'viewed_page' | 'scrolled_50' | 'played_vsl' | 'clicked_cta' | 'started_checkout' | 'completed_checkout'
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, try to update existing record
    const updateData: any = {
      [step]: true,
      [`${step}_at`]: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabase
      .from('vendor_funnel_stats')
      .select('id')
      .eq('session_id', sessionId)
      .eq('page_id', pageId)
      .single();

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('vendor_funnel_stats')
        .update(updateData)
        .eq('id', existing.id);

      if (updateError) {
        console.error('[updateFunnelStats] Update error:', updateError);
        return { success: false, error: updateError.message };
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('vendor_funnel_stats')
        .insert({
          vendor_id: vendorId,
          page_id: pageId,
          session_id: sessionId,
          ...updateData
        });

      if (insertError) {
        console.error('[updateFunnelStats] Insert error:', insertError);
        return { success: false, error: insertError.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('[updateFunnelStats] Exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get funnel metrics for a vendor/page
 */
export async function getFunnelMetrics(
  vendorId: string,
  pageId?: string,
  dateRange?: { start: string; end: string }
): Promise<{ success: boolean; metrics?: FunnelMetrics; error?: string }> {
  try {
    let query = supabase
      .from('vendor_funnel_stats')
      .select('*')
      .eq('vendor_id', vendorId);

    if (pageId) {
      query = query.eq('page_id', pageId);
    }

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[getFunnelMetrics] Error:', error);
      return { success: false, error: error.message };
    }

    const stats = data as VendorFunnelStats[];

    // Compute metrics
    const metrics: FunnelMetrics = {
      total_visitors: stats.length,
      scrolled_50_percent: stats.filter(s => s.scrolled_50).length,
      played_vsl: stats.filter(s => s.played_vsl).length,
      clicked_cta: stats.filter(s => s.clicked_cta).length,
      started_checkout: stats.filter(s => s.started_checkout).length,
      completed_checkout: stats.filter(s => s.completed_checkout).length,
      conversion_rate: stats.length > 0
        ? (stats.filter(s => s.completed_checkout).length / stats.length) * 100
        : 0
    };

    return { success: true, metrics };
  } catch (error: any) {
    console.error('[getFunnelMetrics] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// ATTRIBUTION
// ============================================================================

/**
 * Create or update attribution record
 */
export async function updateAttribution(
  sessionId: string,
  vendorId: string,
  pageId: string,
  attribution: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    referrer?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: existing } = await supabase
      .from('vendor_attribution')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (existing) {
      // Update last touch
      const { error: updateError } = await supabase
        .from('vendor_attribution')
        .update({
          last_page_id: pageId,
          last_utm_source: attribution.utm_source,
          last_utm_medium: attribution.utm_medium,
          last_utm_campaign: attribution.utm_campaign,
          last_utm_content: attribution.utm_content,
          last_utm_term: attribution.utm_term,
          last_referrer: attribution.referrer,
          last_visit_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('[updateAttribution] Update error:', updateError);
        return { success: false, error: updateError.message };
      }
    } else {
      // Create new attribution record
      const { error: insertError } = await supabase
        .from('vendor_attribution')
        .insert({
          session_id: sessionId,
          vendor_id: vendorId,
          first_page_id: pageId,
          first_utm_source: attribution.utm_source,
          first_utm_medium: attribution.utm_medium,
          first_utm_campaign: attribution.utm_campaign,
          first_utm_content: attribution.utm_content,
          first_utm_term: attribution.utm_term,
          first_referrer: attribution.referrer,
          last_page_id: pageId,
          last_utm_source: attribution.utm_source,
          last_utm_medium: attribution.utm_medium,
          last_utm_campaign: attribution.utm_campaign,
          last_utm_content: attribution.utm_content,
          last_utm_term: attribution.utm_term,
          last_referrer: attribution.referrer
        });

      if (insertError) {
        console.error('[updateAttribution] Insert error:', insertError);
        return { success: false, error: insertError.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('[updateAttribution] Exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark attribution as converted
 */
export async function markAttributionConverted(
  sessionId: string,
  clientId: string,
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('vendor_attribution')
      .update({
        converted: true,
        converted_at: new Date().toISOString(),
        client_id: clientId,
        order_id: orderId,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('[markAttributionConverted] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[markAttributionConverted] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// DAILY ROLLUPS
// ============================================================================

/**
 * Get daily rollups for a vendor
 */
export async function getVendorDailyRollups(
  vendorId: string,
  dateRange: { start: string; end: string }
): Promise<{ success: boolean; rollups?: VendorDailyRollup[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('vendor_daily_rollups')
      .select('*')
      .eq('vendor_id', vendorId)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end)
      .order('date', { ascending: false });

    if (error) {
      console.error('[getVendorDailyRollups] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, rollups: data as VendorDailyRollup[] };
  } catch (error: any) {
    console.error('[getVendorDailyRollups] Exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get page daily rollups
 */
export async function getPageDailyRollups(
  pageId: string,
  dateRange: { start: string; end: string }
): Promise<{ success: boolean; rollups?: VendorPageDailyRollup[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('vendor_page_daily_rollups')
      .select('*')
      .eq('page_id', pageId)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end)
      .order('date', { ascending: false });

    if (error) {
      console.error('[getPageDailyRollups] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, rollups: data as VendorPageDailyRollup[] };
  } catch (error: any) {
    console.error('[getPageDailyRollups] Exception:', error);
    return { success: false, error: error.message };
  }
}
