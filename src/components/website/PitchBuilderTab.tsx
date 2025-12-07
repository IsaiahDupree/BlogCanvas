'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Calendar, FileText, Zap, ArrowRight, Download, Send, Mail, FileDown, Presentation } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ScoreProjection {
    current_score: number
    target_score: number
    score_increase: number
    recommended_posts: number
    timeline_months: number
    confidence: 'high' | 'medium' | 'low'
    factors: {
        content_gap_impact: number
        topic_coverage_impact: number
        quality_improvement_impact: number
    }
    cadence: {
        postsPerMonth: number
        postsPerWeek: number
        schedule: string
    }
}

export function PitchBuilderTab({ websiteId }: { websiteId: string }) {
    const [projection, setProjection] = useState<ScoreProjection | null>(null)
    const [loading, setLoading] = useState(false)
    const [targetScore, setTargetScore] = useState(78)
    const [customMonths, setCustomMonths] = useState<number | null>(null)
    const [batchName, setBatchName] = useState('')
    const [creatingBatch, setCreatingBatch] = useState(false)
    const [generatingPitch, setGeneratingPitch] = useState(false)
    const [pitchContent, setPitchContent] = useState<{ format: string; content?: string; html?: string; subject?: string } | null>(null)

    const calculateProjection = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/websites/${websiteId}/project-score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetScore,
                    customMonths
                })
            })
            const data = await response.json()
            if (data.success) {
                setProjection(data.projection)
            }
        } catch (error) {
            console.error('Failed to calculate projection:', error)
        } finally {
            setLoading(false)
        }
    }

    const createContentBatch = async () => {
        if (!projection || !batchName) return

        setCreatingBatch(true)
        try {
            // Create batch
            const batchResponse = await fetch('/api/content-batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    websiteId,
                    name: batchName,
                    goalScoreFrom: projection.current_score,
                    goalScoreTo: projection.target_score,
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + projection.timeline_months * 30 * 24 * 60 * 60 * 1000).toISOString(),
                    totalPosts: projection.recommended_posts
                })
            })

            const batchData = await batchResponse.json()

            if (batchData.success) {
                // Generate topics
                await fetch(`/api/content-batches/${batchData.batch.id}/generate-topics`, {
                    method: 'POST'
                })

                alert(`Content batch "${batchName}" created with ${projection.recommended_posts} topics!`)
                setBatchName('')
            }
        } catch (error) {
            console.error('Failed to create batch:', error)
        } finally {
            setCreatingBatch(false)
        }
    }

    const getConfidenceColor = (confidence: string) => {
        switch (confidence) {
            case 'high': return 'bg-green-100 text-green-700'
            case 'medium': return 'bg-yellow-100 text-yellow-700'
            default: return 'bg-orange-100 text-orange-700'
        }
    }

    const generatePitch = async (format: 'email' | 'pdf' | 'slide') => {
        if (!projection) return

        setGeneratingPitch(true)
        try {
            const response = await fetch(`/api/websites/${websiteId}/generate-pitch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    format,
                    projection
                })
            })

            const data = await response.json()
            if (data.success) {
                setPitchContent(data)

                // For PDF, open in new window for printing/download
                if (format === 'pdf' && data.html) {
                    const printWindow = window.open('', '_blank')
                    if (printWindow) {
                        printWindow.document.write(data.html)
                        printWindow.document.close()
                        printWindow.focus()
                    }
                }
            }
        } catch (error) {
            console.error('Failed to generate pitch:', error)
            alert('Failed to generate pitch. Please try again.')
        } finally {
            setGeneratingPitch(false)
        }
    }

    const downloadEmail = () => {
        if (!pitchContent?.content || !pitchContent?.subject) return

        const emailBody = `Subject: ${pitchContent.subject}\n\n${pitchContent.content}`
        const blob = new Blob([emailBody], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pitch-email-${websiteId}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6">
            {/* Score Projection Calculator */}
            <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        SEO Score Projection
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Target SEO Score
                            </label>
                            <input
                                type="number"
                                value={targetScore}
                                onChange={(e) => setTargetScore(parseInt(e.target.value))}
                                min="0"
                                max="100"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Recommended: 75-85 for most businesses
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Custom Timeline (optional)
                            </label>
                            <input
                                type="number"
                                value={customMonths || ''}
                                onChange={(e) => setCustomMonths(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="Auto-calculated"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Leave blank for automatic calculation
                            </p>
                        </div>

                        <Button
                            onClick={calculateProjection}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                        >
                            {loading ? 'Calculating...' : 'Calculate Projection'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Projection Results */}
            {projection && (
                <div className="space-y-6">
                    {/* Main Projection Card */}
                    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">Projected Growth</h3>
                                <Badge className={getConfidenceColor(projection.confidence)}>
                                    {projection.confidence} confidence
                                </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-sm text-muted-foreground mb-1">Current</div>
                                    <div className="text-4xl font-bold text-red-600">{projection.current_score}</div>
                                </div>
                                <div className="flex items-center justify-center">
                                    <ArrowRight className="w-8 h-8 text-green-600" />
                                </div>
                                <div className="text-center">
                                    <div className="text-sm text-muted-foreground mb-1">Target</div>
                                    <div className="text-4xl font-bold text-green-600">{projection.target_score}</div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-white rounded-lg">
                                <div className="text-center">
                                    <div className="text-sm text-muted-foreground mb-2">Improvement</div>
                                    <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                        +{projection.score_increase} points
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recommendation Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-purple-200 bg-purple-50">
                            <CardContent className="p-6 text-center">
                                <FileText className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                                <div className="text-sm text-muted-foreground mb-1">Recommended Posts</div>
                                <div className="text-3xl font-bold text-purple-600">
                                    {projection.recommended_posts}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    High-quality blog posts
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-blue-200 bg-blue-50">
                            <CardContent className="p-6 text-center">
                                <Calendar className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                                <div className="text-sm text-muted-foreground mb-1">Timeline</div>
                                <div className="text-3xl font-bold text-blue-600">
                                    {projection.timeline_months} months
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {projection.cadence.schedule}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-indigo-200 bg-indigo-50">
                            <CardContent className="p-6 text-center">
                                <Zap className="w-8 h-8 mx-auto text-indigo-600 mb-2" />
                                <div className="text-sm text-muted-foreground mb-1">Publishing Pace</div>
                                <div className="text-3xl font-bold text-indigo-600">
                                    {projection.cadence.postsPerMonth}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    posts per month
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Impact Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Impact Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">Content Gap Fixes</span>
                                        <span className="text-sm text-muted-foreground">
                                            +{projection.factors.content_gap_impact} points
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-red-500 h-2 rounded-full"
                                            style={{ width: `${(projection.factors.content_gap_impact / projection.score_increase) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">Topic Coverage</span>
                                        <span className="text-sm text-muted-foreground">
                                            +{projection.factors.topic_coverage_impact} points
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${(projection.factors.topic_coverage_impact / projection.score_increase) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">Quality Improvement</span>
                                        <span className="text-sm text-muted-foreground">
                                            +{projection.factors.quality_improvement_impact} points
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full"
                                            style={{ width: `${(projection.factors.quality_improvement_impact / projection.score_increase) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Generate Pitch */}
                    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Send className="w-5 h-5 text-purple-600" />
                                Generate Client Pitch
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Generate a professional pitch document to send to your client
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <Button
                                        onClick={() => generatePitch('email')}
                                        disabled={generatingPitch}
                                        variant="outline"
                                        className="flex items-center gap-2"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Email Draft
                                    </Button>
                                    <Button
                                        onClick={() => generatePitch('pdf')}
                                        disabled={generatingPitch}
                                        variant="outline"
                                        className="flex items-center gap-2"
                                    >
                                        <FileDown className="w-4 h-4" />
                                        PDF Report
                                    </Button>
                                    <Button
                                        onClick={() => generatePitch('slide')}
                                        disabled={generatingPitch}
                                        variant="outline"
                                        className="flex items-center gap-2"
                                    >
                                        <Presentation className="w-4 h-4" />
                                        Slide Deck
                                    </Button>
                                </div>

                                {pitchContent && pitchContent.format === 'email' && (
                                    <div className="mt-4 p-4 bg-white rounded-lg border">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-semibold">Email Draft</h4>
                                            <Button
                                                onClick={downloadEmail}
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Download
                                            </Button>
                                        </div>
                                        <div className="text-sm space-y-2">
                                            <p><strong>Subject:</strong> {pitchContent.subject}</p>
                                            <div className="max-h-60 overflow-y-auto p-3 bg-gray-50 rounded whitespace-pre-wrap text-xs">
                                                {pitchContent.content}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Create Batch */}
                    <Card className="border-2 border-indigo-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                Create Content Batch
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Batch Name
                                    </label>
                                    <input
                                        type="text"
                                        value={batchName}
                                        onChange={(e) => setBatchName(e.target.value)}
                                        placeholder="Q1 2024 Content Strategy"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600"
                                    />
                                </div>

                                <div className="bg-indigo-50 rounded-lg p-4">
                                    <h4 className="font-semibold mb-2">This will create:</h4>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                        <li>✓ {projection.recommended_posts} auto-generated blog topics</li>
                                        <li>✓ Topics based on gaps and clusters</li>
                                        <li>✓ {projection.timeline_months}-month timeline</li>
                                        <li>✓ Ready for AI content generation</li>
                                    </ul>
                                </div>

                                <Button
                                    onClick={createContentBatch}
                                    disabled={!batchName || creatingBatch}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                >
                                    {creatingBatch ? (
                                        'Creating Batch...'
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Create Batch & Generate Topics
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
