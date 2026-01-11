'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SEOAudit {
    id: string
    website_id: string
    baseline_score: number
    pages_indexed: number
    audit_date: string
    raw_metrics?: any
}

interface TrendStats {
    totalAudits: number
    latestScore: number
    oldestScore: number
    scoreChange: number
    percentChange: number
    timespan: {
        from: string
        to: string
    }
    trend: 'improving' | 'declining' | 'stable'
}

interface AuditHistoryData {
    success: boolean
    audits: SEOAudit[]
    total: number
    trendStats: TrendStats | null
}

interface SEOScoreTrendChartProps {
    websiteId: string
    limit?: number
    showFullChart?: boolean
}

export default function SEOScoreTrendChart({
    websiteId,
    limit = 30,
    showFullChart = false
}: SEOScoreTrendChartProps) {
    const [data, setData] = useState<AuditHistoryData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchAuditHistory()
    }, [websiteId, limit])

    const fetchAuditHistory = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/websites/${websiteId}/seo-audits?limit=${limit}`)
            const result = await response.json()

            if (result.success) {
                setData(result)
                setError(null)
            } else {
                setError(result.error || 'Failed to fetch audit history')
            }
        } catch (err) {
            setError('Failed to load SEO score trend data')
            console.error('SEO audit fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    // Enhanced line chart with grid, axes, and labels
    const FullTrendChart = ({ audits }: { audits: SEOAudit[] }) => {
        if (!audits || audits.length < 2) return null

        const reversedAudits = [...audits].reverse() // Oldest to newest for chart
        const scores = reversedAudits.map(a => a.baseline_score)
        const dates = reversedAudits.map(a => new Date(a.audit_date))

        const maxScore = Math.max(...scores, 100)
        const minScore = Math.min(...scores, 0)
        const scoreRange = maxScore - minScore || 1

        // Chart dimensions
        const width = 800
        const height = 300
        const padding = { top: 20, right: 40, bottom: 60, left: 60 }
        const chartWidth = width - padding.left - padding.right
        const chartHeight = height - padding.top - padding.bottom

        // Calculate points for the line
        const points = scores.map((score, index) => {
            const x = padding.left + (index / (scores.length - 1)) * chartWidth
            const y = padding.top + chartHeight - ((score - minScore) / scoreRange) * chartHeight
            return { x, y, score, date: dates[index] }
        })

        const pathData = points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
        ).join(' ')

        // Grid lines (horizontal)
        const gridLines = [0, 25, 50, 75, 100].map(score => {
            const y = padding.top + chartHeight - ((score - minScore) / scoreRange) * chartHeight
            return { score, y }
        })

        return (
            <div className="w-full overflow-x-auto">
                <svg width={width} height={height} className="mx-auto">
                    {/* Grid lines */}
                    {gridLines.map((line, i) => (
                        <g key={i}>
                            <line
                                x1={padding.left}
                                y1={line.y}
                                x2={width - padding.right}
                                y2={line.y}
                                stroke="#e5e7eb"
                                strokeWidth="1"
                                strokeDasharray="4,4"
                            />
                            <text
                                x={padding.left - 10}
                                y={line.y + 5}
                                textAnchor="end"
                                className="text-xs fill-gray-500"
                            >
                                {line.score}
                            </text>
                        </g>
                    ))}

                    {/* X-axis */}
                    <line
                        x1={padding.left}
                        y1={height - padding.bottom}
                        x2={width - padding.right}
                        y2={height - padding.bottom}
                        stroke="#9ca3af"
                        strokeWidth="2"
                    />

                    {/* Y-axis */}
                    <line
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={height - padding.bottom}
                        stroke="#9ca3af"
                        strokeWidth="2"
                    />

                    {/* Area fill under the line */}
                    <path
                        d={`${pathData} L ${points[points.length - 1].x},${height - padding.bottom} L ${points[0].x},${height - padding.bottom} Z`}
                        fill="url(#scoreGradient)"
                        opacity="0.2"
                    />

                    {/* Main trend line */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {points.map((point, i) => (
                        <g key={i}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="5"
                                fill="#6366f1"
                                stroke="white"
                                strokeWidth="2"
                            />
                            <title>{`${point.date.toLocaleDateString()}: ${point.score}/100`}</title>
                        </g>
                    ))}

                    {/* Date labels (first, last, and a few in between) */}
                    {points.map((point, i) => {
                        const showLabel = i === 0 || i === points.length - 1 ||
                                         (points.length > 5 && i % Math.floor(points.length / 4) === 0)
                        if (!showLabel) return null

                        return (
                            <text
                                key={`label-${i}`}
                                x={point.x}
                                y={height - padding.bottom + 20}
                                textAnchor="middle"
                                className="text-xs fill-gray-600"
                                transform={`rotate(-45, ${point.x}, ${height - padding.bottom + 20})`}
                            >
                                {point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </text>
                        )
                    })}

                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
                        </linearGradient>
                    </defs>

                    {/* Axis labels */}
                    <text
                        x={padding.left - 45}
                        y={padding.top + chartHeight / 2}
                        textAnchor="middle"
                        className="text-sm fill-gray-700 font-semibold"
                        transform={`rotate(-90, ${padding.left - 45}, ${padding.top + chartHeight / 2})`}
                    >
                        SEO Score
                    </text>
                    <text
                        x={padding.left + chartWidth / 2}
                        y={height - 10}
                        textAnchor="middle"
                        className="text-sm fill-gray-700 font-semibold"
                    >
                        Audit Date
                    </text>
                </svg>
            </div>
        )
    }

    // Mini sparkline for compact view
    const MiniSparkline = ({ audits }: { audits: SEOAudit[] }) => {
        if (!audits || audits.length < 2) return null

        const scores = [...audits].reverse().map(a => a.baseline_score)
        const max = Math.max(...scores)
        const min = Math.min(...scores)
        const range = max - min || 1

        const points = scores.map((score, index) => {
            const x = (index / (scores.length - 1)) * 100
            const y = 100 - ((score - min) / range) * 100
            return `${x},${y}`
        }).join(' ')

        return (
            <svg className="w-full h-16" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                    points={points}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-indigo-500"
                />
            </svg>
        )
    }

    const TrendIndicator = ({ trendStats }: { trendStats: TrendStats }) => {
        if (trendStats.trend === 'improving') {
            return (
                <div className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-lg font-semibold">+{trendStats.percentChange.toFixed(1)}%</span>
                </div>
            )
        } else if (trendStats.trend === 'declining') {
            return (
                <div className="flex items-center gap-2 text-red-600">
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-lg font-semibold">{trendStats.percentChange.toFixed(1)}%</span>
                </div>
            )
        } else {
            return (
                <div className="flex items-center gap-2 text-gray-500">
                    <Minus className="w-5 h-5" />
                    <span className="text-lg font-semibold">0%</span>
                </div>
            )
        }
    }

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Loading SEO trend data...</span>
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
                        <p className="font-semibold text-gray-900">SEO Trend Data Unavailable</p>
                        <p className="text-sm text-gray-600">{error}</p>
                    </div>
                </div>
            </Card>
        )
    }

    if (!data || !data.audits || data.audits.length === 0) {
        return (
            <Card className="p-6 border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-gray-400" />
                    <div>
                        <p className="font-semibold text-gray-900">No Audit History Yet</p>
                        <p className="text-sm text-gray-600">
                            Run your first SEO audit to start tracking score trends over time
                        </p>
                    </div>
                </div>
            </Card>
        )
    }

    const { audits, trendStats } = data

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            {trendStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50">
                        <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                            <span className="text-sm font-medium text-gray-600">Current Score</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                            {trendStats.latestScore}/100
                        </p>
                    </Card>

                    <Card className="p-4 border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-600">Score Change</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-3xl font-bold text-gray-900">
                                {trendStats.scoreChange > 0 ? '+' : ''}{trendStats.scoreChange}
                            </p>
                            <TrendIndicator trendStats={trendStats} />
                        </div>
                    </Card>

                    <Card className="p-4 border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-5 h-5 text-purple-600" />
                            <span className="text-sm font-medium text-gray-600">Audits Tracked</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                            {trendStats.totalAudits}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {new Date(trendStats.timespan.from).toLocaleDateString()} -
                            {' '}{new Date(trendStats.timespan.to).toLocaleDateString()}
                        </p>
                    </Card>
                </div>
            )}

            {/* Chart */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">SEO Score Trend</h3>
                    <Badge variant="outline" className="text-xs">
                        {audits.length} audit{audits.length !== 1 ? 's' : ''}
                    </Badge>
                </div>

                {showFullChart && audits.length >= 2 ? (
                    <FullTrendChart audits={audits} />
                ) : (
                    <div className="space-y-4">
                        <MiniSparkline audits={audits} />
                        {audits.length >= 2 && (
                            <p className="text-sm text-center text-gray-600">
                                View detailed chart on the full analytics page
                            </p>
                        )}
                    </div>
                )}
            </Card>
        </div>
    )
}
