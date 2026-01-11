'use client'

import { useState, useEffect } from 'react'
import { History, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import RevisionHistoryTimeline from './RevisionHistoryTimeline'

interface RevisionHistoryProps {
  postId: string
}

export default function RevisionHistory({ postId }: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)

  const fetchRevisions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/posts/${postId}/revisions`)
      if (!response.ok) {
        throw new Error('Failed to fetch revisions')
      }

      const data = await response.json()
      setRevisions(data.revisions || [])
    } catch (err) {
      console.error('Error fetching revisions:', err)
      setError('Failed to load revision history')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (revisionId: string) => {
    if (!confirm('Are you sure you want to restore this revision? The current version will be saved as a backup.')) {
      return
    }

    setRestoring(true)

    try {
      const response = await fetch(`/api/posts/${postId}/revisions/${revisionId}/restore`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to restore revision')
      }

      // Refresh revisions list and show success
      await fetchRevisions()
      alert('Revision restored successfully! The page will reload.')
      window.location.reload()
    } catch (err) {
      console.error('Error restoring revision:', err)
      alert('Failed to restore revision. Please try again.')
    } finally {
      setRestoring(false)
    }
  }

  useEffect(() => {
    fetchRevisions()
  }, [postId])

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">Loading revision history...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <History className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchRevisions}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </Card>
    )
  }

  return (
    <div className={restoring ? 'opacity-50 pointer-events-none' : ''}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Revision History</h2>
            <p className="text-sm text-gray-600 mt-1">
              View changes and restore previous versions
            </p>
          </div>
        </div>
        <button
          onClick={fetchRevisions}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <RevisionHistoryTimeline
        revisions={revisions}
        postId={postId}
        onRestore={handleRestore}
      />
    </div>
  )
}
