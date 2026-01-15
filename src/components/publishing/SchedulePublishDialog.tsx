'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Loader2, AlertCircle } from 'lucide-react'

interface SchedulePublishDialogProps {
  isOpen: boolean
  onClose: () => void
  postId?: string
  postIds?: string[]
  postTitle?: string
  onSuccess?: () => void
}

export default function SchedulePublishDialog({
  isOpen,
  onClose,
  postId,
  postIds,
  postTitle,
  onSuccess
}: SchedulePublishDialogProps) {
  const [scheduledDate, setScheduledDate] = useState('')
  const [publishStatus, setPublishStatus] = useState<'publish' | 'future'>('future')
  const [priority, setPriority] = useState('5')
  const [staggerMinutes, setStaggerMinutes] = useState('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isBatch = postIds && postIds.length > 0
  const postCount = isBatch ? postIds!.length : 1

  const handleSchedule = async () => {
    setError(null)

    // Validation
    if (!scheduledDate) {
      setError('Please select a date and time')
      return
    }

    const selectedDateTime = new Date(scheduledDate)
    const now = new Date()

    if (selectedDateTime <= now) {
      setError('Scheduled time must be in the future')
      return
    }

    setLoading(true)

    try {
      const payload: any = {
        scheduledFor: selectedDateTime.toISOString(),
        priority: parseInt(priority),
        publishStatus
      }

      if (isBatch) {
        payload.postIds = postIds
        if (parseInt(staggerMinutes) > 0) {
          payload.staggerMinutes = parseInt(staggerMinutes)
        }
      } else {
        payload.postId = postId
      }

      const response = await fetch('/api/publish-queue/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to schedule publish')
      }

      // Success
      if (onSuccess) {
        onSuccess()
      }

      // Show success message
      const message = isBatch
        ? `Successfully scheduled ${data.queued} of ${postCount} posts for publishing`
        : `Successfully scheduled post for publishing`

      alert(message)

      // Reset and close
      handleClose()
    } catch (err: any) {
      console.error('Schedule error:', err)
      setError(err.message || 'Failed to schedule publish')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setScheduledDate('')
    setPublishStatus('future')
    setPriority('5')
    setStaggerMinutes('0')
    setError(null)
    onClose()
  }

  // Format min datetime (now + 1 minute)
  const minDateTime = new Date(Date.now() + 60000).toISOString().slice(0, 16)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule for Publishing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Post info */}
          <div className="rounded-lg bg-gray-50 p-3 border">
            <div className="text-sm text-muted-foreground mb-1">
              {isBatch ? 'Posts to schedule' : 'Post'}
            </div>
            <div className="font-medium">
              {isBatch ? `${postCount} posts` : postTitle || 'Selected post'}
            </div>
          </div>

          {/* Date/Time Picker */}
          <div className="space-y-2">
            <Label htmlFor="scheduled-date">Publish Date & Time</Label>
            <input
              id="scheduled-date"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={minDateTime}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-muted-foreground">
              Select when this post should be published to WordPress
            </p>
          </div>

          {/* Publish Status */}
          <div className="space-y-2">
            <Label htmlFor="publish-status">Publish Status</Label>
            <Select value={publishStatus} onValueChange={(value: any) => setPublishStatus(value)}>
              <SelectTrigger id="publish-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="future">Future (Scheduled)</SelectItem>
                <SelectItem value="publish">Publish Immediately</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {publishStatus === 'future'
                ? 'WordPress will publish at the scheduled time'
                : 'Queue will publish immediately at the scheduled time'}
            </p>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority (1-10)</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Lowest</SelectItem>
                <SelectItem value="3">3 - Low</SelectItem>
                <SelectItem value="5">5 - Normal</SelectItem>
                <SelectItem value="7">7 - High</SelectItem>
                <SelectItem value="10">10 - Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stagger Minutes (batch only) */}
          {isBatch && (
            <div className="space-y-2">
              <Label htmlFor="stagger">Stagger Minutes (Optional)</Label>
              <input
                id="stagger"
                type="number"
                min="0"
                max="1440"
                value={staggerMinutes}
                onChange={(e) => setStaggerMinutes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground">
                Spread posts over time (0 = all at once, 60 = 1 hour apart each)
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={loading || !scheduledDate}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule {isBatch ? `${postCount} Posts` : 'Post'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
