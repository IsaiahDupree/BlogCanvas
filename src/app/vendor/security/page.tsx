'use client'

import { useState, useEffect } from 'react'
import { Shield, Lock, AlertTriangle, CheckCircle, Activity, Eye, Ban, Key, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'

interface SecurityMetrics {
  audit_logs_count: number
  failed_logins_7d: number
  ip_blocks_7d: number
  active_ip_rules: number
  two_factor_enabled: boolean
  last_audit_log: string | null
  recent_blocks: Array<{
    ip_address: string
    count: number
  }>
}

interface IPRule {
  id: string
  ip_address: string
  label?: string
  enabled: boolean
  match_count: number
}

export default function VendorSecurityDashboard() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
  const [ipAllowlistEnabled, setIpAllowlistEnabled] = useState(false)
  const [ipRules, setIpRules] = useState<IPRule[]>([])

  useEffect(() => {
    fetchSecurityMetrics()
    fetchIPAllowlist()
  }, [])

  const fetchSecurityMetrics = async () => {
    try {
      const response = await fetch('/api/vendor/security/metrics')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Failed to fetch security metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchIPAllowlist = async () => {
    try {
      const response = await fetch('/api/vendor/ip-allowlist')
      if (response.ok) {
        const data = await response.json()
        setIpAllowlistEnabled(data.enabled || false)
        setIpRules(data.rules || [])
      }
    } catch (error) {
      console.error('Failed to fetch IP allowlist:', error)
    }
  }

  const toggleIPAllowlist = async () => {
    try {
      const response = await fetch('/api/vendor/ip-allowlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !ipAllowlistEnabled }),
      })

      if (response.ok) {
        setIpAllowlistEnabled(!ipAllowlistEnabled)
      }
    } catch (error) {
      console.error('Failed to toggle IP allowlist:', error)
      alert('Failed to toggle IP allowlist')
    }
  }

  const getSecurityScore = (): { score: number; level: string; color: string } => {
    let score = 0

    // Base security features
    if (metrics?.two_factor_enabled) score += 30
    if (ipAllowlistEnabled) score += 20
    if (ipRules.length > 0) score += 15

    // Activity-based score
    if (metrics?.audit_logs_count && metrics.audit_logs_count > 0) score += 10
    if (metrics?.failed_logins_7d !== undefined && metrics.failed_logins_7d < 5) score += 15
    if (metrics?.ip_blocks_7d !== undefined && metrics.ip_blocks_7d < 10) score += 10

    if (score >= 80) return { score, level: 'Excellent', color: 'text-green-600' }
    if (score >= 60) return { score, level: 'Good', color: 'text-blue-600' }
    if (score >= 40) return { score, level: 'Fair', color: 'text-yellow-600' }
    return { score, level: 'Needs Improvement', color: 'text-red-600' }
  }

  const security = getSecurityScore()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-8 flex items-center justify-center">
        <Activity className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-indigo-600" />
          <h1 className="text-4xl font-bold text-gray-900">Security Dashboard</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Monitor and manage your security settings and compliance
        </p>
      </div>

      {/* Security Score Card */}
      <Card className="p-8 mb-8 border-2 border-indigo-100 bg-gradient-to-br from-white to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2">Overall Security Score</p>
            <div className="flex items-center gap-4">
              <div className="text-6xl font-bold text-indigo-600">{security.score}</div>
              <div>
                <div className={`text-2xl font-semibold ${security.color}`}>
                  {security.level}
                </div>
                <p className="text-sm text-gray-500">out of 100</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Shield className="w-24 h-24 text-indigo-200 mb-2" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
              style={{ width: `${security.score}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Security Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Audit Logs */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics?.audit_logs_count?.toLocaleString() || 0}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">Audit Log Events</p>
          <Link href="/app/audit-logs">
            <Button variant="outline" className="w-full" size="sm">
              View Logs
            </Button>
          </Link>
        </Card>

        {/* Failed Logins */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics?.failed_logins_7d || 0}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">Failed Logins (7d)</p>
          <Badge variant="outline" className="text-xs">
            {(metrics?.failed_logins_7d || 0) < 5 ? 'Normal' : 'Review Needed'}
          </Badge>
        </Card>

        {/* IP Blocks */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <Ban className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics?.ip_blocks_7d || 0}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">Blocked Attempts (7d)</p>
          <Badge variant="outline" className="text-xs">
            {(metrics?.ip_blocks_7d || 0) < 10 ? 'Secure' : 'High Activity'}
          </Badge>
        </Card>

        {/* IP Rules */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Key className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics?.active_ip_rules || ipRules.filter(r => r.enabled).length}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">Active IP Rules</p>
          <Badge variant="outline" className="text-xs">
            {ipAllowlistEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </Card>
      </div>

      {/* Security Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* IP Allowlist Management */}
        <Card className="p-6 border-2 border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">IP Allowlist</h2>
            </div>
            <Switch
              checked={ipAllowlistEnabled}
              onCheckedChange={toggleIPAllowlist}
            />
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Restrict access to your vendor dashboard and APIs to specific IP addresses
          </p>

          {ipAllowlistEnabled && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Active Rules ({ipRules.filter(r => r.enabled).length})
              </p>
              {ipRules.filter(r => r.enabled).slice(0, 3).map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <span className="font-mono text-xs">{rule.ip_address}</span>
                  <Badge variant="outline" className="text-xs">
                    {rule.match_count} matches
                  </Badge>
                </div>
              ))}
              {ipRules.filter(r => r.enabled).length > 3 && (
                <p className="text-xs text-gray-500">
                  +{ipRules.filter(r => r.enabled).length - 3} more rules
                </p>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <Link href="/vendor/settings/ip-allowlist">
              <Button variant="outline" className="w-full" size="sm">
                Manage IP Rules
              </Button>
            </Link>
          </div>
        </Card>

        {/* Two-Factor Authentication */}
        <Card className="p-6 border-2 border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
            </div>
            {metrics?.two_factor_enabled ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            )}
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Add an extra layer of security to your account with 2FA
          </p>

          <div className="p-3 bg-gray-50 rounded mb-4">
            <p className="text-xs font-medium text-gray-700 mb-1">Status</p>
            <Badge className={metrics?.two_factor_enabled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
              {metrics?.two_factor_enabled ? 'Enabled' : 'Not Enabled'}
            </Badge>
          </div>

          <div className="pt-4 border-t">
            <Link href="/app/settings/security">
              <Button variant="outline" className="w-full" size="sm">
                Manage 2FA Settings
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Security Activity */}
      {metrics?.recent_blocks && metrics.recent_blocks.length > 0 && (
        <Card className="p-6 border-2 border-indigo-100">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold">Top Blocked IPs (Last 7 Days)</h2>
          </div>

          <div className="space-y-2">
            {metrics.recent_blocks.map((block, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                <span className="font-mono text-sm">{block.ip_address}</span>
                <Badge variant="outline" className="text-xs">
                  {block.count} attempts
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Security Recommendations */}
      <Card className="p-6 mt-6 border-2 border-yellow-100 bg-yellow-50">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <h2 className="text-lg font-semibold text-gray-900">Security Recommendations</h2>
        </div>

        <ul className="space-y-2">
          {!metrics?.two_factor_enabled && (
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-yellow-600 mt-0.5">•</span>
              Enable two-factor authentication for enhanced account security
            </li>
          )}
          {!ipAllowlistEnabled && (
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-yellow-600 mt-0.5">•</span>
              Consider enabling IP allowlist if you access from fixed locations
            </li>
          )}
          {metrics && metrics.failed_logins_7d > 5 && (
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-yellow-600 mt-0.5">•</span>
              Review recent failed login attempts and consider changing your password
            </li>
          )}
          {ipRules.length === 0 && ipAllowlistEnabled && (
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-yellow-600 mt-0.5">•</span>
              Add IP allowlist rules to restrict access to your dashboard
            </li>
          )}
        </ul>
      </Card>
    </div>
  )
}
