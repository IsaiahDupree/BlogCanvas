'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Globe, 
    FileText, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    Download,
    FileDown,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Image as ImageIcon,
    ExternalLink,
    Terminal,
    X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TerminalViewer } from '@/components/workflow/terminal-viewer'

interface ScrapingProgress {
    stage: 'idle' | 'scraping' | 'analyzing' | 'generating' | 'complete'
    progress: number
    message: string
    currentPage?: number
    totalPages?: number
}

interface BlogPost {
    id: string
    title: string
    angle: string
    targetKeyword: string
    estimatedTraffic: number
    difficulty: number
    content?: string
    imageUrl?: string
    seoScore?: number
    wordCount?: number
}

interface AnalysisResult {
    seoScore: number
    topicGaps: Array<{
        cluster: string
        gap: string
        priority: 'high' | 'medium' | 'low'
    }>
    suggestedBlogs: BlogPost[]
    totalBlogs: number
}

export default function OnePageWorkflowPage() {
    const router = useRouter()
    const [inputMethod, setInputMethod] = useState<'url' | 'prd'>('url')
    const [websiteUrl, setWebsiteUrl] = useState('')
    const [prdText, setPrdText] = useState('')
    const [scrapingProgress, setScrapingProgress] = useState<ScrapingProgress>({
        stage: 'idle',
        progress: 0,
        message: 'Ready to start'
    })
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
    const [currentBlogIndex, setCurrentBlogIndex] = useState(0)
    const [generatedBlogs, setGeneratedBlogs] = useState<BlogPost[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentJobId, setCurrentJobId] = useState<string | undefined>()
    const [showTerminal, setShowTerminal] = useState(false)

    const handleScrapeAndAnalyze = async () => {
        if (inputMethod === 'url' && !websiteUrl.trim()) {
            setError('Please enter a website URL')
            return
        }
        if (inputMethod === 'prd' && !prdText.trim()) {
            setError('Please paste your PRD')
            return
        }

        setError(null)
        setScrapingProgress({
            stage: 'scraping',
            progress: 0,
            message: 'Starting website analysis...'
        })

        try {
            // Step 1: Scrape website or parse PRD
            if (inputMethod === 'url') {
                await scrapeWebsite(websiteUrl)
            } else {
                await parsePRD(prdText)
            }

            // Step 2: Run SEO gap analysis
            setScrapingProgress({
                stage: 'analyzing',
                progress: 50,
                message: 'Analyzing SEO gaps and topic coverage...'
            })

            const analysis = await runGapAnalysis(websiteUrl || prdText)
            setAnalysisResult(analysis)

            // Step 3: Use blog suggestions from analysis (or generate if not present)
            setScrapingProgress({
                stage: 'generating',
                progress: 75,
                message: 'Generating blog titles and angles...'
            })

            let blogs: BlogPost[] = []
            if (analysis.suggestedBlogs && analysis.suggestedBlogs.length > 0) {
                // Use suggestions from gap analysis
                blogs = analysis.suggestedBlogs.map((blog: any) => ({
                    id: blog.id,
                    title: blog.title,
                    angle: blog.angle,
                    targetKeyword: blog.targetKeyword,
                    estimatedTraffic: blog.estimatedTraffic,
                    difficulty: blog.difficulty
                }))
            } else {
                // Fallback to separate API call
                blogs = await generateBlogSuggestions(analysis)
            }
            setGeneratedBlogs(blogs)

            setScrapingProgress({
                stage: 'complete',
                progress: 100,
                message: 'Analysis complete!'
            })

        } catch (err: any) {
            setError(err.message || 'An error occurred during analysis')
            setScrapingProgress({
                stage: 'idle',
                progress: 0,
                message: 'Error occurred'
            })
        }
    }

    const scrapeWebsite = async (url: string) => {
        setScrapingProgress({
            stage: 'scraping',
            progress: 10,
            message: 'Connecting to website...',
            currentPage: 0,
            totalPages: 0
        })

        const response = await fetch('/api/websites/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        })

        if (!response.ok) {
            throw new Error('Failed to scrape website')
        }

        const data = await response.json()

        // Simulate progress updates
        for (let i = 10; i <= 40; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 500))
            setScrapingProgress({
                stage: 'scraping',
                progress: i,
                message: `Scraping pages... ${i}%`,
                currentPage: Math.floor(i / 10),
                totalPages: 10
            })
        }

        return data
    }

    const parsePRD = async (prd: string) => {
        setScrapingProgress({
            stage: 'scraping',
            progress: 20,
            message: 'Parsing PRD document...'
        })

        // Simulate PRD parsing
        await new Promise(resolve => setTimeout(resolve, 1000))

        setScrapingProgress({
            stage: 'scraping',
            progress: 40,
            message: 'PRD parsed successfully'
        })

        return { success: true, prd }
    }

    const runGapAnalysis = async (input: string): Promise<AnalysisResult> => {
        // Call gap analysis API
        const response = await fetch('/api/workflow/gap-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input, inputType: inputMethod })
        })

        if (!response.ok) {
            throw new Error('Failed to run gap analysis')
        }

        const data = await response.json()
        
        // Store job ID for terminal viewing
        if (data.jobId) {
            setCurrentJobId(data.jobId)
            setShowTerminal(true)
        }

        return data
    }

    const generateBlogSuggestions = async (analysis: AnalysisResult): Promise<BlogPost[]> => {
        const response = await fetch('/api/workflow/generate-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis })
        })

        if (!response.ok) {
            throw new Error('Failed to generate blog suggestions')
        }

        const data = await response.json()
        return data.blogs || []
    }

    const handleGenerateAllBlogs = async () => {
        if (!analysisResult || generatedBlogs.length === 0) return

        setIsGenerating(true)
        setError(null)

        try {
            const response = await fetch('/api/workflow/generate-blogs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blogs: generatedBlogs,
                    includeImages: true,
                    humanTone: true
                })
            })

            if (!response.ok) {
                throw new Error('Failed to generate blogs')
            }

            const data = await response.json()
            setGeneratedBlogs(data.blogs || generatedBlogs)

        } catch (err: any) {
            setError(err.message || 'Failed to generate blogs')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleExportToGoogleDocs = async () => {
        if (generatedBlogs.length === 0) return

        try {
            const response = await fetch('/api/workflow/export-google-docs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blogs: generatedBlogs })
            })

            if (!response.ok) {
                throw new Error('Failed to export to Google Docs')
            }

            const data = await response.json()
            if (data.folderUrl) {
                window.open(data.folderUrl, '_blank')
            }

        } catch (err: any) {
            setError(err.message || 'Failed to export to Google Docs')
        }
    }

    const handleDownloadAll = async (format: 'pdf' | 'docx' | 'markdown') => {
        if (generatedBlogs.length === 0) return

        try {
            const response = await fetch(`/api/workflow/export?format=${format}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blogs: generatedBlogs })
            })

            if (!response.ok) {
                throw new Error(`Failed to download ${format}`)
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `blogs-${new Date().toISOString()}.${format === 'markdown' ? 'md' : format}`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)

        } catch (err: any) {
            setError(err.message || `Failed to download ${format}`)
        }
    }

    const nextBlog = () => {
        setCurrentBlogIndex((prev) => 
            prev < generatedBlogs.length - 1 ? prev + 1 : 0
        )
    }

    const prevBlog = () => {
        setCurrentBlogIndex((prev) => 
            prev > 0 ? prev - 1 : generatedBlogs.length - 1
        )
    }

    const currentBlog = generatedBlogs[currentBlogIndex]

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        One-Page SEO Workflow
                    </h1>
                    <p className="text-gray-600">
                        Input your website or PRD, get complete SEO analysis and generated blogs
                    </p>
                </div>

                {/* Input Section */}
                <Card className="border-2 border-indigo-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                            Step 1: Input Source
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as 'url' | 'prd')}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="url">
                                    <Globe className="w-4 h-4 mr-2" />
                                    Website URL
                                </TabsTrigger>
                                <TabsTrigger value="prd">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Paste PRD
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="url" className="space-y-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Website URL
                                    </label>
                                    <Input
                                        type="url"
                                        placeholder="https://example.com"
                                        value={websiteUrl}
                                        onChange={(e) => setWebsiteUrl(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </TabsContent>
                            <TabsContent value="prd" className="space-y-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Paste your PRD
                                    </label>
                                    <Textarea
                                        placeholder="Paste your Product Requirements Document here..."
                                        value={prdText}
                                        onChange={(e) => setPrdText(e.target.value)}
                                        className="w-full min-h-[300px] font-mono text-sm"
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                                <AlertCircle className="w-5 h-5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            onClick={handleScrapeAndAnalyze}
                            disabled={scrapingProgress.stage !== 'idle' && scrapingProgress.stage !== 'complete'}
                            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
                            size="lg"
                        >
                            {scrapingProgress.stage === 'idle' ? (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Start Analysis
                                </>
                            ) : scrapingProgress.stage === 'complete' ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Re-run Analysis
                                </>
                            ) : (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Terminal Viewer */}
                {showTerminal && currentJobId && (
                    <Card className="border-2 border-blue-200">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Terminal className="w-5 h-5 text-blue-600" />
                                    Live Workflow Logs
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowTerminal(false)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TerminalViewer 
                                jobId={currentJobId}
                                onComplete={() => {
                                    setScrapingProgress({
                                        stage: 'complete',
                                        progress: 100,
                                        message: 'Analysis complete!'
                                    })
                                }}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Progress Bar */}
                {scrapingProgress.stage !== 'idle' && scrapingProgress.stage !== 'complete' && !showTerminal && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{scrapingProgress.message}</span>
                                    <span className="text-gray-600">{scrapingProgress.progress}%</span>
                                </div>
                                <Progress value={scrapingProgress.progress} className="h-2" />
                                {scrapingProgress.currentPage !== undefined && (
                                    <div className="text-xs text-gray-500">
                                        Page {scrapingProgress.currentPage} of {scrapingProgress.totalPages}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Analysis Results */}
                {analysisResult && scrapingProgress.stage === 'complete' && (
                    <Card className="border-2 border-green-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                Step 2: Analysis Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-indigo-50 rounded-lg">
                                    <div className="text-sm text-gray-600">Current SEO Score</div>
                                    <div className="text-3xl font-bold text-indigo-600">
                                        {analysisResult.seoScore}
                                    </div>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <div className="text-sm text-gray-600">Topic Gaps Found</div>
                                    <div className="text-3xl font-bold text-purple-600">
                                        {analysisResult.topicGaps.length}
                                    </div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="text-sm text-gray-600">Blogs Suggested</div>
                                    <div className="text-3xl font-bold text-green-600">
                                        {analysisResult.totalBlogs}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">High Priority Gaps</h3>
                                <div className="space-y-2">
                                    {analysisResult.topicGaps
                                        .filter(g => g.priority === 'high')
                                        .slice(0, 5)
                                        .map((gap, idx) => (
                                            <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <div className="font-medium text-red-900">{gap.cluster}</div>
                                                <div className="text-sm text-red-700">{gap.gap}</div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Blog Generation Section */}
                {generatedBlogs.length > 0 && (
                    <Card className="border-2 border-purple-200">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                    Step 3: Generated Blogs ({generatedBlogs.length})
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleGenerateAllBlogs}
                                        disabled={isGenerating}
                                        variant="outline"
                                        size="sm"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Generate All Content
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleExportToGoogleDocs}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Export to Google Docs
                                    </Button>
                                    <Button
                                        onClick={() => handleDownloadAll('pdf')}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download PDF
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Carousel */}
                            <div className="relative">
                                <div className="bg-white rounded-lg border-2 border-gray-200 p-6 min-h-[500px]">
                                    {currentBlog && (
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="outline">
                                                            {currentBlogIndex + 1} of {generatedBlogs.length}
                                                        </Badge>
                                                        <Badge>
                                                            {currentBlog.estimatedTraffic} est. traffic
                                                        </Badge>
                                                        <Badge variant="secondary">
                                                            Difficulty: {currentBlog.difficulty}/10
                                                        </Badge>
                                                    </div>
                                                    <h2 className="text-2xl font-bold mb-2">
                                                        {currentBlog.title}
                                                    </h2>
                                                    <p className="text-gray-600 mb-4">
                                                        <strong>Angle:</strong> {currentBlog.angle}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        <strong>Target Keyword:</strong> {currentBlog.targetKeyword}
                                                    </p>
                                                </div>
                                                {currentBlog.imageUrl && (
                                                    <div className="ml-4">
                                                        <img
                                                            src={currentBlog.imageUrl}
                                                            alt={currentBlog.title}
                                                            className="w-48 h-32 object-cover rounded-lg"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {currentBlog.content ? (
                                                <div className="mt-6 prose max-w-none">
                                                    <div
                                                        dangerouslySetInnerHTML={{ __html: currentBlog.content }}
                                                        className="text-gray-700 prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                                                    Content not yet generated. Click "Generate All Content" to create.
                                                </div>
                                            )}

                                            {currentBlog.seoScore && (
                                                <div className="mt-4 flex items-center gap-4 text-sm">
                                                    <span>SEO Score: <strong>{currentBlog.seoScore}/100</strong></span>
                                                    {currentBlog.wordCount && (
                                                        <span>Word Count: <strong>{currentBlog.wordCount}</strong></span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Navigation */}
                                <div className="flex items-center justify-between mt-4">
                                    <Button
                                        onClick={prevBlog}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" />
                                        Previous
                                    </Button>
                                    <div className="flex gap-1">
                                        {generatedBlogs.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentBlogIndex(idx)}
                                                className={`w-2 h-2 rounded-full ${
                                                    idx === currentBlogIndex
                                                        ? 'bg-indigo-600'
                                                        : 'bg-gray-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <Button
                                        onClick={nextBlog}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

