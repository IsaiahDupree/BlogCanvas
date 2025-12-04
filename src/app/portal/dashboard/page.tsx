'use client'

import Link from 'next/link'
import { FileText, Clock, CheckCircle, Calendar, ArrowRight, Bell } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PortalDashboardPage() {
    // Mock data - would come from API filtered by client_id
    const clientName = 'Acme Software Inc'

    const needsReview = [
        {
            id: '1',
            title: 'How AI CRM Transforms Sales Processes',
            excerpt: 'Discover how AI-powered CRM systems are revolutionizing...',
            dueDate: 'Dec 5, 2024',
            readTime: '8 min',
            sections: 6
        },
        {
            id: '2',
            title: 'Ultimate Guide to Sales Automation',
            excerpt: 'Everything you need to know about automating your sales...',
            dueDate: 'Dec 6, 2024',
            readTime: '12 min',
            sections: 8
        }
    ]

    const recentlyApproved = [
        {
            id: '3',
            title: 'Top 10 CRM Features Every Business Needs',
            approvedDate: '2 days ago',
            publishDate: 'Dec 10, 2024'
        },
        {
            id: '4',
            title: 'CRM vs Spreadsheets: Which is Better?',
            approvedDate: '5 days ago',
            publishDate: 'Published'
        }
    ]

    const upcoming = [
        {
            id: '5',
            title: 'How to Choose the Right CRM',
            publishDate: 'Dec 8, 2024',
            status: 'scheduled'
        },
        {
            id: '6',
            title: 'CRM Integration Best Practices',
            publishDate: 'Dec 12, 2024',
            status: 'scheduled'
        }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
                            <p className="text-muted-foreground mt-1">{clientName}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/portal/settings/notifications"
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                            >
                                <Bell className="w-6 h-6 text-gray-600" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </Link>
                            <Link
                                href="/portal/posts"
                                className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                            >
                                All Posts
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Needs Your Review - Priority Section */}
                <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 shadow-xl mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900">Needs Your Review</h2>
                            <p className="text-muted-foreground">{needsReview.length} posts awaiting your approval</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {needsReview.map((post) => (
                            <Card key={post.id} className="p-6 bg-white hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                                        <p className="text-muted-foreground mb-4">{post.excerpt}</p>

                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                Due: {post.dueDate}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {post.readTime}
                                            </span>
                                            <span>{post.sections} sections</span>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/portal/posts/${post.id}`}
                                        className="ml-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2 whitespace-nowrap"
                                    >
                                        Review Now
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recently Approved */}
                    <Card className="p-6 bg-white shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <h2 className="text-2xl font-bold">Recently Approved</h2>
                        </div>

                        <div className="space-y-3">
                            {recentlyApproved.map((post) => (
                                <Link key={post.id} href={`/portal/posts/${post.id}`}>
                                    <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50/50 transition-all">
                                        <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span>Approved {post.approvedDate}</span>
                                            <Badge className="bg-green-100 text-green-700 border-green-200">
                                                {post.publishDate}
                                            </Badge>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </Card>

                    {/* Upcoming Scheduled */}
                    <Card className="p-6 bg-white shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Calendar className="w-8 h-8 text-blue-600" />
                            <h2 className="text-2xl font-bold">Upcoming & Scheduled</h2>
                        </div>

                        <div className="space-y-3">
                            {upcoming.map((post) => (
                                <Link key={post.id} href={`/portal/posts/${post.id}`}>
                                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all">
                                        <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {post.publishDate}
                                            </span>
                                            <Badge variant="outline" className="border-blue-500 text-blue-700">
                                                {post.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                    <Card className="p-6 bg-white border-2 border-yellow-100 text-center">
                        <FileText className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-gray-900">{needsReview.length}</p>
                        <p className="text-sm text-muted-foreground">Pending Review</p>
                    </Card>

                    <Card className="p-6 bg-white border-2 border-green-100 text-center">
                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-gray-900">{recentlyApproved.length}</p>
                        <p className="text-sm text-muted-foreground">Approved</p>
                    </Card>

                    <Card className="p-6 bg-white border-2 border-blue-100 text-center">
                        <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-gray-900">{upcoming.length}</p>
                        <p className="text-sm text-muted-foreground">Scheduled</p>
                    </Card>

                    <Card className="p-6 bg-white border-2 border-purple-100 text-center">
                        <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-gray-900">24</p>
                        <p className="text-sm text-muted-foreground">Total Posts</p>
                    </Card>
                </div>
            </div>
        </div>
    )
}
