'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import RevisionComparer from '@/components/revisions/RevisionComparer'

export default function PostComparePage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = use(params)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <Link
          href={`/app/posts/${postId}/history`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to History
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Compare Revisions
        </h1>
        <p className="text-gray-600">
          Select two revisions to compare their differences side-by-side
        </p>
      </div>

      {/* Revision Comparer */}
      <div className="max-w-6xl mx-auto">
        <RevisionComparer postId={postId} />
      </div>
    </div>
  )
}
