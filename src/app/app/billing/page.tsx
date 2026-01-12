/**
 * Billing Dashboard
 * Manage subscription plans, invoices, and payment links
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  interval: string;
  interval_count: number;
  is_active: boolean;
  created_at: string;
}

interface Subscription {
  id: string;
  client_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  client: {
    company_name: string;
    contact_email: string;
  };
  plan: {
    name: string;
    amount: number;
    currency: string;
    interval: string;
  };
}

interface Invoice {
  id: string;
  client_id: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  description: string;
  invoice_number: string | null;
  hosted_invoice_url: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  client: {
    company_name: string;
  };
}

export default function BillingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions' | 'invoices'>('subscriptions');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePlanDialog, setShowCreatePlanDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'plans') {
        const res = await fetch('/api/subscriptions/plans');
        const data = await res.json();
        setPlans(data.plans || []);
      } else if (activeTab === 'subscriptions') {
        const res = await fetch('/api/subscriptions');
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      } else if (activeTab === 'invoices') {
        const res = await fetch('/api/invoices');
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number, currency: string = 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'canceled':
      case 'void':
        return 'bg-gray-100 text-gray-800';
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Billing & Subscriptions</h1>
          <p className="text-gray-600">
            Manage subscription plans, track invoices, and handle payments
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subscriptions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plans'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Plans
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invoices'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Invoices
            </button>
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <div className="bg-white rounded-lg shadow">
                {subscriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No active subscriptions</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Period
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {subscriptions.map((subscription) => (
                          <tr key={subscription.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {subscription.client.company_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {subscription.client.contact_email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {subscription.plan.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                  subscription.status
                                )}`}
                              >
                                {subscription.status}
                              </span>
                              {subscription.cancel_at_period_end && (
                                <span className="ml-2 text-xs text-red-600">
                                  (Canceling)
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(subscription.current_period_start)} -{' '}
                              {formatDate(subscription.current_period_end)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(subscription.plan.amount, subscription.plan.currency)}/
                              {subscription.plan.interval}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Plans Tab */}
            {activeTab === 'plans' && (
              <div>
                <div className="mb-4">
                  <button
                    onClick={() => setShowCreatePlanDialog(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Create New Plan
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-white rounded-lg shadow p-6 border-2 border-gray-200 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            plan.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {plan.description && (
                        <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                      )}

                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {formatCurrency(plan.amount, plan.currency)}
                      </div>
                      <div className="text-sm text-gray-500 mb-4">
                        per {plan.interval_count > 1 ? `${plan.interval_count} ` : ''}
                        {plan.interval}
                        {plan.interval_count > 1 ? 's' : ''}
                      </div>

                      <div className="text-xs text-gray-500">
                        Created {formatDate(plan.created_at)}
                      </div>
                    </div>
                  ))}

                  {plans.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
                      <p className="text-gray-500">No subscription plans created yet</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Create your first plan to start billing clients
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <div className="bg-white rounded-lg shadow">
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No invoices</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invoice #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {invoice.invoice_number || 'Draft'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {invoice.client.company_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                              {invoice.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(invoice.amount_due, invoice.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                  invoice.status
                                )}`}
                              >
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {invoice.paid_at
                                ? formatDate(invoice.paid_at)
                                : invoice.due_date
                                ? `Due ${formatDate(invoice.due_date)}`
                                : formatDate(invoice.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
