'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Target, ArrowRight, CheckCircle, Clock, FileEdit } from 'lucide-react'
import { ProjectedSEOResult } from '@/lib/analysis/projected-seo'

interface ProjectedSEOScoreProps {
  websiteId?: string
  batchId?: string
  autoRefresh?: boolean
}

export default function ProjectedSEOScore({
  websiteId,
  batchId,
  autoRefresh = false,
}: ProjectedSEOScoreProps) {
  const [data, setData] = useState<ProjectedSEOResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjectedScore() {
      if (!websiteId && !batchId) {
        setError('Either websiteId or batchId is required')
        setLoading(false)
        return
      }

      try {
        const params = new URLSearchParams()
        if (websiteId) params.append('website_id', websiteId)
        if (batchId) params.append('batch_id', batchId)

        const response = await fetch(`/api/analytics/projected-seo?${params}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch projected score')
        }

        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        console.error('Error fetching projected SEO:', err)
        setError(err instanceof Error ? err.message : 'Failed to load projected score')
      } finally {
        setLoading(false)
      }
    }

    fetchProjectedScore()

    // Auto-refresh every 30 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchProjectedScore, 30000)
      return () => clearInterval(interval)
    }
  }, [websiteId, batchId, autoRefresh])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Projected SEO Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Projected SEO Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    )
  }

  const {
    baseline_score,
    current_projected_score,
    target_score,
    total_planned_posts,
    published_posts,
    approved_posts,
    completed_posts,
    score_breakdown,
  } = data

  const scoreGap = target_score - baseline_score
  const currentGain = current_projected_score - baseline_score
  const progressPercentage = scoreGap > 0 ? (currentGain / scoreGap) * 100 : 100

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'success'
    if (score >= 80) return 'default'
    if (score >= 70) return 'secondary'
    return 'destructive'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Projected SEO Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Before → After */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-sm text-gray-500 mb-1">Baseline</p>
            <p className={`text-3xl font-bold ${getScoreColor(baseline_score)}`}>
              {baseline_score}
            </p>
            <Badge variant="outline" className="mt-2">
              Current
            </Badge>
          </div>

          <ArrowRight className="h-8 w-8 text-gray-400 flex-shrink-0 mx-4" />

          <div className="text-center flex-1">
            <p className="text-sm text-gray-500 mb-1">Projected</p>
            <p className={`text-3xl font-bold ${getScoreColor(current_projected_score)}`}>
              {current_projected_score}
            </p>
            <Badge variant={getScoreBadge(current_projected_score) as any} className="mt-2">
              +{(currentGain).toFixed(1)}
            </Badge>
          </div>

          <ArrowRight className="h-8 w-8 text-gray-400 flex-shrink-0 mx-4" />

          <div className="text-center flex-1">
            <p className="text-sm text-gray-500 mb-1">Target</p>
            <p className={`text-3xl font-bold ${getScoreColor(target_score)}`}>
              {target_score}
            </p>
            <Badge variant="outline" className="mt-2">
              Goal
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progress to Target</span>
            <span className="font-semibold">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Post Status Summary */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-gray-600">Published</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{published_posts}</p>
            <p className="text-xs text-gray-500">+{score_breakdown.from_published.toFixed(1)} pts</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-gray-600">Approved</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{approved_posts}</p>
            <p className="text-xs text-gray-500">+{score_breakdown.from_approved.toFixed(1)} pts</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FileEdit className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {total_planned_posts - published_posts - approved_posts}
            </p>
            <p className="text-xs text-gray-500">
              +{(score_breakdown.from_completed + score_breakdown.from_in_progress).toFixed(1)} pts
            </p>
          </div>
        </div>

        {/* Summary Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            {current_projected_score >= target_score ? (
              <>
                <strong>Target achieved!</strong> Your projected score of {current_projected_score} exceeds
                the target of {target_score}.
              </>
            ) : (
              <>
                <strong>On track:</strong> {published_posts} of {total_planned_posts} posts published.
                Projected gain: +{currentGain.toFixed(1)} points ({Math.round(progressPercentage)}% to target).
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
