'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, XCircle, FileText, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PublishingStatus {
    id: string
    topic: string
    status: string
    publishStatus: 'published' | 'scheduled' | 'failed' | 'draft' | 'unknown'
    wordpressId?: string
    publishedUrl?: string
    publishedAt?: string
    scheduledFor?: string
    error?: string
    errorDetails?: any
    lastAttempt?: string
    batch?: { id: string; name: string }
    client?: { id: string; name: string }
}

interface PublishingStats {
    total: number
    published: number
    scheduled: number
    failed: number
    draft: number
}

export default function PublishingDashboardPage() {
    const [posts, setPosts] = useState<PublishingStatus[]>([])
    const [stats, setStats] = useState<PublishingStats>({
        total: 0,
        published: 0,
        scheduled: 0,
        failed: 0,
        draft: 0
    })
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')
    const [retrying, setRetrying] = useState<string | null>(null)

    useEffect(() => {
        fetchPublishingStatus()
    }, [filter])

    const fetchPublishingStatus = async () => {
        setLoading(true)
        try {
            const url = new URL('/api/publishing/status', window.location.origin)
            if (filter !== 'all') {
                url.searchParams.set('status', filter)
            }

            const response = await fetch(url.toString())
            const data = await response.json()

            if (data.success) {
                setPosts(data.posts || [])
                setStats(data.stats || stats)
            }
        } catch (error) {
            console.error('Failed to fetch publishing status:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRetry = async (postId: string) => {
        setRetrying(postId)
        try {
            const response = await fetch(`/api/publishing/retry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId })
            })

            const data = await response.json()
            if (data.success) {
                alert('Publishing retry initiated successfully')
                await fetchPublishingStatus()
            } else {
                alert(`Retry failed: ${data.error}`)
            }
        } catch (error) {
            console.error('Retry error:', error)
            alert('Failed to retry publishing')
        } finally {
            setRetrying(null)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'published':
                return <CheckCircle2 className="w-5 h-5 text-green-600" />
            case 'scheduled':
                return <Clock className="w-5 h-5 text-blue-600" />
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-600" />
            case 'draft':
                return <FileText className="w-5 h-5 text-gray-600" />
            default:
                return <AlertCircle className="w-5 h-5 text-yellow-600" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published':
                return 'bg-green-100 text-green-700 border-green-300'
            case 'scheduled':
                return 'bg-blue-100 text-blue-700 border-blue-300'
            case 'failed':
                return 'bg-red-100 text-red-700 border-red-300'
            case 'draft':
                return 'bg-gray-100 text-gray-700 border-gray-300'
            default:
                return 'bg-yellow-100 text-yellow-700 border-yellow-300'
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Publishing Dashboard</h1>
                    <p className="text-muted-foreground">
                        Monitor and manage blog post publishing status
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    <Card className="border-2">
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground mb-1">Total</div>
                            <div className="text-3xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                            <div className="text-sm text-green-700 mb-1">Published</div>
                            <div className="text-3xl font-bold text-green-700">{stats.published}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                            <div className="text-sm text-blue-700 mb-1">Scheduled</div>
                            <div className="text-3xl font-bold text-blue-700">{stats.scheduled}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                            <div className="text-sm text-red-700 mb-1">Failed</div>
                            <div className="text-3xl font-bold text-red-700">{stats.failed}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-gray-50">
                        <CardContent className="p-4">
                            <div className="text-sm text-gray-700 mb-1">Draft</div>
                            <div className="text-3xl font-bold text-gray-700">{stats.draft}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="mb-6 flex gap-2">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === 'published' ? 'default' : 'outline'}
                        onClick={() => setFilter('published')}
                    >
                        Published
                    </Button>
                    <Button
                        variant={filter === 'scheduled' ? 'default' : 'outline'}
                        onClick={() => setFilter('scheduled')}
                    >
                        Scheduled
                    </Button>
                    <Button
                        variant={filter === 'failed' ? 'default' : 'outline'}
                        onClick={() => setFilter('failed')}
                    >
                        Failed
                    </Button>
                    <Button
                        variant="outline"
                        onClick={fetchPublishingStatus}
                        className="ml-auto"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Posts List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Publishing Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No posts found
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {posts.map((post) => (
                                    <div
                                        key={post.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {getStatusIcon(post.publishStatus)}
                                                <div className="font-medium">{post.topic || 'Untitled'}</div>
                                                <Badge className={getStatusColor(post.publishStatus)}>
                                                    {post.publishStatus}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground space-y-1">
                                                {post.batch && (
                                                    <div>Batch: {post.batch.name}</div>
                                                )}
                                                {post.client && (
                                                    <div>Client: {post.client.name}</div>
                                                )}
                                                {post.publishedAt && (
                                                    <div>Published: {new Date(post.publishedAt).toLocaleString()}</div>
                                                )}
                                                {post.scheduledFor && (
                                                    <div>Scheduled: {new Date(post.scheduledFor).toLocaleString()}</div>
                                                )}
                                                {post.error && (
                                                    <div className="text-red-600">
                                                        Error: {post.error}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {post.publishedUrl && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.open(post.publishedUrl, '_blank')}
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    View
                                                </Button>
                                            )}
                                            {post.publishStatus === 'failed' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRetry(post.id)}
                                                    disabled={retrying === post.id}
                                                >
                                                    {retrying === post.id ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <RefreshCw className="w-4 h-4 mr-2" />
                                                            Retry
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

