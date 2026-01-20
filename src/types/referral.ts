/**
 * Referral & Affiliate System Types
 * Based on: PRD_REFERRAL_AFFILIATE_SYSTEM.md
 * Created: 2026-01-19
 */

// ============================================================================
// REFERRAL PROGRAMS
// ============================================================================

export type ProgramType = 'vendor' | 'client' | 'affiliate';
export type CommissionType = 'percentage' | 'fixed';
export type PayoutSchedule = 'weekly' | 'monthly' | 'manual';

export interface ReferralProgram {
  id: string;
  program_type: ProgramType;
  name: string;

  // Commission settings
  commission_type: CommissionType;
  commission_value: number; // 20 = 20% or $20
  commission_duration_months: number | null; // NULL = lifetime

  // Payout settings
  minimum_payout: number;
  payout_schedule: PayoutSchedule;

  // Status
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface CommissionConfig {
  type: CommissionType;
  value: number;
  durationMonths: number | null;
}

// ============================================================================
// AFFILIATES
// ============================================================================

export type AffiliateStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type PayoutMethod = 'stripe' | 'paypal' | 'bank_transfer' | 'credit';
export type PromotionMethod = 'blog' | 'youtube' | 'email' | 'social' | 'paid_ads' | 'other';

export interface Affiliate {
  id: string;
  user_id: string | null;

  // Profile
  company_name: string | null;
  contact_name: string;
  email: string;
  website: string | null;

  // Application
  application_notes: string | null;
  promotion_methods: PromotionMethod[];
  audience_size: string | null;

  // Status
  status: AffiliateStatus;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;

  // Payout
  payout_method: PayoutMethod;
  payout_email: string | null;
  stripe_account_id: string | null;

  // Terms
  agreed_to_terms: boolean;
  agreed_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface AffiliateApplication {
  company_name?: string;
  contact_name: string;
  email: string;
  website?: string;
  application_notes?: string;
  promotion_methods: PromotionMethod[];
  audience_size?: string;
  agreed_to_terms: boolean;
}

// ============================================================================
// REFERRAL CODES
// ============================================================================

export interface ReferralCode {
  id: string;
  program_id: string;

  // Owner (one of these)
  vendor_id: string | null;
  client_id: string | null;
  affiliate_id: string | null;

  // Code details
  code: string;
  custom_slug: string | null;

  // Tracking
  clicks: number;
  signups: number;
  conversions: number;

  // Status
  is_active: boolean;
  expires_at: string | null;

  created_at: string;
}

export interface CreateReferralCode {
  program_id: string;
  vendor_id?: string;
  client_id?: string;
  affiliate_id?: string;
  custom_slug?: string;
}

export interface ReferralCodeStats {
  code: string;
  clicks: number;
  signups: number;
  conversions: number;
  conversion_rate: number; // clicks to conversions
  signup_rate: number; // clicks to signups
}

// ============================================================================
// REFERRALS
// ============================================================================

export type ReferralStatus = 'pending' | 'qualified' | 'converted' | 'churned' | 'fraudulent';

export interface Referral {
  id: string;
  referral_code_id: string | null;
  program_id: string | null;

  // Referrer (one of these)
  referrer_vendor_id: string | null;
  referrer_client_id: string | null;
  referrer_affiliate_id: string | null;

  // Referred party (one of these)
  referred_vendor_id: string | null;
  referred_client_id: string | null;

  // Status
  status: ReferralStatus;
  qualified_at: string | null;

  // Attribution
  landing_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;

  created_at: string;
}

export interface CreateReferral {
  referral_code_id: string;
  program_id: string;
  referrer_vendor_id?: string;
  referrer_client_id?: string;
  referrer_affiliate_id?: string;
  referred_vendor_id?: string;
  referred_client_id?: string;
  landing_page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface ReferralWithDetails extends Referral {
  // Populated fields
  program?: ReferralProgram;
  referred_vendor?: {
    id: string;
    handle: string;
    business_name: string;
  };
  referred_client?: {
    id: string;
    name: string;
    email: string;
  };
}

// ============================================================================
// COMMISSIONS
// ============================================================================

export type CommissionSourceType = 'subscription' | 'one_time' | 'renewal';
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'reversed';

export interface ReferralCommission {
  id: string;
  referral_id: string | null;
  referral_code_id: string | null;

  // Referrer (one of these)
  referrer_vendor_id: string | null;
  referrer_affiliate_id: string | null;

  // Transaction that triggered commission
  source_type: CommissionSourceType;
  source_id: string; // order_id or subscription_id
  source_amount: number;

  // Commission
  commission_rate: number;
  commission_amount: number;

  // Status
  status: CommissionStatus;

  // Payout reference
  payout_id: string | null;

  created_at: string;
}

export interface CreateCommission {
  referral_id: string;
  referral_code_id: string;
  referrer_vendor_id?: string;
  referrer_affiliate_id?: string;
  source_type: CommissionSourceType;
  source_id: string;
  source_amount: number;
  commission_rate: number;
  commission_amount: number;
}

export interface CommissionSummary {
  total_earned: number;
  pending: number;
  approved: number;
  paid: number;
  available_for_payout: number; // approved but not paid
  total_commissions: number; // count
}

// ============================================================================
// PAYOUTS
// ============================================================================

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ReferralPayout {
  id: string;

  // Recipient (one of these)
  vendor_id: string | null;
  affiliate_id: string | null;

  // Amount
  amount: number;
  currency: string;

  // Method
  payout_method: PayoutMethod;
  payout_details: Record<string, any> | null;

  // Status
  status: PayoutStatus;
  processed_at: string | null;

  // Reference
  external_reference: string | null;
  notes: string | null;

  created_at: string;
}

export interface CreatePayout {
  vendor_id?: string;
  affiliate_id?: string;
  amount: number;
  currency?: string;
  payout_method: PayoutMethod;
  payout_details?: Record<string, any>;
  notes?: string;
}

export interface PayoutWithCommissions extends ReferralPayout {
  commissions: ReferralCommission[];
  commission_count: number;
}

// ============================================================================
// CLICK TRACKING
// ============================================================================

export interface ReferralClick {
  id: string;
  referral_code_id: string;

  // Visitor info (privacy-preserving)
  ip_hash: string | null;
  user_agent: string | null;
  landing_page: string | null;
  referrer_url: string | null;

  // UTM parameters
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;

  // Conversion tracking
  converted: boolean;
  converted_at: string | null;
  referral_id: string | null;

  created_at: string;
}

export interface TrackClick {
  referral_code_id: string;
  ip_hash?: string;
  user_agent?: string;
  landing_page?: string;
  referrer_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

// ============================================================================
// DASHBOARD DATA
// ============================================================================

export interface ReferralDashboard {
  // Overview stats
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  conversion_rate: number;

  // Earnings
  total_earned: number;
  available_balance: number;
  pending_balance: number;
  lifetime_earnings: number;

  // Recent activity
  recent_referrals: ReferralWithDetails[];
  recent_commissions: ReferralCommission[];

  // Referral code
  referral_code?: ReferralCode;
}

export interface AffiliateDashboard extends ReferralDashboard {
  // Affiliate-specific
  status: AffiliateStatus;
  approved_at: string | null;

  // Performance
  click_through_rate: number;
  average_order_value: number;

  // Monthly breakdown
  monthly_stats: {
    month: string;
    clicks: number;
    signups: number;
    conversions: number;
    earnings: number;
  }[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface GenerateReferralLinkRequest {
  custom_slug?: string;
}

export interface GenerateReferralLinkResponse {
  code: ReferralCode;
  full_url: string;
}

export interface RequestPayoutRequest {
  amount: number;
  payout_method: PayoutMethod;
  payout_details?: Record<string, any>;
}

export interface RequestPayoutResponse {
  payout: ReferralPayout;
  message: string;
}

export interface ReferralStatsResponse {
  code: ReferralCode;
  stats: ReferralCodeStats;
  recent_clicks: ReferralClick[];
}

// ============================================================================
// FRAUD DETECTION
// ============================================================================

export interface FraudCheck {
  is_fraudulent: boolean;
  reason?: string;
  confidence: number; // 0-1
}

export interface FraudCheckParams {
  referrer_id: string;
  referred_id: string;
  ip_hash?: string;
  email?: string;
}
