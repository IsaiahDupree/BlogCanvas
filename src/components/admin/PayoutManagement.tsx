'use client';

/**
 * Admin Payout Management Component
 * Manage payouts to affiliates and vendors
 */

import { useState } from 'react';
import type { ReferralPayout } from '@/types/referral';
import { DollarSign, Check, X, Clock, AlertCircle } from 'lucide-react';

interface PayoutManagementProps {
  pendingPayouts: any[];
  processingPayouts: any[];
  completedPayouts: any[];
  commissionsByRecipient: any[];
}

export default function PayoutManagement({
  pendingPayouts,
  processingPayouts,
  completedPayouts,
  commissionsByRecipient,
}: PayoutManagementProps) {
  const [selectedTab, setSelectedTab] = useState<'pending' | 'processing' | 'completed' | 'commissions'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);

  const handleProcessPayout = async (payoutId: string) => {
    setProcessing(payoutId);
    try {
      const response = await fetch(`/api/admin/referrals/payouts/${payoutId}/process`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to process payout');

      // Refresh page
      window.location.reload();
    } catch (error) {
      console.error('Error processing payout:', error);
      alert('Failed to process payout');
    } finally {
      setProcessing(null);
    }
  };

  const handleApprovePayout = async (payoutId: string) => {
    if (!confirm('Approve this payout for processing?')) return;

    try {
      const response = await fetch(`/api/admin/referrals/payouts/${payoutId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to approve payout');

      window.location.reload();
    } catch (error) {
      console.error('Error approving payout:', error);
      alert('Failed to approve payout');
    }
  };

  const handleRejectPayout = async (payoutId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/referrals/payouts/${payoutId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error('Failed to reject payout');

      window.location.reload();
    } catch (error) {
      console.error('Error rejecting payout:', error);
      alert('Failed to reject payout');
    }
  };

  const handleCreateBatchPayout = async (recipientId: string, recipientType: 'vendor' | 'affiliate') => {
    if (!confirm('Create payout for all approved commissions for this recipient?')) return;

    try {
      const response = await fetch('/api/admin/referrals/payouts/create-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: recipientId,
          recipient_type: recipientType,
        }),
      });

      if (!response.ok) throw new Error('Failed to create batch payout');

      window.location.reload();
    } catch (error) {
      console.error('Error creating batch payout:', error);
      alert('Failed to create batch payout');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
          <p className="text-gray-600 mt-1">Manage affiliate and vendor payouts</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <TabButton
                active={selectedTab === 'pending'}
                onClick={() => setSelectedTab('pending')}
                icon={<Clock className="h-4 w-4" />}
                label="Pending"
                count={pendingPayouts.length}
              />
              <TabButton
                active={selectedTab === 'processing'}
                onClick={() => setSelectedTab('processing')}
                icon={<AlertCircle className="h-4 w-4" />}
                label="Processing"
                count={processingPayouts.length}
              />
              <TabButton
                active={selectedTab === 'completed'}
                onClick={() => setSelectedTab('completed')}
                icon={<Check className="h-4 w-4" />}
                label="Completed"
                count={completedPayouts.length}
              />
              <TabButton
                active={selectedTab === 'commissions'}
                onClick={() => setSelectedTab('commissions')}
                icon={<DollarSign className="h-4 w-4" />}
                label="Approved Commissions"
                count={commissionsByRecipient.length}
              />
            </nav>
          </div>

          <div className="p-6">
            {/* Pending Payouts */}
            {selectedTab === 'pending' && (
              <div className="space-y-4">
                {pendingPayouts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pending payouts</p>
                ) : (
                  pendingPayouts.map((payout) => (
                    <PayoutCard
                      key={payout.id}
                      payout={payout}
                      actions={
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprovePayout(payout.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectPayout(payout.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      }
                    />
                  ))
                )}
              </div>
            )}

            {/* Processing Payouts */}
            {selectedTab === 'processing' && (
              <div className="space-y-4">
                {processingPayouts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No processing payouts</p>
                ) : (
                  processingPayouts.map((payout) => (
                    <PayoutCard
                      key={payout.id}
                      payout={payout}
                      actions={
                        <button
                          onClick={() => handleProcessPayout(payout.id)}
                          disabled={processing === payout.id}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                          {processing === payout.id ? 'Processing...' : 'Mark Complete'}
                        </button>
                      }
                    />
                  ))
                )}
              </div>
            )}

            {/* Completed Payouts */}
            {selectedTab === 'completed' && (
              <div className="space-y-4">
                {completedPayouts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No completed payouts</p>
                ) : (
                  completedPayouts.map((payout) => <PayoutCard key={payout.id} payout={payout} />)
                )}
              </div>
            )}

            {/* Approved Commissions */}
            {selectedTab === 'commissions' && (
              <div className="space-y-4">
                {commissionsByRecipient.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No approved commissions ready for payout
                  </p>
                ) : (
                  commissionsByRecipient.map((group) => (
                    <div key={group.recipient_id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="font-medium">
                            {group.recipient_type === 'vendor' ? 'Vendor' : 'Affiliate'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {group.commissions.length} commission(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ${group.total.toFixed(2)}
                          </p>
                          <button
                            onClick={() =>
                              handleCreateBatchPayout(group.recipient_id, group.recipient_type)
                            }
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Create Payout
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {group.commissions.map((commission: any) => (
                          <div
                            key={commission.id}
                            className="bg-white p-3 rounded text-sm flex justify-between"
                          >
                            <span className="text-gray-600">
                              {commission.source_type} - $
                              {Number(commission.source_amount).toFixed(2)}
                            </span>
                            <span className="font-medium">
                              ${Number(commission.commission_amount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 border-b-2 font-medium text-sm flex items-center gap-2 ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {icon}
      {label}
      {count > 0 && (
        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
          {count}
        </span>
      )}
    </button>
  );
}

function PayoutCard({ payout, actions }: { payout: any; actions?: React.ReactNode }) {
  const recipientName =
    payout.vendor?.business_name ||
    payout.affiliate?.company_name ||
    payout.affiliate?.contact_name ||
    'Unknown';

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium text-lg">{recipientName}</p>
          <p className="text-sm text-gray-600">
            {payout.vendor ? 'Vendor' : 'Affiliate'} •{' '}
            {new Date(payout.created_at).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Method: {payout.payout_method} • Currency: {payout.currency}
          </p>
          {payout.external_reference && (
            <p className="text-xs text-gray-500 mt-1">Ref: {payout.external_reference}</p>
          )}
          {payout.notes && <p className="text-sm text-gray-600 mt-2">{payout.notes}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">${payout.amount.toFixed(2)}</p>
          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
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
          {actions && <div className="mt-3">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
