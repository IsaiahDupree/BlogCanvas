'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface WorkDeclaration {
  id: string
  title: string
  description: string
  type: string
  status: string
  priority: string
  start_date: string | null
  due_date: string | null
  progress_percentage: number
  milestones: any[]
  deliverables: any[]
  created_at: string
  vendor: {
    id: string
    name: string
    slug: string
    logo_url: string | null
    brand_colors: any
  }
  content_batch: {
    id: string
    name: string
    status: string
  } | null
  created_by_user: {
    id: string
    full_name: string
    email: string
  }
}

interface Stats {
  total_declarations: number
  planned_count: number
  in_progress_count: number
  completed_count: number
  on_hold_count: number
  cancelled_count: number
  avg_progress: number
}

export default function ClientWorkDeclarationsPage() {
  const router = useRouter()
  const [declarations, setDeclarations] = useState<WorkDeclaration[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')

  useEffect(() => {
    fetchDeclarations()
  }, [filterStatus, filterType])

  const fetchDeclarations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      if (filterType) params.append('type', filterType)

      const response = await fetch(`/api/portal/work-declarations?${params}`)
      if (!response.ok) throw new Error('Failed to fetch work declarations')

      const data = await response.json()
      setDeclarations(data.declarations || [])
      setStats(data.stats || null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      planned: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600',
    }
    return badges[priority] || 'bg-gray-100 text-gray-600'
  }

  const getTypeBadge = (type: string) => {
    const badges: Record<string, string> = {
      content_batch: 'bg-purple-100 text-purple-800',
      seo_audit: 'bg-indigo-100 text-indigo-800',
      publishing: 'bg-green-100 text-green-800',
      analytics: 'bg-cyan-100 text-cyan-800',
      reporting: 'bg-pink-100 text-pink-800',
      custom: 'bg-gray-100 text-gray-800',
    }
    return badges[type] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned':
        return '📋'
      case 'in_progress':
        return '⚙️'
      case 'review':
        return '👀'
      case 'completed':
        return '✅'
      case 'on_hold':
        return '⏸️'
      case 'cancelled':
        return '❌'
      default:
        return '📝'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Declared Work</h1>
          <p className="text-gray-600">Track progress on work your vendor is doing for you</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-gray-500 text-sm mb-1">Total Projects</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total_declarations}</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-gray-500 text-sm mb-1">In Progress</div>
              <div className="text-3xl font-bold text-blue-600">{stats.in_progress_count}</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-gray-500 text-sm mb-1">Completed</div>
              <div className="text-3xl font-bold text-green-600">{stats.completed_count}</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-gray-500 text-sm mb-1">Avg Progress</div>
              <div className="text-3xl font-bold text-indigo-600">{Math.round(stats.avg_progress)}%</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="content_batch">Content Batch</option>
              <option value="seo_audit">SEO Audit</option>
              <option value="publishing">Publishing</option>
              <option value="analytics">Analytics</option>
              <option value="reporting">Reporting</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Work Declarations */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : declarations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-2">No work declarations found</p>
            <p className="text-sm text-gray-400">Your vendor will create work declarations to keep you updated on progress</p>
          </div>
        ) : (
          <div className="space-y-4">
            {declarations.map((declaration) => (
              <div
                key={declaration.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-3xl">{getStatusIcon(declaration.status)}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{declaration.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{declaration.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeBadge(declaration.type)}`}>
                          {declaration.type.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(declaration.status)}`}>
                          {declaration.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(declaration.priority)}`}>
                          {declaration.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-medium text-gray-700">{declaration.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${declaration.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                  {declaration.start_date && (
                    <div>
                      <span className="text-gray-500">Started:</span>{' '}
                      <span className="font-medium">{new Date(declaration.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {declaration.due_date && (
                    <div>
                      <span className="text-gray-500">Due:</span>{' '}
                      <span className="font-medium">{new Date(declaration.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Managed by:</span>{' '}
                    <span className="font-medium">{declaration.created_by_user.full_name}</span>
                  </div>
                </div>

                {/* Milestones */}
                {declaration.milestones && declaration.milestones.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Milestones</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {declaration.milestones.map((milestone: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              milestone.completed
                                ? 'bg-green-500 border-green-500'
                                : 'bg-white border-gray-300'
                            }`}
                          >
                            {milestone.completed && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={`text-sm ${milestone.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                            {milestone.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deliverables */}
                {declaration.deliverables && declaration.deliverables.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Deliverables</div>
                    <div className="space-y-2">
                      {declaration.deliverables.map((deliverable: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{deliverable.name}</div>
                            {deliverable.description && (
                              <div className="text-xs text-gray-500">{deliverable.description}</div>
                            )}
                          </div>
                          {deliverable.url && (
                            <a
                              href={deliverable.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                            >
                              View →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
