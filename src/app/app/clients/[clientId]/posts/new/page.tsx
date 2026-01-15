'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
    ArrowLeft, 
    Sparkles, 
    Loader2, 
    CheckCircle, 
    AlertCircle,
    FileText,
    Target,
    Zap,
    Clock,
    Send,
    Eye,
    Save,
    RefreshCw,
    ChevronRight,
    User,
    Building
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

interface Client {
    id: string
    name: string
    slug?: string
    website_url?: string
    industry?: string
    brand_guides?: Array<{
        product_service_summary?: string
        target_audience?: string
        positioning?: string
        tone_profile?: {
            formality?: number
            playfulness?: number
            voice?: string[]
            tone?: string
        }
    }>
}

interface PipelineStep {
    name: string
    status: 'pending' | 'running' | 'completed' | 'failed'
}

interface GenerationResult {
    blogPost?: {
        title: string
        slug: string
        metaDescription: string
        content: string
        wordCount: number
        seoScore: number
    }
    steps?: PipelineStep[]
    duration?: number
}

export default function NewClientPostPage({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = use(params)
    const router = useRouter()
    
    // Client data
    const [client, setClient] = useState<Client | null>(null)
    const [loadingClient, setLoadingClient] = useState(true)
    
    // Form inputs
    const [topic, setTopic] = useState('')
    const [targetKeyword, setTargetKeyword] = useState('')
    const [wordCountGoal, setWordCountGoal] = useState('1500')
    const [additionalNotes, setAdditionalNotes] = useState('')
    
    // Generation state
    const [generating, setGenerating] = useState(false)
    const [currentStep, setCurrentStep] = useState('')
    const [steps, setSteps] = useState<PipelineStep[]>([
        { name: 'Research', status: 'pending' },
        { name: 'Outline', status: 'pending' },
        { name: 'Draft', status: 'pending' },
        { name: 'SEO Optimization', status: 'pending' },
        { name: 'Fact Check', status: 'pending' },
        { name: 'Enhancement', status: 'pending' },
        { name: 'Voice & Tone Check', status: 'pending' },
    ])
    const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    
    // Post-generation
    const [saving, setSaving] = useState(false)
    const [savedPostId, setSavedPostId] = useState<string | null>(null)

    useEffect(() => {
        fetchClient()
    }, [clientId])

    const fetchClient = async () => {
        setLoadingClient(true)
        try {
            const res = await fetch(`/api/clients/${clientId}`)
            const data = await res.json()
            
            if (data.success && data.client) {
                setClient(data.client)
            } else {
                setError('Client not found')
            }
        } catch (err) {
            console.error('Error fetching client:', err)
            setError('Failed to load client')
        } finally {
            setLoadingClient(false)
        }
    }

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic')
            return
        }

        setGenerating(true)
        setError(null)
        setGenerationResult(null)
        setSavedPostId(null)
        
        // Reset steps
        setSteps(steps.map(s => ({ ...s, status: 'pending' })))

        try {
            const res = await fetch('/api/blog-posts/generate-full', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    targetKeyword: targetKeyword || topic,
                    wordCountGoal: parseInt(wordCountGoal),
                    clientId: client?.id,
                    options: {
                        generateMultipleOutlines: false,
                        skipFactCheck: false,
                        skipEnhancement: false
                    }
                })
            })

            const data = await res.json()

            if (data.success) {
                setGenerationResult(data)
                if (data.steps) {
                    setSteps(data.steps)
                }
            } else {
                setError(data.error || 'Generation failed')
                if (data.steps) {
                    setSteps(data.steps)
                }
            }
        } catch (err: any) {
            console.error('Generation error:', err)
            setError(err.message || 'Generation failed')
        } finally {
            setGenerating(false)
        }
    }

    const handleSaveDraft = async () => {
        if (!generationResult?.blogPost || !client) return
        
        setSaving(true)
        try {
            const res = await fetch('/api/blog-posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: client.id,
                    title: generationResult.blogPost.title,
                    slug: generationResult.blogPost.slug,
                    content: generationResult.blogPost.content,
                    meta_description: generationResult.blogPost.metaDescription,
                    target_keyword: targetKeyword || topic,
                    word_count: generationResult.blogPost.wordCount,
                    seo_quality_score: generationResult.blogPost.seoScore,
                    status: 'draft',
                    approval_status: 'draft'
                })
            })

            const data = await res.json()
            if (data.success && data.post) {
                setSavedPostId(data.post.id)
            } else {
                setError(data.error || 'Failed to save draft')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to save draft')
        } finally {
            setSaving(false)
        }
    }

    const handleSubmitForReview = async () => {
        if (!generationResult?.blogPost || !client) return
        
        setSaving(true)
        try {
            // First save the post if not already saved
            let postId = savedPostId
            
            if (!postId) {
                const createRes = await fetch('/api/blog-posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client_id: client.id,
                        title: generationResult.blogPost.title,
                        slug: generationResult.blogPost.slug,
                        content: generationResult.blogPost.content,
                        meta_description: generationResult.blogPost.metaDescription,
                        target_keyword: targetKeyword || topic,
                        word_count: generationResult.blogPost.wordCount,
                        seo_quality_score: generationResult.blogPost.seoScore,
                        status: 'draft'
                    })
                })
                const createData = await createRes.json()
                if (createData.success && createData.post) {
                    postId = createData.post.id
                    setSavedPostId(postId)
                } else {
                    throw new Error(createData.error || 'Failed to save post')
                }
            }

            // Then showcase to client for review
            const showcaseRes = await fetch(`/api/blog-posts/${postId}/showcase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: client.id,
                    message: `New blog post ready for your review: "${generationResult.blogPost.title}"`
                })
            })

            const showcaseData = await showcaseRes.json()
            if (showcaseData.success) {
                router.push(`/app/posts/${postId}?submitted=true`)
            } else {
                setError(showcaseData.error || 'Failed to submit for review')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit for review')
        } finally {
            setSaving(false)
        }
    }

    const brandGuide = client?.brand_guides?.[0]

    if (loadingClient) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 text-indigo-600 animate-spin" />
                    <p className="text-slate-600">Loading client...</p>
                </div>
            </div>
        )
    }

    if (!client) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full p-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Client Not Found</h2>
                    <p className="text-slate-600 mb-6">{error || 'Could not load client data.'}</p>
                    <Link href="/app/clients">
                        <Button><ArrowLeft className="w-4 h-4 mr-2" />Back to Clients</Button>
                    </Link>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <Link href={`/app/clients/${clientId}/overview`} className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900 mb-2">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to {client.name}
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Create New Blog Post</h1>
                            <p className="text-slate-600">Generate AI-powered content for {client.name}</p>
                        </div>
                        <Badge className="bg-indigo-100 text-indigo-700">
                            <Building className="w-3 h-3 mr-1" />
                            {client.name}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Topic & Keywords */}
                        <Card className="border-0 shadow-lg bg-white">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-600" />
                                    Content Details
                                </CardTitle>
                                <CardDescription>Enter the topic and keywords for your blog post</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="topic">Topic *</Label>
                                    <Input
                                        id="topic"
                                        placeholder="e.g., How AI is Transforming Sales in 2025"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="mt-1"
                                        disabled={generating}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="keyword">Target Keyword</Label>
                                    <Input
                                        id="keyword"
                                        placeholder="e.g., AI sales automation"
                                        value={targetKeyword}
                                        onChange={(e) => setTargetKeyword(e.target.value)}
                                        className="mt-1"
                                        disabled={generating}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Primary keyword for SEO optimization</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="wordCount">Word Count Goal</Label>
                                        <Select value={wordCountGoal} onValueChange={setWordCountGoal} disabled={generating}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="800">~800 words (Short)</SelectItem>
                                                <SelectItem value="1200">~1,200 words (Medium)</SelectItem>
                                                <SelectItem value="1500">~1,500 words (Standard)</SelectItem>
                                                <SelectItem value="2000">~2,000 words (Long)</SelectItem>
                                                <SelectItem value="2500">~2,500 words (Comprehensive)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Any specific points to cover, angle to take, or requirements..."
                                        value={additionalNotes}
                                        onChange={(e) => setAdditionalNotes(e.target.value)}
                                        className="mt-1"
                                        rows={3}
                                        disabled={generating}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Generate Button */}
                        <Button 
                            className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                            onClick={handleGenerate}
                            disabled={generating || !topic.trim()}
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Generate Blog Post
                                </>
                            )}
                        </Button>

                        {/* Error Display */}
                        {error && (
                            <Card className="border-red-200 bg-red-50">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <p className="text-red-700">{error}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Generation Progress */}
                        {(generating || generationResult) && (
                            <Card className="border-0 shadow-lg bg-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-amber-500" />
                                        Generation Progress
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {steps.map((step, index) => (
                                            <div key={step.name} className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                    step.status === 'completed' ? 'bg-green-100' :
                                                    step.status === 'running' ? 'bg-amber-100' :
                                                    step.status === 'failed' ? 'bg-red-100' :
                                                    'bg-slate-100'
                                                }`}>
                                                    {step.status === 'completed' ? (
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                    ) : step.status === 'running' ? (
                                                        <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                                                    ) : step.status === 'failed' ? (
                                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                                    ) : (
                                                        <span className="text-xs text-slate-400">{index + 1}</span>
                                                    )}
                                                </div>
                                                <span className={`font-medium ${
                                                    step.status === 'completed' ? 'text-green-700' :
                                                    step.status === 'running' ? 'text-amber-700' :
                                                    step.status === 'failed' ? 'text-red-700' :
                                                    'text-slate-400'
                                                }`}>
                                                    {step.name}
                                                </span>
                                                {step.status === 'running' && (
                                                    <span className="text-xs text-amber-600 ml-auto">Processing...</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {generationResult?.duration && (
                                        <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-slate-600">
                                            <Clock className="w-4 h-4" />
                                            Completed in {Math.round(generationResult.duration / 1000)}s
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Generated Content Preview */}
                        {generationResult?.blogPost && (
                            <Card className="border-0 shadow-lg bg-white">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-emerald-600" />
                                            Generated Content
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-emerald-100 text-emerald-700">
                                                {generationResult.blogPost.wordCount} words
                                            </Badge>
                                            <Badge className="bg-blue-100 text-blue-700">
                                                SEO: {generationResult.blogPost.seoScore}%
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4 pb-4 border-b">
                                        <h2 className="text-xl font-bold text-slate-800 mb-2">{generationResult.blogPost.title}</h2>
                                        <p className="text-slate-600 italic">{generationResult.blogPost.metaDescription}</p>
                                    </div>
                                    <div 
                                        className="prose prose-slate max-w-none max-h-96 overflow-y-auto"
                                        dangerouslySetInnerHTML={{ __html: generationResult.blogPost.content }}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Action Buttons */}
                        {generationResult?.blogPost && (
                            <div className="flex gap-4">
                                <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={handleSaveDraft}
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save as Draft
                                </Button>
                                <Button 
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={handleSubmitForReview}
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                    Submit for Client Review
                                </Button>
                            </div>
                        )}

                        {savedPostId && (
                            <Card className="border-emerald-200 bg-emerald-50">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                        <span className="text-emerald-700 font-medium">Draft saved successfully!</span>
                                    </div>
                                    <Link href={`/app/posts/${savedPostId}`}>
                                        <Button variant="outline" size="sm">
                                            <Eye className="w-4 h-4 mr-2" />
                                            View Post
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar - Brand Context */}
                    <div className="space-y-6">
                        {/* Brand Snapshot */}
                        <Card className="border-0 shadow-lg bg-white">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="w-5 h-5 text-indigo-600" />
                                    Brand Context
                                </CardTitle>
                                <CardDescription>This info guides the AI generation</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Product/Service</p>
                                    <p className="text-sm text-slate-800 mt-1">
                                        {brandGuide?.product_service_summary || client.industry || 'Not set'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Target Audience</p>
                                    <p className="text-sm text-slate-800 mt-1">
                                        {brandGuide?.target_audience || 'Not set'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Positioning</p>
                                    <p className="text-sm text-slate-800 mt-1">
                                        {brandGuide?.positioning || 'Not set'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tone of Voice</p>
                                    <div className="mt-2 space-y-2">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>Casual</span>
                                                <span>Formal</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-indigo-600" 
                                                    style={{ width: `${(brandGuide?.tone_profile?.formality || 5) * 10}%` }} 
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>Playful</span>
                                                <span>Serious</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-indigo-600" 
                                                    style={{ width: `${(10 - (brandGuide?.tone_profile?.playfulness || 5)) * 10}%` }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Link href={`/app/clients/${clientId}/profile`}>
                                    <Button variant="outline" size="sm" className="w-full mt-2">
                                        Edit Brand Profile
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        {/* AI Generation Info */}
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                            <CardContent className="p-6">
                                <Sparkles className="w-8 h-8 mb-3" />
                                <h3 className="font-bold text-lg mb-2">AI-Powered Generation</h3>
                                <p className="text-sm text-indigo-100 mb-4">
                                    Our 7-step pipeline ensures high-quality, SEO-optimized content aligned with your brand voice.
                                </p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Research & analysis</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>SEO optimization</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Fact checking</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Brand voice alignment</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
