'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Recipient {
  id: string;
  email: string;
  client_id: string | null;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  created_at: string;
  clients?: {
    id: string;
    company_name: string;
    contact_name: string;
  };
}

interface CampaignAnalytics {
  campaign: {
    id: string;
    subject: string;
    status: string;
  };
  stats: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    pending: number;
  };
  rates: {
    open_rate: number;
    click_rate: number;
    bounce_rate: number;
    unsubscribe_rate: number;
  };
}

export default function RecipientManagementPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [newEmails, setNewEmails] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (campaignId) {
      fetchData();
    }
  }, [campaignId, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const filterParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const [recipientsRes, analyticsRes] = await Promise.all([
        fetch(`/api/newsletters/campaigns/${campaignId}/recipients${filterParam}`),
        fetch(`/api/newsletters/campaigns/${campaignId}/analytics`)
      ]);

      if (recipientsRes.ok) {
        const data = await recipientsRes.json();
        setRecipients(data.recipients || []);
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipients = async () => {
    const emails = newEmails
      .split(/[\n,]/)
      .map(e => e.trim())
      .filter(e => e.includes('@'));

    if (emails.length === 0) {
      alert('Please enter at least one valid email address');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/newsletters/campaigns/${campaignId}/recipients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Added ${result.added} recipients (${result.duplicates} duplicates skipped)`);
        setNewEmails('');
        setShowAddDialog(false);
        fetchData();
      } else {
        const { error } = await response.json();
        alert(`Failed to add recipients: ${error}`);
      }
    } catch (error) {
      console.error('Error adding recipients:', error);
      alert('Failed to add recipients');
    } finally {
      setProcessing(false);
    }
  };

  const handleImportCSV = async () => {
    if (!importFile) {
      alert('Please select a CSV file');
      return;
    }

    setProcessing(true);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await fetch(`/api/newsletters/campaigns/${campaignId}/recipients/import`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        const message = `Imported ${result.imported} recipients (${result.duplicates} duplicates skipped)`;
        const errorsMsg = result.errors && result.errors.length > 0
          ? `\n\nWarnings:\n${result.errors.slice(0, 5).join('\n')}${result.errors.length > 5 ? `\n...and ${result.errors.length - 5} more` : ''}`
          : '';
        alert(message + errorsMsg);
        setImportFile(null);
        setShowImportDialog(false);
        fetchData();
      } else {
        const { error, errors } = await response.json();
        alert(`Failed to import: ${error}\n${errors?.join('\n') || ''}`);
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('Failed to import CSV');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveRecipient = async (recipientId: string) => {
    if (!confirm('Are you sure you want to remove this recipient?')) return;

    try {
      const response = await fetch(
        `/api/newsletters/campaigns/${campaignId}/recipients/${recipientId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        fetchData();
      } else {
        const { error } = await response.json();
        alert(`Failed to remove recipient: ${error}`);
      }
    } catch (error) {
      console.error('Error removing recipient:', error);
      alert('Failed to remove recipient');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'opened': return 'bg-purple-100 text-purple-800';
      case 'clicked': return 'bg-indigo-100 text-indigo-800';
      case 'bounced': return 'bg-red-100 text-red-800';
      case 'unsubscribed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-700 mb-4 flex items-center gap-2"
          >
            ← Back to Campaigns
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Recipient Management
          </h1>
          {analytics && (
            <p className="text-gray-600">Campaign: {analytics.campaign.subject}</p>
          )}
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            <StatCard label="Total" value={analytics.stats.total} color="gray" />
            <StatCard label="Pending" value={analytics.stats.pending} color="gray" />
            <StatCard label="Sent" value={analytics.stats.sent} color="blue" />
            <StatCard label="Delivered" value={analytics.stats.delivered} color="green" />
            <StatCard label="Opened" value={analytics.stats.opened} color="purple" />
            <StatCard label="Clicked" value={analytics.stats.clicked} color="indigo" />
            <StatCard label="Bounced" value={analytics.stats.bounced} color="red" />
            <StatCard label="Unsubscribed" value={analytics.stats.unsubscribed} color="orange" />
          </div>
        )}

        {/* Rates */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <RateCard label="Open Rate" value={analytics.rates.open_rate} />
            <RateCard label="Click Rate" value={analytics.rates.click_rate} />
            <RateCard label="Bounce Rate" value={analytics.rates.bounce_rate} />
            <RateCard label="Unsubscribe Rate" value={analytics.rates.unsubscribe_rate} />
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setShowAddDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            Add Recipients
          </button>
          <button
            onClick={() => setShowImportDialog(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span>📥</span>
            Import CSV
          </button>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="opened">Opened</option>
            <option value="clicked">Clicked</option>
            <option value="bounced">Bounced</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </div>

        {/* Recipients Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading recipients...</p>
          </div>
        ) : recipients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No recipients yet</h3>
            <p className="text-gray-600 mb-6">Add recipients to this campaign</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timeline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recipients.map((recipient) => (
                    <tr key={recipient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {recipient.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {recipient.clients ? (
                          <div>
                            <div className="font-medium">{recipient.clients.company_name}</div>
                            <div className="text-xs">{recipient.clients.contact_name}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(recipient.status)}`}>
                          {recipient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {recipient.sent_at && <div>Sent: {new Date(recipient.sent_at).toLocaleString()}</div>}
                        {recipient.opened_at && <div>Opened: {new Date(recipient.opened_at).toLocaleString()}</div>}
                        {recipient.clicked_at && <div>Clicked: {new Date(recipient.clicked_at).toLocaleString()}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleRemoveRecipient(recipient.id)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Recipients Dialog */}
        {showAddDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Add Recipients</h2>
              <p className="text-gray-600 mb-4">
                Enter email addresses (one per line or comma-separated):
              </p>
              <textarea
                value={newEmails}
                onChange={(e) => setNewEmails(e.target.value)}
                placeholder="example1@example.com&#10;example2@example.com&#10;example3@example.com"
                className="w-full h-40 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              />
              <div className="flex gap-4">
                <button
                  onClick={handleAddRecipients}
                  disabled={processing}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {processing ? 'Adding...' : 'Add Recipients'}
                </button>
                <button
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewEmails('');
                  }}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import CSV Dialog */}
        {showImportDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Import Recipients from CSV</h2>
              <p className="text-gray-600 mb-4">
                Upload a CSV file with an "email" column. Other columns will be ignored.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleImportCSV}
                  disabled={processing || !importFile}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {processing ? 'Importing...' : 'Import'}
                </button>
                <button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportFile(null);
                  }}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-50 border-gray-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    red: 'bg-red-50 border-red-200',
    orange: 'bg-orange-50 border-orange-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color] || colorClasses.gray}`}>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
  );
}

// Rate Card Component
function RateCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="text-3xl font-bold text-indigo-600">{value}%</div>
      <div className="text-sm text-gray-600 mt-2">{label}</div>
    </div>
  );
}
