'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Play,
  Calendar,
  TrendingUp,
  BarChart3,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CheckBack {
  id: string
  blog_post_id: string
  scheduled_date: string
  check_type: string
  status: string
  completed_at?: string
  error_message?: string
  metrics_snapshot?: any
  blog_post: {
    id: string
    topic: string
    title?: string
    cms_url?: string
    cms_published_at?: string
    client?: {
      id: string
      name: string
    }
  }
}

interface Stats {
  pending: number
  completed: number
  failed: number
  dueToday: number
}

export default function CheckBacksPage() {
  const [checkBacks, setCheckBacks] = useState<CheckBack[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, completed: 0, failed: 0, dueToday: 0 })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all')

  useEffect(() => {
    fetchCheckBacks()
  }, [filter])

  const fetchCheckBacks = async () => {
    try {
      const url = new URL('/api/analytics/check-backs', window.location.origin)
      if (filter !== 'all') {
        url.searchParams.set('status', filter)
      }
      
      const res = await fetch(url.toString())
      const data = await res.json()
      
      if (data.success) {
        setCheckBacks(data.checkBacks || [])
        setStats(data.stats || { pending: 0, completed: 0, failed: 0, dueToday: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch check-backs:', error)
    } finally {
      setLoading(false)
    }
  }

  const processAllDue = async () => {
    setProcessing(true)
    try {
      const res = await fetch('/api/analytics/check-backs/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 })
      })
      const data = await res.json()
      
      if (data.success) {
        alert(`Processed ${data.processed} check-backs`)
        fetchCheckBacks()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const runSingleCheckBack = async (checkBackId: string) => {
    setRunningId(checkBackId)
    try {
      const res = await fetch('/api/analytics/check-backs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', checkBackId })
      })
      const data = await res.json()
      
      if (data.success) {
        fetchCheckBacks()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setRunningId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />
      case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isDue = (scheduledDate: string, status: string) => {
    if (status !== 'pending') return false
    return new Date(scheduledDate) <= new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/app/analytics" className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Analytics
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Analytics Check-Backs</h1>
              <p className="text-muted-foreground">
                Automated performance tracking for published content
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchCheckBacks}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={processAllDue}
                disabled={processing || stats.dueToday === 0}
                className="bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Process Due ({stats.dueToday})
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className={filter === 'pending' ? 'ring-2 ring-yellow-500' : ''}>
            <CardContent className="pt-6 cursor-pointer" onClick={() => setFilter('pending')}>
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={filter === 'completed' ? 'ring-2 ring-green-500' : ''}>
            <CardContent className="pt-6 cursor-pointer" onClick={() => setFilter('completed')}>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.completed}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={filter === 'failed' ? 'ring-2 ring-red-500' : ''}>
            <CardContent className="pt-6 cursor-pointer" onClick={() => setFilter('failed')}>
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.failed}</div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-indigo-50 border-indigo-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-indigo-600" />
                <div>
                  <div className="text-2xl font-bold text-indigo-700">{stats.dueToday}</div>
                  <p className="text-sm text-indigo-600">Due Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Reset */}
        {filter !== 'all' && (
          <div className="mb-4">
            <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>
              Clear filter: {filter}
              <XCircle className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Check-Backs List */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Check-Backs</CardTitle>
            <CardDescription>
              Metrics are collected at Day 7, 30, 60, and 90 after publishing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkBacks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No check-backs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {checkBacks.map((checkBack) => (
                  <div
                    key={checkBack.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      isDue(checkBack.scheduled_date, checkBack.status) 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(checkBack.status)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {checkBack.blog_post?.title || checkBack.blog_post?.topic || 'Untitled'}
                          </span>
                          <Badge className={getStatusColor(checkBack.status)}>
                            {checkBack.status}
                          </Badge>
                          <Badge variant="outline">{checkBack.check_type}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-x-4">
                          {checkBack.blog_post?.client && (
                            <span>Client: {checkBack.blog_post.client.name}</span>
                          )}
                          <span>
                            Scheduled: {new Date(checkBack.scheduled_date).toLocaleDateString()}
                          </span>
                          {checkBack.completed_at && (
                            <span>
                              Completed: {new Date(checkBack.completed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {checkBack.metrics_snapshot && (
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              {checkBack.metrics_snapshot.impressions} impressions
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-4 h-4 text-blue-600" />
                              {checkBack.metrics_snapshot.clicks} clicks
                            </span>
                            <span>
                              Pos: {checkBack.metrics_snapshot.avgPosition?.toFixed(1)}
                            </span>
                          </div>
                        )}
                        {checkBack.error_message && (
                          <p className="text-sm text-red-600 mt-1">
                            Error: {checkBack.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {checkBack.blog_post?.cms_url && (
                        <a href={checkBack.blog_post.cms_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      {checkBack.status === 'pending' && isDue(checkBack.scheduled_date, checkBack.status) && (
                        <Button
                          size="sm"
                          onClick={() => runSingleCheckBack(checkBack.id)}
                          disabled={runningId === checkBack.id}
                        >
                          {runningId === checkBack.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Run Now
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-indigo-900 mb-3">How Check-Backs Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="font-medium text-indigo-900">Day 7</p>
                  <p className="text-indigo-700">Initial indexing check</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="font-medium text-indigo-900">Day 30</p>
                  <p className="text-indigo-700">Early performance</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="font-medium text-indigo-900">Day 60</p>
                  <p className="text-indigo-700">Growth trajectory</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">4</div>
                <div>
                  <p className="font-medium text-indigo-900">Day 90</p>
                  <p className="text-indigo-700">Mature performance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
