'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
    MessageSquare, 
    Loader2, 
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
    Layers,
    Mail,
    MoreHorizontal,
    Filter,
    RefreshCw,
    ChevronRight,
    User,
    Building,
    Calendar,
    Flag
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ContentRequest {
    id: string
    content_type: string
    title?: string
    message: string
    priority: string
    status: string
    created_at: string
    clients?: {
        id: string
        name: string
    }
    profiles?: {
        id: string
        full_name: string
        email: string
    }
}

export default function VendorRequestsPage() {
    const [requests, setRequests] = useState<ContentRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        fetchRequests()
    }, [filter])

    const fetchRequests = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filter !== 'all') {
                params.set('status', filter)
            }
            
            const res = await fetch(`/api/content-requests?${params}`)
            const data = await res.json()
            
            if (data.success) {
                setRequests(data.requests || [])
            }
        } catch (error) {
            console.error('Error fetching requests:', error)
        } finally {
            setLoading(false)
        }
    }

    const getContentTypeIcon = (type: string) => {
        switch (type) {
            case 'blog_post': return FileText
            case 'batch': return Layers
            case 'newsletter': return Mail
            default: return MoreHorizontal
        }
    }

    const getContentTypeLabel = (type: string) => {
        switch (type) {
            case 'blog_post': return 'Blog Post'
            case 'batch': return 'Content Batch'
            case 'newsletter': return 'Newsletter'
            default: return 'Other'
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>
            case 'in_progress':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>
            case 'completed':
                return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Completed</Badge>
            case 'declined':
                return <Badge className="bg-red-100 text-red-800 border-red-200">Declined</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <Badge className="bg-red-100 text-red-700">Urgent</Badge>
            case 'high':
                return <Badge className="bg-orange-100 text-orange-700">High</Badge>
            case 'normal':
                return null
            case 'low':
                return <Badge variant="outline" className="text-slate-500">Low</Badge>
            default:
                return null
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

    const statusCounts = {
        pending: requests.filter(r => r.status === 'pending').length,
        in_progress: requests.filter(r => r.status === 'in_progress').length,
        completed: requests.filter(r => r.status === 'completed').length,
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Content Requests</h1>
                    <p className="text-slate-600">Manage incoming content requests from your clients</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="border-0 shadow-md bg-white/80 cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => setFilter('pending')}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Pending</p>
                                    <p className="text-2xl font-bold text-amber-600">{statusCounts.pending}</p>
                                </div>
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-white/80 cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => setFilter('in_progress')}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">In Progress</p>
                                    <p className="text-2xl font-bold text-blue-600">{statusCounts.in_progress}</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-white/80 cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => setFilter('completed')}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Completed</p>
                                    <p className="text-2xl font-bold text-emerald-600">{statusCounts.completed}</p>
                                </div>
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
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
                                        { value: 'all', label: 'All' },
                                        { value: 'pending', label: 'Pending' },
                                        { value: 'in_progress', label: 'In Progress' },
                                        { value: 'completed', label: 'Completed' },
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
                            <Button variant="outline" size="sm" onClick={fetchRequests}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Requests List */}
                {loading ? (
                    <Card className="border-0 shadow-md bg-white/80">
                        <CardContent className="p-8 text-center">
                            <Loader2 className="w-8 h-8 mx-auto mb-4 text-indigo-600 animate-spin" />
                            <p className="text-slate-600">Loading requests...</p>
                        </CardContent>
                    </Card>
                ) : requests.length === 0 ? (
                    <Card className="border-0 shadow-md bg-white/80">
                        <CardContent className="p-8 text-center">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">No requests found</h3>
                            <p className="text-slate-500">
                                {filter !== 'all' 
                                    ? 'No requests match your filter.'
                                    : 'When clients submit content requests, they\'ll appear here.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {requests.map((request) => {
                            const Icon = getContentTypeIcon(request.content_type)
                            return (
                                <Card key={request.id} className="border-0 shadow-md bg-white/80 hover:shadow-lg transition-shadow">
                                    <CardContent className="p-0">
                                        <div className="flex items-start justify-between p-5">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                    request.status === 'pending' ? 'bg-amber-100' :
                                                    request.status === 'in_progress' ? 'bg-blue-100' :
                                                    'bg-slate-100'
                                                }`}>
                                                    <Icon className={`w-6 h-6 ${
                                                        request.status === 'pending' ? 'text-amber-600' :
                                                        request.status === 'in_progress' ? 'text-blue-600' :
                                                        'text-slate-600'
                                                    }`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="font-semibold text-slate-800">
                                                            {request.title || `${getContentTypeLabel(request.content_type)} Request`}
                                                        </h3>
                                                        {getStatusBadge(request.status)}
                                                        {getPriorityBadge(request.priority)}
                                                    </div>
                                                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                                                        {request.message}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <Building className="w-3 h-3" />
                                                            {request.clients?.name || 'Unknown'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            {request.profiles?.full_name || 'Unknown'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatTimeAgo(request.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link href={`/app/requests/${request.id}`}>
                                                <Button className="bg-indigo-600 hover:bg-indigo-700">
                                                    View
                                                    <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
