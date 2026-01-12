'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Mail, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface GmailConnection {
  id: string
  gmail_address: string
  sync_enabled: boolean
  last_sync_at: string | null
  created_at: string
}

export default function GmailSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [connection, setConnection] = useState<GmailConnection | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const searchParams = useSearchParams()

  // Handle OAuth callback
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const successParam = searchParams.get('success')

    if (errorParam) {
      setError(`Connection failed: ${errorParam}`)
    } else if (successParam === 'true') {
      setSuccess('Gmail connected successfully!')
      setTimeout(() => setSuccess(null), 5000)
    }

    fetchConnection()
  }, [])

  const fetchConnection = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user's Gmail connection
      const res = await fetch('/api/gmail/connection')

      if (res.status === 404) {
        // No connection found
        setConnection(null)
      } else if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch Gmail connection')
      } else {
        const data = await res.json()
        setConnection(data.connection)
      }
    } catch (err: any) {
      console.error('Error fetching connection:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      setConnecting(true)
      setError(null)

      // Get OAuth URL
      const res = await fetch('/api/gmail/connect')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate connection')
      }

      // Redirect to Google OAuth
      window.location.href = data.authUrl
    } catch (err: any) {
      console.error('Error connecting:', err)
      setError(err.message)
      setConnecting(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      setError(null)

      const res = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxResults: 50 }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync emails')
      }

      setSuccess(`Synced ${data.syncedCount} email threads`)
      setTimeout(() => setSuccess(null), 5000)

      // Refresh connection data
      await fetchConnection()
    } catch (err: any) {
      console.error('Error syncing:', err)
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail? Your synced emails will remain in the system.')) {
      return
    }

    try {
      setError(null)

      const res = await fetch('/api/gmail/connection', {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to disconnect')
      }

      setSuccess('Gmail disconnected successfully')
      setTimeout(() => setSuccess(null), 5000)
      setConnection(null)
    } catch (err: any) {
      console.error('Error disconnecting:', err)
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/app"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Gmail Integration</h1>
        <p className="text-gray-600 mt-2">
          Connect your Gmail account to sync email threads and manage client communications
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-900">Success</h3>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <Card className="p-6">
        {!connection ? (
          // Not connected state
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Mail className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connect Your Gmail Account
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Sync your Gmail to manage client communications directly from BlogCanvas.
              You'll be able to view threads, link emails to clients and projects, and send emails.
            </p>
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center"
            >
              {connecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Connect Gmail
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Requires permissions: Read, send, and modify emails
            </p>
          </div>
        ) : (
          // Connected state
          <div>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mr-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Gmail Connected
                  </h2>
                  <p className="text-sm text-gray-600">{connection.gmail_address}</p>
                </div>
              </div>
              <Badge variant={connection.sync_enabled ? 'default' : 'secondary'}>
                {connection.sync_enabled ? 'Active' : 'Disabled'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Last Synced</p>
                <p className="font-medium text-gray-900">
                  {connection.last_sync_at
                    ? new Date(connection.last_sync_at).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Connected Since</p>
                <p className="font-medium text-gray-900">
                  {new Date(connection.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSync}
                disabled={syncing}
                variant="default"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>

              <Link href="/app/inbox">
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  View Inbox
                </Button>
              </Link>

              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Feature List */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <Mail className="h-8 w-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Email Sync</h3>
          <p className="text-sm text-gray-600">
            Automatically sync your Gmail threads to BlogCanvas
          </p>
        </Card>

        <Card className="p-4">
          <CheckCircle className="h-8 w-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Link to Projects</h3>
          <p className="text-sm text-gray-600">
            Connect email threads to specific clients and projects
          </p>
        </Card>

        <Card className="p-4">
          <RefreshCw className="h-8 w-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Send Emails</h3>
          <p className="text-sm text-gray-600">
            Send emails directly from BlogCanvas using your Gmail
          </p>
        </Card>
      </div>
    </div>
  )
}
