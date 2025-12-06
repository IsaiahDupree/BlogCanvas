'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle2, AlertTriangle, Info, RefreshCw, Download, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ContentGap {
    id: string
    title: string
    description: string
    gap_type: string
    severity: 'high' | 'medium' | 'low'
    affected_pages: string[]
    suggested_action: string
    metadata?: {
        current_score?: number
        potential_score?: number
    }
}

export function GapsAnalysisTab({ websiteId }: { websiteId: string }) {
    const [gaps, setGaps] = useState<ContentGap[]>([])
    const [loading, setLoading] = useState(true)
    const [analyzing, setAnalyzing] = useState(false)
    const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

    useEffect(() => {
        fetchGaps()
    }, [websiteId])

    const fetchGaps = async () => {
        try {
            const response = await fetch(`/api/websites/${websiteId}/gaps`)
            const data = await response.json()
            if (data.success) {
                setGaps(data.gaps || [])
            }
        } catch (error) {
            console.error('Failed to fetch gaps:', error)
        } finally {
            setLoading(false)
        }
    }

    const analyzeGaps = async () => {
        setAnalyzing(true)
        try {
            const response = await fetch(`/api/websites/${websiteId}/gaps`, {
                method: 'POST'
            })
            const data = await response.json()
            if (data.success) {
                setGaps(data.gaps || [])
            }
        } catch (error) {
            console.error('Failed to analyze gaps:', error)
        } finally {
            setAnalyzing(false)
        }
    }

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'high':
                return <AlertCircle className="w-5 h-5 text-red-600" />
            case 'medium':
                return <AlertTriangle className="w-5 h-5 text-yellow-600" />
            default:
                return <Info className="w-5 h-5 text-blue-600" />
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high':
                return 'bg-red-100 text-red-700 border-red-200'
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            default:
                return 'bg-blue-100 text-blue-700 border-blue-200'
        }
    }

    const filteredGaps = gaps.filter(gap =>
        filter === 'all' ? true : gap.severity === filter
    )

    const severityCounts = {
        high: gaps.filter(g => g.severity === 'high').length,
        medium: gaps.filter(g => g.severity === 'medium').length,
        low: gaps.filter(g => g.severity === 'low').length
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-4" />
                    <p className="text-muted-foreground">Loading gap analysis...</p>
                </CardContent>
            </Card>
        )
    }

    if (gaps.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Gap Analysis Yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Run an analysis to identify content gaps and SEO opportunities
                    </p>
                    <Button
                        onClick={analyzeGaps}
                        disabled={analyzing}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    >
                        {analyzing ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            'Run Gap Analysis'
                        )}
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground mb-1">Total Gaps</div>
                        <div className="text-3xl font-bold">{gaps.length}</div>
                    </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="text-sm text-red-700 mb-1">High Severity</div>
                        <div className="text-3xl font-bold text-red-700">{severityCounts.high}</div>
                    </CardContent>
                </Card>
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                        <div className="text-sm text-yellow-700 mb-1">Medium Severity</div>
                        <div className="text-3xl font-bold text-yellow-700">{severityCounts.medium}</div>
                    </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                        <div className="text-sm text-blue-700 mb-1">Low Severity</div>
                        <div className="text-3xl font-bold text-blue-700">{severityCounts.low}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Actions */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                        size="sm"
                    >
                        All ({gaps.length})
                    </Button>
                    <Button
                        variant={filter === 'high' ? 'default' : 'outline'}
                        onClick={() => setFilter('high')}
                        size="sm"
                    >
                        High ({severityCounts.high})
                    </Button>
                    <Button
                        variant={filter === 'medium' ? 'default' : 'outline'}
                        onClick={() => setFilter('medium')}
                        size="sm"
                    >
                        Medium ({severityCounts.medium})
                    </Button>
                    <Button
                        variant={filter === 'low' ? 'default' : 'outline'}
                        onClick={() => setFilter('low')}
                        size="sm"
                    >
                        Low ({severityCounts.low})
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={analyzeGaps} disabled={analyzing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
                        Re-analyze
                    </Button>
                </div>
            </div>

            {/* Gap List */}
            <div className="space-y-4">
                {filteredGaps.map((gap, index) => (
                    <Card key={index} className={`border-2 ${getSeverityColor(gap.severity)}`}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                    {getSeverityIcon(gap.severity)}
                                    <div className="flex-1">
                                        <CardTitle className="text-lg mb-1">{gap.title}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{gap.description}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="capitalize">
                                    {gap.severity}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {/* Impact */}
                                {gap.metadata?.current_score && gap.metadata?.potential_score && (
                                    <div className="bg-white/50 rounded-lg p-3">
                                        <div className="text-sm font-medium mb-2">Potential Impact</div>
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <span className="text-xs text-muted-foreground">Current</span>
                                                <div className="text-2xl font-bold text-red-600">
                                                    {gap.metadata.current_score}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-lg">→</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground">Potential</span>
                                                <div className="text-2xl font-bold text-green-600">
                                                    {gap.metadata.potential_score}
                                                </div>
                                            </div>
                                            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                                                +{gap.metadata.potential_score - gap.metadata.current_score} points
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Suggested Action */}
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                                    <div className="text-sm font-medium text-indigo-900 mb-1">
                                        💡 Recommended Action
                                    </div>
                                    <p className="text-sm text-indigo-700">{gap.suggested_action}</p>
                                </div>

                                {/* Affected Pages */}
                                {gap.affected_pages && gap.affected_pages.length > 0 && (
                                    <details className="text-sm">
                                        <summary className="cursor-pointer font-medium text-muted-foreground hover:text-gray-900">
                                            Affected Pages ({gap.affected_pages.length})
                                        </summary>
                                        <ul className="mt-2 space-y-1 ml-4">
                                            {gap.affected_pages.slice(0, 5).map((page, i) => (
                                                <li key={i} className="text-xs text-muted-foreground truncate">
                                                    • {page}
                                                </li>
                                            ))}
                                            {gap.affected_pages.length > 5 && (
                                                <li className="text-xs text-muted-foreground">
                                                    + {gap.affected_pages.length - 5} more pages
                                                </li>
                                            )}
                                        </ul>
                                    </details>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
