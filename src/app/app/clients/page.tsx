'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Plus, ArrowLeft, Users, Globe, Mail } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ClientsListPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Mock data
    const clients = [
        {
            id: '1',
            name: 'Acme Software Inc',
            slug: 'acme-software',
            website: 'acme.com',
            contact_email: 'marketing@acme.com',
            status: 'active',
            postsThisMonth: 8,
            totalPosts: 42,
            inReview: 2,
            cms_status: 'connected',
            onboarded_via: 'site_scan',
            created_at: '2024-10-15'
        },
        {
            id: '2',
            name: 'TechCorp Inc',
            slug: 'techcorp',
            website: 'techcorp.io',
            contact_email: 'content@techcorp.io',
            status: 'active',
            postsThisMonth: 6,
            totalPosts: 28,
            inReview: 1,
            cms_status: 'connected',
            onboarded_via: 'manual_intake',
            created_at: '2024-09-20'
        },
        {
            id: '3',
            name: 'StartupXYZ',
            slug: 'startupxyz',
            website: 'startupxyz.com',
            contact_email: 'hello@startupxyz.com',
            status: 'onboarding',
            postsThisMonth: 0,
            totalPosts: 0,
            inReview: 0,
            cms_status: 'not_configured',
            onboarded_via: 'site_scan',
            created_at: '2024-12-01'
        },
        {
            id: '4',
            name: 'Enterprise Solutions Ltd',
            slug: 'enterprise-solutions',
            website: 'esolutions.com',
            contact_email: 'marketing@esolutions.com',
            status: 'active',
            postsThisMonth: 12,
            totalPosts: 67,
            inReview: 3,
            cms_status: 'connected',
            onboarded_via: 'manual_intake',
            created_at: '2024-08-10'
        }
    ]

    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.website.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || client.status === statusFilter
        return matchesSearch && matchesStatus
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <Link href="/app" className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900 mb-2">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
                            <p className="text-muted-foreground mt-1">{filteredClients.length} clients found</p>
                        </div>
                        <Link
                            href="/app/clients/new"
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            New Client
                        </Link>
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
                                placeholder="Search by name or website..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex gap-2">
                            {['all', 'active', 'onboarding', 'paused'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === status
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Clients Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredClients.map((client) => (
                        <Card key={client.id} className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">{client.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Globe className="w-3 h-3 text-gray-400" />
                                                <span className="text-sm text-muted-foreground">{client.website}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Badge className={
                                    client.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                                        client.status === 'onboarding' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                            'bg-gray-100 text-gray-700 border-gray-200'
                                }>
                                    {client.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">{client.postsThisMonth}</p>
                                    <p className="text-xs text-muted-foreground">This Month</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900">{client.totalPosts}</p>
                                    <p className="text-xs text-muted-foreground">Total Posts</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-yellow-600">{client.inReview}</p>
                                    <p className="text-xs text-muted-foreground">In Review</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-muted-foreground">{client.contact_email}</span>
                                </div>
                                <Badge variant="outline" className={
                                    client.cms_status === 'connected' ? 'border-green-500 text-green-700' :
                                        'border-gray-300 text-gray-600'
                                }>
                                    {client.cms_status === 'connected' ? '✓ CMS Connected' : 'No CMS'}
                                </Badge>
                            </div>

                            <div className="flex gap-2">
                                <Link
                                    href={`/app/clients/${client.slug}/overview`}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                                >
                                    View Dashboard
                                </Link>
                                <Link
                                    href={`/app/clients/${client.slug}/posts/new`}
                                    className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:border-blue-300 hover:text-blue-600 transition-colors"
                                >
                                    New Post
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>

                {filteredClients.length === 0 && (
                    <Card className="p-12 bg-white text-center">
                        <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients found</h3>
                        <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
                        <Link
                            href="/app/clients/new"
                            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                        >
                            Add Your First Client
                        </Link>
                    </Card>
                )}
            </div>
        </div>
    )
}
