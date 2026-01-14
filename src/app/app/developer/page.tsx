'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Code2, Key, Webhook, BookOpen, Copy, Check, ExternalLink, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  is_active: boolean
  last_used_at?: string
  created_at: string
}

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  is_active: boolean
  created_at: string
}

export default function DeveloperPortalPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [keysRes, webhooksRes] = await Promise.all([
        fetch('/api/api-keys'),
        fetch('/api/webhooks')
      ])
      
      const keysData = await keysRes.json()
      const webhooksData = await webhooksRes.json()
      
      setApiKeys(keysData.apiKeys || [])
      setWebhooks(webhooksData.webhooks || [])
    } catch (error) {
      console.error('Failed to fetch developer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Code2 className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Developer Portal</h1>
          </div>
          <p className="text-muted-foreground">
            Manage API keys, webhooks, and integrate BlogCanvas with your applications
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Key className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{apiKeys.length}</p>
                  <p className="text-sm text-muted-foreground">API Keys</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Webhook className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{webhooks.length}</p>
                  <p className="text-sm text-muted-foreground">Webhooks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{apiKeys.filter(k => k.is_active).length}</p>
                  <p className="text-sm text-muted-foreground">Active Keys</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">v1</p>
                  <p className="text-sm text-muted-foreground">API Version</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Getting Started */}
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>Quick start guide for integrating with BlogCanvas API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <p className="text-xs text-gray-400 mb-2">Base URL</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-green-400 flex-1">{baseUrl}/api</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`${baseUrl}/api`, 'base-url')}
                      >
                        {copiedId === 'base-url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Include your API key in the <code className="bg-gray-100 px-1 rounded">Authorization</code> header:
                    </p>
                    <div className="p-3 bg-gray-100 rounded text-sm font-mono">
                      Authorization: Bearer bc_your_api_key
                    </div>
                  </div>

                  <Link href="/app/api-keys">
                    <Button className="w-full">
                      <Key className="w-4 h-4 mr-2" />
                      Create API Key
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Available Endpoints */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Endpoints</CardTitle>
                  <CardDescription>Core API endpoints for your integration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { method: 'GET', path: '/api/clients', desc: 'List clients' },
                      { method: 'GET', path: '/api/blog-posts', desc: 'List blog posts' },
                      { method: 'POST', path: '/api/blog-posts', desc: 'Create blog post' },
                      { method: 'GET', path: '/api/content-batches', desc: 'List batches' },
                      { method: 'GET', path: '/api/websites', desc: 'List websites' },
                      { method: 'GET', path: '/api/analytics/metrics', desc: 'Get analytics' },
                    ].map((endpoint, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'} className="font-mono text-xs w-16 justify-center">
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm flex-1">{endpoint.path}</code>
                        <span className="text-xs text-muted-foreground">{endpoint.desc}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/api/docs/openapi.json" target="_blank">
                    <Button variant="outline" className="w-full mt-4">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View OpenAPI Spec
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Webhook Events */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Webhook Events</CardTitle>
                  <CardDescription>Subscribe to real-time events from BlogCanvas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      'post.created', 'post.updated', 'post.published', 'post.deleted',
                      'batch.created', 'batch.completed', 'client.created', 'client.updated',
                      'website.analyzed', 'newsletter.sent', 'invoice.created', 'subscription.updated'
                    ].map((event) => (
                      <div key={event} className="p-2 bg-gray-50 rounded text-sm font-mono text-center">
                        {event}
                      </div>
                    ))}
                  </div>
                  <Link href="/app/webhooks">
                    <Button variant="outline" className="w-full mt-4">
                      <Webhook className="w-4 h-4 mr-2" />
                      Configure Webhooks
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="api-keys">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Manage your API keys for authentication</CardDescription>
                </div>
                <Link href="/app/api-keys">
                  <Button>
                    <Key className="w-4 h-4 mr-2" />
                    Manage Keys
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Key className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No API keys yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">{key.key_prefix}...</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {key.scopes.slice(0, 2).map((scope) => (
                              <Badge key={scope} variant="outline" className="text-xs">{scope}</Badge>
                            ))}
                            {key.scopes.length > 2 && (
                              <Badge variant="outline" className="text-xs">+{key.scopes.length - 2}</Badge>
                            )}
                          </div>
                          <Badge variant={key.is_active ? 'default' : 'secondary'}>
                            {key.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>Receive real-time notifications for events</CardDescription>
                </div>
                <Link href="/app/webhooks">
                  <Button>
                    <Webhook className="w-4 h-4 mr-2" />
                    Manage Webhooks
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {webhooks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Webhook className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No webhooks configured</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {webhooks.map((webhook) => (
                      <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{webhook.name}</p>
                          <p className="text-sm text-muted-foreground">{webhook.url}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{webhook.events.length} events</Badge>
                          <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                            {webhook.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs">
            <Card>
              <CardHeader>
                <CardTitle>API Documentation</CardTitle>
                <CardDescription>Complete reference for the BlogCanvas API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/api/docs/openapi.json" target="_blank">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <BookOpen className="w-8 h-8 text-indigo-600 mb-3" />
                        <h3 className="font-medium mb-1">OpenAPI Specification</h3>
                        <p className="text-sm text-muted-foreground">
                          Machine-readable API specification in OpenAPI 3.0 format
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/app/api-docs">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <Code2 className="w-8 h-8 text-purple-600 mb-3" />
                        <h3 className="font-medium mb-1">Interactive Docs</h3>
                        <p className="text-sm text-muted-foreground">
                          Browse and test API endpoints interactively
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-2">Rate Limits</h4>
                  <p className="text-sm text-amber-700">
                    API requests are limited to 1000 requests per hour per API key.
                    Contact support if you need higher limits.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
