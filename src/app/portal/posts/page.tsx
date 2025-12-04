'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Calendar, Clock, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PortalPostsListPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Mock data - would fetch from API filtered by client_id
    const posts = [
        {
            id: '1',
            title: 'How AI CRM Transforms Sales Processes',
            status: 'ready_for_review',
            targetKeyword: 'AI CRM',
            wordCount: 1543,
            plannedDate: 'Dec 10, 2024',
            lastUpdated: '2 hours ago',
            clientStatus: 'Needs your review'
        },
        {
            id: '2',
            title: 'Ultimate Guide to Sales Automation',
            status: 'ready_for_review',
            targetKeyword: 'sales automation',
            wordCount: 2134,
            plannedDate: 'Dec 12, 2024',
            lastUpdated: '5 hours ago',
            clientStatus: 'Needs your review'
        },
        {
            id: '3',
            title: 'Top 10 CRM Features Every Business Needs',
            status: 'approved',
            targetKeyword: 'CRM features',
            wordCount: 987,
            plannedDate: 'Dec 8, 2024',
            lastUpdated: '2 days ago',
            clientStatus: 'Approved'
        },
        {
            id: '4',
            title: 'CRM vs Spreadsheets: Which is Better?',
            status: 'published',
            targetKeyword: 'CRM vs spreadsheets',
            wordCount: 1245,
            plannedDate: 'Nov 28, 2024',
            lastUpdated: '1 week ago',
            clientStatus: 'Published'
        },
        {
            id: '5',
            title: 'How to Choose the Right CRM for Your Business',
            status: 'scheduled',
            targetKeyword: 'choose CRM',
            wordCount: 1678,
            plannedDate: 'Dec 15, 2024',
            lastUpdated: '3 days ago',
            clientStatus: 'Scheduled'
        },
        {
            id: '6',
            title: 'CRM Integration Best Practices',
            status: 'editing',
            targetKeyword: 'CRM integration',
            wordCount: 1023,
            plannedDate: 'Dec 18, 2024',
            lastUpdated: '1 day ago',
            clientStatus: 'In progress (agency editing)'
        }
    ]

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'ready_for_review':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'approved':
                return 'bg-green-100 text-green-700 border-green-200'
            case 'published':
                return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'scheduled':
                return 'bg-purple-100 text-purple-700 border-purple-200'
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.targetKeyword.toLowerCase().includes(searchQuery.toLowerCase())

        let matchesStatus = true
        if (statusFilter === 'needs_review') {
            matchesStatus = post.status === 'ready_for_review'
        } else if (statusFilter === 'upcoming') {
            matchesStatus = post.status === 'approved' || post.status === 'scheduled'
        } else if (statusFilter === 'past') {
            matchesStatus = post.status === 'published'
        }

        return matchesSearch && matchesStatus
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <Link href="/portal/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900 mb-2">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">All Posts</h1>
                            <p className="text-muted-foreground mt-1">{filteredPosts.length} posts found</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Filters */}
                <Card className="p-6 bg-white shadow-lg mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by title or keyword..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'needs_review', label: 'Needs Review' },
                                { key: 'upcoming', label: 'Upcoming' },
                                { key: 'past', label: 'Past' }
                            ].map((filter) => (
                                <button
                                    key={filter.key}
                                    onClick={() => setStatusFilter(filter.key)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${statusFilter === filter.key
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Posts Table */}
                <Card className="p-6 bg-white shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Target Keyword</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Planned Date</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Updated</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPosts.map((post) => (
                                    <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-4">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{post.title}</h3>
                                                <p className="text-sm text-muted-foreground">{post.wordCount} words</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <Badge className={getStatusBadgeClass(post.status)}>
                                                {post.clientStatus}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm text-gray-700">{post.targetKeyword}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-1 text-sm text-gray-700">
                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                                {post.plannedDate}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Clock className="w-4 h-4" />
                                                {post.lastUpdated}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <Link
                                                href={`/portal/posts/${post.id}`}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors inline-block"
                                            >
                                                {post.status === 'ready_for_review' ? 'Review' : 'View'}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredPosts.length === 0 && (
                        <div className="text-center py-12">
                            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
                            <p className="text-muted-foreground">Try adjusting your search or filters</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
