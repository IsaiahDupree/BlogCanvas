'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, Pause, CheckCircle2, AlertCircle, Loader2, TrendingUp, FileText, Upload, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function BatchDetailPage() {
    const params = useParams()
    const [batch, setBatch] = useState<any>(null)
    const [progress, setProgress] = useState<any>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [generating, setGenerating] = useState(false)
    const [loading, setLoading] = useState(true)
    const [importing, setImporting] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)

    useEffect(() => {
        fetchBatchDetails()
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
                                        <div className="text-sm text-muted-foreground">
                                            {post.target_keyword && `Keyword: ${post.target_keyword}`}
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
