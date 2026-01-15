'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Eye, MousePointerClick, Target, BarChart3, Users, Clock, Activity, Download } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Metric {
    impressions: number
    clicks: number
    ctr: number
    avg_position: number
    seo_score: number
    snapshot_date: string
    // GA4 metrics
    page_views?: number
    unique_users?: number
    sessions?: number
    avg_engagement_time?: number
    bounce_rate?: number
}

interface Trend {
    change: number
    percentChange: number
    direction: 'up' | 'down' | 'stable'
}

interface MetricsData {
    success: boolean
    metrics: Metric[]
    trends: {
        impressions: Trend
        clicks: Trend
        ctr: Trend
        avg_position: Trend
        seo_score: Trend
    }
}

interface PerformanceMetricsProps {
    postId: string
    limit?: number
}

export default function PerformanceMetrics({ postId, limit = 30 }: PerformanceMetricsProps) {
    const [data, setData] = useState<MetricsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        fetchMetrics()
    }, [postId, limit])

    const fetchMetrics = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/analytics/metrics/${postId}?limit=${limit}`)
            const result = await response.json()

            if (result.success) {
                setData(result)
                setError(null)
            } else {
                setError(result.error || 'Failed to fetch metrics')
            }
        } catch (err) {
            setError('Failed to load performance data')
            console.error('Metrics fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async (format: 'csv' | 'json') => {
        try {
            setExporting(true)
            const response = await fetch(`/api/analytics/metrics/${postId}/export?format=${format}&limit=${limit}`)

            if (!response.ok) {
                throw new Error('Failed to export metrics')
            }

            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('Content-Disposition')
            const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
            const filename = filenameMatch?.[1] || `metrics-${postId}.${format}`

            // Download file
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err) {
            console.error('Export error:', err)
            alert('Failed to export metrics. Please try again.')
        } finally {
            setExporting(false)
        }
    }

    const TrendIndicator = ({ trend }: { trend: Trend }) => {
        if (trend.direction === 'up') {
            return (
                <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">+{trend.percentChange.toFixed(1)}%</span>
                </div>
            )
        } else if (trend.direction === 'down') {
            return (
                <div className="flex items-center gap-1 text-red-600">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm font-medium">{trend.percentChange.toFixed(1)}%</span>
                </div>
            )
        } else {
            return (
                <div className="flex items-center gap-1 text-gray-500">
                    <Minus className="w-4 h-4" />
                    <span className="text-sm font-medium">0%</span>
                </div>
            )
        }
    }

    const MiniSparkline = ({ values }: { values: number[] }) => {
        if (!values || values.length < 2) return null

        const max = Math.max(...values)
        const min = Math.min(...values)
        const range = max - min || 1

        const points = values.map((value, index) => {
            const x = (index / (values.length - 1)) * 100
            const y = 100 - ((value - min) / range) * 100
            return `${x},${y}`
        }).join(' ')

        return (
            <svg className="w-full h-12" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                    points={points}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-indigo-500"
                />
            </svg>
        )
    }

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Loading performance data...</span>
                </div>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="p-6 border-yellow-200 bg-yellow-50">
                <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-yellow-600" />
                    <div>
                        <p className="font-semibold text-gray-900">Performance Data Unavailable</p>
                        <p className="text-sm text-gray-600">{error}</p>
                    </div>
                </div>
            </Card>
        )
    }

    if (!data || !data.metrics || data.metrics.length === 0) {
        return (
            <Card className="p-6 border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-gray-400" />
                    <div>
                        <p className="font-semibold text-gray-900">No Performance Data Yet</p>
                        <p className="text-sm text-gray-600">
                            Analytics will be available after the first check-back (24 hours after publishing)
                        </p>
                    </div>
                </div>
            </Card>
        )
    }

    const latestMetric = data.metrics[0]
    const impressionsHistory = data.metrics.slice(0, 10).reverse().map(m => m.impressions)
    const clicksHistory = data.metrics.slice(0, 10).reverse().map(m => m.clicks)
    const positionHistory = data.metrics.slice(0, 10).reverse().map(m => m.avg_position)
    const scoreHistory = data.metrics.slice(0, 10).reverse().map(m => m.seo_score)

    // Check if we have GA4 data
    const hasGA4Data = latestMetric.page_views !== undefined && latestMetric.page_views !== null

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Performance Metrics</h3>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                        Last updated: {new Date(latestMetric.snapshot_date).toLocaleDateString()}
                    </Badge>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport('csv')}
                            disabled={exporting}
                            className="text-xs"
                        >
                            <Download className="w-3 h-3 mr-1" />
                            Export CSV
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport('json')}
                            disabled={exporting}
                            className="text-xs"
                        >
                            <Download className="w-3 h-3 mr-1" />
                            Export JSON
                        </Button>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Impressions */}
                <Card className="p-4 border-2 hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <Eye className="w-5 h-5 text-indigo-600" />
                        <TrendIndicator trend={data.trends.impressions} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {latestMetric.impressions.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">Impressions</p>
                    <MiniSparkline values={impressionsHistory} />
                </Card>

                {/* Clicks */}
                <Card className="p-4 border-2 hover:border-green-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <MousePointerClick className="w-5 h-5 text-green-600" />
                        <TrendIndicator trend={data.trends.clicks} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {latestMetric.clicks.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">Clicks</p>
                    <MiniSparkline values={clicksHistory} />
                </Card>

                {/* CTR */}
                <Card className="p-4 border-2 hover:border-purple-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        <TrendIndicator trend={data.trends.ctr} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {latestMetric.ctr.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 mb-3">Click-Through Rate</p>
                    <div className="h-12 flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-purple-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(latestMetric.ctr * 10, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </Card>

                {/* SEO Score */}
                <Card className="p-4 border-2 hover:border-yellow-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <BarChart3 className="w-5 h-5 text-yellow-600" />
                        <TrendIndicator trend={data.trends.seo_score} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {latestMetric.seo_score}/100
                    </p>
                    <p className="text-sm text-gray-600 mb-3">SEO Quality Score</p>
                    <MiniSparkline values={scoreHistory} />
                </Card>
            </div>

            {/* Average Position */}
            <Card className="p-6 border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Average Search Position</p>
                        <p className="text-3xl font-bold text-gray-900">
                            #{latestMetric.avg_position.toFixed(1)}
                        </p>
                    </div>
                    <div className="text-right">
                        <TrendIndicator trend={data.trends.avg_position} />
                        <p className="text-xs text-gray-500 mt-1">
                            {data.trends.avg_position.direction === 'down' ? 'Improving' :
                             data.trends.avg_position.direction === 'up' ? 'Declining' : 'Stable'}
                        </p>
                    </div>
                </div>
                <div className="mt-4">
                    <MiniSparkline values={positionHistory.map(p => 100 - p)} />
                </div>
            </Card>

            {/* GA4 Metrics Section */}
            {hasGA4Data && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">Traffic & Engagement (GA4)</h3>
                        <Badge variant="secondary" className="text-xs">Google Analytics</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Page Views */}
                        <Card className="p-4 border-2 hover:border-blue-300 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <Eye className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                                {(latestMetric.page_views || 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">Page Views</p>
                        </Card>

                        {/* Unique Users */}
                        <Card className="p-4 border-2 hover:border-purple-300 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                                {(latestMetric.unique_users || 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">Unique Users</p>
                        </Card>

                        {/* Avg Engagement Time */}
                        <Card className="p-4 border-2 hover:border-green-300 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <Clock className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatTime(latestMetric.avg_engagement_time || 0)}
                            </p>
                            <p className="text-sm text-gray-600">Avg Engagement</p>
                        </Card>

                        {/* Bounce Rate */}
                        <Card className="p-4 border-2 hover:border-orange-300 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <Activity className="w-5 h-5 text-orange-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                                {(latestMetric.bounce_rate || 0).toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-600">Bounce Rate</p>
                        </Card>
                    </div>
                </div>
            )}

            {/* Historical Data Count */}
            <div className="text-center text-sm text-gray-500">
                Showing {data.metrics.length} data point{data.metrics.length !== 1 ? 's' : ''}
                {data.metrics.length > 0 && (
                    <> from {new Date(data.metrics[data.metrics.length - 1].snapshot_date).toLocaleDateString()}
                    to {new Date(data.metrics[0].snapshot_date).toLocaleDateString()}</>
                )}
            </div>
        </div>
    )
}

/**
 * Format seconds into readable time (e.g., "2m 30s")
 */
function formatTime(seconds: number): string {
    if (seconds < 60) {
        return `${Math.round(seconds)}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
}
