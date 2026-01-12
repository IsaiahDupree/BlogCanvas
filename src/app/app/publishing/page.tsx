'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, XCircle, FileText, RefreshCw, ExternalLink, AlertCircle, Calendar, List } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

interface QueueJob {
    id: string
    blog_post_id: string
    scheduled_for: string
    status: string
    priority: number
    attempts: number
    error_message?: string
    topic?: string
    client_name?: string
    batch_name?: string
}

export default function PublishingDashboardPage() {
    const [posts, setPosts] = useState<PublishingStatus[]>([])
    const [queueJobs, setQueueJobs] = useState<QueueJob[]>([])
    const [stats, setStats] = useState<PublishingStats>({
        total: 0,
        published: 0,
        scheduled: 0,
        failed: 0,
        draft: 0
    })
    const [queueStats, setQueueStats] = useState({ pending: 0, processing: 0, failed: 0, completed: 0 })
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')
    const [retrying, setRetrying] = useState<string | null>(null)
    const [view, setView] = useState<'list' | 'calendar'>('list')

    useEffect(() => {
        fetchPublishingStatus()
        fetchQueueStatus()
    }, [filter])

    const fetchQueueStatus = async () => {
        try {
            // Fetch queue stats
            const statsResponse = await fetch('/api/publish-queue/stats')
            const statsData = await statsResponse.json()
            if (statsData) {
                setQueueStats(statsData)
            }

            // Fetch scheduled publishes for next 30 days
            const scheduleResponse = await fetch('/api/publish-queue/schedule?limit=100')
            const scheduleData = await scheduleResponse.json()
            if (scheduleData.success) {
                setQueueJobs(scheduleData.schedules || [])
            }
        } catch (error) {
            console.error('Failed to fetch queue status:', error)
        }
    }

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
                await fetchQueueStatus()
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

    const handleRetryQueueJob = async (jobId: string) => {
        try {
            const response = await fetch(`/api/publish-queue/${jobId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'retry' })
            })

            const data = await response.json()
            if (data.success) {
                alert('Job queued for retry')
                await fetchQueueStatus()
            } else {
                alert(`Failed to retry: ${data.error}`)
            }
        } catch (error) {
            console.error('Retry error:', error)
            alert('Failed to retry job')
        }
    }

    const handleCancelQueueJob = async (jobId: string) => {
        if (!confirm('Are you sure you want to cancel this scheduled publish?')) {
            return
        }

        try {
            const response = await fetch(`/api/publish-queue/${jobId}`, {
                method: 'DELETE'
            })

            const data = await response.json()
            if (data.success) {
                alert('Job cancelled')
                await fetchQueueStatus()
            } else {
                alert(`Failed to cancel: ${data.error}`)
            }
        } catch (error) {
            console.error('Cancel error:', error)
            alert('Failed to cancel job')
        }
    }

    const groupJobsByDate = (jobs: QueueJob[]) => {
        const grouped: { [date: string]: QueueJob[] } = {}
        jobs.forEach(job => {
            const date = new Date(job.scheduled_for).toLocaleDateString()
            if (!grouped[date]) {
                grouped[date] = []
            }
            grouped[date].push(job)
        })
        return grouped
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
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

                {/* Queue Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="p-4">
                            <div className="text-sm text-yellow-700 mb-1">Queue Pending</div>
                            <div className="text-2xl font-bold text-yellow-700">{queueStats.pending}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-purple-200 bg-purple-50">
                        <CardContent className="p-4">
                            <div className="text-sm text-purple-700 mb-1">Processing</div>
                            <div className="text-2xl font-bold text-purple-700">{queueStats.processing}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                            <div className="text-sm text-red-700 mb-1">Queue Failed</div>
                            <div className="text-2xl font-bold text-red-700">{queueStats.failed}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                            <div className="text-sm text-green-700 mb-1">Queue Completed</div>
                            <div className="text-2xl font-bold text-green-700">{queueStats.completed}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* View Tabs */}
                <Tabs defaultValue="list" className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="list">
                                <List className="w-4 h-4 mr-2" />
                                List View
                            </TabsTrigger>
                            <TabsTrigger value="calendar">
                                <Calendar className="w-4 h-4 mr-2" />
                                Calendar View
                            </TabsTrigger>
                        </TabsList>
                        <Button
                            variant="outline"
                            onClick={() => {
                                fetchPublishingStatus()
                                fetchQueueStatus()
                            }}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>

                    {/* List View */}
                    <TabsContent value="list" className="space-y-4">
                        {/* Filters */}
                        <div className="flex gap-2">
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
                    </TabsContent>

                    {/* Calendar View */}
                    <TabsContent value="calendar">
                        <Card>
                            <CardHeader>
                                <CardTitle>Scheduled Publishes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-8">
                                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                                    </div>
                                ) : queueJobs.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No scheduled publishes
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {Object.entries(groupJobsByDate(queueJobs)).map(([date, jobs]) => (
                                            <div key={date}>
                                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                                    <Calendar className="w-5 h-5" />
                                                    {date}
                                                    <Badge variant="outline">{jobs.length} posts</Badge>
                                                </h3>
                                                <div className="space-y-2">
                                                    {jobs.map((job) => (
                                                        <div
                                                            key={job.id}
                                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                                        >
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-medium">
                                                                        {new Date(job.scheduled_for).toLocaleTimeString([], {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </span>
                                                                    <span className="text-sm">
                                                                        Post ID: {job.blog_post_id.slice(0, 8)}...
                                                                    </span>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={
                                                                            job.status === 'pending'
                                                                                ? 'bg-blue-50 text-blue-700'
                                                                                : job.status === 'failed'
                                                                                ? 'bg-red-50 text-red-700'
                                                                                : 'bg-gray-50'
                                                                        }
                                                                    >
                                                                        {job.status}
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Priority: {job.priority}
                                                                    </span>
                                                                </div>
                                                                {job.client_name && (
                                                                    <div className="text-sm text-muted-foreground">
                                                                        Client: {job.client_name}
                                                                    </div>
                                                                )}
                                                                {job.error_message && (
                                                                    <div className="text-sm text-red-600 mt-1">
                                                                        Error: {job.error_message}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {job.status === 'failed' && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleRetryQueueJob(job.id)}
                                                                    >
                                                                        <RefreshCw className="w-4 h-4 mr-1" />
                                                                        Retry
                                                                    </Button>
                                                                )}
                                                                {job.status === 'pending' && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleCancelQueueJob(job.id)}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

