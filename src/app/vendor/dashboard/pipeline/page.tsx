'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Users, DollarSign } from 'lucide-react';

interface PipelineStage {
  stage: 'prospect' | 'booked' | 'paid' | 'onboarding' | 'active' | 'completed';
  label: string;
  count: number;
  value: number;
  color: string;
}

interface PipelineClient {
  id: string;
  email: string;
  full_name?: string;
  stage: string;
  workspace_status?: string;
  total_value: number;
  created_at: string;
}

export default function VendorPipelinePage() {
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [clients, setClients] = useState<PipelineClient[]>([]);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  useEffect(() => {
    loadPipelineData();
  }, []);

  const loadPipelineData = async () => {
    try {
      const response = await fetch('/api/vendor/pipeline');
      const data = await response.json();

      if (data.success) {
        setStages(data.stages || []);
        setClients(data.clients || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading pipeline:', error);
      setLoading(false);
    }
  };

  const filteredClients = selectedStage
    ? clients.filter((c) => {
        if (selectedStage === 'prospect') return c.stage === 'lead' && !c.workspace_status;
        if (selectedStage === 'booked') return c.stage === 'lead'; // Has booked
        if (selectedStage === 'paid') return c.stage === 'customer' && c.workspace_status === 'onboarding';
        if (selectedStage === 'onboarding') return c.workspace_status === 'onboarding';
        if (selectedStage === 'active') return c.workspace_status === 'active';
        if (selectedStage === 'completed') return c.workspace_status === 'completed';
        return false;
      })
    : clients;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const defaultStages: PipelineStage[] = [
    { stage: 'prospect', label: 'Prospect', count: 0, value: 0, color: 'gray' },
    { stage: 'booked', label: 'Booked', count: 0, value: 0, color: 'blue' },
    { stage: 'paid', label: 'Paid', count: 0, value: 0, color: 'green' },
    { stage: 'onboarding', label: 'Onboarding', count: 0, value: 0, color: 'yellow' },
    { stage: 'active', label: 'Active', count: 0, value: 0, color: 'purple' },
    { stage: 'completed', label: 'Completed', count: 0, value: 0, color: 'indigo' }
  ];

  const displayStages = stages.length > 0 ? stages : defaultStages;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pipeline</h1>
        <p className="text-gray-600 mt-1">
          Track clients through your sales and delivery pipeline
        </p>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {displayStages.map((stage, index) => {
          const isSelected = selectedStage === stage.stage;
          const colorClasses = {
            gray: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
            blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
            green: 'bg-green-50 border-green-200 hover:bg-green-100',
            yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
            purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
            indigo: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
          };

          const colorClass = colorClasses[stage.color as keyof typeof colorClasses];

          return (
            <div key={stage.stage} className="relative">
              {index < displayStages.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-0">
                  <ArrowRight className="h-5 w-5 text-gray-300" />
                </div>
              )}

              <Card
                className={`p-4 cursor-pointer transition-all relative z-10 ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                } ${colorClass} border-2`}
                onClick={() => setSelectedStage(isSelected ? null : stage.stage)}
              >
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    {stage.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stage.count}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatCurrency(stage.value)}
                  </p>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Total Pipeline Value */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pipeline Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(displayStages.reduce((sum, s) => sum + s.value, 0))}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Across all stages
              </p>
            </div>
            <div className="rounded-lg p-3 bg-purple-50 text-purple-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {displayStages.reduce((sum, s) => sum + s.count, 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                In pipeline
              </p>
            </div>
            <div className="rounded-lg p-3 bg-blue-50 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Clients in Selected Stage */}
      {selectedStage && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              {displayStages.find((s) => s.stage === selectedStage)?.label} Clients
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No clients in this stage
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {client.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge>
                          {client.workspace_status || client.stage}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(client.total_value)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => window.location.href = `/vendor/clients/${client.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
