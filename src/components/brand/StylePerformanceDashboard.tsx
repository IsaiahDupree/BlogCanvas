'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, Info, Sparkles, BarChart3 } from 'lucide-react';

/**
 * Style Performance Dashboard
 *
 * @feat-171 PRD Brand: Data backing for style rules with metrics
 *
 * Displays:
 * - Performance metrics for each writing style
 * - Rankings by engagement score
 * - Optimization recommendations
 * - Summary statistics
 */

interface StylePerformance {
  pattern: string;
  confidence: number;
  avgEngagementScore: number;
  sampleSize: number;
  impact: string;
  rank: number;
  category: 'top' | 'medium' | 'low';
  extractedAt: string;
}

interface Recommendation {
  type: 'optimization' | 'warning' | 'info';
  message: string;
  fromStyle?: string;
  toStyle?: string;
  expectedImprovement?: string;
}

interface StylePerformanceData {
  styles: StylePerformance[];
  recommendations: Recommendation[];
  summary: {
    totalStyles: number;
    avgEngagement: number;
    topStyle: string | null;
    bottomStyle: string | null;
  };
}

interface Props {
  clientId: string;
}

export function StylePerformanceDashboard({ clientId }: Props) {
  const [data, setData] = useState<StylePerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/brand/style-performance?clientId=${clientId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch style performance');
        }

        setData({
          styles: result.styles,
          recommendations: result.recommendations,
          summary: result.summary
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (clientId) {
      fetchData();
    }
  }, [clientId]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 animate-pulse" />
          <span className="text-sm text-gray-600">Loading style performance data...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data || data.styles.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Style Data Available</h3>
          <p className="text-sm text-gray-600 mb-4">
            Run the "Learn from Top Posts" analysis to generate style performance metrics.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Total Styles</div>
          <div className="text-2xl font-bold">{data.summary.totalStyles}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Avg Engagement</div>
          <div className="text-2xl font-bold">{data.summary.avgEngagement}/100</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Top Performer</div>
          <div className="text-sm font-medium truncate" title={data.summary.topStyle || ''}>
            {data.summary.topStyle || 'N/A'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Needs Improvement</div>
          <div className="text-sm font-medium truncate" title={data.summary.bottomStyle || ''}>
            {data.summary.bottomStyle || 'N/A'}
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Recommendations</h3>
          {data.recommendations.map((rec, index) => {
            const Icon = rec.type === 'optimization' ? TrendingUp : rec.type === 'warning' ? AlertTriangle : Info;
            const variant = rec.type === 'optimization' ? 'default' : rec.type === 'warning' ? 'destructive' : 'secondary';

            return (
              <Alert key={index} variant={variant as any}>
                <Icon className="h-4 w-4" />
                <AlertDescription>
                  {rec.message}
                  {rec.expectedImprovement && (
                    <span className="ml-2 font-semibold text-green-600">
                      {rec.expectedImprovement}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Style Rankings */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Style Rankings by Performance</h3>
        <div className="space-y-2">
          {data.styles.map((style) => (
            <Card key={style.pattern} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-semibold">#{style.rank}</span>
                    <Badge
                      variant={
                        style.category === 'top' ? 'default' :
                        style.category === 'medium' ? 'secondary' :
                        'outline'
                      }
                      className={
                        style.category === 'top' ? 'bg-green-100 text-green-800 border-green-300' :
                        style.category === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                        'bg-red-100 text-red-800 border-red-300'
                      }
                    >
                      {style.category === 'top' ? 'Top Performer' :
                       style.category === 'medium' ? 'Medium' :
                       'Needs Work'}
                    </Badge>
                  </div>
                  <h4 className="font-medium mb-2">{style.pattern}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Engagement:</span>
                      <div className="font-semibold flex items-center gap-1">
                        {style.avgEngagementScore}/100
                        {style.avgEngagementScore >= 70 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : style.avgEngagementScore <= 50 ? (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Confidence:</span>
                      <div className="font-semibold">{style.confidence}%</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Sample Size:</span>
                      <div className="font-semibold">{style.sampleSize} posts</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Impact:</span>
                      <div className="font-semibold">{style.impact}</div>
                    </div>
                  </div>
                </div>

                {/* Visual engagement bar */}
                <div className="flex-shrink-0 w-24">
                  <div className="text-xs text-gray-600 mb-1 text-right">Score</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        style.avgEngagementScore >= 70 ? 'bg-green-500' :
                        style.avgEngagementScore >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${style.avgEngagementScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t">
        Last updated: {data.styles[0] ? new Date(data.styles[0].extractedAt).toLocaleString() : 'N/A'}
      </div>
    </div>
  );
}
