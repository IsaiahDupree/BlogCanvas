'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
    CheckCircle, 
    XCircle, 
    MessageSquare, 
    Clock, 
    ArrowLeft,
    FileText,
    AlertCircle,
    Send,
    Loader2,
    User,
    Calendar,
    Globe
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface BlogPost {
    id: string
    title: string
    content: string
    seo_title?: string
    seo_description?: string
    featured_image_url?: string
    approval_status: string
    showcased_at: string
    showcased_message?: string
    created_at: string
    updated_at: string
    vendors?: { id: string; company_name: string }
    revision_requests?: Array<{
        id: string
        comment: string
        status: string
        created_at: string
    }>
}

export default function ClientApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [post, setPost] = useState<BlogPost | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [showRevisionForm, setShowRevisionForm] = useState(false)
    const [showRejectForm, setShowRejectForm] = useState(false)
    const [revisionComment, setRevisionComment] = useState('')
    const [rejectReason, setRejectReason] = useState('')

    useEffect(() => {
        fetchPost()
    }, [id])

    const fetchPost = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/portal/approvals/${id}`)
            const data = await res.json()
            
            if (data.success) {
                setPost(data.post)
            } else {
                console.error('Error:', data.error)
            }
        } catch (error) {
            console.error('Error fetching post:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        setActionLoading('approve')
        try {
            const res = await fetch(`/api/blog-posts/${id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            })
            const data = await res.json()
            
            if (data.success) {
                setPost(prev => prev ? { ...prev, approval_status: 'approved' } : null)
                router.push('/portal/approvals?success=approved')
            } else {
                alert(data.error || 'Failed to approve')
            }
        } catch (error) {
            console.error('Approve error:', error)
            alert('Failed to approve content')
        } finally {
            setActionLoading(null)
        }
    }

    const handleRequestRevision = async () => {
        if (!revisionComment.trim()) {
            alert('Please provide feedback for the revision request')
            return
        }

        setActionLoading('revision')
        try {
            const res = await fetch(`/api/blog-posts/${id}/request-revision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: revisionComment })
            })
            const data = await res.json()
            
            if (data.success) {
                setPost(prev => prev ? { ...prev, approval_status: 'revision_requested' } : null)
                setShowRevisionForm(false)
                setRevisionComment('')
                router.push('/portal/approvals?success=revision')
            } else {
                alert(data.error || 'Failed to request revision')
            }
        } catch (error) {
            console.error('Revision error:', error)
            alert('Failed to request revision')
        } finally {
            setActionLoading(null)
        }
    }

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert('Please provide a reason for rejection')
            return
        }

        setActionLoading('reject')
        try {
            const res = await fetch(`/api/blog-posts/${id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectReason })
            })
            const data = await res.json()
            
            if (data.success) {
                setPost(prev => prev ? { ...prev, approval_status: 'rejected' } : null)
                setShowRejectForm(false)
                setRejectReason('')
                router.push('/portal/approvals?success=rejected')
            } else {
                alert(data.error || 'Failed to reject')
            }
        } catch (error) {
            console.error('Reject error:', error)
            alert('Failed to reject content')
        } finally {
            setActionLoading(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_review':
                return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending Review</Badge>
            case 'approved':
                return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Approved</Badge>
            case 'revision_requested':
                return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Revision Requested</Badge>
            case 'rejected':
                return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 text-indigo-600 animate-spin" />
                    <p className="text-slate-600">Loading content...</p>
                </div>
            </div>
        )
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="border-0 shadow-md bg-white/80">
                        <CardContent className="p-8 text-center">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">Content not found</h3>
                            <p className="text-slate-500 mb-4">This content may have been removed or you don't have access.</p>
                            <Link href="/portal/approvals">
                                <Button>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Approvals
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    const canTakeAction = post.approval_status === 'pending_review'

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/portal/approvals" className="inline-flex items-center text-slate-600 hover:text-indigo-600 mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Approvals
                    </Link>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-slate-800">{post.title}</h1>
                                {getStatusBadge(post.approval_status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {post.vendors?.company_name || 'Unknown vendor'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Showcased {new Date(post.showcased_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vendor Message */}
                {post.showcased_message && (
                    <Card className="border-0 shadow-md bg-indigo-50 mb-6">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <MessageSquare className="w-5 h-5 text-indigo-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-indigo-800 mb-1">Message from vendor</p>
                                    <p className="text-indigo-700">{post.showcased_message}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Content Preview */}
                    <div className="lg:col-span-2">
                        <Card className="border-0 shadow-md bg-white/80">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-600" />
                                    Content Preview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {post.featured_image_url && (
                                    <img 
                                        src={post.featured_image_url} 
                                        alt={post.title}
                                        className="w-full h-48 object-cover rounded-lg mb-4"
                                    />
                                )}
                                {post.seo_description && (
                                    <p className="text-slate-600 italic mb-4 pb-4 border-b">
                                        {post.seo_description}
                                    </p>
                                )}
                                <div 
                                    className="prose prose-slate max-w-none"
                                    dangerouslySetInnerHTML={{ __html: post.content || '<p>No content</p>' }}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actions Sidebar */}
                    <div className="space-y-6">
                        {/* Action Buttons */}
                        {canTakeAction && (
                            <Card className="border-0 shadow-md bg-white/80">
                                <CardHeader>
                                    <CardTitle>Your Decision</CardTitle>
                                    <CardDescription>Review the content and take action</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button 
                                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                                        onClick={handleApprove}
                                        disabled={actionLoading !== null}
                                    >
                                        {actionLoading === 'approve' ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Approve Content
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                                        onClick={() => setShowRevisionForm(true)}
                                        disabled={actionLoading !== null}
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Request Revision
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        className="w-full border-red-300 text-red-700 hover:bg-red-50"
                                        onClick={() => setShowRejectForm(true)}
                                        disabled={actionLoading !== null}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject Content
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Revision Form */}
                        {showRevisionForm && (
                            <Card className="border-0 shadow-md bg-purple-50 border-purple-200">
                                <CardHeader>
                                    <CardTitle className="text-purple-800">Request Revision</CardTitle>
                                    <CardDescription>Describe what changes you'd like</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Textarea
                                        placeholder="Please describe the changes you'd like to see..."
                                        value={revisionComment}
                                        onChange={(e) => setRevisionComment(e.target.value)}
                                        rows={4}
                                        className="bg-white"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                                            onClick={handleRequestRevision}
                                            disabled={actionLoading !== null}
                                        >
                                            {actionLoading === 'revision' ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4 mr-2" />
                                            )}
                                            Send Request
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowRevisionForm(false)
                                                setRevisionComment('')
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Reject Form */}
                        {showRejectForm && (
                            <Card className="border-0 shadow-md bg-red-50 border-red-200">
                                <CardHeader>
                                    <CardTitle className="text-red-800">Reject Content</CardTitle>
                                    <CardDescription>Please provide a reason</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Textarea
                                        placeholder="Explain why this content is being rejected..."
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        rows={4}
                                        className="bg-white"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1 bg-red-600 hover:bg-red-700"
                                            onClick={handleReject}
                                            disabled={actionLoading !== null}
                                        >
                                            {actionLoading === 'reject' ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <XCircle className="w-4 h-4 mr-2" />
                                            )}
                                            Confirm Rejection
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowRejectForm(false)
                                                setRejectReason('')
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Status Card for already-actioned content */}
                        {!canTakeAction && (
                            <Card className="border-0 shadow-md bg-white/80">
                                <CardContent className="p-6 text-center">
                                    {post.approval_status === 'approved' && (
                                        <>
                                            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                                            <h3 className="font-semibold text-emerald-700">Content Approved</h3>
                                            <p className="text-sm text-slate-500 mt-1">This content has been approved for publishing.</p>
                                        </>
                                    )}
                                    {post.approval_status === 'revision_requested' && (
                                        <>
                                            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-purple-500" />
                                            <h3 className="font-semibold text-purple-700">Revision Requested</h3>
                                            <p className="text-sm text-slate-500 mt-1">Waiting for vendor to make changes.</p>
                                        </>
                                    )}
                                    {post.approval_status === 'rejected' && (
                                        <>
                                            <XCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
                                            <h3 className="font-semibold text-red-700">Content Rejected</h3>
                                            <p className="text-sm text-slate-500 mt-1">This content has been rejected.</p>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Revision History */}
                        {post.revision_requests && post.revision_requests.length > 0 && (
                            <Card className="border-0 shadow-md bg-white/80">
                                <CardHeader>
                                    <CardTitle className="text-sm">Revision History</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {post.revision_requests.map((req) => (
                                        <div key={req.id} className="text-sm p-3 bg-slate-50 rounded-lg">
                                            <p className="text-slate-700">{req.comment}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(req.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
