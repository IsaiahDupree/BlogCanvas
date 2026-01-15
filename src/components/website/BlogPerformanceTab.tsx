'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'

interface BlogPostAnalysis {
  url: string
  title: string | null
  wordCount: number
  seoScore: number
  publishedDate: string | null
  issues: string[]
  hasH1: boolean
  hasMetaDescription: boolean
  h2Count: number
  internalLinks: number
  externalLinks: number
  hasImages: boolean
}

interface BlogPerformanceSummary {
  totalBlogPosts: number
  avgScore: number
  avgWordCount: number
  postsWithMeta: number
  postsWithImages: number
  topPerformers: BlogPostAnalysis[]
  poorPerformers: BlogPostAnalysis[]
  gaps: string[]
  benchmarks: {
    avgIndustryScore: number
    recommendedWordCount: number
  }
}

interface BlogPerformanceData {
  auditId: string
  auditDate: string
  baselineScore: number
  pagesIndexed: number
  blogPostsDetected: number
  blogPostsAnalyzed: BlogPostAnalysis[]
  summary: BlogPerformanceSummary | null
}

interface BlogPerformanceTabProps {
  websiteId: string
}

export function BlogPerformanceTab({ websiteId }: BlogPerformanceTabProps) {
  const [loading, setLoading] = useState(true)
  const [blogPerformance, setBlogPerformance] = useState<BlogPerformanceData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBlogPerformance()
  }, [websiteId])

  const fetchBlogPerformance = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/websites/${websiteId}/blog-performance`)
      const data = await response.json()

      if (data.success && data.blogPerformance) {
        setBlogPerformance(data.blogPerformance)
      } else {
        setError(data.message || 'No blog performance data available')
      }
    } catch (err) {
      console.error('Failed to fetch blog performance:', err)
      setError('Failed to load blog performance data')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (error || !blogPerformance) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{error || 'No blog posts detected yet'}</p>
            <p className="text-sm text-gray-500 mt-2">Run an audit to analyze existing blog posts</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { summary } = blogPerformance

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blog Posts Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{blogPerformance.blogPostsDetected}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((blogPerformance.blogPostsDetected / blogPerformance.pagesIndexed) * 100)}% of total pages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average SEO Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(summary?.avgScore || 0)}`}>
              {summary?.avgScore || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Industry avg: {summary?.benchmarks.avgIndustryScore || 75}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Word Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.avgWordCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Recommended: {summary?.benchmarks.recommendedWordCount || 1500}+
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Content Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>With meta:</span>
                <span className="font-semibold">{summary?.postsWithMeta || 0}/{summary?.totalBlogPosts || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>With images:</span>
                <span className="font-semibold">{summary?.postsWithImages || 0}/{summary?.totalBlogPosts || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gaps & Recommendations */}
      {summary && summary.gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Content Gaps & Recommendations</CardTitle>
            <CardDescription>Areas for improvement in your existing blog posts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.gaps.map((gap, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-900">{gap}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      {summary && summary.topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Top Performing Blog Posts
            </CardTitle>
            <CardDescription>Your best optimized blog content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.topPerformers.map((post, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <h4 className="font-semibold text-sm truncate">{post.title || 'Untitled'}</h4>
                      </div>
                      <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline block mb-2 truncate">
                        {post.url}
                      </a>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        <span>{post.wordCount} words</span>
                        <span>•</span>
                        <span>{post.h2Count} headings</span>
                        <span>•</span>
                        <span>{post.internalLinks} internal links</span>
                      </div>
                    </div>
                    <Badge className={getScoreBadge(post.seoScore)}>
                      {post.seoScore}/100
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Poor Performers */}
      {summary && summary.poorPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Posts Needing Improvement
            </CardTitle>
            <CardDescription>Blog posts that need optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.poorPerformers.map((post, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <h4 className="font-semibold text-sm truncate">{post.title || 'Untitled'}</h4>
                      </div>
                      <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline block mb-2 truncate">
                        {post.url}
                      </a>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        <span>{post.wordCount} words</span>
                        <span>•</span>
                        <span>{post.h2Count} headings</span>
                      </div>
                    </div>
                    <Badge className={getScoreBadge(post.seoScore)}>
                      {post.seoScore}/100
                    </Badge>
                  </div>
                  {post.issues.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-medium text-gray-700 mb-2">Issues:</p>
                      <div className="flex flex-wrap gap-2">
                        {post.issues.slice(0, 5).map((issue, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
