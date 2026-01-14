'use client'

import { useState, useEffect } from 'react'
import { Shield, Search, Download, Filter, Calendar, User, Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface AuditLog {
    id: string
    created_at: string
    user_id: string | null
    vendor_id: string | null
    client_id: string | null
    action_type: string
    resource_type: string
    resource_id: string | null
    endpoint: string
    method: string
    status_code: number | null
    success: boolean
    ip_address: string | null
    user_agent: string | null
    duration_ms: number | null
    error_message: string | null
    changes: any
    metadata: any
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        actionType: 'all',
        resourceType: 'all',
        success: 'all',
        startDate: '',
        endDate: '',
        limit: 50,
        offset: 0,
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        fetchAuditLogs()
    }, [filters])

    const fetchAuditLogs = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()

            if (filters.actionType && filters.actionType !== 'all') params.set('actionType', filters.actionType)
            if (filters.resourceType && filters.resourceType !== 'all') params.set('resourceType', filters.resourceType)
            if (filters.success && filters.success !== 'all') params.set('success', filters.success)
            if (filters.startDate) params.set('startDate', filters.startDate)
            if (filters.endDate) params.set('endDate', filters.endDate)
            params.set('limit', filters.limit.toString())
            params.set('offset', filters.offset.toString())

            const response = await fetch(`/api/audit-logs?${params.toString()}`)
            if (!response.ok) {
                throw new Error('Failed to fetch audit logs')
            }

            const data = await response.json()
            setLogs(data.logs || [])
        } catch (error) {
            console.error('Failed to fetch audit logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async (exportType: 'csv' | 'json') => {
        try {
            setExporting(true)
            const response = await fetch('/api/audit-logs/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exportType, filters }),
            })

            if (!response.ok) {
                throw new Error('Failed to export logs')
            }

            // Download the file
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `audit-logs-${Date.now()}.${exportType}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Failed to export logs:', error)
            alert('Failed to export logs')
        } finally {
            setExporting(false)
        }
    }

    const getActionBadgeColor = (action: string) => {
        switch (action.toLowerCase()) {
            case 'create':
                return 'bg-green-100 text-green-800'
            case 'update':
                return 'bg-blue-100 text-blue-800'
            case 'delete':
                return 'bg-red-100 text-red-800'
            case 'read':
                return 'bg-gray-100 text-gray-800'
            case 'auth':
                return 'bg-purple-100 text-purple-800'
            case 'export':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getMethodBadgeColor = (method: string) => {
        switch (method.toUpperCase()) {
            case 'GET':
                return 'bg-blue-100 text-blue-800'
            case 'POST':
                return 'bg-green-100 text-green-800'
            case 'PUT':
            case 'PATCH':
                return 'bg-yellow-100 text-yellow-800'
            case 'DELETE':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const filteredLogs = logs.filter(log => {
        if (!searchTerm) return true
        const term = searchTerm.toLowerCase()
        return (
            log.action_type.toLowerCase().includes(term) ||
            log.resource_type.toLowerCase().includes(term) ||
            log.endpoint.toLowerCase().includes(term) ||
            (log.resource_id && log.resource_id.toLowerCase().includes(term))
        )
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-8 h-8 text-indigo-600" />
                    <h1 className="text-4xl font-bold text-gray-900">Audit Logs</h1>
                </div>
                <p className="text-gray-600 text-lg">
                    Comprehensive audit trail of all system actions for compliance and security
                </p>
            </div>

            {/* Filters */}
            <Card className="p-6 mb-6 border-2 border-indigo-100">
                <div className="flex items-center gap-3 mb-4">
                    <Filter className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold">Filters</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Action Type */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Action Type
                        </label>
                        <Select
                            value={filters.actionType}
                            onValueChange={(value) => setFilters({ ...filters, actionType: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All actions</SelectItem>
                                <SelectItem value="read">Read</SelectItem>
                                <SelectItem value="create">Create</SelectItem>
                                <SelectItem value="update">Update</SelectItem>
                                <SelectItem value="delete">Delete</SelectItem>
                                <SelectItem value="auth">Auth</SelectItem>
                                <SelectItem value="export">Export</SelectItem>
                                <SelectItem value="import">Import</SelectItem>
                                <SelectItem value="publish">Publish</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Resource Type */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Resource Type
                        </label>
                        <Select
                            value={filters.resourceType}
                            onValueChange={(value) => setFilters({ ...filters, resourceType: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All resources" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All resources</SelectItem>
                                <SelectItem value="blog_post">Blog Post</SelectItem>
                                <SelectItem value="content_batch">Content Batch</SelectItem>
                                <SelectItem value="client">Client</SelectItem>
                                <SelectItem value="vendor">Vendor</SelectItem>
                                <SelectItem value="website">Website</SelectItem>
                                <SelectItem value="api_key">API Key</SelectItem>
                                <SelectItem value="webhook">Webhook</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Success Filter */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Status
                        </label>
                        <Select
                            value={filters.success}
                            onValueChange={(value) => setFilters({ ...filters, success: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="true">Success</SelectItem>
                                <SelectItem value="false">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Start Date
                        </label>
                        <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            End Date
                        </label>
                        <Input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                </div>

                {/* Export Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                    <Button
                        onClick={() => handleExport('csv')}
                        disabled={exporting}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </Button>
                    <Button
                        onClick={() => handleExport('json')}
                        disabled={exporting}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export JSON
                    </Button>
                    <Button
                        onClick={() => setFilters({
                            actionType: '',
                            resourceType: '',
                            success: '',
                            startDate: '',
                            endDate: '',
                            limit: 50,
                            offset: 0,
                        })}
                        variant="outline"
                    >
                        Clear Filters
                    </Button>
                </div>
            </Card>

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
                Showing {filteredLogs.length} of {logs.length} logs
            </div>

            {/* Logs Table */}
            {loading ? (
                <Card className="p-8 text-center">
                    <Activity className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading audit logs...</p>
                </Card>
            ) : filteredLogs.length === 0 ? (
                <Card className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No audit logs found</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredLogs.map((log) => (
                        <Card key={log.id} className="p-5 border-2 hover:border-indigo-200 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    {/* Header Row */}
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <Badge className={getActionBadgeColor(log.action_type)}>
                                            {log.action_type.toUpperCase()}
                                        </Badge>
                                        <Badge className={getMethodBadgeColor(log.method)}>
                                            {log.method}
                                        </Badge>
                                        <span className="text-sm font-medium text-gray-700">
                                            {log.resource_type}
                                        </span>
                                        {log.success ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                        )}
                                        {log.status_code && (
                                            <Badge variant="outline" className="text-xs">
                                                {log.status_code}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Endpoint */}
                                    <p className="text-sm font-mono text-gray-600 mb-2">
                                        {log.endpoint}
                                    </p>

                                    {/* Details */}
                                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(log.created_at).toLocaleString()}
                                        </div>
                                        {log.user_id && (
                                            <div className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                User: {log.user_id.substring(0, 8)}...
                                            </div>
                                        )}
                                        {log.ip_address && (
                                            <div className="flex items-center gap-1">
                                                IP: {log.ip_address}
                                            </div>
                                        )}
                                        {log.duration_ms && (
                                            <div className="flex items-center gap-1">
                                                Duration: {log.duration_ms}ms
                                            </div>
                                        )}
                                    </div>

                                    {/* Error Message */}
                                    {log.error_message && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                                            <strong>Error:</strong> {log.error_message}
                                        </div>
                                    )}

                                    {/* Changes Preview */}
                                    {log.changes && (
                                        <details className="mt-2">
                                            <summary className="text-xs text-indigo-600 cursor-pointer hover:text-indigo-800">
                                                View changes
                                            </summary>
                                            <pre className="mt-2 p-2 bg-gray-50 border rounded text-xs overflow-x-auto">
                                                {JSON.stringify(log.changes, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            <div className="mt-6 flex justify-center gap-3">
                <Button
                    onClick={() => setFilters({ ...filters, offset: Math.max(0, filters.offset - filters.limit) })}
                    disabled={filters.offset === 0}
                    variant="outline"
                >
                    Previous
                </Button>
                <Button
                    onClick={() => setFilters({ ...filters, offset: filters.offset + filters.limit })}
                    disabled={logs.length < filters.limit}
                    variant="outline"
                >
                    Next
                </Button>
            </div>
        </div>
    )
}
