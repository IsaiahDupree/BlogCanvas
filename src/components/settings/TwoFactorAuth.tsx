'use client'

import { useState, useEffect } from 'react'
import { Shield, Download, RefreshCw, AlertTriangle, Check, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

interface TwoFactorAuthProps {
  userId?: string
}

interface TwoFactorStatus {
  enabled: boolean
  verified: boolean
  enforced: boolean
  enabledAt: string | null
  lastUsedAt: string | null
  backupCodesCount: number
  needsSetup: boolean
}

interface SetupData {
  qrCodeDataUrl: string
  manualEntryKey: string
  issuer: string
  accountName: string
}

export default function TwoFactorAuth({ userId }: TwoFactorAuthProps) {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupMode, setSetupMode] = useState(false)
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [verificationToken, setVerificationToken] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa/setup')
      const result = await response.json()

      if (result.success) {
        setStatus(result.data)
      } else {
        setError(result.error || 'Failed to load 2FA status')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load 2FA status')
    } finally {
      setLoading(false)
    }
  }

  const startSetup = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      })
      const result = await response.json()

      if (result.success) {
        setSetupData(result.data)
        setSetupMode(true)
      } else {
        setError(result.error || 'Failed to initialize 2FA setup')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize 2FA setup')
    } finally {
      setLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verificationToken,
          purpose: 'setup',
        }),
      })
      const result = await response.json()

      if (result.success) {
        setBackupCodes(result.backupCodes || [])
        setShowBackupCodes(true)
        setSetupMode(false)
        setSuccess('2FA enabled successfully! Save your backup codes.')
        await fetchStatus()
      } else {
        setError(result.error || 'Invalid verification code')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify token')
    } finally {
      setLoading(false)
      setVerificationToken('')
    }
  }

  const disable2FA = async () => {
    if (
      !confirm(
        'Are you sure you want to disable 2FA? This will make your account less secure.'
      )
    ) {
      return
    }

    const password = prompt('Enter your password to confirm:')
    if (!password) return

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const result = await response.json()

      if (result.success) {
        setSuccess('2FA disabled successfully')
        await fetchStatus()
      } else {
        setError(result.error || 'Failed to disable 2FA')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const regenerateBackupCodes = async () => {
    if (
      !confirm(
        'This will invalidate all existing backup codes. Are you sure?'
      )
    ) {
      return
    }

    const password = prompt('Enter your password to confirm:')
    if (!password) return

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/2fa/backup-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const result = await response.json()

      if (result.success) {
        setBackupCodes(result.backupCodes || [])
        setShowBackupCodes(true)
        setSuccess('Backup codes regenerated successfully!')
        await fetchStatus()
      } else {
        setError(result.error || 'Failed to regenerate backup codes')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate backup codes')
    } finally {
      setLoading(false)
    }
  }

  const downloadBackupCodes = () => {
    const content = backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'blogcanvas-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && !status) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Status Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
              {status?.enabled ? (
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800">Disabled</Badge>
              )}
              {status?.enforced && (
                <Badge className="bg-amber-100 text-amber-800">Required</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Add an extra layer of security to your account by requiring a code from your
              authenticator app when signing in.
            </p>
          </div>
        </div>

        {status?.enabled && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Enabled</p>
              <p className="text-sm font-medium">
                {status.enabledAt
                  ? new Date(status.enabledAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Backup Codes</p>
              <p className="text-sm font-medium">
                {status.backupCodesCount} remaining
                {status.backupCodesCount <= 3 && (
                  <span className="text-amber-600 ml-2">(Low!)</span>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {!status?.enabled && !setupMode && (
            <Button onClick={startSetup} disabled={loading}>
              <Shield className="w-4 h-4 mr-2" />
              Enable 2FA
            </Button>
          )}

          {status?.enabled && !status?.enforced && (
            <Button variant="outline" onClick={disable2FA} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              Disable 2FA
            </Button>
          )}

          {status?.enabled && (
            <Button variant="outline" onClick={regenerateBackupCodes} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate Backup Codes
            </Button>
          )}
        </div>
      </Card>

      {/* Setup Mode */}
      {setupMode && setupData && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Set Up Authenticator App</h3>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-700 mb-3">
                <strong>Step 1:</strong> Scan this QR code with your authenticator app (Google
                Authenticator, Authy, 1Password, etc.)
              </p>
              <div className="bg-white p-4 rounded-lg border inline-block">
                <Image
                  src={setupData.qrCodeDataUrl}
                  alt="2FA QR Code"
                  width={300}
                  height={300}
                  className="w-64 h-64"
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Or manually enter this key:</strong>
              </p>
              <code className="block bg-gray-100 p-3 rounded text-sm font-mono">
                {setupData.manualEntryKey}
              </code>
            </div>

            <div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Step 2:</strong> Enter the 6-digit code from your authenticator app
              </p>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  placeholder="000000"
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg text-center text-lg font-mono"
                />
                <Button
                  onClick={verifyAndEnable}
                  disabled={loading || verificationToken.length !== 6}
                >
                  Verify & Enable
                </Button>
                <Button variant="outline" onClick={() => setSetupMode(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Backup Codes Display */}
      {showBackupCodes && backupCodes.length > 0 && (
        <Card className="p-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-amber-900">Save Your Backup Codes</h3>
              <p className="text-sm text-amber-800 mt-1">
                Each code can be used once. Store them in a safe place - you won't be able to see
                them again!
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-amber-200 mb-4">
            <div className="grid grid-cols-2 gap-3 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-gray-500">{(index + 1).toString().padStart(2, '0')}.</span>
                  <span className="font-semibold">{code}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={downloadBackupCodes}>
              <Download className="w-4 h-4 mr-2" />
              Download as Text File
            </Button>
            <Button variant="outline" onClick={() => setShowBackupCodes(false)}>
              I've Saved Them
            </Button>
          </div>
        </Card>
      )}

      {/* Info Card */}
      {status?.enforced && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                2FA Required for Your Role
              </h4>
              <p className="text-sm text-blue-800">
                As an administrator, two-factor authentication is required for your account and
                cannot be disabled. This helps protect your account and the platform.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
