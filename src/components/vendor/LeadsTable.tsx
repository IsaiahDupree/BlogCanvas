'use client';

import { Badge } from '@/components/ui/badge';
import { Eye, Calendar, DollarSign } from 'lucide-react';

interface Lead {
  id: string;
  email: string;
  full_name?: string;
  status: 'lead' | 'customer' | 'churned';
  first_page_title?: string;
  utm_source?: string;
  utm_campaign?: string;
  created_at: string;
  page_views: number;
  has_booked_call: boolean;
  has_purchased: boolean;
}

interface LeadsTableProps {
  leads: Lead[];
  onViewDetails: (leadId: string) => void;
}

export default function LeadsTable({ leads, onViewDetails }: LeadsTableProps) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  if (leads.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        No leads found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Activity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              First Seen
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="font-medium text-gray-900">
                    {lead.full_name || 'Anonymous'}
                  </div>
                  <div className="text-sm text-gray-500">{lead.email}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge className={getStatusColor(lead.status)}>
                  {lead.status}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm">
                  {lead.first_page_title && (
                    <div className="font-medium text-gray-900">
                      {lead.first_page_title}
                    </div>
                  )}
                  {lead.utm_source && (
                    <div className="text-gray-500">
                      {lead.utm_source}
                      {lead.utm_campaign && ` / ${lead.utm_campaign}`}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {lead.page_views}
                  </div>
                  {lead.has_booked_call && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Calendar className="h-3 w-3 mr-1" />
                      Call
                    </Badge>
                  )}
                  {lead.has_purchased && (
                    <Badge className="bg-green-100 text-green-800">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Paid
                    </Badge>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(lead.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onViewDetails(lead.id)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
