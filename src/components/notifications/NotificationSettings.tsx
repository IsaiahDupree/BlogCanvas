'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, MessageSquare } from 'lucide-react'

interface NotificationPreference {
  channel: 'push' | 'email' | 'sms'
  event_type: string
  enabled: boolean
}

const EVENT_TYPES = [
  { value: 'order.created', label: 'New Orders', description: 'When a client purchases an offer' },
  { value: 'message.received', label: 'New Messages', description: 'When you receive a message' },
  { value: 'meeting.reminder', label: 'Meeting Reminders', description: '15 minutes before meetings' },
  { value: 'deliverable.approved', label: 'Deliverable Approvals', description: 'When clients approve deliverables' },
  { value: 'deliverable.revision', label: 'Revision Requests', description: 'When clients request changes' },
  { value: 'workspace.created', label: 'New Workspaces', description: 'When a new workspace is created' },
  { value: 'form.submitted', label: 'Form Submissions', description: 'When clients submit forms' },
]

const CHANNELS = [
  { value: 'push', label: 'Push', icon: Bell },
  { value: 'email', label: 'Email', icon: Mail },
]

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences')
      const data = await response.json()

      if (response.ok) {
        setPreferences(data.preferences || [])
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const savePreferences = async () => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      })

      if (response.ok) {
        // Show success message
        alert('Notification preferences saved!')
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to save notification preferences. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const togglePreference = (channel: string, eventType: string) => {
    setPreferences((prev) => {
      const existing = prev.find(
        (p) => p.channel === channel && p.event_type === eventType
      )

      if (existing) {
        return prev.map((p) =>
          p.channel === channel && p.event_type === eventType
            ? { ...p, enabled: !p.enabled }
            : p
        )
      } else {
        return [
          ...prev,
          {
            channel: channel as 'push' | 'email' | 'sms',
            event_type: eventType,
            enabled: true,
          },
        ]
      }
    })
  }

  const isEnabled = (channel: string, eventType: string): boolean => {
    const pref = preferences.find(
      (p) => p.channel === channel && p.event_type === eventType
    )
    return pref?.enabled ?? true // Default to enabled
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Notification Preferences
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose how you want to be notified about different events.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Event
                </th>
                {CHANNELS.map((channel) => {
                  const Icon = channel.icon
                  return (
                    <th
                      key={channel.value}
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Icon className="w-4 h-4" />
                        {channel.label}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {EVENT_TYPES.map((event) => (
                <tr key={event.value} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {event.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {event.description}
                      </p>
                    </div>
                  </td>
                  {CHANNELS.map((channel) => (
                    <td key={channel.value} className="px-6 py-4 text-center">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={isEnabled(channel.value, event.value)}
                          onChange={() => togglePreference(channel.value, event.value)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="sr-only">
                          Enable {channel.label} for {event.label}
                        </span>
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
