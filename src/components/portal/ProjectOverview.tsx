'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Target, BarChart3, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SEOMetrics {
  baselineScore: number
  targetScore: number
  expectedUplift: number
  pagesIndexed: number
  lastAuditDate: string | null
}

interface ContentBatch {
  id: string
  name: string
  goal_score_from: number
  goal_score_to: number
  total_posts: number
  posts_completed: number
  posts_approved: number
  posts_published: number
  status: string
  start_date: string
  end_date: string
}

interface ProjectOverviewData {
  seoMetrics: SEOMetrics
  contentBatches: ContentBatch[]
  website: {
    url: string
    platform: string
  }
}

export default function ProjectOverview() {
  const [data, setData] = useState<ProjectOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjectOverview() {
      try {
        const response = await fetch('/api/portal/project-overview')
        if (!response.ok) {
          throw new Error('Failed to fetch project overview')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error('Error fetching project overview:', err)
        setError('Failed to load project overview')
      } finally {
        setLoading(false)
      }
    }

    fetchProjectOverview()
  }, [])

  if (loading) {
    return (
      <Card className="p-6 bg-white shadow-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="p-6 bg-white shadow-xl">
        <p className="text-red-600">
          {error || 'No project data available. Please contact your account manager.'}
        </p>
      </Card>
    )
  }

  const { seoMetrics, contentBatches, website } = data
  const activeBatch = contentBatches.length > 0 ? contentBatches[0] : null

  // Calculate progress percentage
  const progressPercentage = activeBatch
    ? Math.round(
        (activeBatch.posts_completed / Math.max(activeBatch.total_posts, 1)) * 100
      )
    : 0

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-200 shadow-xl mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Project Overview</h2>
          <p className="text-muted-foreground">{website.url}</p>
        </div>
      </div>

      {/* SEO Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-white border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-muted-foreground">
              SEO Baseline Score
            </p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {seoMetrics.baselineScore}
            <span className="text-sm text-muted-foreground">/100</span>
          </p>
          {seoMetrics.lastAuditDate && (
            <p className="text-xs text-muted-foreground mt-1">
              Last audit: {new Date(seoMetrics.lastAuditDate).toLocaleDateString()}
            </p>
          )}
        </Card>

        <Card className="p-4 bg-white border-2 border-indigo-200">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <p className="text-sm font-medium text-muted-foreground">
              Target Score
            </p>
          </div>
          <p className="text-3xl font-bold text-indigo-600">
            {seoMetrics.targetScore}
            <span className="text-sm text-muted-foreground">/100</span>
          </p>
          {activeBatch && (
            <p className="text-xs text-muted-foreground mt-1">
              Goal: {activeBatch.name}
            </p>
          )}
        </Card>

        <Card className="p-4 bg-white border-2 border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-muted-foreground">
              Expected Uplift
            </p>
          </div>
          <p className="text-3xl font-bold text-green-600">
            +{seoMetrics.expectedUplift}
            <span className="text-sm text-muted-foreground"> points</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {seoMetrics.pagesIndexed} pages indexed
          </p>
        </Card>
      </div>

      {/* Active Batch Progress */}
      {activeBatch && (
        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Active Content Batch</h3>
            </div>
            <Badge
              className={
                activeBatch.status === 'in_progress'
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }
            >
              {activeBatch.status.replace('_', ' ')}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-3">{activeBatch.name}</p>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-gray-900">
                {activeBatch.posts_completed} / {activeBatch.total_posts} posts
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Batch Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {activeBatch.posts_approved}
              </p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {activeBatch.posts_published}
              </p>
              <p className="text-xs text-muted-foreground">Published</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {activeBatch.total_posts -
                  activeBatch.posts_completed}
              </p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
          </div>

          {/* Timeline */}
          {activeBatch.start_date && activeBatch.end_date && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Start: {new Date(activeBatch.start_date).toLocaleDateString()}
                </span>
                <span>
                  End: {new Date(activeBatch.end_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* No Active Batch Message */}
      {!activeBatch && (
        <Card className="p-4 bg-white border-2 border-gray-200">
          <p className="text-center text-muted-foreground">
            No active content batch. Contact your account manager to get started.
          </p>
        </Card>
      )}
    </Card>
  )
}
