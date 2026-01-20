'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type ReportConfig = {
  name: string;
  dateRange: 'last7days' | 'last30days' | 'last90days' | 'custom';
  metrics: string[];
  groupBy: 'day' | 'week' | 'month';
  format: 'table' | 'chart' | 'both';
};

/**
 * Report Builder Component
 * Allows users to build custom reports
 */
export function ReportBuilder() {
  const [config, setConfig] = useState<ReportConfig>({
    name: 'Custom Report',
    dateRange: 'last30days',
    metrics: [],
    groupBy: 'day',
    format: 'both',
  });

  const availableMetrics = [
    { id: 'revenue', label: 'Revenue' },
    { id: 'orders', label: 'Orders' },
    { id: 'customers', label: 'New Customers' },
    { id: 'pageViews', label: 'Page Views' },
    { id: 'conversions', label: 'Conversions' },
    { id: 'avgOrderValue', label: 'Avg Order Value' },
    { id: 'retention', label: 'Retention Rate' },
    { id: 'churn', label: 'Churn Rate' },
  ];

  const toggleMetric = (metricId: string) => {
    setConfig((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter((m) => m !== metricId)
        : [...prev.metrics, metricId],
    }));
  };

  const generateReport = async () => {
    console.log('Generating report with config:', config);
    // Implementation for report generation
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration Panel */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range */}
            <div>
              <Label>Date Range</Label>
              <Select
                value={config.dateRange}
                onValueChange={(v: any) => setConfig({ ...config, dateRange: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="last90days">Last 90 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Metrics Selection */}
            <div>
              <Label className="mb-3 block">Select Metrics</Label>
              <div className="grid grid-cols-2 gap-3">
                {availableMetrics.map((metric) => (
                  <div key={metric.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric.id}
                      checked={config.metrics.includes(metric.id)}
                      onCheckedChange={() => toggleMetric(metric.id)}
                    />
                    <label
                      htmlFor={metric.id}
                      className="text-sm cursor-pointer"
                    >
                      {metric.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Group By */}
            <div>
              <Label>Group By</Label>
              <Select
                value={config.groupBy}
                onValueChange={(v: any) => setConfig({ ...config, groupBy: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format */}
            <div>
              <Label>Display Format</Label>
              <Select
                value={config.format}
                onValueChange={(v: any) => setConfig({ ...config, format: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table Only</SelectItem>
                  <SelectItem value="chart">Chart Only</SelectItem>
                  <SelectItem value="both">Both Table & Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={generateReport} disabled={config.metrics.length === 0}>
                Generate Report
              </Button>
              <Button variant="outline">Save Template</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {config.metrics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Select metrics to preview your report
              </p>
            ) : (
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium">Selected Metrics:</p>
                  <ul className="mt-2 space-y-1">
                    {config.metrics.map((metricId) => {
                      const metric = availableMetrics.find((m) => m.id === metricId);
                      return (
                        <li key={metricId} className="text-muted-foreground">
                          • {metric?.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Period:</p>
                  <p className="text-muted-foreground mt-1">{config.dateRange}</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Grouping:</p>
                  <p className="text-muted-foreground mt-1">By {config.groupBy}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
