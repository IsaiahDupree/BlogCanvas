'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, Calendar, Clock, Tag } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { blogPosts } from '@/data/blog-posts'

export default function PublicBlogPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')

    // Data fetched from shared source
    const posts = blogPosts.map(post => ({
        ...post,
        coverImage: post.category === 'Security' ? '/blog/security-update.jpg' :
            post.category === 'CRM' ? '/blog/ai-crm.jpg' :
                post.category === 'Sales' ? '/blog/sales-automation.jpg' :
                    '/blog/crm-features.jpg'
    }))

    const categories = ['All', 'Security', 'CRM', 'Sales', 'Automation', 'Guides']

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
                <div className="max-w-7xl mx-auto px-6 py-20">
                    <div className="max-w-3xl">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Insights & Resources
                        </h1>
                        <p className="text-xl text-blue-100 mb-8">
                            Expert advice on CRM, sales, and business growth. Learn from the best in the industry.
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-2xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 rounded-xl text-gray-900 text-lg outline-none focus:ring-4 focus:ring-white/30 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Categories */}
                <div className="flex gap-3 mb-12 overflow-x-auto pb-2">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category.toLowerCase())}
                            className={`px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap ${selectedCategory === category.toLowerCase()
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Featured Post */}
                {filteredPosts.length > 0 && (
                    <Card className="mb-12 overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-shadow">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-12 flex items-center justify-center">
                                <div className="text-6xl">📊</div>
                            </div>
                            <div className="p-8 md:p-12 flex flex-col justify-center">
                                <Badge className="bg-blue-600 text-white w-fit mb-4">Featured</Badge>
                                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                                    {filteredPosts[0].title}
                                </h2>
                                <p className="text-lg text-gray-600 mb-6">
                                    {filteredPosts[0].excerpt}
                                </p>
                                <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {filteredPosts[0].publishDate}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {filteredPosts[0].readTime}
                                    </div>
                                </div>
                                <Link
                                    href={`/blog/${filteredPosts[0].slug}`}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity w-fit"
                                >
                                    Read Article
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Blog Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.slice(1).map((post) => (
                        <Card key={post.id} className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group">
                            <Link href={`/blog/${post.slug}`}>
                                {/* Image Placeholder */}
                                <div className="h-56 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                    <div className="text-6xl">
                                        {post.category === 'CRM' ? '📈' : post.category === 'Sales' ? '💼' : '⚡'}
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge variant="outline" className="text-xs">{post.category}</Badge>
                                    </div>

                                    <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                        {post.excerpt}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {post.publishDate}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {post.readTime}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {post.tags.slice(0, 3).map((tag, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                                <Tag className="w-3 h-3 mr-1" />
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        </Card>
                    ))}
                </div>

                {filteredPosts.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No articles found</h3>
                        <p className="text-gray-600">Try adjusting your search or category filter</p>
                    </div>
                )}

                {/* Newsletter Signup */}
                <Card className="mt-16 p-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
                        <p className="text-blue-100 mb-6">
                            Get the latest articles and insights delivered to your inbox weekly
                        </p>
                        <div className="flex gap-4 max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-6 py-3 rounded-lg text-gray-900 outline-none"
                            />
                            <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
