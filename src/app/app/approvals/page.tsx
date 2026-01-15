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
    Send,
    Globe,
    Link2,
    Copy,
    ExternalLink,
    Filter,
    RefreshCw,
    Users,
    ChevronRight,
    Loader2,
    Share2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface BlogPost {
    id: string
    title: string
    seo_description?: string
    approval_status: string
    showcased_at?: string
    showcased_message?: string
    is_public: boolean
    public_token?: string
    client_id?: string
    created_at: string
    clients?: { id: string; name: string }
}

interface Client {
    id: string
    name: string
}

export default function VendorApprovalsPage() {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')
    const [showcasePost, setShowcasePost] = useState<BlogPost | null>(null)
    const [selectedClient, setSelectedClient] = useState<string>('')
    const [showcaseMessage, setShowcaseMessage] = useState('')
    const [showcaseLoading, setShowcaseLoading] = useState(false)
    const [publicLinkPost, setPublicLinkPost] = useState<BlogPost | null>(null)
    const [publicLinkLoading, setPublicLinkLoading] = useState(false)

    useEffect(() => {
        fetchData()
    }, [filter])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch posts with approval info
            const params = new URLSearchParams()
            if (filter !== 'all') {
                params.set('approval_status', filter)
            }
            
            const [postsRes, clientsRes] = await Promise.all([
                fetch(`/api/blog-posts?${params}&include_approval=true`),
                fetch('/api/clients')
            ])
            
            const postsData = await postsRes.json()
            const clientsData = await clientsRes.json()
            
            if (postsData.success) {
                setPosts(postsData.posts || [])
            }
            if (clientsData.success) {
                setClients(clientsData.clients || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleShowcase = async () => {
        if (!showcasePost || !selectedClient) return
        
        setShowcaseLoading(true)
        try {
            const res = await fetch(`/api/blog-posts/${showcasePost.id}/showcase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: selectedClient,
                    message: showcaseMessage
                })
            })
            const data = await res.json()
            
            if (data.success) {
                setShowcasePost(null)
                setSelectedClient('')
                setShowcaseMessage('')
                fetchData()
            } else {
                alert(data.error || 'Failed to showcase content')
            }
        } catch (error) {
            console.error('Showcase error:', error)
            alert('Failed to showcase content')
        } finally {
            setShowcaseLoading(false)
        }
    }

    const handleMakePublic = async (post: BlogPost) => {
        setPublicLinkLoading(true)
        try {
            const res = await fetch(`/api/blog-posts/${post.id}/make-public`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            })
            const data = await res.json()
            
            if (data.success) {
                setPublicLinkPost({ ...post, public_token: data.public_token, is_public: true })
                fetchData()
            } else {
                alert(data.error || 'Failed to generate public link')
            }
        } catch (error) {
            console.error('Make public error:', error)
            alert('Failed to generate public link')
        } finally {
            setPublicLinkLoading(false)
        }
    }

    const handleMakePrivate = async (postId: string) => {
        try {
            const res = await fetch(`/api/blog-posts/${postId}/make-public`, {
                method: 'DELETE'
            })
            const data = await res.json()
            
            if (data.success) {
                setPublicLinkPost(null)
                fetchData()
            } else {
                alert(data.error || 'Failed to revoke public link')
            }
        } catch (error) {
            console.error('Make private error:', error)
        }
    }

    const copyPublicLink = (token: string) => {
        const url = `${window.location.origin}/shared/post/${token}`
        navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <Badge variant="outline" className="text-slate-600">Draft</Badge>
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
                return <FileText className="w-5 h-5 text-slate-500" />
        }
    }

    const statusCounts = {
        draft: posts.filter(p => p.approval_status === 'draft').length,
        pending: posts.filter(p => p.approval_status === 'pending_review').length,
        approved: posts.filter(p => p.approval_status === 'approved').length,
        revisions: posts.filter(p => p.approval_status === 'revision_requested').length,
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Content Approvals</h1>
                    <p className="text-slate-600">Manage client approvals, showcase content, and track status</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="border-0 shadow-md bg-white/80 cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => setFilter('draft')}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Drafts</p>
                                    <p className="text-2xl font-bold text-slate-600">{statusCounts.draft}</p>
                                </div>
                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-slate-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-white/80 cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => setFilter('pending_review')}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Pending Review</p>
                                    <p className="text-2xl font-bold text-amber-600">{statusCounts.pending}</p>
                                </div>
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-white/80 cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => setFilter('approved')}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Approved</p>
                                    <p className="text-2xl font-bold text-emerald-600">{statusCounts.approved}</p>
                                </div>
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-white/80 cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => setFilter('revision_requested')}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Need Revisions</p>
                                    <p className="text-2xl font-bold text-purple-600">{statusCounts.revisions}</p>
                                </div>
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-purple-600" />
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
                                <div className="flex gap-2 flex-wrap">
                                    {[
                                        { value: 'all', label: 'All' },
                                        { value: 'draft', label: 'Draft' },
                                        { value: 'pending_review', label: 'Pending' },
                                        { value: 'revision_requested', label: 'Revisions' },
                                        { value: 'approved', label: 'Approved' },
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
                            <Button variant="outline" size="sm" onClick={fetchData}>
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
                            <p className="text-slate-600">Loading content...</p>
                        </CardContent>
                    </Card>
                ) : posts.length === 0 ? (
                    <Card className="border-0 shadow-md bg-white/80">
                        <CardContent className="p-8 text-center">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">No content found</h3>
                            <p className="text-slate-500 mb-4">
                                {filter !== 'all' 
                                    ? 'No content matches your filter.'
                                    : 'Create your first blog post to get started.'}
                            </p>
                            <Link href="/app/posts/new">
                                <Button className="bg-indigo-600">Create New Post</Button>
                            </Link>
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
                                                    {post.is_public && (
                                                        <Badge variant="outline" className="text-green-600 border-green-300">
                                                            <Globe className="w-3 h-3 mr-1" />
                                                            Public
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500 line-clamp-1">
                                                    {post.seo_description || 'No description'}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                                    {post.clients?.name && (
                                                        <>
                                                            <span className="flex items-center gap-1">
                                                                <Users className="w-3 h-3" />
                                                                {post.clients.name}
                                                            </span>
                                                            <span>•</span>
                                                        </>
                                                    )}
                                                    <span>Created {new Date(post.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Showcase Button - for drafts or revision-needed posts */}
                                            {['draft', 'revision_requested'].includes(post.approval_status) && (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => setShowcasePost(post)}
                                                            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                                        >
                                                            <Send className="w-4 h-4 mr-1" />
                                                            Showcase
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Showcase to Client</DialogTitle>
                                                            <DialogDescription>
                                                                Send this content to a client for approval
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4 mt-4">
                                                            <div>
                                                                <label className="text-sm font-medium text-slate-700">Select Client</label>
                                                                <Select value={selectedClient} onValueChange={setSelectedClient}>
                                                                    <SelectTrigger className="mt-1">
                                                                        <SelectValue placeholder="Choose a client" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {clients.map(client => (
                                                                            <SelectItem key={client.id} value={client.id}>
                                                                                {client.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium text-slate-700">Message (optional)</label>
                                                                <Textarea
                                                                    placeholder="Add a note for the client..."
                                                                    value={showcaseMessage}
                                                                    onChange={(e) => setShowcaseMessage(e.target.value)}
                                                                    className="mt-1"
                                                                    rows={3}
                                                                />
                                                            </div>
                                                            <Button 
                                                                className="w-full bg-indigo-600"
                                                                onClick={handleShowcase}
                                                                disabled={!selectedClient || showcaseLoading}
                                                            >
                                                                {showcaseLoading ? (
                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                ) : (
                                                                    <Send className="w-4 h-4 mr-2" />
                                                                )}
                                                                Send for Approval
                                                            </Button>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            )}

                                            {/* Public Link Button */}
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => setPublicLinkPost(post)}
                                                    >
                                                        <Link2 className="w-4 h-4 mr-1" />
                                                        {post.is_public ? 'Link' : 'Share'}
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Public Sharing</DialogTitle>
                                                        <DialogDescription>
                                                            {post.is_public 
                                                                ? 'This content is publicly accessible'
                                                                : 'Make this content publicly accessible'}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 mt-4">
                                                        {post.is_public && post.public_token ? (
                                                            <>
                                                                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                                                                    <input 
                                                                        type="text" 
                                                                        readOnly 
                                                                        value={`${window.location.origin}/shared/post/${post.public_token}`}
                                                                        className="flex-1 bg-transparent text-sm text-slate-600 outline-none"
                                                                    />
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="outline"
                                                                        onClick={() => copyPublicLink(post.public_token!)}
                                                                    >
                                                                        <Copy className="w-4 h-4" />
                                                                    </Button>
                                                                    <a 
                                                                        href={`/shared/post/${post.public_token}`} 
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        <Button size="sm" variant="outline">
                                                                            <ExternalLink className="w-4 h-4" />
                                                                        </Button>
                                                                    </a>
                                                                </div>
                                                                <Button 
                                                                    variant="outline" 
                                                                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                                                                    onClick={() => handleMakePrivate(post.id)}
                                                                >
                                                                    Revoke Public Access
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button 
                                                                className="w-full bg-indigo-600"
                                                                onClick={() => handleMakePublic(post)}
                                                                disabled={publicLinkLoading}
                                                            >
                                                                {publicLinkLoading ? (
                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                ) : (
                                                                    <Globe className="w-4 h-4 mr-2" />
                                                                )}
                                                                Generate Public Link
                                                            </Button>
                                                        )}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>

                                            {/* View Button */}
                                            <Link href={`/app/posts/${post.id}`}>
                                                <Button size="sm" className="bg-indigo-600">
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
