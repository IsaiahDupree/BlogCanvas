'use client'

import { useState } from 'react'
import { Clock, User, Bot, Eye, RotateCcw, GitCommit } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DiffViewer from './DiffViewer'
import { Change } from 'diff'

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

interface RevisionHistoryTimelineProps {
  revisions: Revision[]
  postId: string
  onRestore?: (revisionId: string) => void
}

export default function RevisionHistoryTimeline({
  revisions,
  postId,
  onRestore,
}: RevisionHistoryTimelineProps) {
  const [selectedRevision, setSelectedRevision] = useState<string | null>(null)
  const [diffData, setDiffData] = useState<any>(null)
  const [loadingDiff, setLoadingDiff] = useState(false)

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

  const handleViewDiff = async (revisionId: string) => {
    if (selectedRevision === revisionId) {
      setSelectedRevision(null)
      setDiffData(null)
      return
    }

    setLoadingDiff(true)
    setSelectedRevision(revisionId)

    try {
      const response = await fetch(`/api/posts/${postId}/revisions/${revisionId}/diff`)
      if (!response.ok) {
        throw new Error('Failed to fetch diff')
      }

      const data = await response.json()
      setDiffData(data)
    } catch (error) {
      console.error('Error fetching diff:', error)
      setDiffData(null)
    } finally {
      setLoadingDiff(false)
    }
  }

  const handleRestore = (revisionId: string) => {
    if (onRestore) {
      onRestore(revisionId)
    }
  }

  if (revisions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <GitCommit className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No revision history available</p>
        <p className="text-sm text-gray-500 mt-2">
          Revisions will appear here as changes are made to the post
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {revisions.map((revision, index) => {
        const isLatest = index === 0
        const isSelected = selectedRevision === revision.id

        return (
          <div key={revision.id}>
            <Card className={`p-4 ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`mt-1 p-2 rounded-full ${
                    revision.created_by_type === 'system'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {revision.created_by_type === 'system' ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getRevisionTypeColor(revision.revision_type)}>
                        {getRevisionTypeLabel(revision.revision_type)}
                      </Badge>
                      {isLatest && (
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          Latest
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(revision.created_at).toLocaleString()}</span>
                    </div>

                    {revision.notes && (
                      <p className="text-sm text-gray-700 italic">{revision.notes}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewDiff(revision.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {isSelected ? 'Hide' : 'View'} Diff
                  </button>

                  {!isLatest && (
                    <button
                      onClick={() => handleRestore(revision.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </button>
                  )}
                </div>
              </div>
            </Card>

            {/* Diff Display */}
            {isSelected && (
              <div className="mt-2 ml-11">
                {loadingDiff ? (
                  <Card className="p-4 text-center text-gray-500">
                    Loading diff...
                  </Card>
                ) : diffData ? (
                  <div className="space-y-4">
                    {diffData.diff.title && diffData.diff.title.length > 0 && (
                      <DiffViewer diff={diffData.diff.title} title="Title" />
                    )}
                    {diffData.diff.meta_description && diffData.diff.meta_description.length > 0 && (
                      <DiffViewer diff={diffData.diff.meta_description} title="Meta Description" />
                    )}
                    {diffData.diff.content && diffData.diff.content.length > 0 && (
                      <DiffViewer diff={diffData.diff.content} title="Content" />
                    )}
                  </div>
                ) : (
                  <Card className="p-4 text-center text-red-500">
                    Failed to load diff
                  </Card>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
