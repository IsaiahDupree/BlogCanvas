'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Globe, CheckCircle, XCircle, Loader2, Plus, Trash2, RefreshCw } from 'lucide-react'

interface CMSConnection {
  id: string
  cms_type: string
  base_url: string
  connection_status: 'active' | 'inactive' | 'error'
  last_tested_at: string
  test_result: any
  created_at: string
}

interface WordPressSettingsProps {
  clientId: string
}

export function WordPressSettings({ clientId }: WordPressSettingsProps) {
  const [connections, setConnections] = useState<CMSConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    baseUrl: '',
    username: '',
    appPassword: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)

  useEffect(() => {
    fetchConnections()
  }, [clientId])

  const fetchConnections = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cms-connections?clientId=${clientId}`)
      const data = await response.json()
      if (data.success) {
        setConnections(data.connections || [])
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/cms-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          cmsType: 'wordpress',
          baseUrl: formData.baseUrl.trim().replace(/\/$/, ''), // Remove trailing slash
          username: formData.username.trim(),
          appPassword: formData.appPassword.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('WordPress connection added successfully!')
        setShowAddForm(false)
        setFormData({ baseUrl: '', username: '', appPassword: '' })
        await fetchConnections()
      } else {
        alert(`Failed to add connection: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Failed to add connection: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleTestConnection = async (connectionId: string) => {
    setTesting(connectionId)
    try {
      const response = await fetch(`/api/cms-connections/${connectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' })
      })

      const data = await response.json()

      if (data.success) {
        if (data.testResult.success) {
          alert('Connection test successful!')
        } else {
          alert(`Connection test failed: ${data.testResult.message}`)
        }
        await fetchConnections()
      } else {
        alert(`Test failed: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Test failed: ${error.message}`)
    } finally {
      setTesting(null)
    }
  }

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) {
      return
    }

    try {
      const response = await fetch(`/api/cms-connections/${connectionId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        alert('Connection deleted successfully')
        await fetchConnections()
      } else {
        alert(`Failed to delete connection: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Failed to delete connection: ${error.message}`)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Error</Badge>
      default:
        return <Badge variant="outline">Inactive</Badge>
    }
  }

  return (
    <Card className="p-6 bg-white shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">WordPress Publishing</h2>
            <p className="text-sm text-muted-foreground">Connect your WordPress site to publish posts directly</p>
          </div>
        </div>

        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Add Connection Form */}
          {showAddForm && (
            <form onSubmit={handleAddConnection} className="mb-6 p-6 border-2 border-blue-200 rounded-lg bg-blue-50">
              <h3 className="font-bold text-lg mb-4">Add WordPress Connection</h3>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium text-sm">WordPress Site URL</label>
                  <input
                    type="url"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    placeholder="https://yoursite.com"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The full URL of your WordPress site (e.g., https://example.com)
                  </p>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm">WordPress Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="admin"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm">Application Password</label>
                  <input
                    type="password"
                    value={formData.appPassword}
                    onChange={(e) => setFormData({ ...formData, appPassword: e.target.value })}
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Create an Application Password in WordPress: Users → Profile → Application Passwords
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    {submitting ? 'Adding...' : 'Add Connection'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setFormData({ baseUrl: '', username: '', appPassword: '' })
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Connections List */}
          {connections.length === 0 && !showAddForm ? (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium mb-2">No WordPress connections</p>
              <p className="text-sm">Add a connection to start publishing posts to your WordPress site</p>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg">{connection.base_url}</h4>
                        {getStatusBadge(connection.connection_status)}
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Type: WordPress</p>
                        <p>Last tested: {connection.last_tested_at ? new Date(connection.last_tested_at).toLocaleString() : 'Never'}</p>
                        {connection.test_result?.message && (
                          <p className={connection.test_result.success ? 'text-green-600' : 'text-red-600'}>
                            {connection.test_result.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleTestConnection(connection.id)}
                        disabled={testing === connection.id}
                        variant="outline"
                        size="sm"
                      >
                        {testing === connection.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => handleDeleteConnection(connection.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-sm mb-2">How to set up WordPress publishing:</h4>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Log in to your WordPress admin panel</li>
          <li>Go to Users → Your Profile</li>
          <li>Scroll down to "Application Passwords"</li>
          <li>Enter a name (e.g., "BlogCanvas") and click "Add New Application Password"</li>
          <li>Copy the generated password and paste it above</li>
        </ol>
      </div>
    </Card>
  )
}
