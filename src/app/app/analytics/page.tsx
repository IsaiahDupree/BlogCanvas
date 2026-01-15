'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Eye, MousePointerClick, Target, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import TopPerformingPosts from '@/components/analytics/TopPerformingPosts'
import ClientMetrics from '@/components/analytics/ClientMetrics'
import BatchMetrics from '@/components/analytics/BatchMetrics'

export default function AnalyticsDashboardPage() {
    const [stats, setStats] = useState({
        totalPosts: 0,
        totalImpressions: 0,
        totalClicks: 0,
        avgCTR: 0,
        avgPosition: 0,
        avgSeoScore: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOverallStats()
    }, [])

    const fetchOverallStats = async () => {
        try {
            const response = await fetch('/api/analytics/overall-stats')
            if (!response.ok) {
                throw new Error('Failed to fetch overall stats')
            }
            const data = await response.json()
            setStats(data)
            setLoading(false)
        } catch (error) {
            console.error('Failed to fetch stats:', error)
            setLoading(false)
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-8 h-8 text-indigo-600" />
                    <h1 className="text-4xl font-bold text-gray-900">Analytics Dashboard</h1>
                </div>
                <p className="text-gray-600 text-lg">
                    Track performance metrics across all published content
                </p>
            </div>

            {/* Overall Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Total Impressions */}
                <Card className="p-6 border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50">
                    <div className="flex items-center justify-between mb-4">
                        <Eye className="w-8 h-8 text-indigo-600" />
                        <Badge variant="outline" className="text-xs">All Time</Badge>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                        {stats.totalImpressions.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Total Impressions</p>
                    <div className="mt-3 flex items-center gap-2 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">+12.3% vs last month</span>
                    </div>
                </Card>

                {/* Total Clicks */}
                <Card className="p-6 border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="flex items-center justify-between mb-4">
                        <MousePointerClick className="w-8 h-8 text-green-600" />
                        <Badge variant="outline" className="text-xs">All Time</Badge>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                        {stats.totalClicks.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Total Clicks</p>
                    <div className="mt-3 flex items-center gap-2 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">+8.7% vs last month</span>
                    </div>
                </Card>

                {/* Average CTR */}
                <Card className="p-6 border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="flex items-center justify-between mb-4">
                        <Target className="w-8 h-8 text-purple-600" />
                        <Badge variant="outline" className="text-xs">Average</Badge>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                        {stats.avgCTR.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Click-Through Rate</p>
                    <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-purple-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(stats.avgCTR * 10, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </Card>

                {/* Average Position */}
                <Card className="p-6 border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <div className="flex items-center justify-between mb-4">
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                        <Badge variant="outline" className="text-xs">Average</Badge>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                        #{stats.avgPosition.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">Search Position</p>
                    <div className="mt-3 flex items-center gap-2 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">Improving</span>
                    </div>
                </Card>

                {/* Average SEO Score */}
                <Card className="p-6 border-2 border-yellow-100 bg-gradient-to-br from-yellow-50 to-orange-50">
                    <div className="flex items-center justify-between mb-4">
                        <BarChart3 className="w-8 h-8 text-yellow-600" />
                        <Badge variant="outline" className="text-xs">Average</Badge>
                    </div>
                    <p className={`text-3xl font-bold mb-1 ${getScoreColor(stats.avgSeoScore)}`}>
                        {stats.avgSeoScore}/100
                    </p>
                    <p className="text-sm text-gray-600">SEO Quality Score</p>
                    <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-yellow-600 h-2 rounded-full transition-all"
                                style={{ width: `${stats.avgSeoScore}%` }}
                            ></div>
                        </div>
                    </div>
                </Card>

                {/* Total Published Posts */}
                <Card className="p-6 border-2 border-gray-100 bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <Calendar className="w-8 h-8 text-gray-600" />
                        <Badge variant="outline" className="text-xs">Total</Badge>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                        {stats.totalPosts}
                    </p>
                    <p className="text-sm text-gray-600">Published Posts</p>
                    <div className="mt-3 flex items-center gap-2 text-gray-600">
                        <span className="text-sm">Tracking performance</span>
                    </div>
                </Card>
            </div>

            {/* Top Performing Posts */}
            <div className="mb-8">
                <TopPerformingPosts limit={10} />
            </div>

            {/* Client Performance Metrics */}
            <div className="mb-8">
                <ClientMetrics limit={10} />
            </div>

            {/* Batch Performance Metrics */}
            <div className="mb-8">
                <BatchMetrics limit={10} />
            </div>

            {/* Info Box */}
            <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
                <div className="flex items-start gap-4">
                    <BarChart3 className="w-6 h-6 text-indigo-600 mt-1" />
                    <div>
                        <h3 className="font-bold text-gray-900 mb-2">About Analytics Data</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            Performance metrics are collected automatically via scheduled check-backs after posts are published.
                            Data is gathered from Google Search Console and includes impressions, clicks, CTR, and search position.
                            Check-backs occur at: 1 day, 7 days, 30 days, 90 days, and 180 days after publishing.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
