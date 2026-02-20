/**
 * Email Bounce and Complaint Handler
 *
 * Handles email delivery failures and spam complaints
 * - Tracks bounces (hard and soft)
 * - Handles spam complaints
 * - Automatically suppresses problematic emails
 * - Provides reporting and monitoring
 */

import { createClient } from '@supabase/supabase-js';

export type BounceType = 'hard' | 'soft' | 'complaint' | 'undetermined';

export interface BounceEvent {
  email: string;
  bounce_type: BounceType;
  reason?: string;
  diagnostic_code?: string;
  timestamp: string;
  raw_event?: any;
}

export interface EmailSuppressionEntry {
  email: string;
  suppression_reason: 'bounce_hard' | 'bounce_soft_repeated' | 'complaint';
  bounce_count?: number;
  last_bounce_at?: string;
  suppressed_at: string;
  notes?: string;
}

/**
 * Process a bounce event from email provider
 */
export async function processBounceEvent(
  supabaseUrl: string,
  supabaseServiceKey: string,
  event: BounceEvent
): Promise<{ success: boolean; suppressed: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Log the bounce event
    const { error: logError } = await supabase.from('email_bounces').insert({
      email: event.email.toLowerCase(),
      bounce_type: event.bounce_type,
      reason: event.reason,
      diagnostic_code: event.diagnostic_code,
      bounced_at: event.timestamp,
      raw_event: event.raw_event,
    });

    if (logError) {
      console.error('Error logging bounce event:', logError);
    }

    let shouldSuppress = false;
    let suppressionReason: EmailSuppressionEntry['suppression_reason'] | null = null;

    // Determine if email should be suppressed
    if (event.bounce_type === 'hard') {
      // Hard bounces are immediately suppressed
      shouldSuppress = true;
      suppressionReason = 'bounce_hard';
    } else if (event.bounce_type === 'complaint') {
      // Spam complaints are immediately suppressed
      shouldSuppress = true;
      suppressionReason = 'complaint';
    } else if (event.bounce_type === 'soft') {
      // Soft bounces: suppress after 3 occurrences within 30 days
      const { count } = await supabase
        .from('email_bounces')
        .select('*', { count: 'exact', head: true })
        .eq('email', event.email.toLowerCase())
        .eq('bounce_type', 'soft')
        .gte('bounced_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (count && count >= 3) {
        shouldSuppress = true;
        suppressionReason = 'bounce_soft_repeated';
      }
    }

    // Suppress email if needed
    if (shouldSuppress && suppressionReason) {
      await suppressEmail(supabase, {
        email: event.email.toLowerCase(),
        suppression_reason: suppressionReason,
        suppressed_at: new Date().toISOString(),
        notes: event.reason,
      });

      // Update user profile to mark email as invalid
      await supabase
        .from('profiles')
        .update({
          email_valid: false,
          email_suppression_reason: suppressionReason,
        })
        .eq('email', event.email.toLowerCase());

      return { success: true, suppressed: true };
    }

    return { success: true, suppressed: false };
  } catch (error: any) {
    console.error('Error processing bounce event:', error);
    return {
      success: false,
      suppressed: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Suppress an email address
 */
async function suppressEmail(
  supabase: any,
  entry: EmailSuppressionEntry
): Promise<void> {
  // Check if already suppressed
  const { data: existing } = await supabase
    .from('email_suppression_list')
    .select('*')
    .eq('email', entry.email)
    .single();

  if (existing) {
    // Update existing entry
    await supabase
      .from('email_suppression_list')
      .update({
        suppression_reason: entry.suppression_reason,
        suppressed_at: entry.suppressed_at,
        notes: entry.notes,
      })
      .eq('email', entry.email);
  } else {
    // Insert new entry
    await supabase.from('email_suppression_list').insert(entry);
  }
}

/**
 * Check if an email is suppressed
 */
export async function isEmailSuppressed(
  supabaseUrl: string,
  supabaseServiceKey: string,
  email: string
): Promise<{ suppressed: boolean; reason?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('email_suppression_list')
    .select('suppression_reason')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) {
    return { suppressed: false };
  }

  return {
    suppressed: true,
    reason: data.suppression_reason,
  };
}

/**
 * Remove email from suppression list
 */
export async function unsuppressEmail(
  supabaseUrl: string,
  supabaseServiceKey: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Remove from suppression list
    await supabase
      .from('email_suppression_list')
      .delete()
      .eq('email', email.toLowerCase());

    // Update user profile
    await supabase
      .from('profiles')
      .update({
        email_valid: true,
        email_suppression_reason: null,
      })
      .eq('email', email.toLowerCase());

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Get bounce statistics
 */
export async function getBounceStats(
  supabaseUrl: string,
  supabaseServiceKey: string,
  daysBack: number = 30
): Promise<{
  total_bounces: number;
  hard_bounces: number;
  soft_bounces: number;
  complaints: number;
  suppressed_emails: number;
  bounce_rate: number;
}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  // Get bounce counts by type
  const { data: bounces } = await supabase
    .from('email_bounces')
    .select('bounce_type')
    .gte('bounced_at', startDate);

  const stats = {
    total_bounces: bounces?.length || 0,
    hard_bounces: bounces?.filter((b) => b.bounce_type === 'hard').length || 0,
    soft_bounces: bounces?.filter((b) => b.bounce_type === 'soft').length || 0,
    complaints: bounces?.filter((b) => b.bounce_type === 'complaint').length || 0,
    suppressed_emails: 0,
    bounce_rate: 0,
  };

  // Get total suppressed emails
  const { count: suppressedCount } = await supabase
    .from('email_suppression_list')
    .select('*', { count: 'exact', head: true });

  stats.suppressed_emails = suppressedCount || 0;

  // Calculate bounce rate (bounces / total sent emails)
  const { count: totalSent } = await supabase
    .from('email_delivery_tracking')
    .select('*', { count: 'exact', head: true })
    .gte('sent_at', startDate);

  if (totalSent && totalSent > 0) {
    stats.bounce_rate = (stats.total_bounces / totalSent) * 100;
  }

  return stats;
}

/**
 * Parse Resend webhook event
 */
export function parseResendWebhookEvent(payload: any): BounceEvent | null {
  const { type, data } = payload;

  if (!type || !data) {
    return null;
  }

  const email = data.email || data.to;

  if (!email) {
    return null;
  }

  let bounceType: BounceType = 'undetermined';
  let reason = '';

  switch (type) {
    case 'email.bounced':
      bounceType = data.bounce?.type === 'Permanent' ? 'hard' : 'soft';
      reason = data.bounce?.message || 'Email bounced';
      break;

    case 'email.complained':
      bounceType = 'complaint';
      reason = 'Spam complaint';
      break;

    default:
      return null; // Not a bounce or complaint event
  }

  return {
    email,
    bounce_type: bounceType,
    reason,
    diagnostic_code: data.diagnostic_code,
    timestamp: data.created_at || new Date().toISOString(),
    raw_event: payload,
  };
}

/**
 * Parse SendGrid webhook event
 */
export function parseSendGridWebhookEvent(payload: any): BounceEvent | null {
  const { event, email, reason, type } = payload;

  if (!event || !email) {
    return null;
  }

  let bounceType: BounceType = 'undetermined';
  let bounceReason = reason || '';

  switch (event) {
    case 'bounce':
      bounceType = type === 'bounce' ? 'hard' : 'soft';
      break;

    case 'dropped':
      bounceType = 'hard';
      break;

    case 'spamreport':
      bounceType = 'complaint';
      bounceReason = 'Spam complaint';
      break;

    default:
      return null; // Not a bounce or complaint event
  }

  return {
    email,
    bounce_type: bounceType,
    reason: bounceReason,
    timestamp: payload.timestamp ? new Date(payload.timestamp * 1000).toISOString() : new Date().toISOString(),
    raw_event: payload,
  };
}
