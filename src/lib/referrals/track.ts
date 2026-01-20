/**
 * Referral Tracking
 * REF-003: Track conversions and attribution
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ReferralClick,
  TrackClick,
  Referral,
  CreateReferral,
  ReferralCommission,
  CreateCommission,
  FraudCheck,
  FraudCheckParams,
  CommissionConfig,
} from '@/types/referral';
import crypto from 'crypto';

/**
 * Track a referral click
 */
export async function trackReferralClick(
  params: TrackClick
): Promise<ReferralClick> {
  const supabase = await createClient();

  // Create click record
  const { data: click, error } = await supabase
    .from('referral_clicks')
    .insert(params)
    .select()
    .single();

  if (error) throw error;

  // Increment click counter
  await supabase.rpc('increment_referral_code_clicks', {
    code_id: params.referral_code_id,
  });

  return click as ReferralClick;
}

/**
 * Hash IP address for privacy
 */
export function hashIpAddress(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

/**
 * Create a referral record when someone signs up
 */
export async function createReferral(
  params: CreateReferral
): Promise<Referral> {
  const supabase = await createClient();

  // Check for fraud
  const fraudCheck = await checkForFraud({
    referrer_id: params.referrer_vendor_id || params.referrer_affiliate_id || '',
    referred_id: params.referred_vendor_id || params.referred_client_id || '',
  });

  if (fraudCheck.is_fraudulent) {
    throw new Error(`Referral flagged as fraudulent: ${fraudCheck.reason}`);
  }

  // Create referral
  const { data: referral, error } = await supabase
    .from('referrals')
    .insert({
      ...params,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // Increment signup counter
  if (params.referral_code_id) {
    await supabase.rpc('increment_referral_code_signups', {
      code_id: params.referral_code_id,
    });
  }

  return referral as Referral;
}

/**
 * Mark referral as qualified (when they become paying customer)
 */
export async function qualifyReferral(referralId: string): Promise<void> {
  const supabase = await createClient();

  const { data: referral, error } = await supabase
    .from('referrals')
    .update({
      status: 'qualified',
      qualified_at: new Date().toISOString(),
    })
    .eq('id', referralId)
    .select()
    .single();

  if (error) throw error;

  // Increment conversion counter
  if (referral.referral_code_id) {
    await supabase.rpc('increment_referral_code_conversions', {
      code_id: referral.referral_code_id,
    });
  }
}

/**
 * Mark referral as converted (actively using product)
 */
export async function convertReferral(referralId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('referrals')
    .update({ status: 'converted' })
    .eq('id', referralId);

  if (error) throw error;
}

/**
 * Get referral by referred vendor ID
 */
export async function getReferralByVendorId(
  vendorId: string
): Promise<Referral | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_vendor_id', vendorId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as Referral;
}

/**
 * Get referral by referred client ID
 */
export async function getReferralByClientId(
  clientId: string
): Promise<Referral | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_client_id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as Referral;
}

/**
 * Calculate commission amount
 */
export function calculateCommission(
  transactionAmount: number,
  config: CommissionConfig,
  referralDate: Date
): number {
  // Check if still within commission window
  if (config.durationMonths !== null) {
    const monthsSinceReferral = getMonthsDiff(referralDate, new Date());
    if (monthsSinceReferral > config.durationMonths) {
      return 0;
    }
  }

  // Calculate commission
  if (config.type === 'percentage') {
    return transactionAmount * (config.value / 100);
  }

  return config.value;
}

/**
 * Create commission record
 */
export async function createCommission(
  params: CreateCommission
): Promise<ReferralCommission> {
  const supabase = await createClient();

  const { data: commission, error } = await supabase
    .from('referral_commissions')
    .insert({
      ...params,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  return commission as ReferralCommission;
}

/**
 * Process payment and create commission if applicable
 */
export async function processPaymentForCommission(params: {
  vendorId: string;
  amount: number;
  sourceType: 'subscription' | 'one_time' | 'renewal';
  sourceId: string;
}): Promise<ReferralCommission | null> {
  const supabase = await createClient();

  // Check if vendor was referred
  const referral = await getReferralByVendorId(params.vendorId);
  if (!referral) return null;

  // Get referral program
  const { data: program, error: programError } = await supabase
    .from('referral_programs')
    .select('*')
    .eq('id', referral.program_id || '')
    .single();

  if (programError || !program) return null;

  // Calculate commission
  const commissionAmount = calculateCommission(
    params.amount,
    {
      type: program.commission_type,
      value: program.commission_value,
      durationMonths: program.commission_duration_months,
    },
    new Date(referral.created_at)
  );

  if (commissionAmount === 0) return null;

  // Qualify referral if not already qualified
  if (referral.status === 'pending') {
    await qualifyReferral(referral.id);
  }

  // Create commission
  const commission = await createCommission({
    referral_id: referral.id,
    referral_code_id: referral.referral_code_id || '',
    referrer_vendor_id: referral.referrer_vendor_id || undefined,
    referrer_affiliate_id: referral.referrer_affiliate_id || undefined,
    source_type: params.sourceType,
    source_id: params.sourceId,
    source_amount: params.amount,
    commission_rate: program.commission_value,
    commission_amount: commissionAmount,
  });

  return commission;
}

/**
 * Check for fraudulent referrals
 */
export async function checkForFraud(
  params: FraudCheckParams
): Promise<FraudCheck> {
  const supabase = await createClient();

  // Check 1: Self-referral (same user)
  if (params.referrer_id === params.referred_id) {
    return {
      is_fraudulent: true,
      reason: 'Self-referral detected',
      confidence: 1.0,
    };
  }

  // Check 2: Duplicate referral
  const { data: existingReferral, error } = await supabase
    .from('referrals')
    .select('id')
    .or(
      `referred_vendor_id.eq.${params.referred_id},referred_client_id.eq.${params.referred_id}`
    )
    .single();

  if (!error && existingReferral) {
    return {
      is_fraudulent: true,
      reason: 'User already referred',
      confidence: 0.9,
    };
  }

  // Check 3: Same IP address (if provided)
  if (params.ip_hash) {
    // Get referrer's recent clicks with same IP
    const { data: suspiciousClicks, error: clickError } = await supabase
      .from('referral_clicks')
      .select('id')
      .eq('ip_hash', params.ip_hash)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24h
      .limit(10);

    if (!clickError && suspiciousClicks && suspiciousClicks.length > 5) {
      return {
        is_fraudulent: true,
        reason: 'Suspicious IP activity',
        confidence: 0.7,
      };
    }
  }

  // Check 4: Same email domain (if provided)
  if (params.email) {
    // This would require comparing email domains
    // Implementation depends on access to user emails
  }

  // No fraud detected
  return {
    is_fraudulent: false,
    confidence: 0.0,
  };
}

/**
 * Get months difference between two dates
 */
function getMonthsDiff(date1: Date, date2: Date): number {
  const yearDiff = date2.getFullYear() - date1.getFullYear();
  const monthDiff = date2.getMonth() - date1.getMonth();
  return yearDiff * 12 + monthDiff;
}

/**
 * Get referral statistics for a code
 */
export async function getReferralCodeStats(codeId: string) {
  const supabase = await createClient();

  // Get code with basic stats
  const { data: code, error: codeError } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('id', codeId)
    .single();

  if (codeError) throw codeError;

  // Get conversion details
  const { data: referrals, error: referralsError } = await supabase
    .from('referrals')
    .select('id, status, created_at, qualified_at')
    .eq('referral_code_id', codeId);

  if (referralsError) throw referralsError;

  // Get commission totals
  const { data: commissions, error: commissionsError } = await supabase
    .from('referral_commissions')
    .select('commission_amount, status')
    .eq('referral_code_id', codeId);

  if (commissionsError) throw commissionsError;

  const totalEarned = commissions?.reduce(
    (sum, c) => sum + Number(c.commission_amount),
    0
  ) || 0;

  const pendingEarnings = commissions
    ?.filter((c) => c.status === 'pending' || c.status === 'approved')
    .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

  return {
    code,
    referrals,
    stats: {
      clicks: code.clicks,
      signups: code.signups,
      conversions: code.conversions,
      conversion_rate: code.clicks > 0 ? (code.conversions / code.clicks) * 100 : 0,
      signup_rate: code.clicks > 0 ? (code.signups / code.clicks) * 100 : 0,
      total_earned: totalEarned,
      pending_earnings: pendingEarnings,
    },
  };
}

/**
 * Store referral code in cookie for attribution
 */
export function setReferralCookie(code: string): void {
  if (typeof document === 'undefined') return;

  // Store for 30 days
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  document.cookie = `ref_code=${code}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Get referral code from cookie
 */
export function getReferralCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/ref_code=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Clear referral cookie
 */
export function clearReferralCookie(): void {
  if (typeof document === 'undefined') return;

  document.cookie = 'ref_code=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}
