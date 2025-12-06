'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Globe, FileText, TrendingUp, CheckCircle2, Clock, Zap, ArrowRight, Play } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
    const [stats, setStats] = useState({
        websites: 0,
        batches: 0,
        postsGenerated: 0,
        postsPublished: 0,
        avgQuality: 0,
        activeGeneration: false
    })
    const [recentActivity, setRecentActivity] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            // Fetch stats from various endpoints
            const [websitesRes, batchesRes, postsRes] = await Promise.all([
                fetch('/api/websites'),
                fetch('/api/content-batches'),
                fetch('/api/blog-posts')
            ])

            const websitesData = await websitesRes.json()
            const batchesData = await batchesRes.json()
            const postsData = await postsRes.json()

            const websites = websitesData.websites || []
            const batches = batchesData.batches || []
            const posts = postsData.posts || []

            const published = posts.filter((p: any) => p.status === 'published').length
            const qualityScores = posts
                .filter((p: any) => p.seo_quality_score)
                .map((p: any) => p.seo_quality_score)
            const avgQuality = qualityScores.length > 0
                ? Math.round(qualityScores.reduce((a: number, b: number) => a + b, 0) / qualityScores.length)
                : 0

            setStats({
                websites: websites.length,
                batches: batches.length,
                postsGenerated: posts.filter((p: any) => ['draft', 'in_review', 'approved', 'published'].includes(p.status)).length,
                postsPublished: published,
                avgQuality,
                activeGeneration: posts.some((p: any) => p.status === 'generating')
            })

            // Create recent activity from batches
            const recent = batches
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
            setRecentActivity(recent)

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        BlogCanvas Dashboard
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        AI-Powered SEO Content Pipeline
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <Globe className="w-8 h-8 text-indigo-600" />
                                {stats.activeGeneration && (
                                    <Badge className="bg-green-500 text-white animate-pulse">
                                        <Zap className="w-3 h-3 mr-1" />
                                        Active
                                    </Badge>
                                )}
                            </div>
                            <div className="text-3xl font-bold text-indigo-700">{stats.websites}</div>
                            <div className="text-sm text-indigo-600">Websites</div>
                        </CardContent>
                    </Card>

                    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                        <CardContent className="p-6">
                            <FileText className="w-8 h-8 text-purple-600 mb-2" />
                            <div className="text-3xl font-bold text-purple-700">{stats.batches}</div>
                            <div className="text-sm text-purple-600">Content Batches</div>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                        <CardContent className="p-6">
                            <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
                            <div className="text-3xl font-bold text-blue-700">{stats.postsGenerated}</div>
                            <div className="text-sm text-blue-600">Posts Generated</div>
                        </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                        <CardContent className="p-6">
                            <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
                            <div className="text-3xl font-bold text-green-700">{stats.postsPublished}</div>
                            <div className="text-sm text-green-600">Published</div>
                        </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                        <CardContent className="p-6">
                            <div className="text-xs text-orange-600 mb-2">Avg Quality</div>
                            <div className="text-3xl font-bold text-orange-700">{stats.avgQuality}</div>
                            <div className="text-sm text-orange-600">Out of 100</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Link href="/app/websites">
                        <Card className="hover:shadow-xl transition-all cursor-pointer group h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Websites</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Analyze websites, identify gaps, and generate topic clusters
                                </p>
                                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                    Manage Websites
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/app/batches">
                        <Card className="hover:shadow-xl transition-all cursor-pointer group h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Content Batches</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Create and manage content production batches
                                </p>
                                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                                    View Batches
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/app/review">
                        <Card className="hover:shadow-xl transition-all cursor-pointer group h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Review Board</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Manage content workflow and approvals
                                </p>
                                <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                                    Review Content
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card className="hover:shadow-xl transition-all group h-full bg-gradient-to-br from-indigo-50 to-purple-50">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Quick Stats</span>
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Posts:</span>
                                    <span className="font-semibold">{stats.postsGenerated}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Published:</span>
                                    <span className="font-semibold text-green-600">{stats.postsPublished}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Avg Quality:</span>
                                    <span className="font-semibold text-orange-600">{stats.avgQuality}/100</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Recent Batches
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentActivity.length > 0 ? (
                            <div className="space-y-3">
                                {recentActivity.map((batch: any) => (
                                    <Link
                                        key={batch.id}
                                        href={`/app/batches/${batch.id}`}
                                        className="block"
                                    >
                                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex-1">
                                                <div className="font-medium mb-1">{batch.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {batch.total_posts} posts • Created{' '}
                                                    {new Date(batch.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="capitalize">
                                                    {batch.status}
                                                </Badge>
                                                <ArrowRight className="w-5 h-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No batches yet. Start by analyzing a website!</p>
                                <Link href="/app/websites">
                                    <Button className="mt-4">Add Website</Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
