'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Tag, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PortalPostReviewPage({ params }: { params: Promise<{ postId: string }> }) {
    const { postId } = use(params)
    const [comment, setComment] = useState('')
    const [changeRequest, setChangeRequest] = useState('')
    const [showChangeModal, setShowChangeModal] = useState(false)

    // Mock data - would fetch from API filtered by client_id
    const post = {
        id: postId,
        title: 'How AI CRM Transforms Sales Processes',
        status: 'ready_for_review',
        targetKeyword: 'AI CRM',
        wordCount: 1543,
        readTime: '8 min read',
        plannedPublishDate: 'December 10, 2024',
        lastUpdated: '2 hours ago',
        updatedBy: 'Sarah Johnson (Agency)',

        content: `
      <h2>The Challenge of Traditional CRM</h2>
      <p>Sales teams across industries face a common struggle: managing relationships at scale while maintaining the personal touch that closes deals. Traditional CRM systems, while better than spreadsheets, still require constant manual data entry and often feel like a burden rather than a help.</p>
      
      <p>The result? Missed follow-ups, lost opportunities, and sales reps spending 65% of their time on administrative tasks instead of selling.</p>

      <h2>How AI Changes Everything</h2>
      <p>AI-powered CRM systems fundamentally change this dynamic. Instead of you working for the CRM, the CRM works for you.</p>

      <h3>Automatic Data Capture</h3>
      <p>Every email, call, and meeting is automatically logged. No more manual entry. The AI reads your communications and updates records in real-time.</p>

      <h3>Smart Reminders</h3>
      <p>The system learns when to reach out based on your past successful interactions. It knows that Sarah prefers Tuesday mornings and Bob responds best to Thursday afternoon check-ins.</p>

      <h3>Relationship Scoring</h3>
      <p>Each contact gets a health score from 0-100 based on engagement frequency, response rates, and deal velocity. You instantly see which relationships need attention.</p>

      <h2>Real Results from Real Companies</h2>
      <p>Companies using AI CRM see measurable improvements:</p>
      <ul>
        <li><strong>3x more deals closed</strong> - by focusing on high-probability opportunities</li>
        <li><strong>70% time saved</strong> - on data entry and admin work</li>
        <li><strong>40% higher response rates</strong> - from perfectly timed outreach</li>
      </ul>

      <blockquote>
        "Our team closed 40% more deals in the first quarter after switching to AI CRM. The automatic follow-ups alone were game-changing. We never let a hot lead go cold again." - Sarah Martinez, VP of Sales at TechCorp
      </blockquote>

      <h2>Getting Started with AI CRM</h2>
      <p>The best time to adopt AI CRM is now. Start small, measure results, and scale what works. Most teams see ROI within 60 days.</p>

      <p>Ready to transform how your team sells? <a href="#">Start your free trial today</a>.</p>
    `,

        reviewTasks: [
            {
                id: 't1',
                section: 'Real Results',
                prompt: 'Can you provide a specific customer success story with actual numbers?',
                status: 'open'
            }
        ],

        comments: [
            {
                id: 'c1',
                author: 'Sarah Johnson',
                role: 'Agency',
                content: 'Updated the intro to be more compelling based on your feedback!',
                time: '2 hours ago'
            }
        ]
    }

    const handleApprove = () => {
        if (confirm('Are you sure you want to approve this post for publishing?')) {
            alert('Post approved! Your agency will handle the publishing.')
            window.location.href = '/portal/dashboard'
        }
    }

    const handleRequestChanges = () => {
        if (!changeRequest.trim()) {
            alert('Please describe the changes you need')
            return
        }

        alert('Changes requested! Your agency will be notified.')
        setShowChangeModal(false)
        window.location.href = '/portal/dashboard'
    }

    const handleAddComment = () => {
        if (!comment.trim()) return

        alert('Comment added!')
        setComment('')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <Link href="/portal/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900 mb-3">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>

                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                                    Needs Your Review
                                </Badge>
                                <Badge variant="outline">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {post.targetKeyword}
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {post.readTime}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Planned: {post.plannedPublishDate}
                        </span>
                        <span>{post.wordCount} words</span>
                        <span className="text-muted-foreground">Last updated {post.lastUpdated} by {post.updatedBy}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    <Card className="p-8 md:p-12 bg-white shadow-lg">
                        <div
                            className="prose prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-gray-900
                prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-6
                prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
                prose-ul:my-6 prose-li:my-2
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-blockquote:border-l-4 prose-blockquote:border-indigo-600 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700
                prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Action Buttons */}
                    <Card className="p-6 bg-white shadow-lg sticky top-24">
                        <h3 className="font-bold text-lg mb-4">Your Decision</h3>

                        <button
                            onClick={handleApprove}
                            className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2 mb-3"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Approve Post
                        </button>

                        <button
                            onClick={() => setShowChangeModal(true)}
                            className="w-full px-6 py-4 bg-white border-2 border-yellow-500 text-yellow-700 rounded-lg font-semibold hover:bg-yellow-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <AlertCircle className="w-5 h-5" />
                            Request Changes
                        </button>

                        <p className="text-xs text-muted-foreground mt-4 text-center">
                            Your agency will be notified immediately
                        </p>
                    </Card>

                    {/* Review Tasks */}
                    {post.reviewTasks.length > 0 && (
                        <Card className="p-6 bg-white shadow-lg">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                                Needs Your Input
                            </h3>

                            {post.reviewTasks.map((task) => (
                                <div key={task.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
                                    <p className="text-sm font-semibold text-gray-900 mb-2">Section: {task.section}</p>
                                    <p className="text-sm text-gray-700 mb-3">{task.prompt}</p>
                                    <textarea
                                        placeholder="Your response..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                                    />
                                    <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                        Submit Response
                                    </button>
                                </div>
                            ))}
                        </Card>
                    )}

                    {/* Comments */}
                    <Card className="p-6 bg-white shadow-lg">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Comments ({post.comments.length})
                        </h3>

                        <div className="space-y-4 mb-4">
                            {post.comments.map((c) => (
                                <div key={c.id} className="pb-4 border-b border-gray-100 last:border-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-sm">{c.author}</span>
                                        <Badge variant="outline" className="text-xs">{c.role}</Badge>
                                    </div>
                                    <p className="text-sm text-gray-700">{c.content}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{c.time}</p>
                                </div>
                            ))}
                        </div>

                        <div>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none mb-2"
                            />
                            <button
                                onClick={handleAddComment}
                                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                            >
                                Add Comment
                            </button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Change Request Modal */}
            {showChangeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
                    <Card className="p-8 bg-white max-w-lg w-full">
                        <h2 className="text-2xl font-bold mb-4">Request Changes</h2>
                        <p className="text-muted-foreground mb-6">
                            Describe what needs to be changed. Your agency will review and update the post.
                        </p>

                        <textarea
                            value={changeRequest}
                            onChange={(e) => setChangeRequest(e.target.value)}
                            placeholder="Please describe the changes needed..."
                            rows={6}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none mb-4"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={handleRequestChanges}
                                className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
                            >
                                Submit Request
                            </button>
                            <button
                                onClick={() => setShowChangeModal(false)}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
