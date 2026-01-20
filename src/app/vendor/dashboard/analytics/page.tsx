'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Users, DollarSign, ShoppingCart, Eye, MousePointerClick, PlayCircle, CreditCard, Check } from 'lucide-react';
import type { FunnelMetrics } from '@/types/analytics';

export default function VendorAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics | null>(null);
  const [pageMetrics, setPageMetrics] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load funnel metrics
      const funnelResponse = await fetch(`/api/vendor/analytics/funnel?range=${dateRange}`);
      const funnelData = await funnelResponse.json();
      if (funnelData.success) {
        setFunnelMetrics(funnelData.metrics);
      }

      // Load page metrics
      const pagesResponse = await fetch(`/api/vendor/analytics/pages?range=${dateRange}`);
      const pagesData = await pagesResponse.json();
      if (pagesData.success) {
        setPageMetrics(pagesData.pages || []);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track your funnel performance and conversions</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2">
          <Button
            variant={dateRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('7d')}
          >
            Last 7 Days
          </Button>
          <Button
            variant={dateRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('30d')}
          >
            Last 30 Days
          </Button>
          <Button
            variant={dateRange === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('90d')}
          >
            Last 90 Days
          </Button>
        </div>
      </div>

      {/* Funnel Visualization */}
      {funnelMetrics && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Conversion Funnel</h2>

          <div className="space-y-4">
            {/* Page Views */}
            <FunnelStep
              icon={<Eye className="h-5 w-5" />}
              label="Page Views"
              count={funnelMetrics.total_visitors}
              percentage={100}
              color="bg-blue-500"
            />

            {/* Scrolled 50% */}
            <FunnelStep
              icon={<MousePointerClick className="h-5 w-5" />}
              label="Scrolled 50%"
              count={funnelMetrics.scrolled_50_percent}
              percentage={funnelMetrics.total_visitors > 0 ? (funnelMetrics.scrolled_50_percent / funnelMetrics.total_visitors) * 100 : 0}
              color="bg-indigo-500"
            />

            {/* Played VSL */}
            <FunnelStep
              icon={<PlayCircle className="h-5 w-5" />}
              label="Played VSL"
              count={funnelMetrics.played_vsl}
              percentage={funnelMetrics.total_visitors > 0 ? (funnelMetrics.played_vsl / funnelMetrics.total_visitors) * 100 : 0}
              color="bg-purple-500"
            />

            {/* Clicked CTA */}
            <FunnelStep
              icon={<MousePointerClick className="h-5 w-5" />}
              label="Clicked CTA"
              count={funnelMetrics.clicked_cta}
              percentage={funnelMetrics.total_visitors > 0 ? (funnelMetrics.clicked_cta / funnelMetrics.total_visitors) * 100 : 0}
              color="bg-pink-500"
            />

            {/* Started Checkout */}
            <FunnelStep
              icon={<ShoppingCart className="h-5 w-5" />}
              label="Started Checkout"
              count={funnelMetrics.started_checkout}
              percentage={funnelMetrics.total_visitors > 0 ? (funnelMetrics.started_checkout / funnelMetrics.total_visitors) * 100 : 0}
              color="bg-orange-500"
            />

            {/* Completed Checkout */}
            <FunnelStep
              icon={<Check className="h-5 w-5" />}
              label="Completed Purchase"
              count={funnelMetrics.completed_checkout}
              percentage={funnelMetrics.total_visitors > 0 ? (funnelMetrics.completed_checkout / funnelMetrics.total_visitors) * 100 : 0}
              color="bg-green-500"
            />
          </div>

          {/* Overall Conversion Rate */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Conversion Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {funnelMetrics.conversion_rate.toFixed(2)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Conversions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {funnelMetrics.completed_checkout}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Top Performing Pages */}
      {pageMetrics.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performing Pages</h2>

          <div className="space-y-4">
            {pageMetrics.map((page) => (
              <div key={page.page_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{page.title}</h3>
                  <p className="text-sm text-gray-600">/{page.slug}</p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">Views</p>
                    <p className="font-semibold text-gray-900">{page.views || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Conversions</p>
                    <p className="font-semibold text-green-600">{page.conversions || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Revenue</p>
                    <p className="font-semibold text-blue-600">${(page.revenue || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!funnelMetrics && pageMetrics.length === 0 && (
        <Card className="p-12 text-center">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data Yet</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Start driving traffic to your offer pages to see analytics data here.
          </p>
        </Card>
      )}
    </div>
  );
}

// Funnel Step Component
interface FunnelStepProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

function FunnelStep({ icon, label, count, percentage, color }: FunnelStepProps) {
  return (
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-gray-900`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-900">{label}</span>
          <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
        </div>
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 ${color} rounded-full transition-all`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      <div className="text-right min-w-[80px]">
        <p className="text-2xl font-bold text-gray-900">{count.toLocaleString()}</p>
      </div>
    </div>
  );
}
