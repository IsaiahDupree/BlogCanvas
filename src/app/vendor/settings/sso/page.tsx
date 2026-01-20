/**
 * SSO Settings Page
 * Manage SAML and OIDC SSO connections
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Plus, Trash2, TestTube, CheckCircle, XCircle } from 'lucide-react'

interface SSOConnection {
  id: string
  provider: 'saml' | 'oidc'
  name: string
  domain: string
  enabled: boolean
  config: any
  created_at: string
  updated_at: string
}

export default function SSOSettingsPage() {
  const [connections, setConnections] = useState<SSOConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    provider: 'oidc' as 'saml' | 'oidc',
    name: '',
    domain: '',
    enabled: true,
    config: {
      // OIDC defaults
      issuer: '',
      clientId: '',
      clientSecret: '',
      scopes: ['openid', 'email', 'profile']
    }
  })

  useEffect(() => {
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/vendor/sso')
      const data = await response.json()
      setConnections(data.connections || [])
    } catch (error) {
      console.error('Failed to fetch SSO connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/vendor/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowCreateForm(false)
        fetchConnections()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create SSO connection')
      }
    } catch (error) {
      console.error('Failed to create SSO connection:', error)
      alert('Failed to create SSO connection')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SSO connection?')) {
      return
    }

    try {
      const response = await fetch(`/api/vendor/sso/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchConnections()
      } else {
        alert('Failed to delete SSO connection')
      }
    } catch (error) {
      console.error('Failed to delete SSO connection:', error)
      alert('Failed to delete SSO connection')
    }
  }

  const handleTest = async (id: string) => {
    try {
      const response = await fetch(`/api/vendor/sso/${id}/test`, {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        alert('✅ ' + result.message)
      } else {
        alert('❌ ' + result.message)
      }
    } catch (error) {
      console.error('Failed to test SSO connection:', error)
      alert('Failed to test SSO connection')
    }
  }

  const resetForm = () => {
    setFormData({
      provider: 'oidc',
      name: '',
      domain: '',
      enabled: true,
      config: {
        issuer: '',
        clientId: '',
        clientSecret: '',
        scopes: ['openid', 'email', 'profile']
      }
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading SSO connections...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            SSO Configuration
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure SAML or OIDC single sign-on for your organization
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add SSO Connection
        </Button>
      </div>

      {showCreateForm && (
        <Card className="p-6 mb-6 border-2 border-blue-200">
          <h2 className="text-lg font-semibold mb-4">Create SSO Connection</h2>

          <div className="space-y-4">
            <div>
              <Label>Provider Type</Label>
              <select
                className="w-full p-2 border rounded"
                value={formData.provider}
                onChange={(e) => setFormData({
                  ...formData,
                  provider: e.target.value as 'saml' | 'oidc',
                  config: e.target.value === 'oidc'
                    ? { issuer: '', clientId: '', clientSecret: '', scopes: ['openid', 'email', 'profile'] }
                    : { idpMetadata: '', spEntityId: '', acsUrl: '' }
                })}
              >
                <option value="oidc">OIDC (OpenID Connect)</option>
                <option value="saml">SAML 2.0</option>
              </select>
            </div>

            <div>
              <Label>Connection Name</Label>
              <Input
                placeholder="e.g., Company SSO"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Email Domain</Label>
              <Input
                placeholder="e.g., company.com"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Users with this email domain will be redirected to SSO login
              </p>
            </div>

            {formData.provider === 'oidc' && (
              <>
                <div>
                  <Label>Issuer URL</Label>
                  <Input
                    placeholder="https://accounts.google.com"
                    value={formData.config.issuer}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, issuer: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <Label>Client ID</Label>
                  <Input
                    placeholder="Your OAuth Client ID"
                    value={formData.config.clientId}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, clientId: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <Label>Client Secret</Label>
                  <Input
                    type="password"
                    placeholder="Your OAuth Client Secret"
                    value={formData.config.clientSecret}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, clientSecret: e.target.value }
                    })}
                  />
                </div>
              </>
            )}

            {formData.provider === 'saml' && (
              <>
                <div>
                  <Label>IdP Metadata URL or XML</Label>
                  <textarea
                    className="w-full p-2 border rounded min-h-[100px]"
                    placeholder="https://idp.example.com/metadata or paste XML"
                    value={formData.config.idpMetadata}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, idpMetadata: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <Label>SP Entity ID</Label>
                  <Input
                    placeholder="https://yourapp.com/saml"
                    value={formData.config.spEntityId}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, spEntityId: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <Label>ACS URL (Assertion Consumer Service)</Label>
                  <Input
                    placeholder="https://yourapp.com/auth/saml/callback"
                    value={formData.config.acsUrl}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, acsUrl: e.target.value }
                    })}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setShowCreateForm(false)
                resetForm()
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>
                Create Connection
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {connections.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No SSO connections configured</p>
            <p className="text-sm mt-2">Add your first SSO connection to enable enterprise authentication</p>
          </Card>
        ) : (
          connections.map((connection) => (
            <Card key={connection.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{connection.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${
                      connection.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {connection.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded uppercase">
                      {connection.provider}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Domain: <span className="font-mono">{connection.domain}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Created: {new Date(connection.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTest(connection.id)}
                  >
                    <TestTube className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(connection.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2">Documentation</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• SSO allows enterprise users to log in with their company credentials</li>
          <li>• OIDC is recommended for modern identity providers (Google, Azure AD, Okta)</li>
          <li>• SAML 2.0 is used for traditional enterprise SSO</li>
          <li>• Users with matching email domains will automatically use SSO for login</li>
          <li>• Test your configuration before enabling to avoid lockout</li>
        </ul>
      </Card>
    </div>
  )
}
