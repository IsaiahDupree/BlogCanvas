'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Clock, AlertTriangle, Mail, CheckCircle, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface SLASettings {
  id?: string
  vendor_id: string
  editor_sla_hours: number
  editor_alert_threshold_hours: number
  client_sla_hours: number
  client_alert_threshold_hours: number
  enable_alerts: boolean
  alert_recipients: string[]
  escalation_enabled: boolean
  escalation_hours: number
  escalation_recipients: string[]
  created_at?: string
  updated_at?: string
}

export default function SLASettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDefault, setIsDefault] = useState(false)

  const [settings, setSettings] = useState<SLASettings>({
    vendor_id: '',
    editor_sla_hours: 24,
    editor_alert_threshold_hours: 20,
    client_sla_hours: 72,
    client_alert_threshold_hours: 60,
    enable_alerts: true,
    alert_recipients: [],
    escalation_enabled: false,
    escalation_hours: 48,
    escalation_recipients: []
  })

  // Temporary input state for adding emails
  const [newAlertEmail, setNewAlertEmail] = useState('')
  const [newEscalationEmail, setNewEscalationEmail] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/sla/settings')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch SLA settings')
      }

      setSettings(data.settings)
      setIsDefault(data.isDefault || false)

    } catch (err: any) {
      console.error('Error fetching settings:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const res = await fetch('/api/sla/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save SLA settings')
      }

      setSettings(data.settings)
      setSaved(true)
      setIsDefault(false)
      setTimeout(() => setSaved(false), 3000)

    } catch (err: any) {
      console.error('Error saving settings:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const addAlertRecipient = () => {
    if (newAlertEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAlertEmail)) {
      if (!settings.alert_recipients.includes(newAlertEmail)) {
        setSettings({
          ...settings,
          alert_recipients: [...settings.alert_recipients, newAlertEmail]
        })
        setNewAlertEmail('')
      }
    }
  }

  const removeAlertRecipient = (email: string) => {
    setSettings({
      ...settings,
      alert_recipients: settings.alert_recipients.filter(e => e !== email)
    })
  }

  const addEscalationRecipient = () => {
    if (newEscalationEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEscalationEmail)) {
      if (!settings.escalation_recipients.includes(newEscalationEmail)) {
        setSettings({
          ...settings,
          escalation_recipients: [...settings.escalation_recipients, newEscalationEmail]
        })
        setNewEscalationEmail('')
      }
    }
  }

  const removeEscalationRecipient = (email: string) => {
    setSettings({
      ...settings,
      escalation_recipients: settings.escalation_recipients.filter(e => e !== email)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading SLA settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/app/settings" className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-600" />
                SLA Settings
              </h1>
              <p className="text-gray-600 mt-2">
                Configure review SLA timelines and alert preferences
              </p>
            </div>
            {isDefault && (
              <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700">
                Using Defaults
              </Badge>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">What is an SLA?</p>
              <p>
                Service Level Agreements (SLAs) define expected turnaround times for reviews.
                Alerts help ensure reviews are completed on time to maintain quality and client satisfaction.
              </p>
            </div>
          </div>
        </Card>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}

        {saved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {/* Editor Review SLA */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Editor Review SLA
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Internal team review of completed content before client submission
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SLA Duration (hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={settings.editor_sla_hours}
                onChange={(e) => setSettings({ ...settings, editor_sla_hours: parseInt(e.target.value) || 24 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: 24 hours
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Threshold (hours)
              </label>
              <input
                type="number"
                min="1"
                max={settings.editor_sla_hours - 1}
                value={settings.editor_alert_threshold_hours}
                onChange={(e) => setSettings({ ...settings, editor_alert_threshold_hours: parseInt(e.target.value) || 20 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Send warning at this time (before deadline)
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Timeline:</strong> Content pending {settings.editor_alert_threshold_hours}+ hours receives a warning alert.
              Content pending {settings.editor_sla_hours}+ hours is marked as SLA breach.
            </p>
          </div>
        </Card>

        {/* Client Review SLA */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Client Review SLA
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Client approval/feedback on submitted content
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SLA Duration (hours)
              </label>
              <input
                type="number"
                min="1"
                max="720"
                value={settings.client_sla_hours}
                onChange={(e) => setSettings({ ...settings, client_sla_hours: parseInt(e.target.value) || 72 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: 72 hours (3 days)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Threshold (hours)
              </label>
              <input
                type="number"
                min="1"
                max={settings.client_sla_hours - 1}
                value={settings.client_alert_threshold_hours}
                onChange={(e) => setSettings({ ...settings, client_alert_threshold_hours: parseInt(e.target.value) || 60 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Send reminder at this time (before deadline)
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Timeline:</strong> Content awaiting client review for {settings.client_alert_threshold_hours}+ hours receives a gentle reminder.
              Content pending {settings.client_sla_hours}+ hours is flagged for follow-up.
            </p>
          </div>
        </Card>

        {/* Alert Configuration */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-600" />
            Alert Configuration
          </h2>

          {/* Enable Alerts Toggle */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_alerts}
                onChange={(e) => setSettings({ ...settings, enable_alerts: e.target.checked })}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Enable SLA Alerts</span>
                <p className="text-xs text-gray-500">Send email notifications when reviews approach or exceed SLA</p>
              </div>
            </label>
          </div>

          {/* Alert Recipients */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Recipients
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Team members who will receive SLA alert emails (editors, managers)
            </p>

            <div className="flex gap-2 mb-3">
              <input
                type="email"
                value={newAlertEmail}
                onChange={(e) => setNewAlertEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAlertRecipient()}
                placeholder="email@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                onClick={addAlertRecipient}
                disabled={!newAlertEmail}
                variant="outline"
              >
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {settings.alert_recipients.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No recipients added. Alerts will go to vendor admins by default.</p>
              ) : (
                settings.alert_recipients.map((email, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                    <span className="text-sm text-gray-700">{email}</span>
                    <button
                      onClick={() => removeAlertRecipient(email)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Escalation (Optional) */}
          <div className="border-t pt-6">
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.escalation_enabled}
                  onChange={(e) => setSettings({ ...settings, escalation_enabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Enable Escalation</span>
                  <p className="text-xs text-gray-500">Send escalated alerts to additional recipients after prolonged SLA breach</p>
                </div>
              </label>
            </div>

            {settings.escalation_enabled && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escalation Threshold (hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.escalation_hours}
                    onChange={(e) => setSettings({ ...settings, escalation_hours: parseInt(e.target.value) || 48 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Send escalation alert if still pending after this time
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escalation Recipients
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Senior leadership or managers who receive escalated alerts (optional)
                  </p>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="email"
                      value={newEscalationEmail}
                      onChange={(e) => setNewEscalationEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addEscalationRecipient()}
                      placeholder="manager@example.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      onClick={addEscalationRecipient}
                      disabled={!newEscalationEmail}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {settings.escalation_recipients.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No escalation recipients added</p>
                    ) : (
                      settings.escalation_recipients.map((email, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                          <span className="text-sm text-gray-700">{email}</span>
                          <button
                            onClick={() => removeEscalationRecipient(email)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Link href="/app/settings">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        {/* Last Updated */}
        {settings.updated_at && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Last updated: {new Date(settings.updated_at).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}
