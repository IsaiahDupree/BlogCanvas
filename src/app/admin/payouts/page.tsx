/**
 * Admin Payout Management
 * REF-005: Manage payouts to affiliates and vendors
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PayoutManagement from '@/components/admin/PayoutManagement';

export const metadata: Metadata = {
  title: 'Payout Management | Admin | BlogCanvas',
  description: 'Manage affiliate and vendor payouts',
};

export default async function PayoutManagementPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirect=/admin/payouts');
  }

  // Check if user is admin
  const isAdmin = user.user_metadata?.role === 'admin';
  if (!isAdmin) {
    redirect('/');
  }

  // Get pending payouts
  const { data: pendingPayouts } = await supabase
    .from('referral_payouts')
    .select(`
      *,
      vendor:vendors(id, handle, business_name),
      affiliate:affiliates(id, company_name, contact_name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  // Get processing payouts
  const { data: processingPayouts } = await supabase
    .from('referral_payouts')
    .select(`
      *,
      vendor:vendors(id, handle, business_name),
      affiliate:affiliates(id, company_name, contact_name)
    `)
    .eq('status', 'processing')
    .order('created_at', { ascending: false });

  // Get recent completed payouts
  const { data: completedPayouts } = await supabase
    .from('referral_payouts')
    .select(`
      *,
      vendor:vendors(id, handle, business_name),
      affiliate:affiliates(id, company_name, contact_name)
    `)
    .eq('status', 'completed')
    .order('processed_at', { ascending: false })
    .limit(20);

  // Get approved commissions (ready for payout)
  const { data: approvedCommissions } = await supabase
    .from('referral_commissions')
    .select(`
      *,
      referral:referrals(
        *,
        referred_vendor:vendors!referrals_referred_vendor_id_fkey(id, handle, business_name)
      )
    `)
    .eq('status', 'approved')
    .is('payout_id', null)
    .order('created_at', { ascending: true });

  // Group commissions by recipient
  const commissionsByRecipient = approvedCommissions?.reduce((acc, commission) => {
    const key = commission.referrer_vendor_id || commission.referrer_affiliate_id || '';
    if (!acc[key]) {
      acc[key] = {
        recipient_id: key,
        recipient_type: commission.referrer_vendor_id ? 'vendor' : 'affiliate',
        commissions: [],
        total: 0,
      };
    }
    acc[key].commissions.push(commission);
    acc[key].total += Number(commission.commission_amount);
    return acc;
  }, {} as Record<string, any>);

  return (
    <PayoutManagement
      pendingPayouts={pendingPayouts || []}
      processingPayouts={processingPayouts || []}
      completedPayouts={completedPayouts || []}
      commissionsByRecipient={Object.values(commissionsByRecipient || {})}
    />
  );
}
