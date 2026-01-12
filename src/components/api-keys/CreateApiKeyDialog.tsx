'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Check, AlertCircle } from 'lucide-react';

const API_SCOPES = {
  'posts:read': 'Read blog posts',
  'posts:write': 'Create and update blog posts',
  'posts:delete': 'Delete blog posts',
  'batches:read': 'Read content batches',
  'batches:write': 'Create and update content batches',
  'batches:delete': 'Delete content batches',
  'clients:read': 'Read client information',
  'clients:write': 'Create and update clients',
  'websites:read': 'Read website information',
  'websites:write': 'Create and update websites',
  'analytics:read': 'Read analytics data',
  'reports:read': 'Read reports',
  'reports:generate': 'Generate new reports',
  'newsletters:read': 'Read newsletters',
  'newsletters:write': 'Create and send newsletters',
  'webhooks:receive': 'Receive webhook events',
};

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeyCreated: () => void;
}

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onKeyCreated,
}: CreateApiKeyDialogProps) {
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleScopeToggle(scope: string) {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  }

  async function handleCreate() {
    if (!name.trim() || selectedScopes.length === 0) {
      alert('Please provide a name and select at least one scope');
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          scopes: selectedScopes,
          expiresAt: expiresAt || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedKey(data.key);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key');
    } finally {
      setCreating(false);
    }
  }

  function handleCopyKey() {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClose() {
    if (createdKey) {
      onKeyCreated();
    }
    setName('');
    setSelectedScopes([]);
    setExpiresAt('');
    setCreatedKey(null);
    setCopied(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {createdKey ? 'API Key Created' : 'Create API Key'}
          </DialogTitle>
          <DialogDescription>
            {createdKey
              ? 'Save this key securely - it will only be shown once.'
              : 'Create a new API key for programmatic access to BlogCanvas.'}
          </DialogDescription>
        </DialogHeader>

        {createdKey ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-900 mb-1">
                  Save this key immediately!
                </p>
                <p className="text-yellow-800">
                  For security reasons, this key will only be displayed once. If you lose it,
                  you'll need to create a new one.
                </p>
              </div>
            </div>

            <div>
              <Label>Your API Key</Label>
              <div className="flex gap-2 mt-2">
                <code className="flex-1 bg-gray-100 p-3 rounded font-mono text-sm break-all">
                  {createdKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyKey}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Key Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Production API Key"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                A descriptive name to help you identify this key
              </p>
            </div>

            <div>
              <Label>Scopes *</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Select the permissions this API key should have
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                {Object.entries(API_SCOPES).map(([scope, description]) => (
                  <div key={scope} className="flex items-start gap-3">
                    <Checkbox
                      id={scope}
                      checked={selectedScopes.includes(scope)}
                      onCheckedChange={() => handleScopeToggle(scope)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={scope}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {scope}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank for keys that don't expire
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {createdKey ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create API Key'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
