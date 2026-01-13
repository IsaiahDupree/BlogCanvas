'use client'

/**
 * Two-Factor Authentication Settings Page
 * Allows users to enable, disable, and manage 2FA
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Shield, Key, Download, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface TwoFAStatus {
  enabled: boolean
  verified: boolean
  enforced: boolean
  backupCodesCount: number
  needsSetup: boolean
}

interface SetupData {
  qrCodeDataUrl: string
  manualEntryKey: string
  issuer: string
  accountName: string
}

export default function TwoFactorAuthPage() {
  const router = useRouter()
  const [status, setStatus] = useState<TwoFAStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false)
  const [verificationToken, setVerificationToken] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      const res = await fetch('/api/auth/2fa/setup')
      const data = await res.json()

      if (data.success) {
        setStatus(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error)
    } finally {
      setLoading(false)
    }
  }

  async function startSetup() {
    try {
      setLoading(true)
      setError('')

      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error)
        return
      }

      setSetupData(data.data)
      setShowSetupDialog(true)
    } catch (error: any) {
      setError(error.message || 'Failed to start 2FA setup')
    } finally {
      setLoading(false)
    }
  }

  async function verifyAndEnable() {
    try {
      setLoading(true)
      setError('')

      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verificationToken,
          purpose: 'setup',
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error)
        return
      }

      setBackupCodes(data.backupCodes)
      setShowSetupDialog(false)
      setShowBackupCodesDialog(true)
      setSuccess('2FA enabled successfully!')
      await fetchStatus()
    } catch (error: any) {
      setError(error.message || 'Failed to verify token')
    } finally {
      setLoading(false)
      setVerificationToken('')
    }
  }

  async function disable2FA() {
    try {
      setLoading(true)
      setError('')

      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error)
        return
      }

      setSuccess('2FA disabled successfully')
      setShowDisableDialog(false)
      await fetchStatus()
    } catch (error: any) {
      setError(error.message || 'Failed to disable 2FA')
    } finally {
      setLoading(false)
      setPassword('')
    }
  }

  async function regenerateBackupCodes() {
    try {
      setLoading(true)
      setError('')

      const res = await fetch('/api/auth/2fa/backup-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error)
        return
      }

      setBackupCodes(data.backupCodes)
      setShowBackupCodesDialog(true)
      setSuccess('Backup codes regenerated successfully')
      await fetchStatus()
    } catch (error: any) {
      setError(error.message || 'Failed to regenerate backup codes')
    } finally {
      setLoading(false)
      setPassword('')
    }
  }

  function downloadBackupCodes() {
    const text = backupCodes
      .map((code, i) => `${i + 1}. ${code}`)
      .join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blogcanvas-backup-codes-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading 2FA settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-600" />
          Two-Factor Authentication
        </h1>
        <p className="text-gray-600 mt-2">
          Add an extra layer of security to your account
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">{success}</div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Authenticator App</CardTitle>
          <CardDescription>
            Use an authenticator app like Google Authenticator, Authy, or 1Password to
            generate verification codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">
                Status:{' '}
                {status?.enabled ? (
                  <span className="text-green-600">Enabled</span>
                ) : (
                  <span className="text-gray-600">Disabled</span>
                )}
              </p>
              {status?.enforced && (
                <p className="text-sm text-amber-600 mt-1">
                  2FA is required for your role
                </p>
              )}
            </div>
            {status?.enabled ? (
              <Button
                variant="outline"
                onClick={() => setShowDisableDialog(true)}
                disabled={status.enforced}
              >
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={startSetup} disabled={loading}>
                Enable 2FA
              </Button>
            )}
          </div>

          {status?.enabled && (
            <div className="mt-6 space-y-4">
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
                  <Key className="w-5 h-5 text-gray-600" />
                  Backup Codes
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Backup codes can be used to access your account if you lose your
                  authenticator device. Each code can only be used once.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      Unused codes: <strong>{status.backupCodesCount}</strong>
                    </p>
                    {status.backupCodesCount <= 3 && status.backupCodesCount > 0 && (
                      <p className="text-sm text-amber-600 mt-1">
                        Running low on backup codes. Consider regenerating.
                      </p>
                    )}
                    {status.backupCodesCount === 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        No backup codes left. Regenerate immediately.
                      </p>
                    )}
                  </div>
                  <Button variant="outline" onClick={regenerateBackupCodes}>
                    Regenerate Codes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {setupData && (
              <>
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <Image
                    src={setupData.qrCodeDataUrl}
                    alt="2FA QR Code"
                    width={250}
                    height={250}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Manual Entry Key
                  </Label>
                  <p className="text-xs text-gray-500 mt-1 mb-2">
                    If you cant scan the QR code, enter this key manually
                  </p>
                  <code className="block p-3 bg-gray-50 rounded border text-sm font-mono break-all">
                    {setupData.manualEntryKey}
                  </code>
                </div>
                <div>
                  <Label htmlFor="token">Verification Code</Label>
                  <Input
                    id="token"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={verificationToken}
                    onChange={(e) =>
                      setVerificationToken(e.target.value.replace(/\D/g, ''))
                    }
                  />
                </div>
                <Button
                  onClick={verifyAndEnable}
                  disabled={verificationToken.length !== 6 || loading}
                  className="w-full"
                >
                  Verify and Enable
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Your Backup Codes</DialogTitle>
            <DialogDescription>
              Store these codes in a safe place. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg border font-mono text-sm">
              {backupCodes.map((code, i) => (
                <div key={i} className="p-2">
                  {code}
                </div>
              ))}
            </div>
            <Button onClick={downloadBackupCodes} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Codes
            </Button>
            <Button
              onClick={() => setShowBackupCodesDialog(false)}
              className="w-full"
            >
              I&apos;ve Saved My Codes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to confirm disabling 2FA
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDisableDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={disable2FA}
                disabled={!password || loading}
                className="flex-1"
              >
                Disable 2FA
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
