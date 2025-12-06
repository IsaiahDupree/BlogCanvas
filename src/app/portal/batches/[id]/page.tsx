'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, XCircle, MessageCircle, Download, TrendingUp, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Post {
    id: string
    topic: string
    content: string
    status: string
    seo_quality_score: number | null
    target_keyword: string | null
    word_count_goal: number | null
}

export default function ClientPortalPage() {
    const params = useParams()
    const [batch, setBatch] = useState<any>(null)
    const [posts, setPosts] = useState<Post[]>([])
    const [selectedPost, setSelectedPost] = useState<Post | null>(null)
    const [comment, setComment] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBatch()
    }, [params.id])

    const fetchBatch = async () => {
        try {
            const response = await fetch(`/api/content-batches/${params.id}/posts`)
            const data = await response.json()
            if (data.success) {
                setBatch(data.batch)
                // Only show posts ready for client review
                const reviewPosts = data.posts.filter((p: Post) =>
                    ['approved', 'client_review', 'client_approved', 'client_rejected'].includes(p.status)
                )
                setPosts(reviewPosts)
                if (reviewPosts.length > 0 && !selectedPost) {
                    setSelectedPost(reviewPosts[0])
                }
            }
        } catch (error) {
            console.error('Failed to fetch batch:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (postId: string) => {
        try {
            await fetch(`/api/blog-posts/${postId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'client_approved' })
            })

            // Update local state
            setPosts(posts.map(p =>
                p.id === postId ? { ...p, status: 'client_approved' } : p
            ))

            if (selectedPost?.id === postId) {
                setSelectedPost({ ...selectedPost, status: 'client_approved' })
            }
        } catch (error) {
            console.error('Failed to approve:', error)
        }
    }

    const handleReject = async (postId: string) => {
        if (!comment.trim()) {
            alert('Please provide feedback before rejecting')
            return
        }

        try {
            await fetch(`/api/blog-posts/${postId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'client_rejected',
                    feedback: comment
                })
            })

            setPosts(posts.map(p =>
                p.id === postId ? { ...p, status: 'client_rejected' } : p
            ))

            if (selectedPost?.id === postId) {
                setSelectedPost({ ...selectedPost, status: 'client_rejected' })
            }

            setComment('')
        } catch (error) {
            console.error('Failed to reject:', error)
        }
    }

    const handleApproveAll = async () => {
        const pendingPosts = posts.filter(p => p.status === 'approved')

        for (const post of pendingPosts) {
            await handleApprove(post.id)
        }

        alert(`Approved ${pendingPosts.length} posts!`)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'client_approved':
                return <Badge className="bg-green-100 text-green-700">✓ Approved</Badge>
            case 'client_rejected':
                return <Badge className="bg-red-100 text-red-700">✗ Needs Revision</Badge>
            default:
                return <Badge className="bg-blue-100 text-blue-700">Pending Review</Badge>
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your content...</p>
                </div>
            </div>
        )
    }

    const pendingCount = posts.filter(p => p.status === 'approved').length
    const approvedCount = posts.filter(p => p.status === 'client_approved').length
    const rejectedCount = posts.filter(p => p.status === 'client_rejected').length

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Content Review Portal
                            </h1>
                            <p className="text-gray-600">
                                {batch?.name || 'Content Batch'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {pendingCount > 0 && (
                                <Button
                                    onClick={handleApproveAll}
                                    className="bg-green-600 text-white"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Approve All ({pendingCount})
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Banner */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
                            <div className="text-sm text-gray-600">Total Posts</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                            <div className="text-sm text-gray-600">Approved</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
                            <div className="text-sm text-gray-600">Pending Review</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-3 gap-6">
                    {/* Post List */}
                    <div className="col-span-1 space-y-3">
                        <h2 className="text-lg font-semibold mb-4">Posts for Review</h2>
                        {posts.map(post => (
                            <Card
                                key={post.id}
                                className={`cursor-pointer transition-all ${selectedPost?.id === post.id
                                        ? 'ring-2 ring-indigo-600 shadow-lg'
                                        : 'hover:shadow-md'
                                    }`}
                                onClick={() => setSelectedPost(post)}
                            >
                                <CardContent className="p-4">
                                    <div className="space-y-2">
                                        <div className="font-medium text-sm line-clamp-2">
                                            {post.topic}
                                        </div>
                                        {getStatusBadge(post.status)}
                                        {post.seo_quality_score && (
                                            <div className="text-xs text-gray-600">
                                                Quality: {post.seo_quality_score}/100
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Post Preview */}
                    <div className="col-span-2">
                        {selectedPost ? (
                            <Card className="h-full">
                                <CardHeader className="border-b">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-2xl mb-2">
                                                {selectedPost.topic}
                                            </CardTitle>
                                            {selectedPost.target_keyword && (
                                                <p className="text-sm text-gray-600">
                                                    🎯 Target: {selectedPost.target_keyword}
                                                </p>
                                            )}
                                        </div>
                                        {getStatusBadge(selectedPost.status)}
                                    </div>
                                </CardHeader>

                                <CardContent className="p-6">
                                    {/* Content Preview */}
                                    <div className="prose max-w-none mb-6">
                                        {selectedPost.content ? (
                                            <div
                                                className="text-gray-700"
                                                dangerouslySetInnerHTML={{
                                                    __html: selectedPost.content.substring(0, 1000) + '...'
                                                }}
                                            />
                                        ) : (
                                            <p className="text-gray-500 italic">Content preview not available</p>
                                        )}
                                    </div>

                                    {/* Feedback Section */}
                                    {selectedPost.status !== 'client_approved' && (
                                        <div className="border-t pt-6">
                                            <h3 className="text-lg font-semibold mb-3">Your Feedback</h3>
                                            <textarea
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Add any comments or requested changes..."
                                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-600 mb-4"
                                                rows={4}
                                            />

                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={() => handleApprove(selectedPost.id)}
                                                    className="flex-1 bg-green-600 text-white hover:bg-green-700"
                                                    disabled={selectedPost.status === 'client_approved'}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Approve Post
                                                </Button>
                                                <Button
                                                    onClick={() => handleReject(selectedPost.id)}
                                                    variant="outline"
                                                    className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                                                    disabled={selectedPost.status === 'client_rejected'}
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Request Revision
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {selectedPost.status === 'client_approved' && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                                            <p className="text-green-800 font-semibold">Post Approved!</p>
                                            <p className="text-green-700 text-sm">
                                                This post will be published to your website
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="h-full flex items-center justify-center">
                                <CardContent className="text-center py-12">
                                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600">Select a post to review</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
