'use client'

/**
 * Notification Preferences Component
 * Allows users to configure which notifications they receive
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface NotificationPreferences {
  email_new_order: boolean
  email_order_update: boolean
  email_message: boolean
  email_content_approved: boolean
  email_content_rejected: boolean
  email_meeting_reminder: boolean
  email_weekly_summary: boolean
  in_app_new_order: boolean
  in_app_message: boolean
  in_app_content_update: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email_new_order: true,
  email_order_update: true,
  email_message: true,
  email_content_approved: true,
  email_content_rejected: true,
  email_meeting_reminder: true,
  email_weekly_summary: false,
  in_app_new_order: true,
  in_app_message: true,
  in_app_content_update: true,
}

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadPreferences()
  }, [])

  async function loadPreferences() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setPreferences(data as NotificationPreferences)
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  async function savePreferences() {
    setSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: 'Preferences saved',
        description: 'Your notification preferences have been updated.',
      })
    } catch (error: any) {
      toast({
        title: 'Error saving preferences',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  function updatePreference(key: keyof NotificationPreferences, value: boolean) {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return <div className="p-4">Loading preferences...</div>
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>

      {/* Email Notifications */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
        <div className="space-y-3">
          <PreferenceToggle
            label="New orders"
            description="Receive an email when a new order is placed"
            checked={preferences.email_new_order}
            onChange={(checked) => updatePreference('email_new_order', checked)}
          />
          <PreferenceToggle
            label="Order updates"
            description="Receive emails when order status changes"
            checked={preferences.email_order_update}
            onChange={(checked) => updatePreference('email_order_update', checked)}
          />
          <PreferenceToggle
            label="Messages"
            description="Receive emails for new messages"
            checked={preferences.email_message}
            onChange={(checked) => updatePreference('email_message', checked)}
          />
          <PreferenceToggle
            label="Content approved"
            description="Receive email when content is approved"
            checked={preferences.email_content_approved}
            onChange={(checked) => updatePreference('email_content_approved', checked)}
          />
          <PreferenceToggle
            label="Content rejected"
            description="Receive email when content needs revisions"
            checked={preferences.email_content_rejected}
            onChange={(checked) => updatePreference('email_content_rejected', checked)}
          />
          <PreferenceToggle
            label="Meeting reminders"
            description="Receive email reminders for upcoming meetings"
            checked={preferences.email_meeting_reminder}
            onChange={(checked) => updatePreference('email_meeting_reminder', checked)}
          />
          <PreferenceToggle
            label="Weekly summary"
            description="Receive a weekly summary of activity"
            checked={preferences.email_weekly_summary}
            onChange={(checked) => updatePreference('email_weekly_summary', checked)}
          />
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">In-App Notifications</h3>
        <div className="space-y-3">
          <PreferenceToggle
            label="New orders"
            description="Show notification bell for new orders"
            checked={preferences.in_app_new_order}
            onChange={(checked) => updatePreference('in_app_new_order', checked)}
          />
          <PreferenceToggle
            label="Messages"
            description="Show notification bell for new messages"
            checked={preferences.in_app_message}
            onChange={(checked) => updatePreference('in_app_message', checked)}
          />
          <PreferenceToggle
            label="Content updates"
            description="Show notification bell for content updates"
            checked={preferences.in_app_content_update}
            onChange={(checked) => updatePreference('in_app_content_update', checked)}
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={savePreferences}
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  )
}

interface PreferenceToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function PreferenceToggle({ label, description, checked, onChange }: PreferenceToggleProps) {
  return (
    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer ml-4">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  )
}
