'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

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
  notes: string | null
  created_at: string
  updated_at: string
  client: {
    id: string
    name: string
    slug: string
    email: string
  }
  vendor: {
    id: string
    name: string
    slug: string
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
    avatar_url: string | null
  }
}

interface Update {
  id: string
  update_type: string
  old_value: string | null
  new_value: string | null
  comment: string | null
  created_at: string
  created_by_user: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}

export default function WorkDeclarationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const declarationId = params.id as string

  const [declaration, setDeclaration] = useState<WorkDeclaration | null>(null)
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<any>({})

  // Comment form
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    fetchDeclaration()
  }, [declarationId])

  const fetchDeclaration = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/work-declarations/${declarationId}`)
      if (!response.ok) throw new Error('Failed to fetch work declaration')

      const data = await response.json()
      setDeclaration(data.declaration)
      setUpdates(data.updates || [])
      setEditData({
        title: data.declaration.title,
        description: data.declaration.description,
        status: data.declaration.status,
        priority: data.declaration.priority,
        progress_percentage: data.declaration.progress_percentage,
        start_date: data.declaration.start_date || '',
        due_date: data.declaration.due_date || '',
        notes: data.declaration.notes || '',
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/work-declarations/${declarationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update work declaration')
      }

      const { declaration: updated } = await response.json()
      setDeclaration(updated)
      setEditing(false)

      // Refresh to get new updates from triggers
      fetchDeclaration()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setSubmittingComment(true)
    setError('')

    try {
      const response = await fetch(`/api/work-declarations/${declarationId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          update_type: 'comment',
          comment: comment.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add comment')
      }

      setComment('')
      // Refresh to get new comment
      fetchDeclaration()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmittingComment(false)
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

  const getUpdateIcon = (updateType: string) => {
    switch (updateType) {
      case 'status_change':
        return '🔄'
      case 'progress_update':
        return '📊'
      case 'milestone_complete':
        return '🎯'
      case 'deliverable_added':
        return '📦'
      case 'comment':
        return '💬'
      case 'due_date_change':
        return '📅'
      default:
        return '📝'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!declaration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">Work declaration not found</p>
            <button
              onClick={() => router.push('/app/work-declarations')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Work Declarations
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/app/work-declarations')}
          className="mb-6 text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
        >
          ← Back to Work Declarations
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {editing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="w-full text-2xl font-bold border-b-2 border-gray-200 focus:border-indigo-500 outline-none pb-2"
                  />
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  ></textarea>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{declaration.title}</h1>
                  <p className="text-gray-700">{declaration.description}</p>
                </>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                {editing ? (
                  <>
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                      className="px-3 py-1 rounded-full text-sm font-medium border border-gray-300"
                    >
                      <option value="planned">Planned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                      value={editData.priority}
                      onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                      className="px-3 py-1 rounded-full text-sm font-medium border border-gray-300"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </>
                ) : (
                  <>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(declaration.status)}`}>
                      {declaration.status.replace('_', ' ')}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadge(declaration.priority)}`}
                    >
                      {declaration.priority}
                    </span>
                  </>
                )}
              </div>

              {!editing && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )}

              {editing && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setEditData({
                        title: declaration.title,
                        description: declaration.description,
                        status: declaration.status,
                        priority: declaration.priority,
                        progress_percentage: declaration.progress_percentage,
                        start_date: declaration.start_date || '',
                        due_date: declaration.due_date || '',
                        notes: declaration.notes || '',
                      })
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Progress Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Progress</h2>

              {editing ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progress Percentage: {editData.progress_percentage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={editData.progress_percentage}
                    onChange={(e) => setEditData({ ...editData, progress_percentage: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className="text-sm font-medium text-gray-700">{declaration.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-indigo-600 h-3 rounded-full transition-all"
                      style={{ width: `${declaration.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {editing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={editData.start_date}
                      onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={editData.due_date}
                      onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Start Date:</span>
                    <p className="font-medium text-gray-900">
                      {declaration.start_date ? new Date(declaration.start_date).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Due Date:</span>
                    <p className="font-medium text-gray-900">
                      {declaration.due_date ? new Date(declaration.due_date).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Timeline</h2>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="mb-6">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-2"
                ></textarea>
                <button
                  type="submit"
                  disabled={submittingComment || !comment.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submittingComment ? 'Adding...' : 'Add Comment'}
                </button>
              </form>

              {/* Updates List */}
              <div className="space-y-4">
                {updates.length === 0 ? (
                  <p className="text-gray-500 text-sm">No updates yet</p>
                ) : (
                  updates.map((update) => (
                    <div key={update.id} className="flex gap-3">
                      <div className="text-2xl">{getUpdateIcon(update.update_type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{update.created_by_user.full_name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(update.created_at).toLocaleString()}
                          </span>
                        </div>
                        {update.comment && <p className="text-gray-700">{update.comment}</p>}
                        {update.update_type === 'status_change' && (
                          <p className="text-sm text-gray-600">
                            Changed status from <span className="font-medium">{update.old_value}</span> to{' '}
                            <span className="font-medium">{update.new_value}</span>
                          </p>
                        )}
                        {update.update_type === 'progress_update' && (
                          <p className="text-sm text-gray-600">
                            Updated progress from <span className="font-medium">{update.old_value}%</span> to{' '}
                            <span className="font-medium">{update.new_value}%</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client</h3>
              <div>
                <p className="font-medium text-gray-900">{declaration.client.name}</p>
                <p className="text-sm text-gray-600">{declaration.client.email}</p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <p className="font-medium text-gray-900">{declaration.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <p className="font-medium text-gray-900">{new Date(declaration.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Created By:</span>
                  <p className="font-medium text-gray-900">{declaration.created_by_user.full_name}</p>
                </div>
                {declaration.content_batch && (
                  <div>
                    <span className="text-gray-500">Content Batch:</span>
                    <p className="font-medium text-gray-900">{declaration.content_batch.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {(declaration.notes || editing) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                {editing ? (
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    rows={4}
                    placeholder="Add any notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  ></textarea>
                ) : (
                  <p className="text-sm text-gray-700">{declaration.notes}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
