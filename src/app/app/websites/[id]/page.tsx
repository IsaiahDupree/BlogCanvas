'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, TrendingUp, FileText, Link as LinkIcon, Image as ImageIcon, List, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GapsAnalysisTab } from '@/components/website/GapsAnalysisTab'
import { TopicClustersTab } from '@/components/website/TopicClustersTab'
import { PitchBuilderTab } from '@/components/website/PitchBuilderTab'

export default function WebsiteDetailPage() {
    const params = useParams()
    const [website, setWebsite] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchWebsite()
    }, [params.id])

    const fetchWebsite = async () => {
        try {
            const response = await fetch(`/api/websites/${params.id}`)
            const data = await response.json()
            if (data.success) {
                setWebsite(data.website)
            }
        } catch (error) {
            console.error('Failed to fetch website:', error)
        } finally {
            setLoading(false)
        }
    }

    const getSEOScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getSEOGrade = (score: number) => {
        if (score >= 90) return 'A+'
        if (score >= 80) return 'A'
        if (score >= 70) return 'B'
        if (score >= 60) return 'C'
        if (score >= 50) return 'D'
        return 'F'
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-4" />
                    <p className="text-muted-foreground">Loading website data...</p>
                </div>
            </div>
        )
    }

    if (!website) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto text-red-600 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Website Not Found</h2>
                    <Link href="/app/websites">
                        <Button>Back to Websites</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const audit = website.latestAudit

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/app/websites" className="text-sm text-muted-foreground hover:text-gray-900 mb-4 inline-flex items-center">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Websites
                    </Link>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                                <Globe className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-2">
                                    {website.title || website.domain}
                                </h1>
                                <a href={website.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                    {website.url}
                                </a>
                            </div>
                        </div>
                        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Re-analyze
                        </Button>
                    </div>
                </div>

                {/* SEO Score Overview */}
                {audit && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {/* Main Score */}
                        <Card className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Overall SEO Score</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-6xl font-bold ${getSEOScoreColor(audit.baseline_score)}`}>
                                                {audit.baseline_score}
                                            </span>
                                            <span className="text-3xl text-muted-foreground">/100</span>
                                        </div>
                                        <p className={`text-lg font-semibold mt-2 ${getSEOScoreColor(audit.baseline_score)}`}>
                                            Grade: {getSEOGrade(audit.baseline_score)}
                                        </p>
                                    </div>
                                    <div className="w-32 h-32">
                                        <svg className="transform -rotate-90" viewBox="0 0 120 120">
                                            <circle
                                                cx="60"
                                                cy="60"
                                                r="54"
                                                fill="none"
                                                stroke="#e5e7eb"
                                                strokeWidth="12"
                                            />
                                            <circle
                                                cx="60"
                                                cy="60"
                                                r="54"
                                                fill="none"
                                                stroke="url(#gradient)"
                                                strokeWidth="12"
                                                strokeDasharray={`${audit.baseline_score * 3.39} 339`}
                                                strokeLinecap="round"
                                            />
                                            <defs>
                                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#6366f1" />
                                                    <stop offset="100%" stopColor="#a855f7" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pages Indexed */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className="w-5 h-5 text-indigo-600" />
                                    <p className="text-sm text-muted-foreground">Pages Analyzed</p>
                                </div>
                                <p className="text-4xl font-bold">{audit.pages_indexed}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {website.pagesScraped || audit.pages_indexed} total pages
                                </p>
                            </CardContent>
                        </Card>

                        {/* Status */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <p className="text-sm text-muted-foreground">Status</p>
                                </div>
                                <p className="text-lg font-semibold mb-2">Completed</p>
                                <p className="text-xs text-muted-foreground">
                                    Last analyzed: {new Date(audit.audit_date).toLocaleDateString()}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Detailed Analysis Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
                        <TabsTrigger value="topics">Topic Clusters</TabsTrigger>
                        <TabsTrigger value="pitch">Build Pitch</TabsTrigger>
                        <TabsTrigger value="pages">Pages</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>SEO Analysis Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium">Title Optimization</span>
                                            <span className="text-sm text-muted-foreground">15/15</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium">Description Optimization</span>
                                            <span className="text-sm text-muted-foreground">12/15</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '80%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium">Heading Structure</span>
                                            <span className="text-sm text-muted-foreground">18/20</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium">Content Depth</span>
                                            <span className="text-sm text-muted-foreground">20/25</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '80%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium">Image Optimization</span>
                                            <span className="text-sm text-muted-foreground">8/10</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium">Internal Linking</span>
                                            <span className="text-sm text-muted-foreground">12/15</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '80%' }} />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="gaps">
                        <GapsAnalysisTab websiteId={params.id as string} />
                    </TabsContent>

                    <TabsContent value="topics">
                        <TopicClustersTab websiteId={params.id as string} />
                    </TabsContent>

                    <TabsContent value="pitch">
                        <PitchBuilderTab websiteId={params.id as string} />
                    </TabsContent>

                    <TabsContent value="pages">
                        <Card>
                            <CardHeader>
                                <CardTitle>Scraped Pages</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    {website.pagesScraped || 0} pages analyzed
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
