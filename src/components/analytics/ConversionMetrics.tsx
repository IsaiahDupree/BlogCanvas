'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, DollarSign, Activity } from 'lucide-react';

interface ConversionGoal {
  goal_id: string;
  goal_name: string;
  goal_type: 'event' | 'pageview' | 'custom';
  conversions: number;
  target_count: number | null;
  target_value: number | null;
  progress: number | null;
}

interface ConversionData {
  post_id: string;
  total_conversions: number;
  snapshot_date: string | null;
  goal_breakdown: ConversionGoal[];
  has_metrics: boolean;
}

interface ConversionMetricsProps {
  postId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export default function ConversionMetrics({
  postId,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds default
}: ConversionMetricsProps) {
  const [data, setData] = useState<ConversionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversionData = async () => {
    try {
      const response = await fetch(`/api/blog-posts/${postId}/conversions`);

      if (!response.ok) {
        throw new Error('Failed to fetch conversion data');
      }

      const conversionData = await response.json();
      setData(conversionData);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversion data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversionData();

    if (autoRefresh) {
      const interval = setInterval(fetchConversionData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [postId, autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Conversion Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading conversion data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Conversion Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-destructive">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const hasGoals = data.goal_breakdown.length > 0;
  const totalValue = data.goal_breakdown.reduce((sum, goal) => {
    return sum + (goal.conversions * (goal.target_value || 0));
  }, 0);

  return (
    <div className="space-y-4">
      {/* Total Conversions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Total Conversions
          </CardTitle>
          {data.snapshot_date && (
            <CardDescription>
              Last updated: {new Date(data.snapshot_date).toLocaleDateString()}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Count */}
            <div className="flex flex-col">
              <div className="text-3xl font-bold">{data.total_conversions}</div>
              <div className="text-sm text-muted-foreground">Total Conversions</div>
            </div>

            {/* Total Value (if applicable) */}
            {totalValue > 0 && (
              <div className="flex flex-col">
                <div className="text-3xl font-bold flex items-center gap-1">
                  <DollarSign className="h-6 w-6" />
                  {totalValue.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Estimated Value</div>
              </div>
            )}
          </div>

          {!data.has_metrics && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                No conversion data available yet. Data will appear after the first metrics collection.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Breakdown */}
      {hasGoals && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Conversion Goals
            </CardTitle>
            <CardDescription>
              Track performance against specific conversion goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.goal_breakdown.map((goal) => (
                <div key={goal.goal_id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium">{goal.goal_name}</div>
                      <Badge variant="outline" className="mt-1">
                        {goal.goal_type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{goal.conversions}</div>
                      {goal.target_count && (
                        <div className="text-sm text-muted-foreground">
                          of {goal.target_count} target
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {goal.progress !== null && (
                    <div className="space-y-1">
                      <Progress value={Math.min(goal.progress, 100)} className="h-2" />
                      <div className="text-xs text-muted-foreground text-right">
                        {goal.progress.toFixed(1)}% complete
                      </div>
                    </div>
                  )}

                  {/* Value */}
                  {goal.target_value && goal.target_value > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      {goal.target_value.toFixed(2)} per conversion
                      <span className="ml-2">
                        ({(goal.conversions * goal.target_value).toFixed(2)} total)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Goals Message */}
      {!hasGoals && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              No Conversion Goals Set
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Set up conversion goals in your website settings to track specific actions like form
              submissions, purchases, or newsletter signups.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
