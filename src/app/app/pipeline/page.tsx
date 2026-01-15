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
  ChevronRight,
  Clock,
  History,
  Search,
  ExternalLink,
  Trash2,
  RotateCcw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Client {
  id: string
  name: string
  website_url?: string
}

interface PipelineJob {
  id: string
  website_url: string
  target_market?: string
  client_goals?: string
  ideal_customer_profile?: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  current_step?: string
  progress: number
  seo_score?: number
  pages_indexed?: number
  content_gaps?: number
  topics_generated?: number
  blogs_created?: number
  error_message?: string
  error_step?: string
  crawl_result?: any
  analyze_result?: any
  gaps_result?: any
  topics_result?: any
  started_at?: string
  created_at: string
  completed_at?: string
  clients?: { id: string; name: string }
}

interface PipelineStep {
  id: string
  label: string
  description: string
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
  const [recentJobs, setRecentJobs] = useState<PipelineJob[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new')
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  
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
    { id: 'crawl', label: 'Crawl & Index', description: 'Scanning website pages', status: 'pending' },
    { id: 'analyze', label: 'SEO Analysis', description: 'Analyzing SEO health', status: 'pending' },
    { id: 'gaps', label: 'Gap Analysis', description: 'Finding content opportunities', status: 'pending' },
    { id: 'topics', label: 'Topic Generation', description: 'Creating recommendations', status: 'pending' },
  ])
  
  // Results
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [generatingBlogs, setGeneratingBlogs] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [clientsRes, jobsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/pipeline-jobs?limit=10')
      ])
      
      const clientsData = await clientsRes.json()
      const jobsData = await jobsRes.json()
      
      setClients(clientsData.clients || [])
      setRecentJobs(jobsData.jobs || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStep = (stepId: string, status: PipelineStep['status'], result?: any) => {
    setSteps(prev => prev.map(s => 
      s.id === stepId ? { ...s, status, result } : s
    ))
  }

  const createJob = async () => {
    try {
      const res = await fetch('/api/pipeline-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_url: websiteUrl,
          client_id: selectedClient || null,
          target_market: targetMarket,
          client_goals: clientGoals,
          ideal_customer_profile: icp
        })
      })
      const data = await res.json()
      if (data.success && data.job) {
        setCurrentJobId(data.job.id)
        return data.job.id
      }
      return null
    } catch (error) {
      console.error('Failed to create job:', error)
      return null
    }
  }

  const updateJob = async (jobId: string, updates: Partial<PipelineJob>) => {
    try {
      await fetch(`/api/pipeline-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
    } catch (error) {
      console.error('Failed to update job:', error)
    }
  }

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/pipeline-jobs/${jobId}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.success) {
        setRecentJobs(prev => prev.filter(job => job.id !== jobId))
      } else {
        alert('Failed to delete job: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to delete job:', error)
      alert('Failed to delete job')
    }
  }

  const retryJob = async (job: PipelineJob) => {
    if (!confirm(`Retry this job?\n\nWebsite: ${job.website_url}\nThis will create a new job with the same parameters.`)) {
      return
    }

    try {
      const res = await fetch('/api/pipeline-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_url: job.website_url,
          client_id: job.clients?.id || null,
          target_market: job.target_market,
          client_goals: job.client_goals,
          ideal_customer_profile: job.ideal_customer_profile
        })
      })
      const data = await res.json()

      if (data.success && data.job) {
        setRecentJobs(prev => [data.job, ...prev])
        setCurrentJobId(data.job.id)
        alert('New job created successfully! Starting analysis...')

        setWebsiteUrl(job.website_url)
        if (job.clients?.id) setSelectedClient(job.clients.id)
        if (job.target_market) setTargetMarket(job.target_market)
        if (job.client_goals) setClientGoals(job.client_goals)
        if (job.ideal_customer_profile) setIcp(job.ideal_customer_profile)

        setActiveTab('new')
      } else {
        alert('Failed to create retry job: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to retry job:', error)
      alert('Failed to retry job')
    }
  }

  const runPipeline = async () => {
    if (!websiteUrl) return
    
    setIsRunning(true)
    setResult(null)
    setSteps(steps.map(s => ({ ...s, status: 'pending' })))

    // Create job in database
    const jobId = await createJob()
    if (jobId) {
      await updateJob(jobId, { status: 'running', started_at: new Date().toISOString() })
    }

    try {
      // Step 1: Crawl website
      setCurrentStep(0)
      updateStep('crawl', 'running')
      if (jobId) await updateJob(jobId, { current_step: 'crawl', progress: 10 })
      
      const crawlRes = await fetch('/api/ai/website-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          websiteUrl: websiteUrl,
          websiteId: selectedClient || undefined,
          action: 'quick',
          maxPages: 30
        })
      })
      const crawlData = await crawlRes.json()
      
      if (!crawlData.success && !crawlData.audit) {
        updateStep('crawl', 'error')
        if (jobId) await updateJob(jobId, { status: 'failed', error_message: crawlData.error, error_step: 'crawl' })
        throw new Error(crawlData.error || 'Failed to crawl website')
      }
      updateStep('crawl', 'completed', crawlData)
      if (jobId) await updateJob(jobId, { crawl_result: crawlData, progress: 25 })

      // Step 2: Analyze SEO
      setCurrentStep(1)
      updateStep('analyze', 'running')
      if (jobId) await updateJob(jobId, { current_step: 'analyze', progress: 35 })
      
      const seoScore = crawlData.audit?.baseline_score || crawlData.score || 50
      const pagesIndexed = crawlData.audit?.pages_indexed || crawlData.pages?.length || 0
      updateStep('analyze', 'completed', { seoScore, pagesIndexed })
      if (jobId) await updateJob(jobId, { 
        analyze_result: { seoScore, pagesIndexed }, 
        seo_score: seoScore,
        pages_indexed: pagesIndexed,
        progress: 50 
      })

      // Step 3: Content Gap Analysis
      setCurrentStep(2)
      updateStep('gaps', 'running')
      if (jobId) await updateJob(jobId, { current_step: 'gaps', progress: 60 })
      
      const gapsRes = await fetch('/api/ai/content-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          websiteUrl: websiteUrl,
          action: 'keywords',
          industry: targetMarket || 'General',
          maxPages: 20
        })
      })
      const gapsData = await gapsRes.json()
      updateStep('gaps', 'completed', gapsData)
      if (jobId) await updateJob(jobId, { gaps_result: gapsData, progress: 75 })

      // Step 4: Generate Topics
      setCurrentStep(3)
      updateStep('topics', 'running')
      if (jobId) await updateJob(jobId, { current_step: 'topics', progress: 85 })
      
      const topicsRes = await fetch('/api/ai/topic-clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          websiteUrl: websiteUrl,
          websiteId: selectedClient || undefined,
          industry: targetMarket || 'General Business',
          niche: icp || 'Business Services',
          targetAudience: icp || 'Business professionals',
          businessGoals: clientGoals || 'Increase organic traffic',
          generateForecast: true
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

      const finalResult = {
        seoScore,
        pagesIndexed,
        contentGaps: gapsData.gaps?.length || topics.filter((t: TopicCluster) => t.priority === 'high').length,
        topPerformers: gapsData.topPerformers || [],
        underperformers: gapsData.underperformers || [],
        topics
      }

      setResult(finalResult)

      // Update job with final results
      if (jobId) {
        await updateJob(jobId, { 
          status: 'completed',
          topics_result: topicsData,
          content_gaps: finalResult.contentGaps,
          topics_generated: topics.length,
          progress: 100,
          completed_at: new Date().toISOString()
        })
      }

      // Refresh jobs list
      fetchInitialData()

    } catch (error: any) {
      console.error('Pipeline error:', error)
      if (jobId) {
        await updateJob(jobId, { 
          status: 'failed', 
          error_message: error.message 
        })
      }
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
            targetKeyword: topic.primary_keyword,
            clientId: selectedClient || undefined,
            wordCountGoal: 1500
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

          // Update job blogs_created count
          if (currentJobId) {
            await updateJob(currentJobId, { blogs_created: i + 1 })
          }
        }
      } catch (error) {
        console.error(`Failed to generate blog for ${topic.name}:`, error)
      }
    }

    setGeneratingBlogs(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600'
    if (score >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'from-emerald-500 to-green-600'
    if (score >= 50) return 'from-amber-500 to-orange-600'
    return 'from-red-500 to-rose-600'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-700 border-rose-200'
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Completed</Badge>
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 animate-pulse">Running</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Failed</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Pending</Badge>
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading pipeline...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Content Pipeline
                </h1>
                <p className="text-slate-500">
                  Analyze websites and generate AI-powered content strategies
                </p>
              </div>
            </div>
            
            {/* Tab Switcher */}
            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
              <button
                onClick={() => setActiveTab('new')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'new' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-4 h-4 inline mr-2" />
                New Analysis
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'history' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-4 h-4 inline mr-2" />
                History ({recentJobs.length})
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'history' ? (
          /* Job History Tab */
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Clock className="w-5 h-5 text-indigo-600" />
                Recent Pipeline Jobs
              </CardTitle>
              <CardDescription>View and manage your previous website analyses</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {recentJobs.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentJobs.map((job) => (
                    <div 
                      key={job.id} 
                      className="p-5 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            job.status === 'completed' ? 'bg-emerald-100' :
                            job.status === 'running' ? 'bg-blue-100' :
                            job.status === 'failed' ? 'bg-red-100' : 'bg-slate-100'
                          }`}>
                            {job.status === 'completed' ? <CheckCircle className="w-6 h-6 text-emerald-600" /> :
                             job.status === 'running' ? <Loader2 className="w-6 h-6 text-blue-600 animate-spin" /> :
                             job.status === 'failed' ? <AlertCircle className="w-6 h-6 text-red-600" /> :
                             <Globe className="w-6 h-6 text-slate-400" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-semibold text-slate-800 truncate max-w-md">
                                {job.website_url}
                              </span>
                              {getStatusBadge(job.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDate(job.created_at)}
                              </span>
                              {job.clients && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" />
                                  {job.clients.name}
                                </span>
                              )}
                              {job.seo_score && (
                                <span className={`font-medium ${getScoreColor(job.seo_score)}`}>
                                  SEO: {job.seo_score}
                                </span>
                              )}
                              {job.topics_generated && (
                                <span className="text-indigo-600">
                                  {job.topics_generated} topics
                                </span>
                              )}
                              {job.blogs_created && job.blogs_created > 0 && (
                                <span className="text-emerald-600">
                                  {job.blogs_created} blogs
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {job.status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-indigo-600"
                              onClick={() => retryJob(job)}
                              title="Retry this job"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-indigo-600"
                            onClick={() => window.open(job.website_url, '_blank')}
                            title="Open website"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-red-600"
                            onClick={() => deleteJob(job.id)}
                            title="Delete job"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {job.status === 'running' && (
                        <div className="mt-3 ml-16">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-indigo-600">{job.progress}%</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Current step: {job.current_step || 'Initializing...'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No jobs yet</h3>
                  <p className="text-slate-500 mb-4">Start your first website analysis to see it here</p>
                  <Button onClick={() => setActiveTab('new')} className="bg-indigo-600 hover:bg-indigo-700">
                    <Zap className="w-4 h-4 mr-2" />
                    Start New Analysis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : !result ? (
          <>
            {/* New Analysis Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white pb-8">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Globe className="w-6 h-6" />
                      Website Analysis
                    </CardTitle>
                    <CardDescription className="text-indigo-100 text-base">
                      Enter a website URL to analyze its content and generate SEO topics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* URL Input */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Website URL <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-lg"
                          disabled={isRunning}
                        />
                      </div>
                    </div>

                    {/* Client & Market */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          <Users className="w-4 h-4 inline mr-1" />
                          Client
                        </label>
                        <select
                          value={selectedClient}
                          onChange={(e) => setSelectedClient(e.target.value)}
                          className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                          disabled={isRunning}
                        >
                          <option value="">Select client (optional)</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          <TrendingUp className="w-4 h-4 inline mr-1" />
                          Target Market
                        </label>
                        <input
                          type="text"
                          value={targetMarket}
                          onChange={(e) => setTargetMarket(e.target.value)}
                          placeholder="e.g., Small businesses in US"
                          className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                          disabled={isRunning}
                        />
                      </div>
                    </div>

                    {/* Goals & ICP */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          <Target className="w-4 h-4 inline mr-1" />
                          Business Goals
                        </label>
                        <textarea
                          value={clientGoals}
                          onChange={(e) => setClientGoals(e.target.value)}
                          placeholder="e.g., Increase organic traffic, generate leads..."
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all h-28 resize-none"
                          disabled={isRunning}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          <Users className="w-4 h-4 inline mr-1" />
                          Ideal Customer Profile
                        </label>
                        <textarea
                          value={icp}
                          onChange={(e) => setIcp(e.target.value)}
                          placeholder="e.g., Marketing managers at B2B SaaS companies..."
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all h-28 resize-none"
                          disabled={isRunning}
                        />
                      </div>
                    </div>

                    {/* Run Button */}
                    <Button
                      onClick={runPipeline}
                      disabled={!websiteUrl || isRunning}
                      size="lg"
                      className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white py-7 text-lg font-semibold shadow-lg shadow-indigo-200 rounded-xl transition-all hover:shadow-xl"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                          Analyzing Website...
                        </>
                      ) : (
                        <>
                          <Zap className="w-6 h-6 mr-3" />
                          Start Analysis Pipeline
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Steps or Stats */}
              <div className="space-y-6">
                {/* Pipeline Steps */}
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-slate-800">Pipeline Steps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                          step.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                          step.status === 'running' ? 'bg-indigo-100 text-indigo-600 shadow-lg shadow-indigo-100' :
                          step.status === 'error' ? 'bg-red-100 text-red-600' :
                          'bg-slate-100 text-slate-400'
                        }`}>
                          {step.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                           step.status === 'running' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                           step.status === 'error' ? <AlertCircle className="w-5 h-5" /> :
                           <span className="text-sm font-bold">{index + 1}</span>}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className={`font-semibold text-sm ${
                            step.status === 'running' ? 'text-indigo-600' :
                            step.status === 'completed' ? 'text-emerald-600' :
                            step.status === 'error' ? 'text-red-600' :
                            'text-slate-500'
                          }`}>
                            {step.label}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-indigo-100 mb-4">Recent Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-indigo-200">Total Jobs</span>
                        <span className="font-bold text-xl">{recentJobs.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-indigo-200">Completed</span>
                        <span className="font-bold text-xl text-emerald-300">
                          {recentJobs.filter(j => j.status === 'completed').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-indigo-200">Topics Generated</span>
                        <span className="font-bold text-xl">
                          {recentJobs.reduce((acc, j) => acc + (j.topics_generated || 0), 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Results Dashboard */}
            <div className="space-y-6">
              {/* Success Header */}
              <Card className="border-0 shadow-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Analysis Complete!</h2>
                        <p className="text-emerald-100">
                          {websiteUrl} • {result.topics.length} topics discovered
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setResult(null)
                        setSteps(steps.map(s => ({ ...s, status: 'pending' })))
                        setWebsiteUrl('')
                      }}
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      New Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Score Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${getScoreBg(result.seoScore)}`} />
                  <CardContent className="pt-6 text-center">
                    <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br ${getScoreBg(result.seoScore)}`}>
                      <BarChart3 className="w-7 h-7 text-white" />
                    </div>
                    <div className={`text-4xl font-bold ${getScoreColor(result.seoScore)}`}>
                      {result.seoScore}
                    </div>
                    <p className="text-sm text-slate-500 font-medium mt-1">SEO Score</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-purple-500 to-violet-600" />
                  <CardContent className="pt-6 text-center">
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br from-purple-500 to-violet-600">
                      <Globe className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-purple-600">{result.pagesIndexed}</div>
                    <p className="text-sm text-slate-500 font-medium mt-1">Pages Found</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
                  <CardContent className="pt-6 text-center">
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-amber-600">{result.contentGaps}</div>
                    <p className="text-sm text-slate-500 font-medium mt-1">Content Gaps</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-600" />
                  <CardContent className="pt-6 text-center">
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600">
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-indigo-600">{result.topics.length}</div>
                    <p className="text-sm text-slate-500 font-medium mt-1">Topics Generated</p>
                  </CardContent>
                </Card>
              </div>

              {/* Topic Recommendations */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-slate-800">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        Recommended Topics
                      </CardTitle>
                      <CardDescription>
                        AI-generated topics based on content gaps, goals, and target audience
                      </CardDescription>
                    </div>
                    <Button
                      onClick={generateAllBlogs}
                      disabled={generatingBlogs || result.topics.every(t => t.blog_generated)}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-200"
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
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {result.topics.map((topic, index) => (
                      <div
                        key={topic.id}
                        className={`flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors ${
                          topic.blog_generated ? 'bg-emerald-50/50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            topic.blog_generated 
                              ? 'bg-emerald-100 text-emerald-600' 
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            {topic.blog_generated ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <span className="text-sm font-bold">{index + 1}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-800">{topic.name}</span>
                              <Badge className={`${getPriorityColor(topic.priority)} border`}>
                                {topic.priority}
                              </Badge>
                              {topic.blog_generated && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Generated
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              <span className="font-medium text-indigo-600">{topic.primary_keyword}</span>
                              <span>•</span>
                              <span>Difficulty: {topic.difficulty}/100</span>
                              <span>•</span>
                              <span>~{topic.estimated_traffic.toLocaleString()} traffic/mo</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!topic.blog_generated && !generatingBlogs && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            >
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
                  size="lg"
                  onClick={() => setActiveTab('history')}
                  className="border-slate-300"
                >
                  <History className="w-4 h-4 mr-2" />
                  View History
                </Button>
                <Link href="/app/posts">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200"
                  >
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
