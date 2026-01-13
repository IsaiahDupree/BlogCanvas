'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, AlertTriangle, CheckCircle2, TrendingUp, ArrowRight, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface SLAMetrics {
  summary: {
    activeReviews: number
    approachingDeadline: number
    breached: number
    onTrack: number
  }
  editorReview: {
    slaHours: number
    complianceRate: number
    avgReviewDuration: number
    currentBreaches: number
    approachingDeadline: number
  }
  clientReview: {
    slaHours: number
    complianceRate: number
    avgReviewDuration: number
    currentBreaches: number
    approachingDeadline: number
  }
}

export default function SLADashboardWidget() {
  const [metrics, setMetrics] = useState<SLAMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
    // Refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/sla/metrics')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch SLA metrics')
      }

      setMetrics(data)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching SLA metrics:', err)
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
            <Clock className="w-5 h-5" />
            SLA Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            SLA Monitoring Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button onClick={fetchMetrics} size="sm" variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return null
  }

  const hasIssues = metrics.summary.breached > 0 || metrics.summary.approachingDeadline > 0
  const overallCompliance = metrics.editorReview.complianceRate

  return (
    <Card className={hasIssues ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${hasIssues ? 'text-orange-600' : 'text-green-600'}`} />
            SLA Compliance
          </CardTitle>
          <Link href="/app/settings/sla">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Overall Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Compliance</span>
            <Badge className={overallCompliance >= 90 ? 'bg-green-500' : overallCompliance >= 75 ? 'bg-yellow-500' : 'bg-red-500'}>
              {overallCompliance.toFixed(1)}%
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all ${
                overallCompliance >= 90 ? 'bg-green-500' :
                overallCompliance >= 75 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${overallCompliance}%` }}
            />
          </div>
        </div>

        {/* Active Reviews Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-gray-900">{metrics.summary.activeReviews}</div>
            <div className="text-xs text-gray-600">Active Reviews</div>
          </div>
          <div className="p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{metrics.summary.onTrack}</div>
            <div className="text-xs text-gray-600">On Track</div>
          </div>
        </div>

        {/* Issues */}
        {hasIssues && (
          <div className="space-y-2 mb-4">
            {metrics.summary.breached > 0 && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-800">
                  <strong>{metrics.summary.breached}</strong> SLA breach{metrics.summary.breached > 1 ? 'es' : ''}
                </span>
              </div>
            )}
            {metrics.summary.approachingDeadline > 0 && (
              <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
                <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <span className="text-sm text-orange-800">
                  <strong>{metrics.summary.approachingDeadline}</strong> approaching deadline
                </span>
              </div>
            )}
          </div>
        )}

        {/* SLA Breakdown */}
        <div className="space-y-3 mb-4">
          <div className="pb-3 border-b">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Editor Review ({metrics.editorReview.slaHours}h SLA)</span>
              <span className="text-xs font-semibold text-gray-900">{metrics.editorReview.complianceRate.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Avg: {metrics.editorReview.avgReviewDuration.toFixed(1)}h</span>
              {metrics.editorReview.currentBreaches > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {metrics.editorReview.currentBreaches} breach{metrics.editorReview.currentBreaches > 1 ? 'es' : ''}
                </Badge>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Client Review ({metrics.clientReview.slaHours}h SLA)</span>
              <span className="text-xs font-semibold text-gray-900">{metrics.clientReview.complianceRate.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Avg: {metrics.clientReview.avgReviewDuration.toFixed(1)}h</span>
              {metrics.clientReview.currentBreaches > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {metrics.clientReview.currentBreaches} breach{metrics.clientReview.currentBreaches > 1 ? 'es' : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link href="/app/review" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Clock className="w-4 h-4 mr-1" />
              View Reviews
            </Button>
          </Link>
          <Link href="/app/settings/sla" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </Button>
          </Link>
        </div>

        {!hasIssues && metrics.summary.activeReviews === 0 && (
          <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded text-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-sm text-green-800 font-medium">All caught up!</p>
            <p className="text-xs text-green-700">No pending reviews</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
