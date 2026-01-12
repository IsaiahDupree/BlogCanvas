'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  secret_preview: string;
  retry_count: number;
  timeout_seconds: number;
}

interface WebhookDelivery {
  id: string;
  event: string;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  created_at: string;
  delivered_at?: string;
}

interface DeliveryStats {
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  pending_deliveries: number;
  avg_attempts: number;
  success_rate: number;
}

interface WebhookDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: Webhook;
  onWebhookUpdated: () => void;
  onWebhookDeleted: () => void;
}

export function WebhookDetailsDialog({
  open,
  onOpenChange,
  webhook,
  onWebhookUpdated,
  onWebhookDeleted,
}: WebhookDetailsDialogProps) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [isActive, setIsActive] = useState(webhook.is_active);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDeliveries();
    }
  }, [open, webhook.id]);

  async function fetchDeliveries() {
    try {
      setLoadingDeliveries(true);
      const response = await fetch(`/api/webhooks/${webhook.id}/deliveries`);
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.deliveries);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    } finally {
      setLoadingDeliveries(false);
    }
  }

  async function handleToggleActive() {
    try {
      setUpdating(true);
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (response.ok) {
        setIsActive(!isActive);
        onWebhookUpdated();
      } else {
        alert('Failed to update webhook');
      }
    } catch (error) {
      console.error('Failed to update webhook:', error);
      alert('Failed to update webhook');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onWebhookDeleted();
      } else {
        alert('Failed to delete webhook');
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      alert('Failed to delete webhook');
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'retrying':
        return <RefreshCw className="w-4 h-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      delivered: 'default',
      failed: 'destructive',
      retrying: 'outline',
      pending: 'secondary',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{webhook.name}</DialogTitle>
          <DialogDescription>Webhook details and delivery logs</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label>URL</Label>
                <Input value={webhook.url} readOnly className="font-mono text-sm" />
              </div>

              <div>
                <Label>Secret (Preview)</Label>
                <Input value={webhook.secret_preview} readOnly className="font-mono text-sm" />
                <p className="text-xs text-muted-foreground mt-1">
                  The full secret was shown only once at creation time
                </p>
              </div>

              <div>
                <Label>Subscribed Events</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {webhook.events.map((event) => (
                    <Badge key={event} variant="outline">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Retry Count</Label>
                  <p className="text-sm mt-1">{webhook.retry_count}x</p>
                </div>
                <div>
                  <Label>Timeout</Label>
                  <p className="text-sm mt-1">{webhook.timeout_seconds}s</p>
                </div>
              </div>

              <div>
                <Label>Created</Label>
                <p className="text-sm mt-1">
                  {new Date(webhook.created_at).toLocaleString()}
                </p>
              </div>

              {webhook.last_triggered_at && (
                <div>
                  <Label>Last Triggered</Label>
                  <p className="text-sm mt-1">
                    {new Date(webhook.last_triggered_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-4">
            {stats && (
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Total Deliveries</div>
                  <div className="text-2xl font-bold">{stats.total_deliveries}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.success_rate}%
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Avg Attempts</div>
                  <div className="text-2xl font-bold">{stats.avg_attempts}</div>
                </Card>
              </div>
            )}

            {loadingDeliveries ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading deliveries...
              </div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No deliveries yet
              </div>
            ) : (
              <div className="space-y-3">
                {deliveries.map((delivery) => (
                  <Card key={delivery.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(delivery.status)}
                          <span className="font-medium">{delivery.event}</span>
                          {getStatusBadge(delivery.status)}
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="text-muted-foreground">
                            {new Date(delivery.created_at).toLocaleString()}
                          </div>
                          {delivery.response_status && (
                            <div>
                              Status: <code>{delivery.response_status}</code>
                            </div>
                          )}
                          {delivery.error_message && (
                            <div className="text-red-600">
                              Error: {delivery.error_message}
                            </div>
                          )}
                          <div>Attempts: {delivery.attempts}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={fetchDeliveries}
              disabled={loadingDeliveries}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable this webhook
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={handleToggleActive}
                disabled={updating}
              />
            </div>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Danger Zone</strong>
                <p className="mt-2">
                  Deleting a webhook will permanently remove it and all its delivery logs.
                  This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  className="mt-4"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Webhook
                </Button>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
