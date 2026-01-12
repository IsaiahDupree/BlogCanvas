'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle, Loader2, Play } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ContentBatch {
    id: string
    name: string
    status: 'planned' | 'generating' | 'completed' | 'partial' | 'failed'
    total_posts: number
    posts_completed: number
    goal_score_from: number
    goal_score_to: number
    created_at: string
    website?: {
        url: string
        domain: string
    }
}

export default function BatchesPage() {
    const [batches, setBatches] = useState<ContentBatch[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBatches()
    }, [])

    const fetchBatches = async () => {
        try {
            const response = await fetch('/api/content-batches')
            const data = await response.json()
            if (data.success) {
                setBatches(data.batches || [])
            }
        } catch (error) {
            console.error('Failed to fetch batches:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>
            case 'generating':
                return <Badge className="bg-blue-100 text-blue-700"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Generating...</Badge>
            case 'partial':
                return <Badge className="bg-yellow-100 text-yellow-700"><AlertCircle className="w-3 h-3 mr-1" />Partial</Badge>
            case 'failed':
                return <Badge className="bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>
            default:
                return <Badge className="bg-gray-100 text-gray-700">Planned</Badge>
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/app" className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                Content Batches
                            </h1>
                            <p className="text-muted-foreground">
                                Manage and track your content production pipelines
                            </p>
                        </div>
                    </div>
                </div>

                {/* Batch Grid */}
                {batches.length === 0 ? (
                    <Card className="p-12 text-center">
                        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Content Batches Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Create batches from website analysis pitch builder
                        </p>
                        <Link href="/app/websites">
                            <Button>Go to Websites</Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {batches.map((batch) => {
                            const progress = batch.total_posts > 0
                                ? Math.round((batch.posts_completed / batch.total_posts) * 100)
                                : 0

                            return (
                                <Link key={batch.id} href={`/app/batches/${batch.id}`}>
                                    <Card className="hover:shadow-xl transition-shadow cursor-pointer h-full">
                                        <CardHeader>
                                            <div className="flex items-start justify-between mb-2">
                                                <CardTitle className="text-lg line-clamp-2 flex-1">
                                                    {batch.name}
                                                </CardTitle>
                                                {getStatusBadge(batch.status)}
                                            </div>
                                            {batch.website && (
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {batch.website.domain}
                                                </p>
                                            )}
                                        </CardHeader>

                                        <CardContent>
                                            <div className="space-y-4">
                                                {/* Goal */}
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">SEO Goal</span>
                                                    <span className="font-semibold">
                                                        {batch.goal_score_from} → {batch.goal_score_to}
                                                    </span>
                                                </div>

                                                {/* Progress */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-muted-foreground">Progress</span>
                                                        <span className="text-sm font-semibold">
                                                            {batch.posts_completed}/{batch.total_posts} posts
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {progress}% complete
                                                    </div>
                                                </div>

                                                {/* Date */}
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    Created {new Date(batch.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
