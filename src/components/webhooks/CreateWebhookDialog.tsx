'use client';

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, AlertCircle } from 'lucide-react';

const WEBHOOK_EVENTS = [
  { value: 'post.created', label: 'Post Created', description: 'When a new post is created' },
  { value: 'post.status_changed', label: 'Post Status Changed', description: 'When post status changes' },
  { value: 'post.published', label: 'Post Published', description: 'When a post is published to CMS' },
  { value: 'post.updated', label: 'Post Updated', description: 'When a post is updated' },
  { value: 'post.deleted', label: 'Post Deleted', description: 'When a post is deleted' },
  { value: 'client.created', label: 'Client Created', description: 'When a new client is added' },
  { value: 'client.updated', label: 'Client Updated', description: 'When client info is updated' },
  { value: 'client.deleted', label: 'Client Deleted', description: 'When a client is removed' },
  { value: 'batch.created', label: 'Batch Created', description: 'When a content batch is created' },
  { value: 'batch.completed', label: 'Batch Completed', description: 'When a batch is completed' },
  { value: 'review.requested', label: 'Review Requested', description: 'When content review is requested' },
  { value: 'review.completed', label: 'Review Completed', description: 'When content review is done' },
  { value: 'invoice.created', label: 'Invoice Created', description: 'When an invoice is created' },
  { value: 'invoice.updated', label: 'Invoice Updated', description: 'When an invoice is updated' },
  { value: 'payment.received', label: 'Payment Received', description: 'When a payment is received' },
  { value: 'payment.failed', label: 'Payment Failed', description: 'When a payment fails' },
];

interface CreateWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWebhookCreated: () => void;
}

export function CreateWebhookDialog({
  open,
  onOpenChange,
  onWebhookCreated,
}: CreateWebhookDialogProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(3);
  const [timeoutSeconds, setTimeoutSeconds] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  function handleEventToggle(eventValue: string) {
    setSelectedEvents((prev) =>
      prev.includes(eventValue)
        ? prev.filter((e) => e !== eventValue)
        : [...prev, eventValue]
    );
  }

  function handleSelectAll() {
    if (selectedEvents.length === WEBHOOK_EVENTS.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(WEBHOOK_EVENTS.map((e) => e.value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !url || selectedEvents.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          url,
          events: selectedEvents,
          retry_count: retryCount,
          timeout_seconds: timeoutSeconds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create webhook');
      }

      // Show the secret (only shown once)
      setCreatedSecret(data.webhook.secret);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopySecret() {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  }

  function handleClose() {
    // Reset form
    setName('');
    setUrl('');
    setSelectedEvents([]);
    setRetryCount(3);
    setTimeoutSeconds(30);
    setError(null);
    setCreatedSecret(null);
    setCopiedSecret(false);

    if (createdSecret) {
      onWebhookCreated();
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Webhook</DialogTitle>
          <DialogDescription>
            Configure a webhook endpoint to receive real-time event notifications
          </DialogDescription>
        </DialogHeader>

        {createdSecret ? (
          // Show secret (only once)
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Save your webhook secret!</strong> It will only be shown once.
                You'll need this to verify webhook signatures.
              </AlertDescription>
            </Alert>

            <div>
              <Label>Webhook Secret</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={createdSecret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopySecret}
                >
                  {copiedSecret ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Use this secret to verify webhook signatures using HMAC-SHA256
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        ) : (
          // Create form
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Production Webhook"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Endpoint URL *</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-app.com/webhooks/blogcanvas"
                required
              />
              <p className="text-sm text-muted-foreground">
                Must be a valid HTTPS URL
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Events to Subscribe *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedEvents.length === WEBHOOK_EVENTS.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </div>
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
                {WEBHOOK_EVENTS.map((event) => (
                  <div key={event.value} className="flex items-start space-x-2">
                    <Checkbox
                      id={event.value}
                      checked={selectedEvents.includes(event.value)}
                      onCheckedChange={() => handleEventToggle(event.value)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={event.value}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {event.label}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {selectedEvents.length} of {WEBHOOK_EVENTS.length} events
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retry_count">Retry Count</Label>
                <Input
                  id="retry_count"
                  type="number"
                  min="0"
                  max="10"
                  value={retryCount}
                  onChange={(e) => setRetryCount(parseInt(e.target.value) || 3)}
                />
                <p className="text-xs text-muted-foreground">
                  Max retry attempts on failure
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout_seconds">Timeout (seconds)</Label>
                <Input
                  id="timeout_seconds"
                  type="number"
                  min="5"
                  max="300"
                  value={timeoutSeconds}
                  onChange={(e) =>
                    setTimeoutSeconds(parseInt(e.target.value) || 30)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Request timeout
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Webhook'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
