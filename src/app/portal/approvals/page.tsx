'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
    CheckCircle, 
    XCircle, 
    MessageSquare, 
    Clock, 
    Eye,
    FileText,
    AlertCircle,
    ChevronRight,
    Filter,
    RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface BlogPost {
    id: string
    title: string
    seo_description?: string
    approval_status: string
    showcased_at: string
    showcased_message?: string
    created_at: string
    vendors?: { company_name: string }
}

export default function ClientApprovalsPage() {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('pending_review')

    useEffect(() => {
        fetchPendingApprovals()
    }, [filter])

    const fetchPendingApprovals = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filter !== 'all') {
                params.set('approval_status', filter)
            }
            
            const res = await fetch(`/api/portal/approvals?${params}`)
            const data = await res.json()
            
            if (data.success) {
                setPosts(data.posts || [])
            }
        } catch (error) {
            console.error('Error fetching approvals:', error)
        } finally {
            setLoading(false)
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
            case 'published':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Published</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending_review':
                return <Clock className="w-5 h-5 text-amber-600" />
            case 'approved':
                return <CheckCircle className="w-5 h-5 text-emerald-600" />
            case 'revision_requested':
                return <MessageSquare className="w-5 h-5 text-purple-600" />
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-600" />
            default:
                return <FileText className="w-5 h-5 text-gray-600" />
        }
    }

    const pendingCount = posts.filter(p => p.approval_status === 'pending_review').length

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Content Approvals</h1>
                    <p className="text-slate-600">Review and approve content from your vendors</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="border-0 shadow-md bg-white/80">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Pending Review</p>
                                    <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                                </div>
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-white/80">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Approved</p>
                                    <p className="text-2xl font-bold text-emerald-600">
                                        {posts.filter(p => p.approval_status === 'approved').length}
                                    </p>
                                </div>
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-white/80">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Revisions</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {posts.filter(p => p.approval_status === 'revision_requested').length}
                                    </p>
                                </div>
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-white/80">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Total</p>
                                    <p className="text-2xl font-bold text-slate-700">{posts.length}</p>
                                </div>
                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-slate-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="border-0 shadow-md bg-white/80 mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-slate-500" />
                                <span className="text-sm text-slate-600 mr-4">Filter:</span>
                                <div className="flex gap-2">
                                    {[
                                        { value: 'pending_review', label: 'Pending' },
                                        { value: 'revision_requested', label: 'Revisions' },
                                        { value: 'approved', label: 'Approved' },
                                        { value: 'all', label: 'All' }
                                    ].map(opt => (
                                        <Button
                                            key={opt.value}
                                            variant={filter === opt.value ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilter(opt.value)}
                                            className={filter === opt.value ? 'bg-indigo-600' : ''}
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchPendingApprovals}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Content List */}
                {loading ? (
                    <Card className="border-0 shadow-md bg-white/80">
                        <CardContent className="p-8 text-center">
                            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-indigo-600 animate-spin" />
                            <p className="text-slate-600">Loading approvals...</p>
                        </CardContent>
                    </Card>
                ) : posts.length === 0 ? (
                    <Card className="border-0 shadow-md bg-white/80">
                        <CardContent className="p-8 text-center">
                            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">All caught up!</h3>
                            <p className="text-slate-500">
                                {filter === 'pending_review' 
                                    ? 'No content pending your review.'
                                    : 'No content matches your filter.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <Card key={post.id} className="border-0 shadow-md bg-white/80 hover:shadow-lg transition-shadow">
                                <CardContent className="p-0">
                                    <div className="flex items-center justify-between p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                                {getStatusIcon(post.approval_status)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-semibold text-slate-800">{post.title}</h3>
                                                    {getStatusBadge(post.approval_status)}
                                                </div>
                                                <p className="text-sm text-slate-500 line-clamp-1">
                                                    {post.seo_description || 'No description'}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                                    <span>From: {post.vendors?.company_name || 'Unknown'}</span>
                                                    <span>•</span>
                                                    <span>Showcased: {new Date(post.showcased_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link href={`/portal/approvals/${post.id}`}>
                                                <Button className="bg-indigo-600 hover:bg-indigo-700">
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Review
                                                    <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                    {post.showcased_message && (
                                        <div className="px-5 pb-4">
                                            <div className="bg-indigo-50 rounded-lg p-3 text-sm">
                                                <span className="font-medium text-indigo-700">Vendor note: </span>
                                                <span className="text-indigo-600">{post.showcased_message}</span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
