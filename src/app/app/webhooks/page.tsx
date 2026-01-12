'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Webhook, Copy, Trash2, Check, Activity, Send } from 'lucide-react';
import { CreateWebhookDialog } from '@/components/webhooks/CreateWebhookDialog';
import { WebhookDetailsDialog } from '@/components/webhooks/WebhookDetailsDialog';

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

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [copiedWebhookId, setCopiedWebhookId] = useState<string | null>(null);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    try {
      setLoading(true);
      const response = await fetch('/api/webhooks');
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks);
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteWebhook(webhookId: string) {
    if (!confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWebhooks(webhooks.filter((w) => w.id !== webhookId));
      } else {
        alert('Failed to delete webhook');
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      alert('Failed to delete webhook');
    }
  }

  async function handleTestWebhook(webhookId: string) {
    try {
      setTestingWebhookId(webhookId);
      const response = await fetch(`/api/webhooks/${webhookId}/test`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert('Test webhook delivered successfully!');
      } else {
        alert(`Test webhook failed: ${data.response?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
      alert('Failed to test webhook');
    } finally {
      setTestingWebhookId(null);
    }
  }

  function handleCopyUrl(webhookId: string, url: string) {
    navigator.clipboard.writeText(url);
    setCopiedWebhookId(webhookId);
    setTimeout(() => setCopiedWebhookId(null), 2000);
  }

  function handleWebhookCreated() {
    fetchWebhooks();
    setCreateDialogOpen(false);
  }

  function handleViewDetails(webhook: Webhook) {
    setSelectedWebhook(webhook);
    setDetailsDialogOpen(true);
  }

  function handleWebhookUpdated() {
    fetchWebhooks();
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-1">
            Configure webhook endpoints to receive real-time event notifications
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      {webhooks.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Webhook className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Webhooks Yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first webhook to start receiving real-time notifications about events in your BlogCanvas account.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Webhook
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{webhook.name}</h3>
                    {webhook.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">URL:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1 truncate">
                        {webhook.url}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyUrl(webhook.id, webhook.url)}
                      >
                        {copiedWebhookId === webhook.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Events:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {webhook.events.slice(0, 5).map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Retry: {webhook.retry_count}x</span>
                      <span>Timeout: {webhook.timeout_seconds}s</span>
                      {webhook.last_triggered_at && (
                        <span>
                          Last triggered: {new Date(webhook.last_triggered_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestWebhook(webhook.id)}
                    disabled={testingWebhookId === webhook.id}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    {testingWebhookId === webhook.id ? 'Testing...' : 'Test'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(webhook)}
                  >
                    <Activity className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteWebhook(webhook.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateWebhookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onWebhookCreated={handleWebhookCreated}
      />

      {selectedWebhook && (
        <WebhookDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          webhook={selectedWebhook}
          onWebhookUpdated={handleWebhookUpdated}
          onWebhookDeleted={() => {
            fetchWebhooks();
            setDetailsDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
