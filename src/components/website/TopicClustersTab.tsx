'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Target, CheckCircle2, Circle, RefreshCw, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TopicCluster {
    id: string
    name: string
    primary_keyword: string
    search_intent: string
    difficulty: number
    estimated_traffic: number
    currently_covered: boolean
    recommended_article_count: number
}

export function TopicClustersTab({ websiteId }: { websiteId: string }) {
    const [clusters, setClusters] = useState<TopicCluster[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        fetchClusters()
    }, [websiteId])

    const fetchClusters = async () => {
        try {
            const response = await fetch(`/api/websites/${websiteId}/topic-clusters`)
            const data = await response.json()
            if (data.success) {
                setClusters(data.clusters || [])
            }
        } catch (error) {
            console.error('Failed to fetch clusters:', error)
        } finally {
            setLoading(false)
        }
    }

    const generateClusters = async () => {
        setGenerating(true)
        try {
            const response = await fetch(`/api/websites/${websiteId}/topic-clusters`, {
                method: 'POST'
            })
            const data = await response.json()
            if (data.success) {
                setClusters(data.clusters || [])
            }
        } catch (error) {
            console.error('Failed to generate clusters:', error)
        } finally {
            setGenerating(false)
        }
    }

    const getDifficultyColor = (difficulty: number) => {
        if (difficulty < 40) return 'text-green-600'
        if (difficulty < 65) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getDifficultyLabel = (difficulty: number) => {
        if (difficulty < 40) return 'Easy'
        if (difficulty < 65) return 'Medium'
        return 'Hard'
    }

    const getIntentColor = (intent: string) => {
        switch (intent) {
            case 'informational': return 'bg-blue-100 text-blue-700'
            case 'commercial': return 'bg-purple-100 text-purple-700'
            case 'transactional': return 'bg-green-100 text-green-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const covered = clusters.filter(c => c.currently_covered)
    const opportunities = clusters.filter(c => !c.currently_covered)
    const coveragePercent = clusters.length > 0 ? Math.round((covered.length / clusters.length) * 100) : 0

    if (loading) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-4" />
                    <p className="text-muted-foreground">Loading topic clusters...</p>
                </CardContent>
            </Card>
        )
    }

    if (clusters.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <Target className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Topic Clusters Yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Generate topic clusters to identify content opportunities
                    </p>
                    <Button
                        onClick={generateClusters}
                        disabled={generating}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    >
                        {generating ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            'Generate Topic Clusters'
                        )}
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Coverage Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                    <CardContent className="p-6">
                        <div className="text-sm text-muted-foreground mb-2">Topic Coverage</div>
                        <div className="flex items-center gap-4">
                            <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                {coveragePercent}%
                            </div>
                            <div className="flex-1">
                                <div className="text-sm text-muted-foreground mb-1">
                                    {covered.length} of {clusters.length} clusters covered
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all"
                                        style={{ width: `${coveragePercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                        <div className="text-sm text-green-700 mb-1">Covered</div>
                        <div className="text-3xl font-bold text-green-700">{covered.length}</div>
                    </CardContent>
                </Card>
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                        <div className="text-sm text-orange-700 mb-1">Opportunities</div>
                        <div className="text-3xl font-bold text-orange-700">{opportunities.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Content Opportunities</h3>
                <Button variant="outline" size="sm" onClick={generateClusters} disabled={generating}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                    Regenerate
                </Button>
            </div>

            {/* Opportunity Clusters (Not Covered) */}
            {opportunities.length > 0 && (
                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        High-priority topics to create content for
                    </div>
                    {opportunities
                        .sort((a, b) => b.estimated_traffic - a.estimated_traffic)
                        .map((cluster, index) => (
                            <Card key={index} className="border-2 border-orange-200 bg-orange-50/30">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <Circle className="w-5 h-5 text-orange-600 mt-1" />
                                            <div className="flex-1">
                                                <CardTitle className="text-lg mb-2">{cluster.name}</CardTitle>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    <Badge variant="outline" className={getIntentColor(cluster.search_intent)}>
                                                        {cluster.search_intent}
                                                    </Badge>
                                                    <Badge variant="outline" className={`${getDifficultyColor(cluster.difficulty)} bg-white`}>
                                                        {getDifficultyLabel(cluster.difficulty)} ({cluster.difficulty}/100)
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white rounded-lg p-3">
                                            <div className="text-xs text-muted-foreground mb-1">Primary Keyword</div>
                                            <div className="font-semibold text-indigo-600">"{cluster.primary_keyword}"</div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3">
                                            <div className="text-xs text-muted-foreground mb-1">Est. Monthly Traffic</div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {cluster.estimated_traffic.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3">
                                            <div className="text-xs text-muted-foreground mb-1">Recommended Articles</div>
                                            <div className="text-2xl font-bold text-purple-600">
                                                {cluster.recommended_article_count}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                </div>
            )}

            {/* Covered Clusters */}
            {covered.length > 0 && (
                <div className="space-y-4 mt-8">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Covered Topics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {covered.map((cluster, index) => (
                            <Card key={index} className="border-green-200 bg-green-50/30">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="font-semibold mb-1">{cluster.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {cluster.estimated_traffic.toLocaleString()} monthly searches
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
