'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  FileText, 
  Users,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ReviewMetrics {
  totalPosts: number
  recentPosts: number
  statusCounts: Record<string, number>
  avgTimeToPublish: number
  approvalRate: number
  avgRevisionsPerPost: number
  qualityDistribution: {
    excellent: number
    good: number
    fair: number
    poor: number
    unscored: number
  }
  weeklyData: {
    date: string
    created: number
    published: number
    approved: number
  }[]
  topClients: { name: string; count: number }[]
  reviewTasks: {
    pending: number
    completed: number
    total: number
  }
  totalRevisions: number
}

export function ReviewAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<ReviewMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/analytics/review-metrics')
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch metrics')
      }
      
      setMetrics(data.metrics)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Review Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Review Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button onClick={fetchMetrics} className="mt-4" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) return null

  const maxWeeklyValue = Math.max(
    ...metrics.weeklyData.map(d => Math.max(d.created, d.published, d.approved))
  ) || 1

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Avg Time to Publish</p>
                <p className="text-3xl font-bold text-blue-800">
                  {metrics.avgTimeToPublish}h
                </p>
              </div>
              <Clock className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Approval Rate</p>
                <p className="text-3xl font-bold text-green-800">
                  {metrics.approvalRate}%
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Avg Revisions</p>
                <p className="text-3xl font-bold text-orange-800">
                  {metrics.avgRevisionsPerPost}
                </p>
              </div>
              <RefreshCw className="w-10 h-10 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Pending Reviews</p>
                <p className="text-3xl font-bold text-purple-800">
                  {metrics.reviewTasks.pending}
                </p>
              </div>
              <FileText className="w-10 h-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution & Quality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Content Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.statusCounts).map(([status, count]) => {
                const percentage = Math.round((count / metrics.totalPosts) * 100) || 0
                const colorMap: Record<string, string> = {
                  draft: 'bg-gray-500',
                  in_review: 'bg-yellow-500',
                  approved: 'bg-green-500',
                  published: 'bg-blue-500',
                  generating: 'bg-indigo-500',
                  failed: 'bg-red-500',
                }
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-24 capitalize">
                      {status.replace('_', ' ')}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colorMap[status] || 'bg-gray-400'} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">
                      {count} ({percentage}%)
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quality Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quality Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">
                  {metrics.qualityDistribution.excellent}
                </p>
                <p className="text-sm text-green-600">Excellent (80+)</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">
                  {metrics.qualityDistribution.good}
                </p>
                <p className="text-sm text-blue-600">Good (60-79)</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-700">
                  {metrics.qualityDistribution.fair}
                </p>
                <p className="text-sm text-yellow-600">Fair (40-59)</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-700">
                  {metrics.qualityDistribution.poor}
                </p>
                <p className="text-sm text-red-600">Poor (&lt;40)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            7-Day Content Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-40 gap-2">
            {metrics.weeklyData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '120px' }}>
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${(day.created / maxWeeklyValue) * 100}%`, minHeight: day.created > 0 ? '4px' : '0' }}
                    title={`Created: ${day.created}`}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-gray-600">Created</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Clients */}
      {metrics.topClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Clients by Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topClients.map((client, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">
                      {i + 1}
                    </span>
                    <span className="font-medium">{client.name}</span>
                  </div>
                  <Badge variant="secondary">{client.count} posts</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
