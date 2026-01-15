'use client'

import { useState, useEffect } from 'react'
import { FolderKanban, TrendingUp, Eye, MousePointerClick, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface BatchStats {
  batchId: string
  batchName: string
  clientId: string
  totalPosts: number
  totalImpressions: number
  totalClicks: number
  avgCTR: number
  avgPosition: number
  avgSeoScore: number
}

interface BatchMetricsProps {
  limit?: number
  clientId?: string
}

export default function BatchMetrics({ limit = 10, clientId }: BatchMetricsProps) {
  const [batches, setBatches] = useState<BatchStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBatchStats()
  }, [clientId])

  const fetchBatchStats = async () => {
    try {
      const url = clientId
        ? `/api/analytics/batch-stats?clientId=${clientId}`
        : '/api/analytics/batch-stats'

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch batch stats')
      }
      const data = await response.json()
      setBatches(data.batches.slice(0, limit))
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch batch stats:', error)
      setError('Failed to load batch metrics')
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <Card className="p-6 border-2 border-purple-100 bg-white">
        <div className="flex items-center gap-3 mb-6">
          <FolderKanban className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Batch Performance</h2>
        </div>
        <div className="text-center py-8 text-gray-500">Loading batch metrics...</div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 border-2 border-red-100 bg-white">
        <div className="flex items-center gap-3 mb-6">
          <FolderKanban className="w-6 h-6 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900">Batch Performance</h2>
        </div>
        <div className="text-center py-8 text-red-500">{error}</div>
      </Card>
    )
  }

  if (batches.length === 0) {
    return (
      <Card className="p-6 border-2 border-purple-100 bg-white">
        <div className="flex items-center gap-3 mb-6">
          <FolderKanban className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Batch Performance</h2>
        </div>
        <div className="text-center py-8 text-gray-500">No batch metrics available yet</div>
      </Card>
    )
  }

  return (
    <Card className="p-6 border-2 border-purple-100 bg-white">
      <div className="flex items-center gap-3 mb-6">
        <FolderKanban className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900">Batch Performance</h2>
        <Badge variant="outline" className="ml-auto">
          {batches.length} {batches.length === 1 ? 'Batch' : 'Batches'}
        </Badge>
      </div>

      <div className="space-y-4">
        {batches.map((batch, index) => (
          <div
            key={batch.batchId}
            className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                  <h3 className="text-lg font-bold text-gray-900">{batch.batchName}</h3>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {batch.totalPosts} {batch.totalPosts === 1 ? 'post' : 'posts'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* Impressions */}
              <div className="bg-white/80 p-3 rounded border border-purple-100">
                <div className="flex items-center gap-1 mb-1">
                  <Eye className="w-3 h-3 text-purple-600" />
                  <p className="text-xs text-gray-600">Impressions</p>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {batch.totalImpressions.toLocaleString()}
                </p>
              </div>

              {/* Clicks */}
              <div className="bg-white/80 p-3 rounded border border-green-100">
                <div className="flex items-center gap-1 mb-1">
                  <MousePointerClick className="w-3 h-3 text-green-600" />
                  <p className="text-xs text-gray-600">Clicks</p>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {batch.totalClicks.toLocaleString()}
                </p>
              </div>

              {/* CTR */}
              <div className="bg-white/80 p-3 rounded border border-pink-100">
                <div className="flex items-center gap-1 mb-1">
                  <Target className="w-3 h-3 text-pink-600" />
                  <p className="text-xs text-gray-600">CTR</p>
                </div>
                <p className="text-lg font-bold text-pink-600">
                  {batch.avgCTR.toFixed(1)}%
                </p>
              </div>

              {/* Position */}
              <div className="bg-white/80 p-3 rounded border border-blue-100">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-blue-600" />
                  <p className="text-xs text-gray-600">Position</p>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  #{batch.avgPosition.toFixed(1)}
                </p>
              </div>

              {/* SEO Score */}
              <div className="bg-white/80 p-3 rounded border border-yellow-100">
                <div className="flex items-center gap-1 mb-1">
                  <Target className="w-3 h-3 text-yellow-600" />
                  <p className="text-xs text-gray-600">SEO Score</p>
                </div>
                <p className={`text-lg font-bold ${getScoreColor(batch.avgSeoScore)}`}>
                  {batch.avgSeoScore}/100
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
