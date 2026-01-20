'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  Eye,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

interface ClientProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  status: string;
  created_at: string;

  // Attribution
  first_page_title?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;

  // Activity
  page_views: number;
  last_activity_at?: string;

  // Workspaces
  workspaces: Array<{
    id: string;
    name: string;
    status: string;
    started_at: string;
  }>;

  // Orders
  orders: Array<{
    id: string;
    order_number: string;
    total_amount: number;
    payment_status: string;
    created_at: string;
  }>;

  // Meetings
  meetings: Array<{
    id: string;
    title: string;
    start_time: string;
    status: string;
  }>;

  // Messages
  message_count: number;

  // Totals
  total_spent: number;
  total_workspaces: number;
}

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientProfile | null>(null);

  useEffect(() => {
    if (params.id) {
      loadClientProfile();
    }
  }, [params.id]);

  const loadClientProfile = async () => {
    try {
      const response = await fetch(`/api/vendor/clients/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setClient(data.client);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading client:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'customer':
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'onboarding':
        return 'bg-yellow-100 text-yellow-800';
      case 'lead':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8">
        <Card className="p-6 text-center">
          <p className="text-gray-600">Client not found</p>
          <button
            onClick={() => router.push('/vendor/dashboard/leads')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Leads
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/vendor/dashboard/leads')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {client.full_name || 'Client Profile'}
            </h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {client.email}
            </p>
            {client.phone && (
              <p className="text-gray-600 mt-1">{client.phone}</p>
            )}
          </div>
        </div>

        <Badge className={getStatusColor(client.status)}>
          {client.status}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(client.total_spent)}
              </p>
            </div>
            <div className="rounded-lg p-3 bg-green-50 text-green-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Workspaces</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {client.total_workspaces}
              </p>
            </div>
            <div className="rounded-lg p-3 bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Page Views</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {client.page_views}
              </p>
            </div>
            <div className="rounded-lg p-3 bg-purple-50 text-purple-600">
              <Eye className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Messages</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {client.message_count}
              </p>
            </div>
            <div className="rounded-lg p-3 bg-orange-50 text-orange-600">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attribution */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attribution</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">First Seen</p>
              <p className="font-medium text-gray-900">{formatDate(client.created_at)}</p>
            </div>
            {client.first_page_title && (
              <div>
                <p className="text-sm text-gray-500">First Page</p>
                <p className="font-medium text-gray-900">{client.first_page_title}</p>
              </div>
            )}
            {client.utm_source && (
              <div>
                <p className="text-sm text-gray-500">Source</p>
                <p className="font-medium text-gray-900">
                  {client.utm_source}
                  {client.utm_medium && ` / ${client.utm_medium}`}
                </p>
              </div>
            )}
            {client.utm_campaign && (
              <div>
                <p className="text-sm text-gray-500">Campaign</p>
                <p className="font-medium text-gray-900">{client.utm_campaign}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {client.last_activity_at && (
              <div>
                <p className="text-sm text-gray-500">Last Activity</p>
                <p className="font-medium text-gray-900">{formatDate(client.last_activity_at)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Total Page Views</p>
              <p className="font-medium text-gray-900">{client.page_views} views</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Workspaces */}
      {client.workspaces.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Workspaces</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {client.workspaces.map((workspace) => (
              <div key={workspace.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{workspace.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(workspace.started_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(workspace.status)}>
                      {workspace.status}
                    </Badge>
                    <button
                      onClick={() => router.push(`/vendor/workspaces/${workspace.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Orders */}
      {client.orders.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {client.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm">{order.order_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(order.payment_status)}>
                        {order.payment_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Meetings */}
      {client.meetings.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Meetings</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {client.meetings.map((meeting) => (
              <div key={meeting.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{meeting.title}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(meeting.start_time)}
                    </p>
                  </div>
                  <Badge className={getStatusColor(meeting.status)}>
                    {meeting.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
