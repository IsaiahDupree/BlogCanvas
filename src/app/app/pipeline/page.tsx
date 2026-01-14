'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Globe, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Target,
  BarChart3,
  FileText,
  Users,
  TrendingUp,
  Zap,
  RefreshCw,
  Eye,
  Play,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Client {
  id: string
  name: string
  website_url?: string
}

interface PipelineStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'completed' | 'error'
  result?: any
}

interface TopicCluster {
  id: string
  name: string
  primary_keyword: string
  difficulty: number
  estimated_traffic: number
  priority: 'high' | 'medium' | 'low'
  blog_generated?: boolean
}

interface AnalysisResult {
  seoScore: number
  pagesIndexed: number
  contentGaps: number
  topPerformers: string[]
  underperformers: string[]
  topics: TopicCluster[]
}

export default function PipelinePage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [clientGoals, setClientGoals] = useState('')
  const [targetMarket, setTargetMarket] = useState('')
  const [icp, setIcp] = useState('')
  
  // Pipeline state
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: 'crawl', label: 'Crawling website pages', status: 'pending' },
    { id: 'analyze', label: 'Analyzing SEO health', status: 'pending' },
    { id: 'gaps', label: 'Identifying content gaps', status: 'pending' },
    { id: 'topics', label: 'Generating topic recommendations', status: 'pending' },
  ])
  
  // Results
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [generatingBlogs, setGeneratingBlogs] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStep = (stepId: string, status: PipelineStep['status'], result?: any) => {
    setSteps(prev => prev.map(s => 
      s.id === stepId ? { ...s, status, result } : s
    ))
  }

  const runPipeline = async () => {
    if (!websiteUrl) return
    
    setIsRunning(true)
    setResult(null)
    setSteps(steps.map(s => ({ ...s, status: 'pending' })))

    try {
      // Step 1: Crawl website
      setCurrentStep(0)
      updateStep('crawl', 'running')
      
      const crawlRes = await fetch('/api/ai/website-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: websiteUrl,
          clientId: selectedClient || undefined
        })
      })
      const crawlData = await crawlRes.json()
      
      if (!crawlData.success && !crawlData.audit) {
        updateStep('crawl', 'error')
        throw new Error(crawlData.error || 'Failed to crawl website')
      }
      updateStep('crawl', 'completed', crawlData)

      // Step 2: Analyze SEO
      setCurrentStep(1)
      updateStep('analyze', 'running')
      
      // Use the audit data from crawl
      const seoScore = crawlData.audit?.baseline_score || crawlData.score || 50
      const pagesIndexed = crawlData.audit?.pages_indexed || crawlData.pages?.length || 0
      updateStep('analyze', 'completed', { seoScore, pagesIndexed })

      // Step 3: Content Gap Analysis
      setCurrentStep(2)
      updateStep('gaps', 'running')
      
      const gapsRes = await fetch('/api/ai/content-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: websiteUrl,
          action: 'gaps',
          clientGoals,
          targetMarket,
          icp
        })
      })
      const gapsData = await gapsRes.json()
      updateStep('gaps', 'completed', gapsData)

      // Step 4: Generate Topics
      setCurrentStep(3)
      updateStep('topics', 'running')
      
      const topicsRes = await fetch('/api/ai/topic-clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: websiteUrl,
          clientId: selectedClient || undefined,
          clientGoals,
          targetMarket,
          icp,
          count: 15
        })
      })
      const topicsData = await topicsRes.json()
      updateStep('topics', 'completed', topicsData)

      // Compile results
      const topics: TopicCluster[] = (topicsData.clusters || topicsData.topics || []).map((t: any, i: number) => ({
        id: t.id || `topic-${i}`,
        name: t.name || t.topic || t.cluster_name,
        primary_keyword: t.primary_keyword || t.keyword || t.name,
        difficulty: t.difficulty || 50,
        estimated_traffic: t.estimated_traffic || t.search_volume || 1000,
        priority: t.difficulty <= 40 ? 'high' : t.difficulty <= 60 ? 'medium' : 'low',
        blog_generated: false
      }))

      setResult({
        seoScore,
        pagesIndexed,
        contentGaps: gapsData.gaps?.length || topics.filter((t: TopicCluster) => t.priority === 'high').length,
        topPerformers: gapsData.topPerformers || [],
        underperformers: gapsData.underperformers || [],
        topics
      })

    } catch (error: any) {
      console.error('Pipeline error:', error)
      alert(`Pipeline error: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const generateAllBlogs = async () => {
    if (!result?.topics.length) return
    
    setGeneratingBlogs(true)
    setGeneratedCount(0)

    const topicsToGenerate = result.topics.filter(t => !t.blog_generated)
    
    for (let i = 0; i < topicsToGenerate.length; i++) {
      const topic = topicsToGenerate[i]
      
      try {
        const res = await fetch('/api/blog-posts/generate-full', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topic.name,
            keyword: topic.primary_keyword,
            clientId: selectedClient || undefined,
            clientGoals,
            targetMarket,
            icp
          })
        })

        if (res.ok) {
          setGeneratedCount(i + 1)
          setResult(prev => prev ? {
            ...prev,
            topics: prev.topics.map(t => 
              t.id === topic.id ? { ...t, blog_generated: true } : t
            )
          } : null)
        }
      } catch (error) {
        console.error(`Failed to generate blog for ${topic.name}:`, error)
      }
    }

    setGeneratingBlogs(false)
    alert(`Generated ${generatedCount} blog posts! Check the Posts page to review.`)
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Website-to-Content Pipeline</h1>
              <p className="text-muted-foreground">
                Analyze any website and generate a complete content strategy
              </p>
            </div>
          </div>
        </div>

        {!result ? (
          <>
            {/* Input Form */}
            <Card className="mb-8 border-2 border-indigo-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Start Analysis
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Paste a website URL to begin the content analysis pipeline
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* URL Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                      disabled={isRunning}
                    />
                  </div>
                </div>

                {/* Client Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client (Optional)
                    </label>
                    <select
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500"
                      disabled={isRunning}
                    >
                      <option value="">New/No Client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Market
                    </label>
                    <input
                      type="text"
                      value={targetMarket}
                      onChange={(e) => setTargetMarket(e.target.value)}
                      placeholder="e.g., Small businesses in US"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500"
                      disabled={isRunning}
                    />
                  </div>
                </div>

                {/* Goals & ICP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Target className="w-4 h-4 inline mr-1" />
                      Client Goals
                    </label>
                    <textarea
                      value={clientGoals}
                      onChange={(e) => setClientGoals(e.target.value)}
                      placeholder="e.g., Increase organic traffic, establish thought leadership, generate leads..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 h-24"
                      disabled={isRunning}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Ideal Customer Profile (ICP)
                    </label>
                    <textarea
                      value={icp}
                      onChange={(e) => setIcp(e.target.value)}
                      placeholder="e.g., Marketing managers at B2B SaaS companies with 50-200 employees..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 h-24"
                      disabled={isRunning}
                    />
                  </div>
                </div>

                {/* Run Button */}
                <Button
                  onClick={runPipeline}
                  disabled={!websiteUrl || isRunning}
                  size="lg"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6 text-lg shadow-lg"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Running Pipeline...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Analyze Website & Generate Topics
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Pipeline Steps */}
            {isRunning && (
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step.status === 'completed' ? 'bg-green-100 text-green-600' :
                          step.status === 'running' ? 'bg-indigo-100 text-indigo-600' :
                          step.status === 'error' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {step.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                           step.status === 'running' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                           step.status === 'error' ? <AlertCircle className="w-5 h-5" /> :
                           <span className="text-sm font-medium">{index + 1}</span>}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${
                            step.status === 'running' ? 'text-indigo-600' :
                            step.status === 'completed' ? 'text-green-600' :
                            step.status === 'error' ? 'text-red-600' :
                            'text-gray-400'
                          }`}>
                            {step.label}
                          </p>
                        </div>
                        {step.status === 'running' && (
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 animate-pulse" style={{ width: '60%' }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Results Dashboard */}
            <div className="space-y-6">
              {/* Score Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                    <div className={`text-3xl font-bold ${getScoreColor(result.seoScore)}`}>
                      {result.seoScore}
                    </div>
                    <p className="text-sm text-muted-foreground">SEO Score</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Globe className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-3xl font-bold text-purple-600">{result.pagesIndexed}</div>
                    <p className="text-sm text-muted-foreground">Pages Found</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <div className="text-3xl font-bold text-orange-600">{result.contentGaps}</div>
                    <p className="text-sm text-muted-foreground">Content Gaps</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-cyan-600" />
                    <div className="text-3xl font-bold text-cyan-600">{result.topics.length}</div>
                    <p className="text-sm text-muted-foreground">Topics Generated</p>
                  </CardContent>
                </Card>
              </div>

              {/* Topic Recommendations */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        Recommended Topics
                      </CardTitle>
                      <CardDescription>
                        AI-generated topics based on gaps, goals, and ICP
                      </CardDescription>
                    </div>
                    <Button
                      onClick={generateAllBlogs}
                      disabled={generatingBlogs || result.topics.every(t => t.blog_generated)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600"
                    >
                      {generatingBlogs ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating ({generatedCount}/{result.topics.filter(t => !t.blog_generated).length})
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Generate All Blogs
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.topics.map((topic) => (
                      <div
                        key={topic.id}
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          topic.blog_generated ? 'bg-green-50 border-green-200' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {topic.blog_generated ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{topic.name}</span>
                              <Badge className={getPriorityColor(topic.priority)}>
                                {topic.priority}
                              </Badge>
                              {topic.blog_generated && (
                                <Badge className="bg-green-100 text-green-800">Generated</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Keyword: {topic.primary_keyword} • 
                              Difficulty: {topic.difficulty}/100 • 
                              Est. Traffic: {topic.estimated_traffic.toLocaleString()}/mo
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!topic.blog_generated && !generatingBlogs && (
                            <Button variant="outline" size="sm">
                              <Zap className="w-4 h-4 mr-1" />
                              Generate
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null)
                    setSteps(steps.map(s => ({ ...s, status: 'pending' })))
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Analyze Another Website
                </Button>
                <Link href="/app/posts">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
                    <Eye className="w-4 h-4 mr-2" />
                    View Generated Posts
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* How It Works */}
        {!isRunning && !result && (
          <Card className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-indigo-900 mb-4">How the Pipeline Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium text-indigo-900">Crawl & Analyze</p>
                    <p className="text-indigo-700">Scrape all public pages and assess SEO health</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium text-indigo-900">Find Gaps</p>
                    <p className="text-indigo-700">Identify missing topics and underperforming content</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium text-indigo-900">Generate Topics</p>
                    <p className="text-indigo-700">AI creates prioritized topic recommendations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                  <div>
                    <p className="font-medium text-indigo-900">Create Blogs</p>
                    <p className="text-indigo-700">One-click generates full blog posts for approval</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
