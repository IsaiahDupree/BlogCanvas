'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Eye, MousePointerClick, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TopPost {
    postId: string
    topic: string
    publishedAt: string
    impressions: number
    clicks: number
    ctr: number
    avgPosition: number
    seoScore: number
    snapshotDate: string
}

interface TopPerformingPostsProps {
    clientId?: string
    limit?: number
}

export default function TopPerformingPosts({ clientId, limit = 5 }: TopPerformingPostsProps) {
    const [posts, setPosts] = useState<TopPost[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchTopPosts()
    }, [clientId, limit])

    const fetchTopPosts = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({ limit: limit.toString() })
            if (clientId) params.append('clientId', clientId)

            const response = await fetch(`/api/analytics/top-posts?${params}`)
            const result = await response.json()

            if (result.success) {
                setPosts(result.posts || [])
                setError(null)
            } else {
                setError(result.error || 'Failed to fetch top posts')
            }
        } catch (err) {
            setError('Failed to load top performing posts')
            console.error('Top posts fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 text-green-700 border-green-200'
        if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
        return 'bg-red-100 text-red-700 border-red-200'
    }

    const getPositionColor = (position: number) => {
        if (position <= 3) return 'text-green-600'
        if (position <= 10) return 'text-yellow-600'
        return 'text-gray-600'
    }

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                    <h2 className="text-xl font-bold">Top Performing Posts</h2>
                </div>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-600 text-sm">Loading performance data...</span>
                </div>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="p-6 border-yellow-200 bg-yellow-50">
                <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                    <h2 className="text-xl font-bold">Top Performing Posts</h2>
                </div>
                <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm text-gray-600">{error}</p>
                </div>
            </Card>
        )
    }

    if (posts.length === 0) {
        return (
            <Card className="p-6 border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                    <h2 className="text-xl font-bold">Top Performing Posts</h2>
                </div>
                <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                    <div>
                        <p className="font-semibold text-gray-900">No Performance Data Yet</p>
                        <p className="text-sm text-gray-600">
                            Post performance will appear here after publishing and first check-back
                        </p>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-6 bg-white shadow-xl">
            <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div className="flex-1">
                    <h2 className="text-2xl font-bold">Top Performing Posts</h2>
                    <p className="text-sm text-gray-600">Based on search impressions and engagement</p>
                </div>
            </div>

            <div className="space-y-3">
                {posts.map((post, index) => (
                    <Link key={post.postId} href={`/portal/posts/${post.postId}`}>
                        <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/30 transition-all group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-bold">
                                            #{index + 1}
                                        </Badge>
                                        <Badge className={`${getScoreColor(post.seoScore)} text-xs`}>
                                            SEO: {post.seoScore}/100
                                        </Badge>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                        {post.topic}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Published {new Date(post.publishedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-indigo-600 mb-1">
                                        <Eye className="w-3 h-3" />
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">
                                        {post.impressions.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">Views</p>
                                </div>

                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                                        <MousePointerClick className="w-3 h-3" />
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">
                                        {post.clicks.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">Clicks</p>
                                </div>

                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                                        <BarChart3 className="w-3 h-3" />
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">
                                        {post.ctr.toFixed(1)}%
                                    </p>
                                    <p className="text-xs text-gray-500">CTR</p>
                                </div>

                                <div className="text-center">
                                    <p className={`text-lg font-bold ${getPositionColor(post.avgPosition)}`}>
                                        #{post.avgPosition.toFixed(1)}
                                    </p>
                                    <p className="text-xs text-gray-500">Position</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t text-center">
                <p className="text-xs text-gray-500">
                    Last updated: {new Date(posts[0]?.snapshotDate).toLocaleDateString()}
                </p>
            </div>
        </Card>
    )
}
