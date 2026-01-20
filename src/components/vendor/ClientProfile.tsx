'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Calendar, DollarSign, FileText, MessageSquare, Eye } from 'lucide-react';

interface ClientProfileProps {
  client: {
    email: string;
    full_name?: string;
    phone?: string;
    status: string;
    created_at: string;
    first_page_title?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    page_views: number;
    last_activity_at?: string;
    total_spent: number;
    total_workspaces: number;
    message_count: number;
  };
}

export default function ClientProfile({ client }: ClientProfileProps) {
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
      case 'customer':
        return 'bg-green-100 text-green-800';
      case 'lead':
        return 'bg-blue-100 text-blue-800';
      case 'churned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {client.full_name || 'Client'}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {client.email}
              </div>
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {client.phone}
                </div>
              )}
            </div>
          </div>

          <Badge className={getStatusColor(client.status)}>
            {client.status}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-3 bg-green-50 text-green-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="font-semibold text-gray-900">
                {formatCurrency(client.total_spent)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg p-3 bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Workspaces</p>
              <p className="font-semibold text-gray-900">{client.total_workspaces}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg p-3 bg-purple-50 text-purple-600">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Page Views</p>
              <p className="font-semibold text-gray-900">{client.page_views}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg p-3 bg-orange-50 text-orange-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Messages</p>
              <p className="font-semibold text-gray-900">{client.message_count}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Attribution & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attribution</h3>
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

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
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
    </div>
  );
}
