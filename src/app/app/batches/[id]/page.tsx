'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, Pause, CheckCircle2, AlertCircle, Loader2, TrendingUp, FileText, Upload, Download, Send, Image as ImageIcon, ExternalLink, Calendar, Clock, AlertTriangle, CalendarClock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ImageGenerationDialog from '@/components/images/ImageGenerationDialog'
import SchedulePublishDialog from '@/components/publishing/SchedulePublishDialog'

export default function BatchDetailPage() {
    const params = useParams()
    const [batch, setBatch] = useState<any>(null)
    const [progress, setProgress] = useState<any>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [generating, setGenerating] = useState(false)
    const [loading, setLoading] = useState(true)
    const [importing, setImporting] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)
    const [publishing, setPublishing] = useState(false)
    const [imageDialogOpen, setImageDialogOpen] = useState(false)
    const [selectedPostForImages, setSelectedPostForImages] = useState<{ id: string; topic: string } | null>(null)
    const [overdueStats, setOverdueStats] = useState<any>(null)
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
    const [selectedPostForSchedule, setSelectedPostForSchedule] = useState<{ id: string; topic: string } | null>(null)
    const [scheduledPosts, setScheduledPosts] = useState<any[]>([])
    const [showScheduledSection, setShowScheduledSection] = useState(false)

    useEffect(() => {
        fetchBatchDetails()
        fetchOverdueStats()
        fetchScheduledPosts()
        const interval = setInterval(fetchProgress, 3000) // Poll every 3 seconds
        return () => clearInterval(interval)
    }, [params.id])

    const fetchBatchDetails = async () => {
        try {
            const response = await fetch(`/api/content-batches/${params.id}/posts`)
            const data = await response.json()
            if (data.success) {
                setBatch(data.batch)
                setPosts(data.posts || [])
            }
        } catch (error) {
            console.error('Failed to fetch batch:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchProgress = async () => {
        try {
            const response = await fetch(`/api/content-batches/${params.id}/generate-all`)
            const data = await response.json()
            if (data.success) {
                setProgress(data.progress)
            }
        } catch (error) {
            // Silently fail for progress polling
        }
    }

    const fetchOverdueStats = async () => {
        try {
            const response = await fetch(`/api/content-batches/${params.id}/overdue`)
            const data = await response.json()
            if (data.success) {
                setOverdueStats(data.stats)
            }
        } catch (error) {
            console.error('Failed to fetch overdue stats:', error)
        }
    }

    const fetchScheduledPosts = async () => {
        try {
            const response = await fetch(`/api/publish-queue/schedule?batchId=${params.id}`)
            const data = await response.json()
            if (data.success) {
                setScheduledPosts(data.schedules || [])
            }
        } catch (error) {
            console.error('Failed to fetch scheduled posts:', error)
        }
    }

    const handleCancelScheduled = async (jobId: string) => {
        if (!confirm('Are you sure you want to cancel this scheduled publish?')) {
            return
        }

        try {
            const response = await fetch(`/api/publish-queue/${jobId}`, {
                method: 'DELETE'
            })
            const data = await response.json()

            if (data.success) {
                alert('Scheduled publish cancelled')
                await fetchScheduledPosts()
            } else {
                alert(`Failed to cancel: ${data.error}`)
            }
        } catch (error: any) {
            console.error('Cancel error:', error)
            alert(`Failed to cancel: ${error.message}`)
        }
    }

    const startGeneration = async () => {
        setGenerating(true)
        try {
            const response = await fetch(`/api/content-batches/${params.id}/generate-all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: 'anthropic', maxConcurrent: 3 })
            })
            const data = await response.json()
            if (data.success) {
                await fetchBatchDetails()
                alert(`Generation complete! ${data.results.succeeded} posts generated successfully.`)
            }
        } catch (error) {
            console.error('Generation failed:', error)
            alert('Failed to start generation')
        } finally {
            setGenerating(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'text-green-600'
            case 'generating': return 'text-blue-600'
            case 'failed': return 'text-red-600'
            default: return 'text-gray-600'
        }
    }

    const getQualityColor = (score: number) => {
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const getOverdueStatus = (post: any) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (post.status === 'published' || post.status === 'scheduled') {
            return null
        }

        if (post.due_date) {
            const dueDate = new Date(post.due_date)
            dueDate.setHours(0, 0, 0, 0)
            const daysUntil = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            if (daysUntil < 0) {
                return { type: 'past_due', message: `${Math.abs(daysUntil)} days overdue`, color: 'text-red-600 bg-red-50' }
            } else if (daysUntil <= 3) {
                return { type: 'at_risk', message: `Due in ${daysUntil} days`, color: 'text-yellow-600 bg-yellow-50' }
            }
        }

        if (post.publish_window_end) {
            const windowEnd = new Date(post.publish_window_end)
            windowEnd.setHours(0, 0, 0, 0)
            const daysUntil = Math.floor((windowEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            if (daysUntil < 0) {
                return { type: 'missed_window', message: 'Missed publish window', color: 'text-red-600 bg-red-50' }
            } else if (daysUntil <= 3) {
                return { type: 'window_closing', message: `Window closes in ${daysUntil} days`, color: 'text-yellow-600 bg-yellow-50' }
            }
        }

        return null
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImportFile(file)
            handleImportCSV(file)
        }
    }

    const handleImportCSV = async (file: File) => {
        setImporting(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`/api/content-batches/${params.id}/import-csv`, {
                method: 'POST',
                body: formData
            })

            const data = await response.json()
            if (data.success) {
                alert(`Successfully imported ${data.imported} posts${data.errors ? ` (${data.errors.length} errors)` : ''}`)
                if (data.errors && data.errors.length > 0) {
                    console.error('Import errors:', data.errors)
                }
                await fetchBatchDetails()
            } else {
                alert(`Import failed: ${data.error}`)
            }
        } catch (error) {
            console.error('Import error:', error)
            alert('Failed to import CSV file')
        } finally {
            setImporting(false)
            setImportFile(null)
            // Reset file input
            const input = document.querySelector('input[type="file"]') as HTMLInputElement
            if (input) input.value = ''
        }
    }

    const handleExportCSV = async () => {
        try {
            const response = await fetch(`/api/content-batches/${params.id}/export-csv`)
            if (!response.ok) throw new Error('Export failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `batch_${params.id}.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Export error:', error)
            alert('Failed to export CSV file')
        }
    }

    const handlePublishAll = async () => {
        if (!confirm('This will publish all approved posts in this batch to WordPress. Continue?')) {
            return
        }

        setPublishing(true)
        try {
            const response = await fetch(`/api/content-batches/${params.id}/publish-all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            const data = await response.json()

            if (data.success) {
                const { summary } = data
                alert(`Publishing complete!\n\nTotal: ${summary.total}\nSucceeded: ${summary.succeeded}\nFailed: ${summary.failed}`)
                await fetchBatchDetails()
            } else {
                alert(`Publishing failed: ${data.error}`)
            }
        } catch (error: any) {
            console.error('Publishing error:', error)
            alert(`Failed to publish posts: ${error.message}`)
        } finally {
            setPublishing(false)
        }
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    }

    if (!batch) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <AlertCircle className="w-16 h-16 mx-auto text-red-600 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Batch Not Found</h2>
                <Link href="/app/batches"><Button>Back to Batches</Button></Link>
            </div>
        </div>
    }

    const totalPosts = progress?.total || posts.length
    const completedPosts = progress?.completed || 0
    const progressPercent = progress?.percent || 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/app/batches" className="text-sm text-muted-foreground hover:text-gray-900 mb-4 inline-flex items-center">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Batches
                    </Link>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{batch.name}</h1>
                            <p className="text-muted-foreground">
                                Goal: {batch.goal_score_from} → {batch.goal_score_to} SEO Score
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleExportCSV}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </Button>
                            <label className="cursor-pointer">
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2"
                                    asChild
                                >
                                    <span>
                                        <Upload className="w-4 h-4" />
                                        Import CSV
                                    </span>
                                </Button>
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </label>
                            <Button
                                onClick={startGeneration}
                                disabled={generating || completedPosts === totalPosts}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        {completedPosts === 0 ? 'Start Generation' : 'Resume Generation'}
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handlePublishAll}
                                disabled={publishing}
                                className="bg-gradient-to-r from-green-600 to-green-700 text-white"
                            >
                                {publishing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Publish to WordPress
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={() => {
                                    const approvedPosts = posts.filter(p => p.status === 'approved')
                                    if (approvedPosts.length === 0) {
                                        alert('No approved posts to schedule')
                                        return
                                    }
                                    setSelectedPostForSchedule({
                                        id: 'batch',
                                        topic: `${approvedPosts.length} approved posts`
                                    })
                                    setScheduleDialogOpen(true)
                                }}
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            >
                                <CalendarClock className="w-4 h-4 mr-2" />
                                Schedule Batch
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Progress Overview */}
                {progress && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                        <Card>
                            <CardContent className="p-4">
                                <div className="text-sm text-muted-foreground mb-1">Total Posts</div>
                                <div className="text-3xl font-bold">{totalPosts}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="p-4">
                                <div className="text-sm text-green-700 mb-1">Completed</div>
                                <div className="text-3xl font-bold text-green-700">{progress.completed}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-blue-200 bg-blue-50">
                            <CardContent className="p-4">
                                <div className="text-sm text-blue-700 mb-1">Generating</div>
                                <div className="text-3xl font-bold text-blue-700">{progress.generating}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="p-4">
                                <div className="text-sm text-red-700 mb-1">Failed</div>
                                <div className="text-3xl font-bold text-red-700">{progress.failed}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-indigo-200 bg-indigo-50">
                            <CardContent className="p-4">
                                <div className="text-sm text-indigo-700 mb-1">Avg Quality</div>
                                <div className={`text-3xl font-bold ${getQualityColor(progress.avgQualityScore)}`}>
                                    {progress.avgQualityScore}/100
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Progress Bar */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Overall Progress</span>
                            <span className="text-sm text-muted-foreground">
                                {completedPosts} / {totalPosts} posts ({progressPercent}%)
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 rounded-full transition-all"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Overdue Alerts */}
                {overdueStats && overdueStats.total_alerts > 0 && (
                    <Card className="mb-8 border-yellow-200 bg-yellow-50">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-yellow-900 mb-2">Deadline Alerts</h3>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        {overdueStats.past_due_count > 0 && (
                                            <div className="text-red-700">
                                                <strong>{overdueStats.past_due_count}</strong> {overdueStats.past_due_count === 1 ? 'post' : 'posts'} past due
                                            </div>
                                        )}
                                        {overdueStats.at_risk_count > 0 && (
                                            <div className="text-yellow-700">
                                                <strong>{overdueStats.at_risk_count}</strong> {overdueStats.at_risk_count === 1 ? 'post' : 'posts'} due soon (within 3 days)
                                            </div>
                                        )}
                                        {overdueStats.missed_window_count > 0 && (
                                            <div className="text-red-700">
                                                <strong>{overdueStats.missed_window_count}</strong> missed publish window
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Scheduled Posts Section - PRD feat-105 */}
                {scheduledPosts.length > 0 && (
                    <Card className="mb-8 border-blue-200 bg-blue-50">
                        <CardHeader className="cursor-pointer" onClick={() => setShowScheduledSection(!showScheduledSection)}>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-blue-900">
                                    <CalendarClock className="w-5 h-5" />
                                    Scheduled Posts ({scheduledPosts.length})
                                </CardTitle>
                                <Button variant="ghost" size="sm">
                                    {showScheduledSection ? 'Hide' : 'Show'}
                                </Button>
                            </div>
                        </CardHeader>
                        {showScheduledSection && (
                            <CardContent className="space-y-3">
                                {scheduledPosts.map((job: any) => (
                                    <div
                                        key={job.id}
                                        className="flex items-center justify-between p-4 bg-white border border-blue-200 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium">{job.topic || 'Untitled Post'}</div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Scheduled for: {new Date(job.scheduled_for).toLocaleString()}
                                                </div>
                                                <div className="mt-1">
                                                    Status: <Badge variant="outline" className="text-xs">{job.status}</Badge>
                                                    {job.priority && <span className="ml-2">Priority: {job.priority}</span>}
                                                    {job.attempts > 0 && <span className="ml-2 text-yellow-600">Attempts: {job.attempts}</span>}
                                                </div>
                                                {job.error_message && (
                                                    <div className="mt-1 text-red-600 text-xs">{job.error_message}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {job.status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleCancelScheduled(job.id)}
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                            {job.status === 'failed' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={async () => {
                                                        try {
                                                            const res = await fetch(`/api/publish-queue/${job.id}`, {
                                                                method: 'PATCH',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ action: 'retry' })
                                                            })
                                                            const data = await res.json()
                                                            if (data.success) {
                                                                alert('Job queued for retry')
                                                                await fetchScheduledPosts()
                                                            }
                                                        } catch (error: any) {
                                                            alert(`Failed to retry: ${error.message}`)
                                                        }
                                                    }}
                                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                >
                                                    Retry
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        )}
                    </Card>
                )}

                {/* Posts List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Blog Posts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {posts.map((post, index) => (
                                <div
                                    key={post.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium mb-1">{post.topic}</div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            {post.target_keyword && <div>Keyword: {post.target_keyword}</div>}

                                            {/* PRD feat-102: Show due date and publish window */}
                                            {(post.due_date || post.publish_window_start) && (
                                                <div className="flex items-center gap-3 mt-1">
                                                    {post.due_date && (
                                                        <div className="inline-flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            <span className="text-xs">Due: {formatDate(post.due_date)}</span>
                                                        </div>
                                                    )}
                                                    {post.publish_window_start && post.publish_window_end && (
                                                        <div className="inline-flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            <span className="text-xs">
                                                                Window: {formatDate(post.publish_window_start)} - {formatDate(post.publish_window_end)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {getOverdueStatus(post) && (
                                                        <Badge variant="outline" className={`text-xs ${getOverdueStatus(post)?.color}`}>
                                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                                            {getOverdueStatus(post)?.message}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}

                                            {/* PRD feat-104: Show published URL */}
                                            {post.cms_url && (
                                                <div className="mt-1">
                                                    <a
                                                        href={post.cms_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        View on WordPress
                                                    </a>
                                                    {/* Show verification status if available */}
                                                    {post.cms_publish_info?.url_verified === true && (
                                                        <span className="ml-2 text-green-600 text-xs">✓ Verified</span>
                                                    )}
                                                    {post.cms_publish_info?.url_verified === false && (
                                                        <span className="ml-2 text-red-600 text-xs">⚠ Not accessible</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {post.seo_quality_score && (
                                            <div className="text-center">
                                                <div className="text-xs text-muted-foreground">Quality</div>
                                                <div className={`text-lg font-bold ${getQualityColor(post.seo_quality_score)}`}>
                                                    {post.seo_quality_score}
                                                </div>
                                            </div>
                                        )}
                                        <Badge
                                            variant="outline"
                                            className={`${getStatusColor(post.status)} capitalize`}
                                        >
                                            {post.status}
                                        </Badge>
                                        {post.status === 'approved' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedPostForSchedule({ id: post.id, topic: post.topic })
                                                    setScheduleDialogOpen(true)
                                                }}
                                                className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
                                            >
                                                <CalendarClock className="w-4 h-4" />
                                                Schedule
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedPostForImages({ id: post.id, topic: post.topic })
                                                setImageDialogOpen(true)
                                            }}
                                            className="flex items-center gap-1"
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                            Images
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Image Generation Dialog */}
            {selectedPostForImages && (
                <ImageGenerationDialog
                    postId={selectedPostForImages.id}
                    postTitle={selectedPostForImages.topic}
                    isOpen={imageDialogOpen}
                    onClose={() => {
                        setImageDialogOpen(false)
                        setSelectedPostForImages(null)
                    }}
                    onImagesGenerated={() => {
                        // Optionally refresh post list
                        fetchBatchDetails()
                    }}
                />
            )}

            {/* Schedule Publish Dialog - PRD feat-105 */}
            {selectedPostForSchedule && (
                <SchedulePublishDialog
                    isOpen={scheduleDialogOpen}
                    onClose={() => {
                        setScheduleDialogOpen(false)
                        setSelectedPostForSchedule(null)
                    }}
                    postId={selectedPostForSchedule.id === 'batch' ? undefined : selectedPostForSchedule.id}
                    postIds={selectedPostForSchedule.id === 'batch' ? posts.filter(p => p.status === 'approved').map(p => p.id) : undefined}
                    postTitle={selectedPostForSchedule.topic}
                    onSuccess={() => {
                        fetchScheduledPosts()
                        fetchBatchDetails()
                    }}
                />
            )}
        </div>
    )
}
