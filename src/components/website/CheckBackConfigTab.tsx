'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, Calendar, CheckCircle2, Plus, Trash2, RotateCcw, Save } from 'lucide-react'

interface CheckBackConfigTabProps {
  websiteId: string
}

interface CheckBackConfig {
  id: string
  website_id: string
  intervals: number[]
  enabled: boolean
  created_at: string
  updated_at: string
}

export function CheckBackConfigTab({ websiteId }: CheckBackConfigTabProps) {
  const [config, setConfig] = useState<CheckBackConfig | null>(null)
  const [intervals, setIntervals] = useState<number[]>([7, 30, 60, 90])
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newInterval, setNewInterval] = useState<string>('')

  useEffect(() => {
    fetchConfig()
  }, [websiteId])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/websites/${websiteId}/check-back-config`)
      const data = await response.json()

      if (response.ok) {
        setConfig(data)
        setIntervals(data.intervals || [7, 30, 60, 90])
        setEnabled(data.enabled !== false)
      } else {
        setError(data.error || 'Failed to fetch configuration')
      }
    } catch (err) {
      console.error('Failed to fetch check-back config:', err)
      setError('Failed to fetch configuration')
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Sort intervals
      const sortedIntervals = [...intervals].sort((a, b) => a - b)

      const response = await fetch(`/api/websites/${websiteId}/check-back-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intervals: sortedIntervals,
          enabled,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setConfig(data)
        setIntervals(data.intervals)
        setEnabled(data.enabled)
        setSuccess('Configuration saved successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to save configuration')
      }
    } catch (err) {
      console.error('Failed to save check-back config:', err)
      setError('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefault = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/websites/${websiteId}/check-back-config`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setConfig(data)
        setIntervals(data.intervals)
        setEnabled(data.enabled)
        setSuccess('Reset to default configuration!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to reset configuration')
      }
    } catch (err) {
      console.error('Failed to reset check-back config:', err)
      setError('Failed to reset configuration')
    } finally {
      setSaving(false)
    }
  }

  const addInterval = () => {
    const days = parseInt(newInterval)
    if (isNaN(days) || days <= 0) {
      setError('Please enter a valid positive number')
      return
    }

    if (intervals.includes(days)) {
      setError('This interval already exists')
      return
    }

    setIntervals([...intervals, days].sort((a, b) => a - b))
    setNewInterval('')
    setError(null)
  }

  const removeInterval = (days: number) => {
    setIntervals(intervals.filter(i => i !== days))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Check-Back Schedule Configuration
          </CardTitle>
          <CardDescription>
            Configure when to collect analytics metrics after posts are published.
            Default schedule follows PRD recommendations: Day 7, 30, 60, 90.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">Success</p>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Automatic Check-Backs</CardTitle>
          <CardDescription>
            Enable or disable automatic metric collection for published posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled" className="text-sm font-medium">
              Automatic check-backs enabled
            </Label>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Intervals Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Check-Back Intervals</CardTitle>
          <CardDescription>
            Days after publish to collect metrics (e.g., 7, 30, 60, 90)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Intervals */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Current Schedule</Label>
            <div className="flex flex-wrap gap-2">
              {intervals.length === 0 ? (
                <p className="text-sm text-gray-500">No intervals configured</p>
              ) : (
                intervals.map((days) => (
                  <Badge
                    key={days}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1"
                  >
                    <Calendar className="h-3 w-3" />
                    Day {days}
                    <button
                      onClick={() => removeInterval(days)}
                      className="ml-1 hover:text-red-600 transition-colors"
                      aria-label={`Remove Day ${days}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Add New Interval */}
          <div>
            <Label htmlFor="new-interval" className="text-sm font-medium mb-2 block">
              Add New Interval
            </Label>
            <div className="flex gap-2">
              <Input
                id="new-interval"
                type="number"
                min="1"
                placeholder="e.g., 14"
                value={newInterval}
                onChange={(e) => setNewInterval(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addInterval()
                  }
                }}
                className="max-w-xs"
              />
              <Button onClick={addInterval} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the number of days after publish
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button
          onClick={resetToDefault}
          variant="outline"
          disabled={saving}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Default
        </Button>

        <Button
          onClick={saveConfig}
          disabled={saving || intervals.length === 0}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
          <CardDescription>
            Example check-back schedule for a post published today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {intervals.map((days) => {
              const date = new Date()
              date.setDate(date.getDate() + days)
              return (
                <div
                  key={days}
                  className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded"
                >
                  <span className="text-sm font-medium">Day {days}</span>
                  <span className="text-sm text-gray-600">
                    {date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
