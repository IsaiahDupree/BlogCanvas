'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Insight = {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  timestamp: string;
};

/**
 * AI Insights Dashboard
 * Displays AI-generated business insights
 */
export function AIInsightsDashboard() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/insights');

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data.insights || []);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'trend':
        return '📈';
      case 'anomaly':
        return '⚠️';
      case 'opportunity':
        return '💡';
      case 'warning':
        return '🔴';
      default:
        return '📊';
    }
  };

  const getImpactColor = (impact: Insight['impact']) => {
    switch (impact) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">
            No insights available yet. Check back soon as our AI analyzes your data!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Insights</CardDescription>
            <CardTitle className="text-3xl">{insights.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>High Impact</CardDescription>
            <CardTitle className="text-3xl">
              {insights.filter((i) => i.impact === 'high').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Opportunities</CardDescription>
            <CardTitle className="text-3xl">
              {insights.filter((i) => i.type === 'opportunity').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Anomalies</CardDescription>
            <CardTitle className="text-3xl">
              {insights.filter((i) => i.type === 'anomaly').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight) => (
          <Card key={insight.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                  <CardTitle className="text-lg">{insight.title}</CardTitle>
                </div>
                <Badge variant={getImpactColor(insight.impact)}>
                  {insight.impact}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {insight.description}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Confidence: {insight.confidence}%
                </span>
                {insight.actionable && (
                  <Badge variant="outline" className="text-xs">
                    Actionable
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
