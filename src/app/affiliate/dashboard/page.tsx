/**
 * Affiliate Dashboard
 * REF-004: Affiliate Dashboard with earnings and referral tracking
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getReferralCodeStats } from '@/lib/referrals/track';
import AffiliateDashboard from '@/components/affiliate/AffiliateDashboard';

export const metadata: Metadata = {
  title: 'Affiliate Dashboard | BlogCanvas',
  description: 'Track your affiliate earnings and referrals',
};

export default async function AffiliateDashboardPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirect=/affiliate/dashboard');
  }

  // Get affiliate profile
  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (affiliateError || !affiliate) {
    redirect('/affiliate/apply');
  }

  // Check if approved
  if (affiliate.status !== 'approved') {
    if (affiliate.status === 'pending') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-4">Application Pending</h1>
            <p className="text-gray-600 mb-4">
              Your affiliate application is currently under review. We'll notify you
              via email once it's been processed.
            </p>
            <p className="text-sm text-gray-500">
              This usually takes 1-2 business days.
            </p>
          </div>
        </div>
      );
    }

    if (affiliate.status === 'rejected') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-4">Application Rejected</h1>
            <p className="text-gray-600 mb-4">
              Unfortunately, your affiliate application was not approved.
            </p>
            {affiliate.rejection_reason && (
              <div className="bg-gray-50 p-4 rounded mb-4">
                <p className="text-sm font-medium mb-1">Reason:</p>
                <p className="text-sm text-gray-600">{affiliate.rejection_reason}</p>
              </div>
            )}
            <p className="text-sm text-gray-500">
              You may reapply after addressing the concerns mentioned above.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Account Suspended</h1>
          <p className="text-gray-600 mb-4">
            Your affiliate account has been suspended. Please contact support for more information.
          </p>
        </div>
      </div>
    );
  }

  // Get referral code
  const { data: referralCode } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('affiliate_id', affiliate.id)
    .eq('is_active', true)
    .single();

  let stats = null;
  if (referralCode) {
    stats = await getReferralCodeStats(referralCode.id);
  }

  // Get referrals
  const { data: referrals } = await supabase
    .from('referrals')
    .select(`
      *,
      referred_vendor:vendors!referrals_referred_vendor_id_fkey(id, handle, business_name)
    `)
    .eq('referrer_affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get commissions
  const { data: commissions } = await supabase
    .from('referral_commissions')
    .select('*')
    .eq('referrer_affiliate_id', affiliate.id)
    .order('created_at', { ascending: false });

  // Calculate earnings
  const totalEarned = commissions?.reduce(
    (sum, c) => sum + Number(c.commission_amount),
    0
  ) || 0;

  const pendingEarnings = commissions
    ?.filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

  const availableBalance = commissions
    ?.filter((c) => c.status === 'approved')
    .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

  const paidEarnings = commissions
    ?.filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

  // Get payouts
  const { data: payouts } = await supabase
    .from('referral_payouts')
    .select('*')
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false });

  return (
    <AffiliateDashboard
      affiliate={affiliate}
      referralCode={referralCode}
      stats={stats}
      referrals={referrals || []}
      commissions={commissions || []}
      payouts={payouts || []}
      earnings={{
        total_earned: totalEarned,
        available_balance: availableBalance,
        pending_balance: pendingEarnings,
        lifetime_earnings: totalEarned,
      }}
    />
  );
}
