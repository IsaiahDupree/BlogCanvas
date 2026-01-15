'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, TrendingUp, Clock, CheckCircle, Settings, Plus, Globe, Loader2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Client {
    id: string
    name: string
    slug?: string
    website_url?: string
    status: string
    industry?: string
    brand_guides?: Array<{
        product_service_summary?: string
        target_audience?: string
        positioning?: string
        tone_profile?: {
            formality?: number
            playfulness?: number
        }
    }>
    wordpress_sites?: Array<{
        id: string
        site_url: string
        status: string
    }>
}

interface BlogPost {
    id: string
    title: string
    status: string
    updated_at: string
}

interface Stats {
    postsThisMonth: number
    totalPosts: number
    inReview: number
    approved: number
    published: number
    avgApprovalTime: string
}

export default function ClientOverviewPage({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = use(params)
    const [client, setClient] = useState<Client | null>(null)
    const [recentPosts, setRecentPosts] = useState<BlogPost[]>([])
    const [stats, setStats] = useState<Stats>({
        postsThisMonth: 0,
        totalPosts: 0,
        inReview: 0,
        approved: 0,
        published: 0,
        avgApprovalTime: 'N/A'
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchClientData()
    }, [clientId])

    const fetchClientData = async () => {
        setLoading(true)
        setError(null)
        try {
            // Fetch client by ID or slug
            const res = await fetch(`/api/clients/${clientId}`)
            const data = await res.json()

            if (!data.success || !data.client) {
                setError('Client not found')
                setLoading(false)
                return
            }

            setClient(data.client)

            // Fetch recent posts for this client
            const postsRes = await fetch(`/api/blog-posts?client_id=${data.client.id}&limit=5`)
            const postsData = await postsRes.json()
            if (postsData.success) {
                setRecentPosts(postsData.posts || [])
                
                // Calculate stats from posts
                const posts = postsData.posts || []
                const now = new Date()
                const thisMonth = posts.filter((p: any) => {
                    const created = new Date(p.created_at)
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                })
                
                setStats({
                    postsThisMonth: thisMonth.length,
                    totalPosts: posts.length,
                    inReview: posts.filter((p: any) => p.approval_status === 'pending_review').length,
                    approved: posts.filter((p: any) => p.approval_status === 'approved').length,
                    published: posts.filter((p: any) => p.approval_status === 'published' || p.status === 'published').length,
                    avgApprovalTime: '2.1 days'
                })
            }
        } catch (err: any) {
            console.error('Error fetching client:', err)
            setError(err.message || 'Failed to load client')
        } finally {
            setLoading(false)
        }
    }

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffHours / 24)
        
        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        return 'Just now'
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 text-indigo-600 animate-spin" />
                    <p className="text-slate-600">Loading client...</p>
                </div>
            </div>
        )
    }

    if (error || !client) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full p-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Client Not Found</h2>
                    <p className="text-slate-600 mb-6">{error || 'The requested client could not be found.'}</p>
                    <Link href="/app/clients">
                        <Button>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Clients
                        </Button>
                    </Link>
                </Card>
            </div>
        )
    }

    const brandGuide = client.brand_guides?.[0]
    const wpSite = client.wordpress_sites?.[0]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <Link href="/app/clients" className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900 mb-2">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Clients
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                    {client.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Globe className="w-4 h-4" />
                                <span>{client.website_url || 'No website'}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href={`/app/clients/${clientId}/posts/new`}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                New Post
                            </Link>
                            <Link
                                href={`/app/clients/${clientId}/profile`}
                                className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center gap-2"
                            >
                                <Settings className="w-5 h-5" />
                                Settings
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="p-6 bg-white border-2 border-blue-100">
                        <FileText className="w-8 h-8 text-blue-600 mb-3" />
                        <h3 className="text-3xl font-bold text-gray-900">{stats.postsThisMonth}</h3>
                        <p className="text-sm text-muted-foreground">Posts This Month</p>
                    </Card>

                    <Card className="p-6 bg-white border-2 border-yellow-100">
                        <Clock className="w-8 h-8 text-yellow-600 mb-3" />
                        <h3 className="text-3xl font-bold text-gray-900">{stats.inReview}</h3>
                        <p className="text-sm text-muted-foreground">In Review</p>
                    </Card>

                    <Card className="p-6 bg-white border-2 border-green-100">
                        <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                        <h3 className="text-3xl font-bold text-gray-900">{stats.published}</h3>
                        <p className="text-sm text-muted-foreground">Published</p>
                    </Card>

                    <Card className="p-6 bg-white border-2 border-purple-100">
                        <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
                        <h3 className="text-3xl font-bold text-gray-900">{stats.avgApprovalTime}</h3>
                        <p className="text-sm text-muted-foreground">Avg Approval Time</p>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Brand Snapshot */}
                    <div className="lg:col-span-2">
                        <Card className="p-6 bg-white shadow-xl mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Brand Snapshot</h2>
                                <Link
                                    href={`/app/clients/${clientId}/profile`}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Edit Profile →
                                </Link>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Product/Service</p>
                                    <p className="text-gray-900">{brandGuide?.product_service_summary || 'Not set'}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Target Audience</p>
                                    <p className="text-gray-900">{brandGuide?.target_audience || 'Not set'}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Positioning</p>
                                    <p className="text-gray-900">{brandGuide?.positioning || 'Not set'}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-3">Tone of Voice</p>
                                    <div className="space-y-2">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>Casual</span>
                                                <span>Formal</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600" style={{ width: `${(brandGuide?.tone_profile?.formality || 5) * 10}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>Playful</span>
                                                <span>Serious</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600" style={{ width: `${(10 - (brandGuide?.tone_profile?.playfulness || 5)) * 10}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Recent Posts */}
                        <Card className="p-6 bg-white shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Recent Posts</h2>
                                <Link
                                    href={`/app/clients/${clientId}/posts`}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    View All →
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {recentPosts.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">No posts yet</p>
                                ) : recentPosts.map((post) => (
                                    <Link key={post.id} href={`/app/posts/${post.id}`}>
                                        <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900">{post.title}</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">{formatTimeAgo(post.updated_at)}</p>
                                                </div>
                                                <Badge variant={
                                                    post.status === 'published' ? 'default' :
                                                        post.status === 'ready_for_review' ? 'outline' :
                                                            'secondary'
                                                }>
                                                    {post.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar - Quick Actions & CMS */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <Card className="p-6 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl">
                            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link
                                    href={`/app/clients/${clientId}/posts/new`}
                                    className="block w-full px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors text-center"
                                >
                                    Create New Post
                                </Link>
                                <Link
                                    href={`/app/clients/${clientId}/posts`}
                                    className="block w-full px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors text-center"
                                >
                                    View All Posts
                                </Link>
                                <Link
                                    href={`/app/clients/${clientId}/profile`}
                                    className="block w-full px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors text-center"
                                >
                                    Edit Brand Profile
                                </Link>
                            </div>
                        </Card>

                        {/* CMS Connection */}
                        <Card className="p-6 bg-white shadow-xl">
                            <h3 className="text-lg font-bold mb-4">CMS Connection</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Type</span>
                                    <span className="font-medium capitalize">{wpSite ? 'WordPress' : 'Not set'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">URL</span>
                                    <span className="font-medium text-sm">{wpSite?.site_url || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <Badge className={
                                        wpSite?.status === 'active' ? 'bg-green-100 text-green-700' :
                                            'bg-gray-100 text-gray-700'
                                    }>
                                        {wpSite?.status === 'active' ? '✓ Connected' : 'Not Connected'}
                                    </Badge>
                                </div>
                                <Link
                                    href={`/app/clients/${client.id}/settings`}
                                    className="block w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors text-center mt-4"
                                >
                                    Manage CMS
                                </Link>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
