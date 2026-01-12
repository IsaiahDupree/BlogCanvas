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
    const [selectedPostIds, setSelectedPostIds] = useState<string[]>([])
    const [comment, setComment] = useState('')
    const [loading, setLoading] = useState(true)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [batchAction, setBatchAction] = useState<'approve' | 'reject' | null>(null)
    const [batchFeedback, setBatchFeedback] = useState('')

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

    const togglePostSelection = (postId: string) => {
        setSelectedPostIds(prev =>
            prev.includes(postId)
                ? prev.filter(id => id !== postId)
                : [...prev, postId]
        )
    }

    const toggleAllPosts = () => {
        const pendingPosts = posts.filter(p =>
            ['approved', 'client_review'].includes(p.status)
        )
        if (selectedPostIds.length === pendingPosts.length) {
            setSelectedPostIds([])
        } else {
            setSelectedPostIds(pendingPosts.map(p => p.id))
        }
    }

    const handleBatchApprove = () => {
        if (selectedPostIds.length === 0) {
            alert('Please select at least one post')
            return
        }
        setBatchAction('approve')
        setShowConfirmModal(true)
    }

    const handleBatchReject = () => {
        if (selectedPostIds.length === 0) {
            alert('Please select at least one post')
            return
        }
        setBatchAction('reject')
        setShowConfirmModal(true)
    }

    const executeBatchAction = async () => {
        if (!batchAction || selectedPostIds.length === 0) return

        if (batchAction === 'reject' && !batchFeedback.trim()) {
            alert('Please provide feedback for rejection')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/portal/posts/batch-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    post_ids: selectedPostIds,
                    action: batchAction,
                    feedback: batchFeedback
                })
            })

            const data = await response.json()

            if (data.success) {
                // Refresh the batch data
                await fetchBatch()
                setSelectedPostIds([])
                setBatchFeedback('')
                setShowConfirmModal(false)
                alert(`Successfully ${batchAction === 'approve' ? 'approved' : 'rejected'} ${selectedPostIds.length} posts!`)
            } else {
                alert(`Error: ${data.error}`)
            }
        } catch (error) {
            console.error('Batch action error:', error)
            alert('Failed to perform batch action')
        } finally {
            setLoading(false)
        }
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
                            {selectedPostIds.length > 0 && (
                                <>
                                    <Button
                                        onClick={handleBatchApprove}
                                        className="bg-green-600 text-white hover:bg-green-700"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Approve Selected ({selectedPostIds.length})
                                    </Button>
                                    <Button
                                        onClick={handleBatchReject}
                                        variant="outline"
                                        className="border-red-600 text-red-600 hover:bg-red-50"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject Selected ({selectedPostIds.length})
                                    </Button>
                                </>
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
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Posts for Review</h2>
                            {posts.filter(p => ['approved', 'client_review'].includes(p.status)).length > 0 && (
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedPostIds.length === posts.filter(p => ['approved', 'client_review'].includes(p.status)).length && selectedPostIds.length > 0}
                                        onChange={toggleAllPosts}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    Select All
                                </label>
                            )}
                        </div>
                        {posts.map(post => {
                            const canSelect = ['approved', 'client_review'].includes(post.status)
                            const isSelected = selectedPostIds.includes(post.id)

                            return (
                                <Card
                                    key={post.id}
                                    className={`transition-all ${selectedPost?.id === post.id
                                            ? 'ring-2 ring-indigo-600 shadow-lg'
                                            : 'hover:shadow-md'
                                        } ${isSelected ? 'bg-blue-50' : ''}`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex gap-3">
                                            {canSelect && (
                                                <div className="flex items-start pt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            e.stopPropagation()
                                                            togglePostSelection(post.id)
                                                        }}
                                                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                            <div
                                                className="flex-1 space-y-2 cursor-pointer"
                                                onClick={() => setSelectedPost(post)}
                                            >
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
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
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

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">
                            {batchAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                        </h3>

                        <p className="text-gray-600 mb-4">
                            You are about to {batchAction} <strong>{selectedPostIds.length}</strong> post{selectedPostIds.length > 1 ? 's' : ''}.
                        </p>

                        {batchAction === 'reject' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Feedback (Required)
                                </label>
                                <textarea
                                    value={batchFeedback}
                                    onChange={(e) => setBatchFeedback(e.target.value)}
                                    placeholder="Please explain what needs to be changed..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                                    rows={4}
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-yellow-800">
                                <strong>Note:</strong> The vendor will be notified via email about this action.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    setShowConfirmModal(false)
                                    setBatchFeedback('')
                                }}
                                variant="outline"
                                className="flex-1"
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={executeBatchAction}
                                className={`flex-1 ${
                                    batchAction === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                } text-white`}
                                disabled={loading || (batchAction === 'reject' && !batchFeedback.trim())}
                            >
                                {loading ? 'Processing...' : `Confirm ${batchAction === 'approve' ? 'Approval' : 'Rejection'}`}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
