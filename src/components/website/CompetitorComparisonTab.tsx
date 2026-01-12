'use client'

import { useState, useEffect } from 'react'
import { Plus, X, RefreshCw, TrendingUp, TrendingDown, Minus, ExternalLink, BarChart3, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Competitor {
    id: string
    competitor_url: string
    competitor_domain: string
    name: string | null
    notes: string | null
    status: string
    last_analyzed_at: string | null
    latestAudit?: {
        seo_score: number
        pages_indexed: number
        audit_date: string
    } | null
}

interface ComparisonSummary {
    competitor_id: string
    competitor_name: string
    competitor_url: string
    latest_seo_score: number | null
    our_seo_score: number | null
    score_difference: number | null
    keywords_tracked: number
    keyword_gaps: number
    last_analyzed_at: string | null
}

interface CompetitorComparisonTabProps {
    websiteId: string
    ourScore: number | null
}

export function CompetitorComparisonTab({ websiteId, ourScore }: CompetitorComparisonTabProps) {
    const [competitors, setCompetitors] = useState<Competitor[]>([])
    const [comparison, setComparison] = useState<ComparisonSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [addingCompetitor, setAddingCompetitor] = useState(false)
    const [analyzing, setAnalyzing] = useState<string | null>(null)

    // Form state
    const [newCompetitorUrl, setNewCompetitorUrl] = useState('')
    const [newCompetitorName, setNewCompetitorName] = useState('')
    const [newCompetitorNotes, setNewCompetitorNotes] = useState('')

    useEffect(() => {
        fetchCompetitors()
    }, [websiteId])

    const fetchCompetitors = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/websites/${websiteId}/competitors`)
            const data = await response.json()

            if (data.success) {
                setCompetitors(data.competitors || [])
                setComparison(data.comparison || [])
            }
        } catch (error) {
            console.error('Failed to fetch competitors:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddCompetitor = async () => {
        if (!newCompetitorUrl.trim()) return

        try {
            const response = await fetch(`/api/websites/${websiteId}/competitors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    competitor_url: newCompetitorUrl,
                    name: newCompetitorName || null,
                    notes: newCompetitorNotes || null
                })
            })

            const data = await response.json()

            if (data.success) {
                setNewCompetitorUrl('')
                setNewCompetitorName('')
                setNewCompetitorNotes('')
                setAddingCompetitor(false)
                await fetchCompetitors()
            } else {
                alert(data.error || 'Failed to add competitor')
            }
        } catch (error) {
            console.error('Failed to add competitor:', error)
            alert('Failed to add competitor')
        }
    }

    const handleAnalyzeCompetitor = async (competitorId: string) => {
        try {
            setAnalyzing(competitorId)
            const response = await fetch(
                `/api/websites/${websiteId}/competitors/${competitorId}/analyze`,
                { method: 'POST' }
            )

            const data = await response.json()

            if (data.success) {
                await fetchCompetitors()
            } else {
                alert(data.error || 'Failed to analyze competitor')
            }
        } catch (error) {
            console.error('Failed to analyze competitor:', error)
            alert('Failed to analyze competitor')
        } finally {
            setAnalyzing(null)
        }
    }

    const handleDeleteCompetitor = async (competitorId: string) => {
        if (!confirm('Are you sure you want to delete this competitor?')) return

        try {
            const response = await fetch(
                `/api/websites/${websiteId}/competitors/${competitorId}`,
                { method: 'DELETE' }
            )

            const data = await response.json()

            if (data.success) {
                await fetchCompetitors()
            } else {
                alert(data.error || 'Failed to delete competitor')
            }
        } catch (error) {
            console.error('Failed to delete competitor:', error)
            alert('Failed to delete competitor')
        }
    }

    const getScoreColor = (score: number | null) => {
        if (score === null) return 'text-gray-400'
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getScoreDiffIcon = (diff: number | null) => {
        if (diff === null) return <Minus className="w-4 h-4 text-gray-400" />
        if (diff > 0) return <TrendingUp className="w-4 h-4 text-green-600" />
        if (diff < 0) return <TrendingDown className="w-4 h-4 text-red-600" />
        return <Minus className="w-4 h-4 text-gray-400" />
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold mb-1">Competitor Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                        Track and compare your SEO performance against competitors
                    </p>
                </div>
                <Button
                    onClick={() => setAddingCompetitor(!addingCompetitor)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Competitor
                </Button>
            </div>

            {/* Add Competitor Form */}
            {addingCompetitor && (
                <Card className="border-indigo-200 bg-indigo-50/50">
                    <CardHeader>
                        <CardTitle>Add Competitor</CardTitle>
                        <CardDescription>
                            Enter a competitor's website URL to start tracking their SEO performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="competitor-url">Website URL *</Label>
                            <Input
                                id="competitor-url"
                                type="url"
                                placeholder="https://competitor.com"
                                value={newCompetitorUrl}
                                onChange={(e) => setNewCompetitorUrl(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="competitor-name">Display Name (optional)</Label>
                            <Input
                                id="competitor-name"
                                placeholder="e.g., Main Competitor, Industry Leader"
                                value={newCompetitorName}
                                onChange={(e) => setNewCompetitorName(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="competitor-notes">Notes (optional)</Label>
                            <Textarea
                                id="competitor-notes"
                                placeholder="Why are you tracking this competitor?"
                                value={newCompetitorNotes}
                                onChange={(e) => setNewCompetitorNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleAddCompetitor} disabled={!newCompetitorUrl.trim()}>
                                Add Competitor
                            </Button>
                            <Button variant="outline" onClick={() => setAddingCompetitor(false)}>
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Comparison Summary */}
            {comparison.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Competitive Landscape</CardTitle>
                        <CardDescription>
                            How you compare to your tracked competitors
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {comparison.map((comp) => (
                                <div
                                    key={comp.competitor_id}
                                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium truncate">{comp.competitor_name}</h4>
                                            <a
                                                href={comp.competitor_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-muted-foreground hover:text-indigo-600 truncate flex items-center gap-1"
                                            >
                                                {comp.competitor_url}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>

                                        {/* SEO Score Comparison */}
                                        <div className="flex items-center gap-2">
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground mb-1">Their Score</p>
                                                <p className={`text-2xl font-bold ${getScoreColor(comp.latest_seo_score)}`}>
                                                    {comp.latest_seo_score || '—'}
                                                </p>
                                            </div>

                                            <div className="flex flex-col items-center px-3">
                                                {getScoreDiffIcon(comp.score_difference)}
                                                {comp.score_difference !== null && (
                                                    <span className={`text-xs font-medium ${
                                                        comp.score_difference > 0
                                                            ? 'text-green-600'
                                                            : comp.score_difference < 0
                                                            ? 'text-red-600'
                                                            : 'text-gray-400'
                                                    }`}>
                                                        {comp.score_difference > 0 ? '+' : ''}
                                                        {comp.score_difference}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground mb-1">Your Score</p>
                                                <p className={`text-2xl font-bold ${getScoreColor(comp.our_seo_score)}`}>
                                                    {comp.our_seo_score || '—'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Keyword Stats */}
                                        <div className="flex gap-4 text-sm">
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground">Keywords</p>
                                                <p className="font-semibold">{comp.keywords_tracked}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground">Gaps</p>
                                                <Badge variant="secondary">{comp.keyword_gaps}</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleAnalyzeCompetitor(comp.competitor_id)}
                                            disabled={analyzing === comp.competitor_id}
                                        >
                                            {analyzing === comp.competitor_id ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteCompetitor(comp.competitor_id)}
                                        >
                                            <X className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {competitors.length === 0 && !addingCompetitor && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Target className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Competitors Tracked</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                            Add competitor websites to track their SEO performance and identify keyword gaps
                        </p>
                        <Button onClick={() => setAddingCompetitor(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Competitor
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
