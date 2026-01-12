'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Settings, TrendingUp } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  created_at: string;
}

interface UsageStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time_ms: number;
  requests_by_endpoint: Record<string, number>;
  requests_by_day: Record<string, number>;
}

interface ApiKeyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: ApiKey;
  onKeyUpdated: () => void;
  onKeyDeleted: () => void;
}

export function ApiKeyDetailsDialog({
  open,
  onOpenChange,
  apiKey,
  onKeyUpdated,
  onKeyDeleted,
}: ApiKeyDetailsDialogProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsageStats();
    }
  }, [open, apiKey.id]);

  async function fetchUsageStats() {
    try {
      setLoadingStats(true);
      const response = await fetch(`/api/api-keys/${apiKey.id}/usage`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }

  async function handleToggleActive() {
    try {
      setToggling(true);
      const response = await fetch(`/api/api-keys/${apiKey.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !apiKey.is_active }),
      });

      if (response.ok) {
        onKeyUpdated();
      } else {
        alert('Failed to update API key');
      }
    } catch (error) {
      console.error('Failed to update API key:', error);
      alert('Failed to update API key');
    } finally {
      setToggling(false);
    }
  }

  const topEndpoints = stats
    ? Object.entries(stats.requests_by_endpoint || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    : [];

  const successRate = stats
    ? stats.total_requests > 0
      ? ((stats.successful_requests / stats.total_requests) * 100).toFixed(1)
      : '0'
    : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {apiKey.name}
            {apiKey.is_active ? (
              <Badge variant="default">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            API key details and usage statistics
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">
              <Settings className="w-4 h-4 mr-2" />
              Info
            </TabsTrigger>
            <TabsTrigger value="scopes">
              <Activity className="w-4 h-4 mr-2" />
              Scopes
            </TabsTrigger>
            <TabsTrigger value="usage">
              <TrendingUp className="w-4 h-4 mr-2" />
              Usage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Key Prefix</p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                  {apiKey.key_prefix}...
                </code>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-sm">
                  {apiKey.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">
                  {new Date(apiKey.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Used</p>
                <p className="text-sm">
                  {apiKey.last_used_at
                    ? new Date(apiKey.last_used_at).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expires</p>
                <p className="text-sm">
                  {apiKey.expires_at
                    ? new Date(apiKey.expires_at).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Rate Limits</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Per Minute</span>
                  <span className="font-medium">{apiKey.rate_limit_per_minute}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Per Hour</span>
                  <span className="font-medium">{apiKey.rate_limit_per_hour}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Per Day</span>
                  <span className="font-medium">{apiKey.rate_limit_per_day}</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="scopes" className="space-y-2">
            {apiKey.scopes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No scopes assigned
              </p>
            ) : (
              <div className="space-y-2">
                {apiKey.scopes.map((scope) => (
                  <div
                    key={scope}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <code className="text-sm font-mono">{scope}</code>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            {loadingStats ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Loading statistics...</p>
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <Card className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold mt-1">{stats.total_requests}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">
                      {successRate}%
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold mt-1 text-red-600">
                      {stats.failed_requests}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                    <p className="text-2xl font-bold mt-1">
                      {stats.avg_response_time_ms.toFixed(0)}ms
                    </p>
                  </Card>
                </div>

                {topEndpoints.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Top Endpoints</h3>
                    <div className="space-y-2">
                      {topEndpoints.map(([endpoint, count]) => (
                        <div
                          key={endpoint}
                          className="flex items-center justify-between text-sm"
                        >
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {endpoint}
                          </code>
                          <span className="font-medium">{count} requests</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No usage data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button
            variant={apiKey.is_active ? 'outline' : 'default'}
            onClick={handleToggleActive}
            disabled={toggling}
          >
            {toggling
              ? 'Updating...'
              : apiKey.is_active
              ? 'Deactivate Key'
              : 'Activate Key'}
          </Button>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={onKeyDeleted}>
              Delete Key
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
