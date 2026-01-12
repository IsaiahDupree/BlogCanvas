'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, Search, Filter, Target, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface KeywordGap {
    keyword: string
    total_competitors: number
    avg_competitor_position: number
    max_search_volume: number
    search_intent: string
    gap_priority: number
    competitor_names: string[]
}

interface KeywordGapStats {
    totalGaps: number
    highPriorityGaps: number
    avgSearchVolume: number
    totalPotentialTraffic: number
    intents: {
        informational: number
        commercial: number
        transactional: number
        navigational: number
    }
}

interface KeywordGapsTabProps {
    websiteId: string
}

export function KeywordGapsTab({ websiteId }: KeywordGapsTabProps) {
    const [gaps, setGaps] = useState<KeywordGap[]>([])
    const [stats, setStats] = useState<KeywordGapStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [intentFilter, setIntentFilter] = useState('all')
    const [minVolumeFilter, setMinVolumeFilter] = useState('100')

    useEffect(() => {
        fetchKeywordGaps()
    }, [websiteId, intentFilter, minVolumeFilter])

    const fetchKeywordGaps = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                min_volume: minVolumeFilter,
                limit: '100'
            })

            if (intentFilter !== 'all') {
                params.append('intent', intentFilter)
            }

            const response = await fetch(`/api/websites/${websiteId}/keyword-gaps?${params}`)
            const data = await response.json()

            if (data.success) {
                setGaps(data.gaps || [])
                setStats(data.stats || null)
            }
        } catch (error) {
            console.error('Failed to fetch keyword gaps:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredGaps = gaps.filter((gap) =>
        gap.keyword.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getPriorityColor = (priority: number) => {
        if (priority <= 3) return 'bg-red-100 text-red-800 border-red-200'
        if (priority <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }

    const getPriorityLabel = (priority: number) => {
        if (priority <= 3) return 'High'
        if (priority <= 6) return 'Medium'
        return 'Low'
    }

    const getIntentColor = (intent: string) => {
        switch (intent) {
            case 'informational':
                return 'bg-blue-100 text-blue-800'
            case 'commercial':
                return 'bg-green-100 text-green-800'
            case 'transactional':
                return 'bg-purple-100 text-purple-800'
            case 'navigational':
                return 'bg-gray-100 text-gray-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
        return num.toString()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Gaps</p>
                                    <p className="text-3xl font-bold">{stats.totalGaps}</p>
                                </div>
                                <Target className="w-8 h-8 text-indigo-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">High Priority</p>
                                    <p className="text-3xl font-bold text-red-600">{stats.highPriorityGaps}</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Avg Search Volume</p>
                                <p className="text-3xl font-bold">{formatNumber(stats.avgSearchVolume)}</p>
                                <p className="text-xs text-muted-foreground mt-1">per month</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Potential Traffic</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {formatNumber(stats.totalPotentialTraffic)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">monthly searches</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Keyword Gap Analysis</CardTitle>
                    <CardDescription>
                        Keywords your competitors rank for that you don't
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search keywords..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Select value={intentFilter} onValueChange={setIntentFilter}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Search Intent" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Intents</SelectItem>
                                <SelectItem value="informational">Informational</SelectItem>
                                <SelectItem value="commercial">Commercial</SelectItem>
                                <SelectItem value="transactional">Transactional</SelectItem>
                                <SelectItem value="navigational">Navigational</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={minVolumeFilter} onValueChange={setMinVolumeFilter}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Min Volume" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">All Volumes</SelectItem>
                                <SelectItem value="100">100+ searches/mo</SelectItem>
                                <SelectItem value="500">500+ searches/mo</SelectItem>
                                <SelectItem value="1000">1K+ searches/mo</SelectItem>
                                <SelectItem value="5000">5K+ searches/mo</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            onClick={fetchKeywordGaps}
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    {/* Keyword Gap List */}
                    <div className="space-y-3">
                        {filteredGaps.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">No keyword gaps found</p>
                                <p className="text-sm">
                                    Add competitors and run analysis to discover keyword opportunities
                                </p>
                            </div>
                        ) : (
                            filteredGaps.map((gap, index) => (
                                <div
                                    key={`${gap.keyword}-${index}`}
                                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium mb-1 truncate">{gap.keyword}</h4>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                <span>{gap.total_competitors} competitor{gap.total_competitors !== 1 ? 's' : ''}</span>
                                                <span>•</span>
                                                <span>Avg position: #{Math.round(gap.avg_competitor_position)}</span>
                                                {gap.competitor_names.length > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="truncate">
                                                            {gap.competitor_names.slice(0, 2).join(', ')}
                                                            {gap.competitor_names.length > 2 && ` +${gap.competitor_names.length - 2}`}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground mb-1">Search Volume</p>
                                                <p className="font-semibold">{formatNumber(gap.max_search_volume)}</p>
                                            </div>

                                            <Badge className={getIntentColor(gap.search_intent)}>
                                                {gap.search_intent}
                                            </Badge>

                                            <Badge className={getPriorityColor(gap.gap_priority)}>
                                                {getPriorityLabel(gap.gap_priority)} Priority
                                            </Badge>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(gap.keyword)}`
                                                window.open(searchUrl, '_blank')
                                            }}
                                        >
                                            <ExternalLink className="w-4 h-4 mr-1" />
                                            Search
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Intent Distribution */}
            {stats && stats.totalGaps > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Intent Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <p className="text-2xl font-bold text-blue-700">{stats.intents.informational}</p>
                                <p className="text-sm text-muted-foreground">Informational</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                                <p className="text-2xl font-bold text-green-700">{stats.intents.commercial}</p>
                                <p className="text-sm text-muted-foreground">Commercial</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
                                <p className="text-2xl font-bold text-purple-700">{stats.intents.transactional}</p>
                                <p className="text-sm text-muted-foreground">Transactional</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <p className="text-2xl font-bold text-gray-700">{stats.intents.navigational}</p>
                                <p className="text-sm text-muted-foreground">Navigational</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
