'use client'

import Link from 'next/link'
import { Plus, FileText, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  // Mock data - would come from API
  const stats = {
    totalPosts: 127,
    inReview: 8,
    published: 104,
    drafting: 15,
    avgQualityScore: 87,
    thisMonth: 23
  }

  const recentPosts = [
    { id: '1', title: 'How AI CRM Transforms Sales', status: 'published', score: 92, date: '2 hours ago' },
    { id: '2', title: 'Ultimate Guide to Sales Automation', status: 'in_review', score: 85, date: '5 hours ago' },
    { id: '3', title: 'Top 10 CRM Features', status: 'drafting', score: 78, date: '1 day ago' },
    { id: '4', title: 'CRM vs Spreadsheets', status: 'published', score: 88, date: '2 days ago' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BlogCanvas
            </h1>
            <p className="text-sm text-muted-foreground">AI-Powered Content at Scale</p>
          </div>
          <Link
            href="/posts/new"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            Create Blog Post
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border-2 border-blue-100 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats.totalPosts}</h3>
            <p className="text-sm text-muted-foreground">Total Blog Posts</p>
            <p className="text-xs text-green-600 mt-2">+{stats.thisMonth} this month</p>
          </Card>

          <Card className="p-6 bg-white border-2 border-green-100 hover:border-green-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats.published}</h3>
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="text-xs text-gray-500 mt-2">Ready to go live</p>
          </Card>

          <Card className="p-6 bg-white border-2 border-yellow-100 hover:border-yellow-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats.inReview}</h3>
            <p className="text-sm text-muted-foreground">In Review</p>
            <p className="text-xs text-yellow-600 mt-2">Needs attention</p>
          </Card>

          <Card className="p-6 bg-white border-2 border-purple-100 hover:border-purple-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats.avgQualityScore}</h3>
            <p className="text-sm text-muted-foreground">Avg Quality Score</p>
            <p className="text-xs text-purple-600 mt-2">Above target (80)</p>
          </Card>
        </div>

        {/* Recent Posts */}
        <Card className="p-6 bg-white shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Blog Posts</h2>
            <Link href="/posts" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </Link>
          </div>

          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
              >
                <div className="flex-1">
                  <Link href={`/posts/${post.id}/review`} className="group">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{post.date}</p>
                  </Link>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">Quality Score</p>
                    <p className="text-2xl font-bold text-blue-600">{post.score}</p>
                  </div>

                  <Badge
                    variant={
                      post.status === 'published'
                        ? 'default'
                        : post.status === 'in_review'
                          ? 'outline'
                          : 'secondary'
                    }
                    className="px-3 py-1"
                  >
                    {post.status === 'published' && '✓ Published'}
                    {post.status === 'in_review' && '⏱ In Review'}
                    {post.status === 'drafting' && '✏️ Drafting'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/posts/new"
            className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-xl transition-shadow group"
          >
            <Plus className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-2">Create New Post</h3>
            <p className="text-sm text-blue-100">Start a new AI-generated blog post</p>
          </Link>

          <Link
            href="/posts?status=in_review"
            className="p-6 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl hover:shadow-xl transition-shadow group"
          >
            <Clock className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-2">Review Queue</h3>
            <p className="text-sm text-yellow-100">{stats.inReview} posts waiting for review</p>
          </Link>

          <Link
            href="/settings"
            className="p-6 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-xl transition-shadow group"
          >
            <AlertCircle className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-2">Settings</h3>
            <p className="text-sm text-purple-100">Configure quality gates & brand voice</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
