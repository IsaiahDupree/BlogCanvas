'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Globe, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Key,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface WordPressConnection {
  id: string
  site_url: string
  site_name: string
  username: string
  is_active: boolean
  connection_status: string
  connection_error?: string
  last_connected_at?: string
  created_at: string
  client?: {
    id: string
    name: string
  }
}

interface Client {
  id: string
  name: string
}

export default function WordPressSettingsPage() {
  const [connections, setConnections] = useState<WordPressConnection[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  
  // Form state
  const [siteUrl, setSiteUrl] = useState('')
  const [username, setUsername] = useState('')
  const [applicationPassword, setApplicationPassword] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [connectionsRes, clientsRes] = await Promise.all([
        fetch('/api/wordpress/connections'),
        fetch('/api/clients')
      ])
      
      const connectionsData = await connectionsRes.json()
      const clientsData = await clientsRes.json()
      
      setConnections(connectionsData.connections || [])
      setClients(clientsData.clients || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)

    try {
      const res = await fetch('/api/wordpress/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl,
          username,
          applicationPassword,
          clientId: selectedClient || null
        })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create connection')
      }

      // Reset form
      setSiteUrl('')
      setUsername('')
      setApplicationPassword('')
      setSelectedClient('')
      setShowForm(false)
      
      // Refresh connections
      fetchData()

    } catch (error: any) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async (connectionId: string) => {
    setTesting(connectionId)
    try {
      const res = await fetch(`/api/wordpress/connections/${connectionId}/test`, {
        method: 'POST'
      })
      const data = await res.json()
      
      // Refresh to get updated status
      fetchData()
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setTesting(null)
    }
  }

  const deleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this WordPress connection?')) return

    try {
      await fetch(`/api/wordpress/connections/${connectionId}`, {
        method: 'DELETE'
      })
      fetchData()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/app/settings" className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">WordPress Integration</h1>
              <p className="text-muted-foreground">
                Connect WordPress sites to publish content directly
              </p>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Connection
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Key className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Application Passwords Required</h3>
                <p className="text-sm text-blue-800 mb-2">
                  WordPress requires an Application Password for API access. To create one:
                </p>
                <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                  <li>Go to your WordPress admin → Users → Profile</li>
                  <li>Scroll to &quot;Application Passwords&quot;</li>
                  <li>Enter a name (e.g., &quot;BlogCanvas&quot;) and click &quot;Add New&quot;</li>
                  <li>Copy the generated password (you won&apos;t see it again)</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Connection Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add WordPress Connection</CardTitle>
              <CardDescription>Connect a WordPress site to publish blog posts</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    WordPress Site URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://yoursite.com"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    WordPress Username
                  </label>
                  <input
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Application Password
                  </label>
                  <input
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                    value={applicationPassword}
                    onChange={(e) => setApplicationPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is NOT your WordPress login password. Use an Application Password.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Associate with Client (optional)
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">No specific client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 mr-2" />
                        Connect & Test
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Connections List */}
        {connections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">No WordPress connections yet</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Connection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => (
              <Card key={connection.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        connection.connection_status === 'connected' 
                          ? 'bg-green-100' 
                          : 'bg-red-100'
                      }`}>
                        {connection.connection_status === 'connected' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {connection.site_name || connection.site_url}
                        </h3>
                        <p className="text-sm text-gray-500">{connection.site_url}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant={connection.connection_status === 'connected' ? 'default' : 'destructive'}>
                            {connection.connection_status}
                          </Badge>
                          {connection.client && (
                            <Badge variant="secondary">
                              {connection.client.name}
                            </Badge>
                          )}
                        </div>
                        {connection.connection_error && (
                          <p className="text-sm text-red-600 mt-2">{connection.connection_error}</p>
                        )}
                        {connection.last_connected_at && (
                          <p className="text-xs text-gray-400 mt-2">
                            Last connected: {new Date(connection.last_connected_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={connection.site_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => testConnection(connection.id)}
                        disabled={testing === connection.id}
                      >
                        {testing === connection.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteConnection(connection.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
