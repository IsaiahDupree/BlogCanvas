'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
    ArrowLeft, 
    Send, 
    Loader2, 
    CheckCircle,
    FileText,
    Layers,
    Mail,
    MoreHorizontal,
    Paperclip,
    AlertCircle,
    User
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface UserProfile {
    id: string
    full_name: string
    email: string
}

export default function RequestContentPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [contentType, setContentType] = useState('')
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [priority, setPriority] = useState('normal')

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/portal/profile')
            const data = await res.json()
            if (data.success) {
                setProfile(data.profile)
            }
        } catch (err) {
            console.error('Error fetching profile:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!contentType || !message.trim()) {
            setError('Please select a content type and enter a message')
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            const res = await fetch('/api/content-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content_type: contentType,
                    title: title || undefined,
                    message,
                    priority
                })
            })

            const data = await res.json()

            if (data.success) {
                setSuccess(true)
                setTimeout(() => {
                    router.push('/portal/dashboard')
                }, 2000)
            } else {
                setError(data.error || 'Failed to submit request')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit request')
        } finally {
            setSubmitting(false)
        }
    }

    const contentTypes = [
        { value: 'blog_post', label: 'Blog Post', icon: FileText, description: 'A single blog article' },
        { value: 'batch', label: 'Content Batch', icon: Layers, description: 'Multiple related posts' },
        { value: 'newsletter', label: 'Newsletter', icon: Mail, description: 'Email newsletter content' },
        { value: 'other', label: 'Other', icon: MoreHorizontal, description: 'Custom content request' }
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full border-0 shadow-xl">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Request Submitted!</h2>
                        <p className="text-slate-600 mb-4">
                            Your content request has been sent to your vendor. They'll get back to you soon.
                        </p>
                        <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <Link href="/portal/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900 mb-2">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Request New Content</h1>
                    <p className="text-slate-600">Tell us what content you need</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8">
                <form onSubmit={handleSubmit}>
                    <Card className="border-0 shadow-lg mb-6">
                        <CardHeader>
                            <CardTitle>Your Information</CardTitle>
                            <CardDescription>This will be included with your request</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Name</Label>
                                    <div className="mt-1 flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-700">{profile?.full_name || 'Not set'}</span>
                                    </div>
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <div className="mt-1 flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-700">{profile?.email || 'Not set'}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg mb-6">
                        <CardHeader>
                            <CardTitle>Content Type *</CardTitle>
                            <CardDescription>What type of content do you need?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                {contentTypes.map((type) => {
                                    const Icon = type.icon
                                    return (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setContentType(type.value)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                                contentType === type.value
                                                    ? 'border-indigo-600 bg-indigo-50'
                                                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <Icon className={`w-6 h-6 mb-2 ${
                                                contentType === type.value ? 'text-indigo-600' : 'text-slate-500'
                                            }`} />
                                            <h3 className={`font-semibold ${
                                                contentType === type.value ? 'text-indigo-900' : 'text-slate-800'
                                            }`}>
                                                {type.label}
                                            </h3>
                                            <p className="text-sm text-slate-500">{type.description}</p>
                                        </button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg mb-6">
                        <CardHeader>
                            <CardTitle>Request Details</CardTitle>
                            <CardDescription>Describe what you need</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title (Optional)</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Q1 Marketing Content"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="message">Message *</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Describe the content you need, including any topics, keywords, or specific requirements..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="mt-1 min-h-[150px]"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="priority">Priority</Label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low - No rush</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="high">High - Needed soon</SelectItem>
                                        <SelectItem value="urgent">Urgent - ASAP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {error && (
                        <Card className="border-red-200 bg-red-50 mb-6">
                            <CardContent className="p-4 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <p className="text-red-700">{error}</p>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex gap-4">
                        <Link href="/portal/dashboard" className="flex-1">
                            <Button type="button" variant="outline" className="w-full">
                                Cancel
                            </Button>
                        </Link>
                        <Button 
                            type="submit" 
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                            disabled={submitting || !contentType || !message.trim()}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Submit Request
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
