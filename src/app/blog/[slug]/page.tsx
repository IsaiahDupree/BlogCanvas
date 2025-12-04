'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Tag, Share2, Bookmark, Twitter, Linkedin, Facebook } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)

    // Mock data - would fetch from API based on slug
    const post = {
        title: 'How AI CRM Transforms Sales Processes',
        slug: 'how-ai-crm-transforms-sales-processes',
        excerpt: 'Discover how AI-powered CRM systems are revolutionizing the way sales teams manage relationships and close deals.',
        content: `
      <h2>The Challenge of Traditional CRM</h2>
      <p>Sales teams struggle with manual data entry, missed follow-ups, and lost opportunities. Traditional CRM systems require constant maintenance and often feel like a burden rather than a help.</p>
      
      <h2>How AI Changes Everything</h2>
      <p>AI-powered CRM systems automatically capture interactions, predict the best time to reach out, and prioritize your most valuable relationships.</p>
      
      <h3>Key Benefits:</h3>
      <ul>
        <li><strong>Automatic Data Entry:</strong> No more manual logging of calls and emails</li>
        <li><strong>Smart Reminders:</strong> AI tells you who to contact and when</li>
        <li><strong>Relationship Scoring:</strong> See which relationships need attention</li>
        <li><strong>Predictive Insights:</strong> Know which deals are likely to close</li>
      </ul>

      <h2>Real Results from Real Teams</h2>
      <p>Companies using AI CRM see 3x more deals closed and save 70% of time previously spent on admin work.</p>

      <blockquote>
        "Our team closed 40% more deals in the first quarter after switching to AI CRM. The automatic follow-ups alone were game-changing." - Sarah M., VP of Sales
      </blockquote>

      <h2>Getting Started with AI CRM</h2>
      <p>The best time to adopt AI CRM is now. Start small, measure results, and scale what works.</p>
    `,
        category: 'CRM',
        tags: ['AI', 'Sales', 'Automation', 'CRM'],
        author: {
            name: 'Sarah Johnson',
            avatar: 'SJ',
            role: 'Head of Content'
        },
        publishDate: 'December 1, 2024',
        readTime: '8 min read',
        views: 1243,
        seo: {
            metaTitle: 'How AI CRM Transforms Sales Processes - Complete Guide 2024',
            metaDescription: 'Discover how AI-powered CRM systems are revolutionizing sales. Learn about automatic data entry, smart reminders, and relationship scoring to close 3x more deals.'
        }
    }

    const relatedPosts = [
        { id: '2', title: 'Ultimate Guide to Sales Automation', slug: 'ultimate-guide-to-sales-automation' },
        { id: '3', title: 'Top 10 CRM Features', slug: 'top-10-crm-features-every-business-needs' }
    ]

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
              prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700"
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
