'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface BlogPost {
    id: string
    topic: string
    status: string
    updated_at: string
}

export default function ProjectBoard() {
    const [posts, setPosts] = useState<BlogPost[]>([])

    useEffect(() => {
        // TODO: Implement /api/posts route to fetch all posts
        // For now, mocking or we need to add that route
    }, [])

    // Mock data for visualization
    const mockPosts: BlogPost[] = [
        { id: '1', topic: 'AI in 2024', status: 'drafting', updated_at: new Date().toISOString() },
        { id: '2', topic: 'Email Marketing Tips', status: 'ready_for_review', updated_at: new Date().toISOString() },
        { id: '3', topic: 'SEO Basics', status: 'published', updated_at: new Date().toISOString() },
    ]

    const columns = [
        { id: 'drafting', title: 'Drafting', color: 'bg-blue-100' },
        { id: 'ready_for_review', title: 'Review', color: 'bg-yellow-100' },
        { id: 'approved', title: 'Approved', color: 'bg-green-100' },
        { id: 'published', title: 'Published', color: 'bg-gray-100' }
    ]

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Project Board</h1>
                <Button>New Post</Button>
            </div>

            <div className="grid grid-cols-4 gap-4 h-[calc(100vh-200px)]">
                {columns.map(col => (
                    <div key={col.id} className={`rounded-lg p-4 ${col.color}`}>
                        <h3 className="font-semibold mb-4 uppercase text-xs tracking-wider">{col.title}</h3>
                        <div className="space-y-3">
                            {mockPosts
                                .filter(p => p.status === col.id) // In real app, map statuses correctly
                                .map(post => (
                                    <Link key={post.id} href={`/posts/${post.id}/review`}>
                                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                                            <CardHeader className="p-4 pb-2">
                                                <CardTitle className="text-sm font-medium">{post.topic}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                                                    <span>{new Date(post.updated_at).toLocaleDateString()}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
