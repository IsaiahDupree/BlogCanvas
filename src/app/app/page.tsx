'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Users, TrendingUp, Clock, CheckCircle, FileText, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function MerchantDashboard() {
    const [searchQuery, setSearchQuery] = useState('')

    // Mock data - would come from API
    const stats = {
        totalClients: 12,
        activeClients: 10,
        postsThisMonth: 47,
        postsInReview: 8,
        avgApprovalTime: '2.3 days'
    }

    const clients = [
        {
            id: '1',
            name: 'Acme Software',
            slug: 'acme-software',
            status: 'active',
            postsThisMonth: 8,
            inReview: 2,
            website: 'acme.com'
        },
        {
            id: '2',
            name: 'TechCorp Inc',
            slug: 'techcorp',
            status: 'active',
            postsThisMonth: 6,
            inReview: 1,
            website: 'techcorp.io'
        },
        {
            id: '3',
            name: 'StartupXYZ',
            slug: 'startupxyz',
            status: 'onboarding',
            postsThisMonth: 0,
            inReview: 0,
            website: 'startupxyz.com'
        }
    ]

    const recentActivity = [
        { id: '1', action: 'Post approved', client: 'Acme Software', post: 'How AI Transforms Sales', time: '2 hours ago' },
        { id: '2', action: 'Post created', client: 'TechCorp Inc', post: 'Ultimate Guide to CRM', time: '5 hours ago' },
        { id: '3', action: 'Client onboarded', client: 'StartupXYZ', time: '1 day ago' }
    ]

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Agency Dashboard
                            </h1>
                            <p className="text-muted-foreground mt-1">Manage all clients and content operations</p>
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
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <Card className="p-6 bg-white border-2 border-blue-100 hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.totalClients}</h3>
                        <p className="text-sm text-muted-foreground">Total Clients</p>
                        <p className="text-xs text-green-600 mt-1">{stats.activeClients} active</p>
                    </Card>

                    <Card className="p-6 bg-white border-2 border-indigo-100 hover:border-indigo-300 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <FileText className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.postsThisMonth}</h3>
                        <p className="text-sm text-muted-foreground">Posts This Month</p>
                    </Card>

                    <Card className="p-6 bg-white border-2 border-yellow-100 hover:border-yellow-300 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <Clock className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.postsInReview}</h3>
                        <p className="text-sm text-muted-foreground">In Review</p>
                    </Card>

                    <Card className="p-6 bg-white border-2 border-green-100 hover:border-green-300 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.avgApprovalTime}</h3>
                        <p className="text-sm text-muted-foreground">Avg Approval Time</p>
                    </Card>

                    <Card className="p-6 bg-white border-2 border-purple-100 hover:border-purple-300 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <TrendingUp className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">87%</h3>
                        <p className="text-sm text-muted-foreground">Client Satisfaction</p>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Clients List */}
                    <div className="lg:col-span-2">
                        <Card className="p-6 bg-white shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Clients</h2>
                                <Link href="/app/clients" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                    View All →
                                </Link>
                            </div>

                            {/* Search */}
                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search clients..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                {filteredClients.map((client) => (
                                    <Link key={client.id} href={`/app/clients/${client.slug}/overview`}>
                                        <div className="p-4 border-2 border-gray-100 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {client.name}
                                                        </h3>
                                                        <Badge className={
                                                            client.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                                                                client.status === 'onboarding' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                                    'bg-gray-100 text-gray-700 border-gray-200'
                                                        }>
                                                            {client.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{client.website}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                                                        <span>{client.postsThisMonth} posts this month</span>
                                                        {client.inReview > 0 && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-yellow-600">{client.inReview} in review</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                                                    Manage
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Recent Activity */}
                    <div>
                        <Card className="p-6 bg-white shadow-xl">
                            <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
                            <div className="space-y-4">
                                {recentActivity.map((activity) => (
                                    <div key={activity.id} className="pb-4 border-b border-gray-100 last:border-0">
                                        <p className="font-semibold text-sm text-gray-900">{activity.action}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {activity.client}
                                            {activity.post && ` - ${activity.post}`}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
