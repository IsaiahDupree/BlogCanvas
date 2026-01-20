'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, DollarSign } from 'lucide-react';

interface PipelineStage {
  stage: string;
  label: string;
  count: number;
  value: number;
  color: string;
}

interface PipelineBoardProps {
  stages: PipelineStage[];
  onStageClick: (stage: string) => void;
  selectedStage?: string | null;
}

export default function PipelineBoard({ stages, onStageClick, selectedStage }: PipelineBoardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const colorClasses = {
    gray: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    green: 'bg-green-50 border-green-200 hover:bg-green-100',
    yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    indigo: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stages.map((stage, index) => {
        const isSelected = selectedStage === stage.stage;
        const colorClass = colorClasses[stage.color as keyof typeof colorClasses];

        return (
          <div key={stage.stage} className="relative">
            {index < stages.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-0">
                <ArrowRight className="h-5 w-5 text-gray-300" />
              </div>
            )}

            <Card
              className={`p-4 cursor-pointer transition-all relative z-10 ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              } ${colorClass} border-2`}
              onClick={() => onStageClick(isSelected ? '' : stage.stage)}
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
  );
}
