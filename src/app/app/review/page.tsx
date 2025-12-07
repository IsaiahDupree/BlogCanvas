'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Filter, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Post {
    id: string
    topic: string
    status: 'planned' | 'generating' | 'draft' | 'in_review' | 'approved' | 'published' | 'failed'
    seo_quality_score: number | null
    target_keyword: string | null
    content_batch_id: string
}

interface KanbanColumn {
    id: string
    title: string
    status: string[]
    color: string
}

const COLUMNS: KanbanColumn[] = [
    { id: 'draft', title: 'Draft', status: ['draft', 'generating', 'idea', 'researching', 'outlining', 'drafting'], color: 'bg-gray-100' },
    { id: 'editing', title: 'Editing', status: ['editing', 'needs_human_input'], color: 'bg-yellow-100' },
    { id: 'review', title: 'In Review', status: ['ready_for_review', 'in_review'], color: 'bg-blue-100' },
    { id: 'client', title: 'Client Review', status: ['client_review'], color: 'bg-orange-100' },
    { id: 'approved', title: 'Approved', status: ['approved'], color: 'bg-green-100' },
    { id: 'published', title: 'Published', status: ['published', 'scheduled'], color: 'bg-purple-100' }
]

export default function ReviewBoardPage() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [draggedPost, setDraggedPost] = useState<string | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

    useEffect(() => {
        fetchPosts()
    }, [])

    const fetchPosts = async () => {
        try {
            // Fetch all posts across batches
            const response = await fetch('/api/blog-posts')
            const data = await response.json()
            if (data.success) {
                setPosts(data.posts || [])
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error)
        } finally {
            setLoading(false)
        }
    }

    const updatePostStatus = async (postId: string, newStatus: string) => {
        try {
            await fetch(`/api/blog-posts/${postId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            // Update local state
            setPosts(posts.map(p =>
                p.id === postId ? { ...p, status: newStatus as any } : p
            ))
        } catch (error) {
            console.error('Failed to update status:', error)
        }
    }

    const handleDragStart = (e: React.DragEvent, postId: string) => {
        setDraggedPost(postId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverColumn(columnId)
    }

    const handleDragLeave = () => {
        setDragOverColumn(null)
    }

    const handleDrop = async (e: React.DragEvent, columnId: string) => {
        e.preventDefault()
        setDragOverColumn(null)

        if (!draggedPost) return

        const column = COLUMNS.find(c => c.id === columnId)
        if (!column) return

        // Get the first status for the column (or map to appropriate status)
        const newStatus = mapColumnToStatus(columnId)
        
        await updatePostStatus(draggedPost, newStatus)
        setDraggedPost(null)
    }

    const mapColumnToStatus = (columnId: string): string => {
        switch (columnId) {
            case 'draft': return 'draft'
            case 'editing': return 'editing'
            case 'review': return 'ready_for_review'
            case 'client': return 'client_review'
            case 'approved': return 'approved'
            case 'published': return 'published'
            default: return 'draft'
        }
    }

    const getPostsByStatus = (statuses: string[]) => {
        return posts.filter(post => statuses.includes(post.status))
            .filter(post => filter ? post.topic.toLowerCase().includes(filter.toLowerCase()) : true)
    }

    const getQualityColor = (score: number | null) => {
        if (!score) return 'text-gray-400'
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-[1800px] mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/app" className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                Review Board
                            </h1>
                            <p className="text-muted-foreground">
                                Manage content workflow and approvals
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search posts..."
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600 w-64"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    {COLUMNS.map(column => {
                        const columnPosts = getPostsByStatus(column.status)
                        const isDragOver = dragOverColumn === column.id

                        return (
                            <div key={column.id} className="flex flex-col">
                                {/* Column Header */}
                                <Card className={`${column.color} border-2 mb-4 ${isDragOver ? 'ring-2 ring-indigo-500' : ''}`}>
                                    <CardHeader className="p-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">{column.title}</CardTitle>
                                            <Badge variant="secondary">{columnPosts.length}</Badge>
                                        </div>
                                    </CardHeader>
                                </Card>

                                {/* Column Posts */}
                                <div
                                    className={`space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[200px] p-2 rounded-lg transition-colors ${
                                        isDragOver ? 'bg-indigo-50 border-2 border-dashed border-indigo-300' : ''
                                    }`}
                                    onDragOver={(e) => handleDragOver(e, column.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, column.id)}
                                >
                                    {columnPosts.map(post => (
                                        <Card
                                            key={post.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, post.id)}
                                            className={`hover:shadow-lg transition-shadow cursor-move group ${
                                                draggedPost === post.id ? 'opacity-50' : ''
                                            }`}
                                        >
                                            <CardContent className="p-4">
                                                <div className="space-y-3">
                                                    {/* Topic */}
                                                    <div>
                                                        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                                                            {post.topic}
                                                        </h3>
                                                        {post.target_keyword && (
                                                            <p className="text-xs text-muted-foreground">
                                                                🎯 {post.target_keyword}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Quality Score */}
                                                    {post.seo_quality_score && (
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-muted-foreground">Quality</span>
                                                            <span className={`font-bold ${getQualityColor(post.seo_quality_score)}`}>
                                                                {post.seo_quality_score}/100
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2 pt-2 border-t">
                                                        {post.status === 'draft' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="w-full text-xs"
                                                                onClick={() => updatePostStatus(post.id, 'in_review')}
                                                            >
                                                                → Review
                                                            </Button>
                                                        )}
                                                        {post.status === 'in_review' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="flex-1 text-xs"
                                                                    onClick={() => updatePostStatus(post.id, 'draft')}
                                                                >
                                                                    ← Revise
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="flex-1 text-xs bg-green-600 text-white"
                                                                    onClick={() => updatePostStatus(post.id, 'approved')}
                                                                >
                                                                    ✓ Approve
                                                                </Button>
                                                            </>
                                                        )}
                                                        {post.status === 'approved' && (
                                                            <Link href={`/app/posts/${post.id}/publish`} className="w-full">
                                                                <Button
                                                                    size="sm"
                                                                    className="w-full text-xs bg-purple-600 text-white"
                                                                >
                                                                    📤 Publish
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {post.status === 'published' && (
                                                            <Badge className="w-full justify-center bg-purple-600 text-white">
                                                                ✓ Live
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    {columnPosts.length === 0 && (
                                        <div className="text-center text-sm text-muted-foreground py-8">
                                            No posts in {column.title.toLowerCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
