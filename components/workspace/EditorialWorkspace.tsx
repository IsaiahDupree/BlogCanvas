'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Section {
    id: string
    section_key: string
    title: string
    content: string
    needs_human: boolean
    human_prompt: string
}

interface Comment {
    id: string
    content: string
    author_name: string
    created_at: string
    section_id?: string
}

interface ReviewTask {
    id: string
    description: string
    status: string
}

export default function EditorialWorkspace() {
    const params = useParams()
    const [data, setData] = useState<any>(null)
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
    const [editedContent, setEditedContent] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [newComment, setNewComment] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (activeSectionId && data) {
            const section = data.sections.find((s: Section) => s.id === activeSectionId)
            if (section) setEditedContent(section.content || '')
        }
    }, [activeSectionId, data])

    const fetchData = async () => {
        const res = await fetch(`/api/posts/${params.id}/review`)
        const json = await res.json()
        setData(json)
        if (json.sections?.length > 0 && !activeSectionId) {
            setActiveSectionId(json.sections[0].id)
        }
    }

    const handleSaveSection = async () => {
        if (!activeSectionId) return
        setIsSaving(true)
        try {
            await fetch(`/api/posts/${params.id}/sections/${activeSectionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editedContent })
            })
            // Refresh local data
            const updatedSections = data.sections.map((s: Section) =>
                s.id === activeSectionId ? { ...s, content: editedContent } : s
            )
            setData({ ...data, sections: updatedSections })
        } catch (error) {
            console.error('Failed to save', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddComment = async () => {
        if (!newComment.trim()) return
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blog_post_id: params.id,
                    section_id: activeSectionId,
                    content: newComment,
                    author_name: 'Editor' // TODO: Get from auth
                })
            })
            const comment = await res.json()
            setData({ ...data, comments: [...data.comments, comment] })
            setNewComment('')
        } catch (error) {
            console.error('Failed to add comment', error)
        }
    }

    if (!data) return <div className="p-8">Loading workspace...</div>

    const activeSection = data.sections.find((s: Section) => s.id === activeSectionId)
    const activeComments = data.comments.filter((c: Comment) =>
        // Show post-level comments or section-specific ones
        !c.section_id || c.section_id === activeSectionId
    )

    return (
        <div className="flex h-screen bg-background">
            {/* Left Sidebar: Sections */}
            <div className="w-64 border-r bg-muted/10 flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="font-semibold truncate">{data.post.topic}</h2>
                    <Badge variant={data.post.status === 'approved' ? 'default' : 'secondary'} className="mt-2">
                        {data.post.status}
                    </Badge>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {data.sections.map((section: Section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSectionId(section.id)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${activeSectionId === section.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                                    }`}
                            >
                                <div className="font-medium truncate">{section.title || section.section_key}</div>
                                {section.needs_human && (
                                    <span className="text-xs text-yellow-600">Needs Input</span>
                                )}
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Center: Editor */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-medium">{activeSection?.title || 'Select a section'}</h3>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => fetchData()}
                        >
                            Refresh
                        </Button>
                        <Button
                            onClick={handleSaveSection}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
                <div className="flex-1 p-6 overflow-auto">
                    {activeSection ? (
                        <div className="max-w-3xl mx-auto space-y-4">
                            {activeSection.human_prompt && (
                                <Card className="bg-yellow-50 border-yellow-200">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm font-medium text-yellow-800">
                                            AI Request: {activeSection.human_prompt}
                                        </CardTitle>
                                    </CardHeader>
                                </Card>
                            )}
                            <Textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="min-h-[500px] font-mono text-base resize-none p-6 leading-relaxed"
                                placeholder="Write your content here..."
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Select a section to start editing
                        </div>
                    )}
                </div>
            </div>

            {/* Right Sidebar: Comments & Tasks */}
            <div className="w-80 border-l bg-muted/10 flex flex-col">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Comments & Tasks</h3>
                </div>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {/* Review Tasks */}
                        {data.tasks.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Tasks</h4>
                                {data.tasks.map((task: ReviewTask) => (
                                    <Card key={task.id} className="p-3 text-sm">
                                        <div className="flex items-start gap-2">
                                            <input type="checkbox" className="mt-1" checked={task.status === 'resolved'} readOnly />
                                            <span>{task.description}</span>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        <Separator />

                        {/* Comments */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground">Comments</h4>
                            {activeComments.length === 0 && (
                                <div className="text-sm text-muted-foreground italic">No comments yet.</div>
                            )}
                            {activeComments.map((comment: Comment) => (
                                <div key={comment.id} className="bg-background p-3 rounded-lg border text-sm space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span className="font-medium text-foreground">{comment.author_name}</span>
                                        <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p>{comment.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollArea>
                <div className="p-4 border-t bg-background">
                    <div className="space-y-2">
                        <Textarea
                            placeholder="Add a comment..."
                            className="min-h-[80px] text-sm"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <Button size="sm" className="w-full" onClick={handleAddComment}>Post Comment</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
