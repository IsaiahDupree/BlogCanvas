'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, CheckCircle, XCircle, RefreshCw, AlertCircle, Plus, Trash2, TestTube } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface GSCConnection {
  id: string
  site_url: string
  property_name: string | null
  status: 'active' | 'inactive' | 'error'
  last_sync_at: string | null
  last_sync_status: string | null
  last_sync_error: string | null
  website?: {
    url: string
    name: string
  }
  client?: {
    name: string
  }
  created_at: string
}

export default function GSCSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState<GSCConnection[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // New connection form state
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    site_url: '',
    property_name: '',
    client_id_gsc: '',
    client_secret_gsc: '',
    refresh_token: '',
    website_id: '',
    client_id: '',
  })
  const [creating, setCreating] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/gsc/connections')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch GSC connections')
      }

      setConnections(data.connections || [])
    } catch (err: any) {
      console.error('Error fetching connections:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTesting(true)
      setError(null)

      const res = await fetch('/api/gsc/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_url: formData.site_url,
          client_id_gsc: formData.client_id_gsc,
          client_secret_gsc: formData.client_secret_gsc,
          refresh_token: formData.refresh_token,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Connection test failed')
      }

      setSuccess(`Connection test successful! Site: ${data.site_url}, Permission: ${data.permission_level}`)
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      console.error('Error testing connection:', err)
      setError(err.message)
    } finally {
      setTesting(false)
    }
  }

  const handleCreateConnection = async () => {
    try {
      setCreating(true)
      setError(null)

      // Validate form
      if (!formData.site_url || !formData.client_id_gsc || !formData.client_secret_gsc || !formData.refresh_token) {
        throw new Error('Please fill in all required fields')
      }

      const res = await fetch('/api/gsc/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_url: formData.site_url,
          property_name: formData.property_name || null,
          client_id_gsc: formData.client_id_gsc,
          client_secret_gsc: formData.client_secret_gsc,
          refresh_token: formData.refresh_token,
          website_id: formData.website_id || null,
          client_id: formData.client_id || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create connection')
      }

      setSuccess('GSC connection created successfully!')
      setTimeout(() => setSuccess(null), 5000)

      // Reset form
      setFormData({
        site_url: '',
        property_name: '',
        client_id_gsc: '',
        client_secret_gsc: '',
        refresh_token: '',
        website_id: '',
        client_id: '',
      })
      setShowForm(false)

      // Refresh connections
      await fetchConnections()
    } catch (err: any) {
      console.error('Error creating connection:', err)
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this GSC connection?')) {
      return
    }

    try {
      setError(null)

      const res = await fetch(`/api/gsc/connections/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete connection')
      }

      setSuccess('GSC connection deleted successfully')
      setTimeout(() => setSuccess(null), 5000)

      // Refresh connections
      await fetchConnections()
    } catch (err: any) {
      console.error('Error deleting connection:', err)
      setError(err.message)
    }
  }

  const handleSyncNow = async (websiteId: string | null) => {
    if (!websiteId) {
      setError('Website ID is required for syncing')
      return
    }

    try {
      setError(null)

      const res = await fetch('/api/gsc/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_id: websiteId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync metrics')
      }

      setSuccess(`Sync completed! ${data.summary.successful} posts updated, ${data.summary.failed} failed`)
      setTimeout(() => setSuccess(null), 5000)

      // Refresh connections
      await fetchConnections()
    } catch (err: any) {
      console.error('Error syncing:', err)
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app"
            className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-block"
          >
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Google Search Console
          </h1>
          <p className="text-muted-foreground">
            Connect your verified sites to track impressions, clicks, CTR, and search positions
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Card className="p-4 bg-red-50 border-red-200 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {success && (
          <Card className="p-4 bg-green-50 border-green-200 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 font-medium">{success}</p>
            </div>
          </Card>
        )}

        {/* Connections List */}
        <Card className="p-6 bg-white shadow-xl mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Search className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold">GSC Connections</h2>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Connection
            </Button>
          </div>

          {connections.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-muted-foreground mb-4">
                No GSC connections configured yet
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Connection
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((conn) => (
                <Card key={conn.id} className="p-4 border-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">
                          {conn.property_name || conn.site_url}
                        </h3>
                        <Badge variant={conn.status === 'active' ? 'default' : 'secondary'}>
                          {conn.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Site URL: {conn.site_url}</p>
                        {conn.website && (
                          <p>Website: {conn.website.name || conn.website.url}</p>
                        )}
                        {conn.client && <p>Client: {conn.client.name}</p>}
                        {conn.last_sync_at && (
                          <p>
                            Last Sync: {new Date(conn.last_sync_at).toLocaleString()}{' '}
                            <Badge variant={conn.last_sync_status === 'success' ? 'default' : 'destructive'}>
                              {conn.last_sync_status}
                            </Badge>
                          </p>
                        )}
                        {conn.last_sync_error && (
                          <p className="text-red-600 text-xs">Error: {conn.last_sync_error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncNow(conn.website?.url || null)}
                        disabled={!conn.website}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteConnection(conn.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* New Connection Form */}
        {showForm && (
          <Card className="p-6 bg-white shadow-xl mb-6">
            <h2 className="text-2xl font-bold mb-6">Add GSC Connection</h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-sm">
                  Site URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.site_url}
                  onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Must exactly match the verified property URL in Search Console
                </p>
              </div>

              <div>
                <label className="block mb-2 font-medium text-sm">
                  Property Name
                </label>
                <input
                  type="text"
                  value={formData.property_name}
                  onChange={(e) => setFormData({ ...formData, property_name: e.target.value })}
                  placeholder="My Website (optional)"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-sm">
                  OAuth Client ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.client_id_gsc}
                  onChange={(e) => setFormData({ ...formData, client_id_gsc: e.target.value })}
                  placeholder="123456789.apps.googleusercontent.com"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  From Google Cloud Console OAuth 2.0 credentials
                </p>
              </div>

              <div>
                <label className="block mb-2 font-medium text-sm">
                  OAuth Client Secret <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.client_secret_gsc}
                  onChange={(e) =>
                    setFormData({ ...formData, client_secret_gsc: e.target.value })
                  }
                  placeholder="GOCSPX-..."
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-sm">
                  Refresh Token <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.refresh_token}
                  onChange={(e) =>
                    setFormData({ ...formData, refresh_token: e.target.value })
                  }
                  placeholder="1//..."
                  className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Obtain via OAuth 2.0 flow (see setup guide below)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-sm">Website ID</label>
                  <input
                    type="text"
                    value={formData.website_id}
                    onChange={(e) => setFormData({ ...formData, website_id: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm">Client ID</label>
                  <input
                    type="text"
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || !formData.site_url || !formData.client_id_gsc || !formData.refresh_token}
                >
                  {testing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Test Connection
                </Button>
                <Button onClick={handleCreateConnection} disabled={creating}>
                  {creating ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Create Connection
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Setup Guide */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-bold mb-4">Setup Guide</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Go to Google Cloud Console and create a new project (or use existing)</li>
            <li>Enable the "Google Search Console API"</li>
            <li>Create OAuth 2.0 credentials (OAuth client ID type "Web application")</li>
            <li>Add authorized redirect URI: <code className="bg-white px-2 py-1 rounded">http://localhost:4848/api/gsc/callback</code> (for local development)</li>
            <li>Verify your site in Google Search Console first</li>
            <li>Use the OAuth Playground or a custom flow to get a refresh token with scope: <code className="bg-white px-2 py-1 rounded">https://www.googleapis.com/auth/webmasters.readonly</code></li>
            <li>Copy the Client ID, Client Secret, and Refresh Token into the form above</li>
            <li>Test the connection before saving</li>
          </ol>
          <div className="mt-4 p-4 bg-white rounded border">
            <p className="font-medium mb-2">Quick Links:</p>
            <ul className="space-y-1 text-sm">
              <li>
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Cloud Console
                </a>
              </li>
              <li>
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Search Console
                </a>
              </li>
              <li>
                <a
                  href="https://developers.google.com/oauthplayground"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  OAuth 2.0 Playground (for getting refresh token)
                </a>
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
