'use client';

/**
 * Affiliate Dashboard Component
 * Displays affiliate performance, earnings, and referrals
 */

import { useState } from 'react';
import type {
  Affiliate,
  ReferralCode,
  ReferralCommission,
  ReferralPayout,
} from '@/types/referral';
import { Check, Copy, ExternalLink, TrendingUp, Users, DollarSign } from 'lucide-react';

interface AffiliateDashboardProps {
  affiliate: Affiliate;
  referralCode: ReferralCode | null;
  stats: any;
  referrals: any[];
  commissions: ReferralCommission[];
  payouts: ReferralPayout[];
  earnings: {
    total_earned: number;
    available_balance: number;
    pending_balance: number;
    lifetime_earnings: number;
  };
}

export default function AffiliateDashboard({
  affiliate,
  referralCode,
  stats,
  referrals,
  commissions,
  payouts,
  earnings,
}: AffiliateDashboardProps) {
  const [copied, setCopied] = useState(false);

  const referralUrl = referralCode
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.com'}/r/${
        referralCode.custom_slug || referralCode.code
      }`
    : null;

  const handleCopy = () => {
    if (referralUrl) {
      navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const conversionRate = stats?.stats?.conversion_rate || 0;
  const signupRate = stats?.stats?.signup_rate || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {affiliate.contact_name}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Referral Link */}
        {referralUrl && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Your Referral Link</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="h-6 w-6" />}
            label="Total Clicks"
            value={referralCode?.clicks || 0}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            label="Signups"
            value={referralCode?.signups || 0}
            subtitle={`${signupRate.toFixed(1)}% conversion`}
            color="green"
          />
          <StatCard
            icon={<Check className="h-6 w-6" />}
            label="Conversions"
            value={referralCode?.conversions || 0}
            subtitle={`${conversionRate.toFixed(1)}% rate`}
            color="purple"
          />
          <StatCard
            icon={<DollarSign className="h-6 w-6" />}
            label="Total Earned"
            value={`$${earnings.total_earned.toFixed(2)}`}
            color="yellow"
          />
        </div>

        {/* Earnings */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Earnings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Available Balance</p>
              <p className="text-2xl font-bold text-green-600">
                ${earnings.available_balance.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Ready for payout</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                ${earnings.pending_balance.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Lifetime Earnings</p>
              <p className="text-2xl font-bold text-blue-600">
                ${earnings.lifetime_earnings.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">All-time total</p>
            </div>
          </div>
          {earnings.available_balance >= 50 && (
            <button className="mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Request Payout
            </button>
          )}
        </div>

        {/* Recent Referrals */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Recent Referrals</h2>
          {referrals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No referrals yet. Share your link to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {referral.referred_vendor?.business_name || 'Unknown Vendor'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        referral.status === 'converted'
                          ? 'bg-green-100 text-green-800'
                          : referral.status === 'qualified'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {referral.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout History */}
        {payouts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Payout History</h2>
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">${payout.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(payout.created_at).toLocaleDateString()} via{' '}
                      {payout.payout_method}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      payout.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : payout.status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : payout.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {payout.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`inline-flex p-3 rounded-lg ${colors[color as keyof typeof colors]}`}>
        {icon}
      </div>
      <p className="text-sm text-gray-600 mt-4">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
