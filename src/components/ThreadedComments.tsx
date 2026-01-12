'use client'

import { useState } from 'react'
import { MessageSquare, Reply, CheckCircle, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface Comment {
    id: string
    blog_post_id: string
    parent_comment_id: string | null
    author_id: string
    author_name: string
    author_role: string
    content: string
    mentioned_user_ids: string[]
    is_resolved: boolean
    resolved_by: string | null
    resolved_by_name: string | null
    resolved_at: string | null
    created_at: string
    updated_at: string
    reply_count: number
    replies: Comment[]
}

interface ThreadedCommentsProps {
    postId: string
    onRefresh?: () => void
}

function CommentItem({
    comment,
    postId,
    depth = 0,
    onReply,
    onResolve,
}: {
    comment: Comment
    postId: string
    depth?: number
    onReply: (commentId: string) => void
    onResolve: (commentId: string, resolved: boolean) => void
}) {
    const [showReplies, setShowReplies] = useState(true)
    const maxDepth = 5 // Maximum nesting level

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    return (
        <div
            className={`${depth > 0 ? 'ml-6 mt-3' : ''} ${
                comment.is_resolved ? 'opacity-60' : ''
            }`}
        >
            <div className="flex gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{comment.author_name}</span>
                        <Badge variant="outline" className="text-xs">
                            {comment.author_role}
                        </Badge>
                        {comment.is_resolved && (
                            <Badge className="bg-green-100 text-green-700 text-xs flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Resolved
                            </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                            {formatTime(comment.created_at)}
                        </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                        {comment.content}
                    </p>

                    <div className="flex items-center gap-3 text-xs">
                        {depth < maxDepth && (
                            <button
                                onClick={() => onReply(comment.id)}
                                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                                <Reply className="w-3 h-3" />
                                Reply
                            </button>
                        )}

                        <button
                            onClick={() => onResolve(comment.id, !comment.is_resolved)}
                            className={`flex items-center gap-1 ${
                                comment.is_resolved
                                    ? 'text-gray-600 hover:text-gray-700'
                                    : 'text-green-600 hover:text-green-700'
                            }`}
                        >
                            {comment.is_resolved ? (
                                <>
                                    <RotateCcw className="w-3 h-3" />
                                    Reopen
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-3 h-3" />
                                    Resolve
                                </>
                            )}
                        </button>

                        {comment.replies.length > 0 && (
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="text-gray-600 hover:text-gray-700"
                            >
                                {showReplies ? 'Hide' : 'Show'} {comment.replies.length}{' '}
                                {comment.replies.length === 1 ? 'reply' : 'replies'}
                            </button>
                        )}
                    </div>

                    {comment.is_resolved && comment.resolved_by_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Resolved by {comment.resolved_by_name}{' '}
                            {comment.resolved_at && formatTime(comment.resolved_at)}
                        </p>
                    )}
                </div>
            </div>

            {/* Render replies */}
            {showReplies && comment.replies.length > 0 && (
                <div className="mt-2 border-l-2 border-gray-200 pl-2">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            postId={postId}
                            depth={depth + 1}
                            onReply={onReply}
                            onResolve={onResolve}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default function ThreadedComments({ postId, onRefresh }: ThreadedCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [replyToId, setReplyToId] = useState<string | null>(null)
    const [replyContent, setReplyContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch comments on mount
    useState(() => {
        fetchComments()
    })

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/portal/posts/${postId}/comments`)
            const data = await res.json()
            if (data.success) {
                setComments(data.comments)
            }
        } catch (err) {
            console.error('Error fetching comments:', err)
        }
    }

    const handleAddComment = async () => {
        if (!newComment.trim()) return

        setLoading(true)
        setError(null)

        try {
            const res = await fetch(`/api/portal/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            })

            const data = await res.json()

            if (data.success) {
                setNewComment('')
                await fetchComments()
                onRefresh?.()
            } else {
                setError(data.error || 'Failed to add comment')
            }
        } catch (err) {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleReply = (commentId: string) => {
        setReplyToId(commentId)
        setReplyContent('')
    }

    const handleAddReply = async () => {
        if (!replyContent.trim() || !replyToId) return

        setLoading(true)
        setError(null)

        try {
            const res = await fetch(`/api/portal/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: replyContent,
                    parent_comment_id: replyToId,
                }),
            })

            const data = await res.json()

            if (data.success) {
                setReplyToId(null)
                setReplyContent('')
                await fetchComments()
                onRefresh?.()
            } else {
                setError(data.error || 'Failed to add reply')
            }
        } catch (err) {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleResolve = async (commentId: string, resolved: boolean) => {
        try {
            const res = await fetch(
                `/api/portal/posts/${postId}/comments?commentId=${commentId}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_resolved: resolved }),
                }
            )

            const data = await res.json()

            if (data.success) {
                await fetchComments()
                onRefresh?.()
            }
        } catch (err) {
            console.error('Error resolving comment:', err)
        }
    }

    return (
        <Card className="p-6 bg-white shadow-lg">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments ({comments.length})
            </h3>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-4 mb-4">
                {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No comments yet. Be the first to comment!
                    </p>
                ) : (
                    comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            postId={postId}
                            onReply={handleReply}
                            onResolve={handleResolve}
                        />
                    ))
                )}
            </div>

            {/* Reply Form */}
            {replyToId && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">
                            Replying to comment
                        </span>
                        <button
                            onClick={() => setReplyToId(null)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                        >
                            Cancel
                        </button>
                    </div>
                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write your reply... (use @username to mention)"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none mb-2"
                    />
                    <button
                        onClick={handleAddReply}
                        disabled={loading || !replyContent.trim()}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Adding...' : 'Add Reply'}
                    </button>
                </div>
            )}

            {/* New Comment Form */}
            <div>
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment... (use @username to mention)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none mb-2"
                />
                <button
                    onClick={handleAddComment}
                    disabled={loading || !newComment.trim()}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Adding...' : 'Add Comment'}
                </button>
            </div>
        </Card>
    )
}
