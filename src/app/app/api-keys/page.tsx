'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, EyeOff, Copy, Trash2, Settings, Check } from 'lucide-react';
import { CreateApiKeyDialog } from '@/components/api-keys/CreateApiKeyDialog';
import { ApiKeyDetailsDialog } from '@/components/api-keys/ApiKeyDetailsDialog';

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

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  async function fetchApiKeys() {
    try {
      setLoading(true);
      const response = await fetch('/api/api-keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteKey(keyId: string) {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setApiKeys(apiKeys.filter((k) => k.id !== keyId));
      } else {
        alert('Failed to delete API key');
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      alert('Failed to delete API key');
    }
  }

  function handleCopyKeyPrefix(keyId: string, keyPrefix: string) {
    navigator.clipboard.writeText(keyPrefix + '...');
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  }

  function handleKeyCreated() {
    fetchApiKeys();
    setCreateDialogOpen(false);
  }

  function handleViewDetails(key: ApiKey) {
    setSelectedKey(key);
    setDetailsDialogOpen(true);
  }

  function handleKeyUpdated() {
    fetchApiKeys();
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
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Manage API keys for programmatic access to BlogCanvas
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {apiKeys.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No API Keys Yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first API key to start accessing the BlogCanvas API programmatically.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <Card key={key.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{key.name}</h3>
                    {key.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {key.expires_at && new Date(key.expires_at) < new Date() && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                      {key.key_prefix}...
                    </code>
                    <button
                      onClick={() => handleCopyKeyPrefix(key.id, key.key_prefix)}
                      className="hover:text-gray-900 transition-colors"
                    >
                      {copiedKeyId === key.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">{key.scopes.length}</span> scopes
                    </div>
                    <div>
                      Rate limit: <span className="font-medium">{key.rate_limit_per_minute}/min</span>
                    </div>
                    {key.last_used_at ? (
                      <div>
                        Last used: {new Date(key.last_used_at).toLocaleDateString()}
                      </div>
                    ) : (
                      <div>Never used</div>
                    )}
                    {key.expires_at && (
                      <div>
                        Expires: {new Date(key.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(key)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteKey(key.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onKeyCreated={handleKeyCreated}
      />

      {selectedKey && (
        <ApiKeyDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          apiKey={selectedKey}
          onKeyUpdated={handleKeyUpdated}
          onKeyDeleted={() => {
            handleDeleteKey(selectedKey.id);
            setDetailsDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
