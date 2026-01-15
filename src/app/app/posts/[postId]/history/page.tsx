'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, GitCompare } from 'lucide-react'
import RevisionHistory from '@/components/revisions/RevisionHistory'
import EditorSignOffToggle from '@/components/editor/EditorSignOffToggle'

export default function PostHistoryPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = use(params)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/app/posts/${postId}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Post
          </Link>

          <Link
            href={`/app/posts/${postId}/compare`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <GitCompare className="w-4 h-4" />
            Compare Revisions
          </Link>
        </div>
      </div>

      {/* Editor Sign-Off Toggle */}
      <div className="max-w-4xl mx-auto mb-6">
        <EditorSignOffToggle postId={postId} />
      </div>

      {/* Revision History */}
      <div className="max-w-4xl mx-auto">
        <RevisionHistory postId={postId} />
      </div>
    </div>
  )
}
