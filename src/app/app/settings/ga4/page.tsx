'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, CheckCircle, XCircle, RefreshCw, AlertCircle, Plus, Trash2, TestTube } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface GA4Connection {
  id: string
  property_id: string
  property_name: string | null
  service_account_email: string
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

export default function GA4SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState<GA4Connection[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // New connection form state
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    property_id: '',
    service_account_email: '',
    service_account_json: '',
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

      const res = await fetch('/api/ga4/connections')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch GA4 connections')
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

      // Parse service account JSON
      let credentials
      try {
        credentials = JSON.parse(formData.service_account_json)
      } catch (e) {
        throw new Error('Invalid JSON format for service account credentials')
      }

      const res = await fetch('/api/ga4/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: formData.property_id,
          service_account_email: formData.service_account_email,
          service_account_credentials: credentials,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Connection test failed')
      }

      setSuccess(`Connection test successful! Property: ${data.property_name || 'N/A'}`)
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
      if (!formData.property_id || !formData.service_account_email || !formData.service_account_json) {
        throw new Error('Please fill in all required fields')
      }

      // Parse service account JSON
      let credentials
      try {
        credentials = JSON.parse(formData.service_account_json)
      } catch (e) {
        throw new Error('Invalid JSON format for service account credentials')
      }

      const res = await fetch('/api/ga4/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: formData.property_id,
          service_account_email: formData.service_account_email,
          service_account_credentials: credentials,
          website_id: formData.website_id || null,
          client_id: formData.client_id || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create connection')
      }

      setSuccess('GA4 connection created successfully!')
      setTimeout(() => setSuccess(null), 5000)

      // Reset form
      setFormData({
        property_id: '',
        service_account_email: '',
        service_account_json: '',
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
    if (!confirm('Are you sure you want to delete this GA4 connection?')) {
      return
    }

    try {
      setError(null)

      const res = await fetch(`/api/ga4/connections/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete connection')
      }

      setSuccess('GA4 connection deleted successfully')
      setTimeout(() => setSuccess(null), 5000)

      // Refresh connections
      await fetchConnections()
    } catch (err: any) {
      console.error('Error deleting connection:', err)
      setError(err.message)
    }
  }

  const handleSyncNow = async (connectionId: string, websiteId: string | null) => {
    if (!websiteId) {
      setError('Website ID is required for syncing')
      return
    }

    try {
      setError(null)

      const res = await fetch('/api/ga4/sync', {
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
            Google Analytics 4
          </h1>
          <p className="text-muted-foreground">
            Connect your GA4 properties to track page views, engagement metrics, and traffic trends
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
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold">GA4 Connections</h2>
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
              <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-muted-foreground mb-4">
                No GA4 connections configured yet
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
                          {conn.property_name || `Property ${conn.property_id}`}
                        </h3>
                        <Badge variant={conn.status === 'active' ? 'default' : 'secondary'}>
                          {conn.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Property ID: {conn.property_id}</p>
                        <p>Service Account: {conn.service_account_email}</p>
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
                        onClick={() => handleSyncNow(conn.id, conn.website?.url || null)}
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
            <h2 className="text-2xl font-bold mb-6">Add GA4 Connection</h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-sm">
                  GA4 Property ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                  placeholder="123456789"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Found in GA4 Admin &gt; Property Settings
                </p>
              </div>

              <div>
                <label className="block mb-2 font-medium text-sm">
                  Service Account Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.service_account_email}
                  onChange={(e) =>
                    setFormData({ ...formData, service_account_email: e.target.value })
                  }
                  placeholder="your-service-account@project-id.iam.gserviceaccount.com"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-sm">
                  Service Account JSON Key <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.service_account_json}
                  onChange={(e) =>
                    setFormData({ ...formData, service_account_json: e.target.value })
                  }
                  placeholder='{"type": "service_account", "project_id": "...", "private_key": "..."}'
                  className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste the entire JSON key file contents. Get this from Google Cloud Console.
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
                  disabled={testing || !formData.property_id || !formData.service_account_json}
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
            <li>Enable the "Google Analytics Data API v1"</li>
            <li>Create a Service Account with Viewer permissions</li>
            <li>Generate and download a JSON key for the service account</li>
            <li>
              In GA4 Admin, go to Property Access Management and add the service account email
              with "Viewer" role
            </li>
            <li>Copy your GA4 Property ID from Admin &gt; Property Settings</li>
            <li>Paste the JSON key and Property ID in the form above</li>
          </ol>
        </Card>
      </div>
    </div>
  )
}
