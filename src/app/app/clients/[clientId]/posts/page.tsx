'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  FileText, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  BarChart3,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface BlogPost {
  id: string
  topic: string
  title?: string
  status: string
  seo_quality_score?: number
  target_keyword?: string
  word_count?: number
  created_at: string
  published_at?: string
}

interface Client {
  id: string
  name: string
  website_url?: string
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
  generating: { label: 'Generating', color: 'bg-blue-100 text-blue-800', icon: Clock },
  in_review: { label: 'In Review', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  published: { label: 'Published', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
}

export default function ClientBlogsPage() {
  const params = useParams()
  const clientId = params.clientId as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [clientId])

  const fetchData = async () => {
    try {
      const [clientRes, postsRes] = await Promise.all([
        fetch(`/api/clients/${clientId}`),
        fetch(`/api/clients/${clientId}/posts`)
      ])
      
      const clientData = await clientRes.json()
      const postsData = await postsRes.json()
      
      if (clientData.success) setClient(clientData.client)
      if (postsData.success) setPosts(postsData.posts || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = filter === '' || 
      post.topic.toLowerCase().includes(filter.toLowerCase()) ||
      post.title?.toLowerCase().includes(filter.toLowerCase()) ||
      post.target_keyword?.toLowerCase().includes(filter.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    inReview: posts.filter(p => p.status === 'in_review').length,
    avgScore: posts.filter(p => p.seo_quality_score).length > 0
      ? Math.round(posts.filter(p => p.seo_quality_score).reduce((sum, p) => sum + (p.seo_quality_score || 0), 0) / posts.filter(p => p.seo_quality_score).length)
      : 0
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
          <Link href={`/app/clients/${clientId}/overview`} className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Client Overview
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {client?.name} - Blog Posts
              </h1>
              <p className="text-muted-foreground">
                Tour and preview all blog posts created for this client
              </p>
            </div>
            <Link href={`/app/clients/${clientId}/overview`}>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Posts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">{stats.published}</div>
              <p className="text-sm text-muted-foreground">Published</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-600">{stats.inReview}</div>
              <p className="text-sm text-muted-foreground">In Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-indigo-600">{stats.avgScore}</div>
              <p className="text-sm text-muted-foreground">Avg SEO Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts by topic, title, or keyword..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="generating">Generating</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No blog posts found for this client</p>
              <Link href="/app/batches">
                <Button className="mt-4">Create Content Batch</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => {
              const config = statusConfig[post.status] || statusConfig.draft
              const StatusIcon = config.icon
              
              return (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge className={config.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                      {post.seo_quality_score && (
                        <span className={`text-lg font-bold ${
                          post.seo_quality_score >= 80 ? 'text-green-600' :
                          post.seo_quality_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {post.seo_quality_score}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg line-clamp-2 mt-2">
                      {post.title || post.topic}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {post.target_keyword && (
                      <p className="text-sm text-muted-foreground mb-3">
                        <span className="font-medium">Keyword:</span> {post.target_keyword}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      {post.word_count && <span>{post.word_count} words</span>}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/app/posts/${post.id}/preview`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                      </Link>
                      <Link href={`/shared/${post.id}`} target="_blank">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
