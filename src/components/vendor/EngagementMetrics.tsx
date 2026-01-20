'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, MessageSquare, FileText, Download, TrendingUp } from 'lucide-react';

interface EngagementMetricsProps {
  portalVisits: number;
  messagesSent: number;
  formsSubmitted: number;
  deliverablesViewed: number;
  engagementScore: number;
}

export default function EngagementMetrics({
  portalVisits,
  messagesSent,
  formsSubmitted,
  deliverablesViewed,
  engagementScore
}: EngagementMetricsProps) {
  const getEngagementLevel = (score: number) => {
    if (score >= 70) {
      return {
        label: 'Highly Engaged',
        color: 'bg-green-100 text-green-800'
      };
    } else if (score >= 40) {
      return {
        label: 'Moderately Engaged',
        color: 'bg-yellow-100 text-yellow-800'
      };
    } else {
      return {
        label: 'Low Engagement',
        color: 'bg-red-100 text-red-800'
      };
    }
  };

  const level = getEngagementLevel(engagementScore);

  return (
    <div className="space-y-6">
      {/* Engagement Score Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Engagement Score</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-4xl font-bold text-gray-900">{engagementScore}</p>
              <p className="text-lg text-gray-500">/100</p>
            </div>
            <Badge className={`mt-2 ${level.color}`}>
              {level.label}
            </Badge>
          </div>
          <div className="rounded-lg p-3 bg-purple-50 text-purple-600">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${engagementScore}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Activity Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-blue-50 text-blue-600">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Portal Visits</p>
              <p className="text-xl font-bold text-gray-900">{portalVisits}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-green-50 text-green-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Messages</p>
              <p className="text-xl font-bold text-gray-900">{messagesSent}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-yellow-50 text-yellow-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Forms</p>
              <p className="text-xl font-bold text-gray-900">{formsSubmitted}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-orange-50 text-orange-600">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Deliverables</p>
              <p className="text-xl font-bold text-gray-900">{deliverablesViewed}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
