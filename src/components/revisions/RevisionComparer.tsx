'use client'

import { useState, useEffect } from 'react'
import { Clock, User, Bot, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DiffViewer from './DiffViewer'

interface Revision {
  id: string
  blog_post_id: string
  revision_type: string
  content: any
  content_text: string
  created_by: string | null
  created_by_type: 'system' | 'user'
  notes: string | null
  created_at: string
}

interface RevisionComparerProps {
  postId: string
  defaultRevision1?: string
  defaultRevision2?: string
}

export default function RevisionComparer({
  postId,
  defaultRevision1,
  defaultRevision2,
}: RevisionComparerProps) {
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [loading, setLoading] = useState(true)
  const [revision1, setRevision1] = useState<string>(defaultRevision1 || '')
  const [revision2, setRevision2] = useState<string>(defaultRevision2 || '')
  const [diffData, setDiffData] = useState<any>(null)
  const [loadingDiff, setLoadingDiff] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch revisions on mount
  useEffect(() => {
    fetchRevisions()
  }, [postId])

  // Set default revisions once loaded (latest two)
  useEffect(() => {
    if (revisions.length >= 2 && !revision1 && !revision2) {
      setRevision1(revisions[0].id)
      setRevision2(revisions[1].id)
    }
  }, [revisions])

  // Fetch diff when both revisions are selected
  useEffect(() => {
    if (revision1 && revision2 && revision1 !== revision2) {
      fetchDiff()
    }
  }, [revision1, revision2])

  const fetchRevisions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/revisions`)
      if (!response.ok) {
        throw new Error('Failed to fetch revisions')
      }
      const data = await response.json()
      setRevisions(data.revisions || [])
    } catch (error) {
      console.error('Error fetching revisions:', error)
      setError('Failed to load revisions')
    } finally {
      setLoading(false)
    }
  }

  const fetchDiff = async () => {
    if (!revision1 || !revision2 || revision1 === revision2) return

    setLoadingDiff(true)
    setError(null)

    try {
      // Use the newer revision as the target, older as the compare
      const rev1 = revisions.find(r => r.id === revision1)
      const rev2 = revisions.find(r => r.id === revision2)

      if (!rev1 || !rev2) {
        throw new Error('Revisions not found')
      }

      // Determine which is newer (we compare older → newer)
      const isRev1Newer = new Date(rev1.created_at) > new Date(rev2.created_at)
      const targetId = isRev1Newer ? revision1 : revision2
      const compareId = isRev1Newer ? revision2 : revision1

      const response = await fetch(
        `/api/posts/${postId}/revisions/${targetId}/diff?compareWith=${compareId}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch diff')
      }

      const data = await response.json()
      setDiffData(data)
    } catch (error) {
      console.error('Error fetching diff:', error)
      setError('Failed to load comparison')
      setDiffData(null)
    } finally {
      setLoadingDiff(false)
    }
  }

  const getRevisionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      outline: 'Outline',
      draft: 'Draft',
      seo_pass: 'SEO Pass',
      fact_check: 'Fact Check',
      human_edit: 'Human Edit',
      enhancement: 'Enhancement',
      ai_generated: 'AI Generated',
    }
    return labels[type] || type
  }

  const getRevisionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      outline: 'bg-blue-100 text-blue-800',
      draft: 'bg-purple-100 text-purple-800',
      seo_pass: 'bg-green-100 text-green-800',
      fact_check: 'bg-yellow-100 text-yellow-800',
      human_edit: 'bg-orange-100 text-orange-800',
      enhancement: 'bg-indigo-100 text-indigo-800',
      ai_generated: 'bg-gray-100 text-gray-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getRevisionInfo = (revisionId: string) => {
    return revisions.find(r => r.id === revisionId)
  }

  const handleSwap = () => {
    const temp = revision1
    setRevision1(revision2)
    setRevision2(temp)
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading revisions...</p>
      </Card>
    )
  }

  if (revisions.length < 2) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600">Not enough revisions to compare</p>
        <p className="text-sm text-gray-500 mt-2">
          At least 2 revisions are needed for comparison
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selector Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Select Revisions to Compare
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Revision 1 Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Revision 1 (Older)
            </label>
            <select
              value={revision1}
              onChange={(e) => setRevision1(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a revision...</option>
              {revisions.map((rev) => (
                <option
                  key={rev.id}
                  value={rev.id}
                  disabled={rev.id === revision2}
                >
                  {getRevisionTypeLabel(rev.revision_type)} - {formatDate(rev.created_at)}
                  {rev.created_by_type === 'system' ? ' (AI)' : ' (Human)'}
                </option>
              ))}
            </select>

            {/* Revision 1 Info Card */}
            {revision1 && getRevisionInfo(revision1) && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getRevisionTypeColor(getRevisionInfo(revision1)!.revision_type)}>
                    {getRevisionTypeLabel(getRevisionInfo(revision1)!.revision_type)}
                  </Badge>
                  <div className={`p-1 rounded-full ${
                    getRevisionInfo(revision1)!.created_by_type === 'system'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {getRevisionInfo(revision1)!.created_by_type === 'system' ? (
                      <Bot className="w-3 h-3" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  {formatDate(getRevisionInfo(revision1)!.created_at)}
                </div>
                {getRevisionInfo(revision1)!.notes && (
                  <p className="text-xs text-gray-600 mt-2 italic">
                    {getRevisionInfo(revision1)!.notes}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 mt-8">
            <button
              onClick={handleSwap}
              disabled={!revision1 || !revision2}
              className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Swap revisions"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Revision 2 Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Revision 2 (Newer)
            </label>
            <select
              value={revision2}
              onChange={(e) => setRevision2(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a revision...</option>
              {revisions.map((rev) => (
                <option
                  key={rev.id}
                  value={rev.id}
                  disabled={rev.id === revision1}
                >
                  {getRevisionTypeLabel(rev.revision_type)} - {formatDate(rev.created_at)}
                  {rev.created_by_type === 'system' ? ' (AI)' : ' (Human)'}
                </option>
              ))}
            </select>

            {/* Revision 2 Info Card */}
            {revision2 && getRevisionInfo(revision2) && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getRevisionTypeColor(getRevisionInfo(revision2)!.revision_type)}>
                    {getRevisionTypeLabel(getRevisionInfo(revision2)!.revision_type)}
                  </Badge>
                  <div className={`p-1 rounded-full ${
                    getRevisionInfo(revision2)!.created_by_type === 'system'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {getRevisionInfo(revision2)!.created_by_type === 'system' ? (
                      <Bot className="w-3 h-3" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  {formatDate(getRevisionInfo(revision2)!.created_at)}
                </div>
                {getRevisionInfo(revision2)!.notes && (
                  <p className="text-xs text-gray-600 mt-2 italic">
                    {getRevisionInfo(revision2)!.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Swap Button for Mobile */}
        <div className="md:hidden flex justify-center mt-4">
          <button
            onClick={handleSwap}
            disabled={!revision1 || !revision2}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Swap Revisions
          </button>
        </div>
      </Card>

      {/* Diff Display Section */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {revision1 && revision2 && revision1 === revision2 && (
        <Card className="p-6 border-yellow-200 bg-yellow-50">
          <p className="text-yellow-800">Please select two different revisions to compare</p>
        </Card>
      )}

      {loadingDiff && (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comparison...</p>
        </Card>
      )}

      {!loadingDiff && diffData && revision1 && revision2 && revision1 !== revision2 && (
        <div className="space-y-4">
          {diffData.diff.title && diffData.diff.title.length > 0 && (
            <DiffViewer diff={diffData.diff.title} title="Title" defaultView="split" />
          )}
          {diffData.diff.meta_description && diffData.diff.meta_description.length > 0 && (
            <DiffViewer diff={diffData.diff.meta_description} title="Meta Description" defaultView="split" />
          )}
          {diffData.diff.content && diffData.diff.content.length > 0 && (
            <DiffViewer diff={diffData.diff.content} title="Content" defaultView="split" />
          )}
        </div>
      )}
    </div>
  )
}
