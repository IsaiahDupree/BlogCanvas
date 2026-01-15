'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Eye,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Calendar,
  User,
  Tag,
  BarChart3,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import BlogPreview from '@/components/BlogPreview'

interface BlogPost {
  id: string
  topic: string
  title?: string
  content?: string
  target_keyword?: string
  status: string
  seo_quality_score?: number
  word_count?: number
  created_at: string
  published_at?: string
  client?: {
    id: string
    name: string
  }
}

export default function BlogPreviewPage() {
  const params = useParams()
  const postId = params.postId as string
  
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchPost()
  }, [postId])

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/blog-posts/${postId}`)
      const data = await res.json()
      if (data.success) {
        setPost(data.post)
      }
    } catch (error) {
      console.error('Failed to fetch post:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/shared/${postId}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'in_review': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-gray-500">Post not found</p>
          <Link href="/app/review">
            <Button className="mt-4">Back to Review</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header Bar */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app/review" className="text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold">Blog Preview</span>
              </div>
              <p className="text-xs text-gray-500">See how this post looks to clients</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={copyShareLink}>
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? 'Copied!' : 'Copy Share Link'}
            </Button>
            <Link href={`/shared/${postId}`} target="_blank">
              <Button size="sm">
                <ExternalLink className="w-4 h-4 mr-1" />
                Open Public Preview
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Preview */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {/* Simulated Blog Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-12 text-white">
                <Badge className={`mb-4 ${getStatusColor(post.status)}`}>
                  {post.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <h1 className="text-3xl font-bold mb-4">
                  {post.title || post.topic}
                </h1>
                <div className="flex items-center gap-6 text-indigo-100 text-sm">
                  {post.client && (
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.client.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                  {post.word_count && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.word_count} words
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-8">
                {post.content ? (
                  <BlogPreview content={post.content} readOnly={true} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">No content generated yet</p>
                    <p className="text-sm">Generate content using the AI pipeline to see a preview</p>
                    <Link href={`/app/batches`}>
                      <Button className="mt-4">Go to Batches</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Post Metadata */}
          <div className="space-y-6">
            {/* SEO Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  SEO Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${
                    (post.seo_quality_score || 0) >= 80 ? 'text-green-600' :
                    (post.seo_quality_score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {post.seo_quality_score || '—'}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">out of 100</p>
                </div>
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      (post.seo_quality_score || 0) >= 80 ? 'bg-green-500' :
                      (post.seo_quality_score || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${post.seo_quality_score || 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Target Keyword */}
            {post.target_keyword && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="w-5 h-5 text-indigo-600" />
                    Target Keyword
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {post.target_keyword}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* Client Info */}
            {post.client && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-600" />
                    Client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{post.client.name}</p>
                  <Link href={`/app/clients/${post.client.id}/overview`}>
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      View Client
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/app/posts/${postId}/history`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="w-4 h-4 mr-2" />
                    View Revision History
                  </Button>
                </Link>
                <Link href={`/app/posts/${postId}/outlines`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Tag className="w-4 h-4 mr-2" />
                    View Outline Options
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={copyShareLink}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share with Client
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
