'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Clock,
  AlertCircle
} from 'lucide-react'

/**
 * Pipeline Progress Component
 * PRD feat-120: Display pipeline status tracking per post
 *
 * Shows:
 * - Current stage in the AI pipeline
 * - Progress indicator (0-100%)
 * - Estimated time remaining
 * - Pause/Resume controls
 */

export interface PipelineStatus {
  id: string
  stage: string | null
  progress: number
  status: 'idle' | 'queued' | 'running' | 'paused' | 'completed' | 'failed'
  etaSeconds?: number | null
  error?: string | null
  startedAt?: string | null
  completedAt?: string | null
  paused: boolean
  postStatus: string
}

interface PipelineProgressProps {
  postId: string
  autoRefresh?: boolean
  refreshInterval?: number // milliseconds
  showControls?: boolean
  onStatusChange?: (status: PipelineStatus) => void
}

const STAGE_LABELS: Record<string, string> = {
  'idle': 'Not Started',
  'research': 'Research',
  'outline': 'Outline',
  'draft': 'Draft',
  'seo': 'SEO Optimization',
  'fact_check': 'Fact Check',
  'enhancement': 'Enhancement',
  'completed': 'Completed',
  'failed': 'Failed'
}

const STAGE_ORDER = ['research', 'outline', 'draft', 'seo', 'fact_check', 'enhancement']

export default function PipelineProgress({
  postId,
  autoRefresh = true,
  refreshInterval = 3000,
  showControls = true,
  onStatusChange
}: PipelineProgressProps) {
  const [status, setStatus] = useState<PipelineStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchStatus()

    if (autoRefresh) {
      const interval = setInterval(fetchStatus, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [postId, autoRefresh, refreshInterval])

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/blog-posts/${postId}/pipeline-status`)
      const data = await response.json()

      if (data.success) {
        setStatus(data.data)
        if (onStatusChange) {
          onStatusChange(data.data)
        }
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch status')
      }
    } catch (err: any) {
      console.error('Error fetching pipeline status:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePauseResume = async () => {
    if (!status) return

    setActionLoading(true)
    try {
      const action = status.paused ? 'resume' : 'pause'
      const response = await fetch(`/api/blog-posts/${postId}/pipeline-status/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      const data = await response.json()
      if (data.success) {
        // Update status immediately
        setStatus(prev => prev ? {
          ...prev,
          paused: action === 'pause',
          status: action === 'pause' ? 'paused' : 'running'
        } : null)

        // Fetch fresh status
        await fetchStatus()
      } else {
        setError(data.error || 'Failed to update status')
      }
    } catch (err: any) {
      console.error('Error updating pipeline status:', err)
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const formatETA = (seconds: number | null | undefined): string => {
    if (!seconds || seconds <= 0) return 'Calculating...'

    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60

    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      case 'running':
        return 'bg-blue-500'
      case 'paused':
        return 'bg-yellow-500'
      case 'queued':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'paused':
        return <Pause className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getCurrentStageIndex = (stage: string | null): number => {
    if (!stage) return -1
    return STAGE_ORDER.indexOf(stage)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading pipeline status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return null
  }

  const currentStageIndex = getCurrentStageIndex(status.stage)
  const overallProgress = status.status === 'completed' ? 100 :
    status.status === 'running' && currentStageIndex >= 0 ?
      ((currentStageIndex + (status.progress / 100)) / STAGE_ORDER.length) * 100 :
      0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Pipeline Status</CardTitle>
          <Badge className={getStatusColor(status.status)}>
            <span className="flex items-center gap-1">
              {getStageIcon(status.status)}
              {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Stage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {STAGE_LABELS[status.stage || 'idle'] || 'Unknown Stage'}
            </span>
            <span className="text-sm text-muted-foreground">
              {status.progress}%
            </span>
          </div>
          <Progress value={status.progress} className="h-2" />
        </div>

        {/* Overall Progress */}
        {status.status === 'running' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-1" />
          </div>
        )}

        {/* ETA */}
        {status.status === 'running' && status.etaSeconds && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Est. time remaining: {formatETA(status.etaSeconds)}</span>
          </div>
        )}

        {/* Error Message */}
        {status.status === 'failed' && status.error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Pipeline Failed</p>
              <p className="text-sm text-red-700 mt-1">{status.error}</p>
            </div>
          </div>
        )}

        {/* Stage Progress Indicators */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pipeline Stages
          </p>
          <div className="grid grid-cols-3 gap-2">
            {STAGE_ORDER.map((stage, index) => {
              const isCompleted = currentStageIndex > index || status.status === 'completed'
              const isCurrent = currentStageIndex === index && status.status === 'running'
              const isPending = currentStageIndex < index && status.status !== 'completed'

              return (
                <div
                  key={stage}
                  className={`
                    flex items-center justify-center gap-1 px-2 py-1 rounded text-xs
                    ${isCompleted ? 'bg-green-100 text-green-700' : ''}
                    ${isCurrent ? 'bg-blue-100 text-blue-700' : ''}
                    ${isPending ? 'bg-gray-100 text-gray-500' : ''}
                  `}
                >
                  {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                  {isCurrent && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span className="truncate">{STAGE_LABELS[stage]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Controls */}
        {showControls && status.status === 'running' && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePauseResume}
              disabled={actionLoading}
              className="flex-1"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : status.paused ? (
                <Play className="h-4 w-4 mr-2" />
              ) : (
                <Pause className="h-4 w-4 mr-2" />
              )}
              {status.paused ? 'Resume' : 'Pause'}
            </Button>
          </div>
        )}

        {/* Timing Info */}
        {(status.startedAt || status.completedAt) && (
          <div className="text-xs text-muted-foreground space-y-1">
            {status.startedAt && (
              <p>Started: {new Date(status.startedAt).toLocaleString()}</p>
            )}
            {status.completedAt && (
              <p>Completed: {new Date(status.completedAt).toLocaleString()}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
