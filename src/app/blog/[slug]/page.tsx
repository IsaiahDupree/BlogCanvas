'use client'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Tag, Twitter, Linkedin, Facebook, Bookmark } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { blogPosts } from '@/data/blog-posts'
import { use } from 'react'

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)
    const post = blogPosts.find(p => p.slug === slug)

    if (!post) {
        notFound()
    }

    const relatedPosts = blogPosts
        .filter(p => p.id !== post.id && (p.category === post.category || post.category === 'Security'))
        .slice(0, 2)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <Link href="/blog" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Blog
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Article Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Badge className="bg-blue-600 text-white">{post.category}</Badge>
                        {post.tags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                            </Badge>
                        ))}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        {post.title}
                    </h1>

                    <p className="text-xl text-gray-600 mb-8">
                        {post.excerpt}
                    </p>

                    {/* Author & Meta */}
                    <div className="flex items-center justify-between pb-8 border-b">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                                {post.author.avatar}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{post.author.name}</p>
                                <p className="text-sm text-gray-600">{post.author.role}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {post.publishDate}
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {post.readTime}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Article Content */}
                <Card className="p-8 md:p-12 bg-white shadow-lg mb-12">
                    <div
                        className="prose prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
              prose-ul:my-6 prose-li:my-2
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700
              prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Sharing */}
                    <div className="mt-12 pt-8 border-t">
                        <p className="text-sm font-semibold text-gray-900 mb-4">Share this article</p>
                        <div className="flex gap-3">
                            <button className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </button>
                            <button className="p-3 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </button>
                            <button className="p-3 rounded-lg bg-blue-800 text-white hover:bg-blue-900 transition-colors">
                                <Facebook className="w-5 h-5" />
                            </button>
                            <button className="p-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors ml-auto">
                                <Bookmark className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Related Posts */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {relatedPosts.map((related) => (
                            <Link key={related.id} href={`/blog/${related.slug}`}>
                                <Card className="p-6 hover:shadow-xl transition-shadow group">
                                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {related.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-2">Read more →</p>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <Card className="p-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to transform your sales process?</h2>
                    <p className="text-blue-100 mb-6">
                        See how AI CRM can help you close more deals and build better relationships
                    </p>
                    <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                        Start Free Trial
                    </button>
                </Card>
            </div>
        </div>
    )
}
