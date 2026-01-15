'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { 
    FileText, 
    Calendar, 
    User,
    AlertCircle,
    Loader2,
    ExternalLink
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PublicPost {
    id: string
    title: string
    content: string
    seo_title?: string
    seo_description?: string
    featured_image_url?: string
    created_at: string
    updated_at: string
    client_name?: string
    vendor_name?: string
}

export default function PublicPostPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params)
    const [post, setPost] = useState<PublicPost | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchPost()
    }, [token])

    const fetchPost = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/shared/post/${token}`)
            const data = await res.json()
            
            if (data.success) {
                setPost(data.post)
            } else {
                setError(data.error || 'Content not available')
            }
        } catch (err) {
            console.error('Error fetching public post:', err)
            setError('Failed to load content')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 mx-auto mb-4 text-indigo-600 animate-spin" />
                    <p className="text-slate-600">Loading content...</p>
                </div>
            </div>
        )
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full border-0 shadow-xl bg-white/90">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Content Not Available</h2>
                        <p className="text-slate-600 mb-6">
                            {error || 'This content is not publicly accessible or the link has expired.'}
                        </p>
                        <Link href="/">
                            <Button variant="outline">
                                Go to BlogCanvas
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Shared Content</p>
                                <p className="font-semibold text-slate-700">BlogCanvas</p>
                            </div>
                        </div>
                        <Link href="/" target="_blank">
                            <Button variant="outline" size="sm">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Learn More
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                <article>
                    {/* Title & Meta */}
                    <header className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                            {post.seo_title || post.title}
                        </h1>
                        {post.seo_description && (
                            <p className="text-lg text-slate-600 mb-4">{post.seo_description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            {post.vendor_name && (
                                <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {post.vendor_name}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(post.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </header>

                    {/* Featured Image */}
                    {post.featured_image_url && (
                        <div className="mb-8">
                            <img 
                                src={post.featured_image_url} 
                                alt={post.title}
                                className="w-full h-auto rounded-xl shadow-lg"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <Card className="border-0 shadow-lg bg-white/90">
                        <CardContent className="p-8">
                            <div 
                                className="prose prose-slate prose-lg max-w-none
                                    prose-headings:text-slate-800 
                                    prose-p:text-slate-600 
                                    prose-a:text-indigo-600 
                                    prose-strong:text-slate-700
                                    prose-ul:text-slate-600
                                    prose-ol:text-slate-600"
                                dangerouslySetInnerHTML={{ __html: post.content || '<p>No content available.</p>' }}
                            />
                        </CardContent>
                    </Card>
                </article>
            </main>

            {/* Footer */}
            <footer className="bg-white/60 border-t border-slate-200 mt-12">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-slate-600">
                                Powered by <span className="font-semibold text-indigo-600">BlogCanvas</span>
                            </span>
                        </div>
                        <p className="text-sm text-slate-500">
                            AI-Powered SEO Content Platform
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
