'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, TrendingUp, Clock, CheckCircle, Settings, Plus, Globe } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ClientOverviewPage({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = use(params)

    // Mock data - would fetch from API
    const client = {
        id: clientId,
        name: 'Acme Software Inc',
        slug: 'acme-software',
        website: 'acme.com',
        status: 'active',

        // Brand snapshot
        product_summary: 'AI-powered CRM platform for sales teams',
        target_audience: 'B2B sales managers and founders',
        positioning: 'Enterprise-grade CRM with AI intelligence',
        tone: { casual_to_formal: 60, playful_to_serious: 70, direct_to_story: 40 },

        // Stats
        stats: {
            postsThisMonth: 8,
            totalPosts: 42,
            inReview: 2,
            approved: 38,
            published: 36,
            avgApprovalTime: '2.1 days'
        },

        // CMS
        cms_status: 'connected',
        cms_type: 'wordpress',
        cms_url: 'https://acme.com'
    }

    const recentPosts = [
        { id: '1', title: 'How AI CRM Transforms Sales', status: 'published', updated: '2 days ago' },
        { id: '2', title: 'Ultimate Guide to Sales Automation', status: 'ready_for_review', updated: '5 hours ago' },
        { id: '3', title: 'Top 10 CRM Features', status: 'approved', updated: '1 day ago' }
    ]

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
                                <span>{client.website}</span>
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
                        <h3 className="text-3xl font-bold text-gray-900">{client.stats.postsThisMonth}</h3>
                        <p className="text-sm text-muted-foreground">Posts This Month</p>
                    </Card>

                    <Card className="p-6 bg-white border-2 border-yellow-100">
                        <Clock className="w-8 h-8 text-yellow-600 mb-3" />
                        <h3 className="text-3xl font-bold text-gray-900">{client.stats.inReview}</h3>
                        <p className="text-sm text-muted-foreground">In Review</p>
                    </Card>

                    <Card className="p-6 bg-white border-2 border-green-100">
                        <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                        <h3 className="text-3xl font-bold text-gray-900">{client.stats.published}</h3>
                        <p className="text-sm text-muted-foreground">Published</p>
                    </Card>

                    <Card className="p-6 bg-white border-2 border-purple-100">
                        <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
                        <h3 className="text-3xl font-bold text-gray-900">{client.stats.avgApprovalTime}</h3>
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
                                    <p className="text-gray-900">{client.product_summary}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Target Audience</p>
                                    <p className="text-gray-900">{client.target_audience}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Positioning</p>
                                    <p className="text-gray-900">{client.positioning}</p>
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
                                                <div className="h-full bg-blue-600" style={{ width: `${client.tone.casual_to_formal}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>Playful</span>
                                                <span>Serious</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600" style={{ width: `${client.tone.playful_to_serious}%` }} />
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
                                {recentPosts.map((post) => (
                                    <Link key={post.id} href={`/app/clients/${clientId}/posts/${post.id}`}>
                                        <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900">{post.title}</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">{post.updated}</p>
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
                                    <span className="font-medium capitalize">{client.cms_type || 'Not set'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">URL</span>
                                    <span className="font-medium text-sm">{client.cms_url || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <Badge className={
                                        client.cms_status === 'connected' ? 'bg-green-100 text-green-700' :
                                            'bg-gray-100 text-gray-700'
                                    }>
                                        {client.cms_status === 'connected' ? '✓ Connected' : 'Not Connected'}
                                    </Badge>
                                </div>
                                <Link
                                    href={`/app/clients/${clientId}/cms`}
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
