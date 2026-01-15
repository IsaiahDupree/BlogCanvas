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
  RotateCcw,
  Download,
  X,
  FolderPlus,
  Package,
  Send,
  Presentation
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
  eta_seconds?: number
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

// Helper function to format ETA
const formatETA = (seconds: number | null | undefined): string => {
  if (!seconds || seconds <= 0) return 'Calculating...'

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  if (mins > 60) {
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }

  if (mins > 0) {
    return `${mins}m ${secs}s`
  }
  return `${secs}s`
}

// Step definitions for progress visualization
const PIPELINE_STEPS = [
  { id: 'crawl', label: 'Crawl & Index', progress: 10 },
  { id: 'analyze', label: 'SEO Analysis', progress: 35 },
  { id: 'gaps', label: 'Gap Analysis', progress: 60 },
  { id: 'topics', label: 'Topic Generation', progress: 85 }
]

// Get current step info based on progress
const getCurrentStepInfo = (progress: number, currentStep?: string) => {
  if (progress === 100) return { label: 'Completed', index: 4 }

  // Find step by current_step name first
  if (currentStep) {
    const stepIndex = PIPELINE_STEPS.findIndex(s => s.id === currentStep)
    if (stepIndex >= 0) {
      return { label: PIPELINE_STEPS[stepIndex].label, index: stepIndex }
    }
  }

  // Otherwise find by progress percentage
  for (let i = PIPELINE_STEPS.length - 1; i >= 0; i--) {
    if (progress >= PIPELINE_STEPS[i].progress) {
      return { label: PIPELINE_STEPS[i].label, index: i }
    }
  }

  return { label: 'Initializing', index: -1 }
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

  // Topic selection for batch creation
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchName, setBatchName] = useState('')
  const [creatingBatch, setCreatingBatch] = useState(false)

  // Pitch generation
  const [showPitchModal, setShowPitchModal] = useState(false)
  const [generatingPitch, setGeneratingPitch] = useState(false)
  const [pitchContent, setPitchContent] = useState<{ format: string; content?: string; html?: string; subject?: string } | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Real-time polling for running jobs
  useEffect(() => {
    const hasRunningJobs = recentJobs.some(job => job.status === 'running')

    if (!hasRunningJobs) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/pipeline-jobs?limit=10')
        const data = await response.json()
        if (data.jobs) {
          setRecentJobs(data.jobs)
        }
      } catch (error) {
        console.error('Failed to poll jobs:', error)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [recentJobs])

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

  const cancelJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this running job?')) {
      return
    }

    try {
      const res = await fetch(`/api/pipeline-jobs/${jobId}/cancel`, {
        method: 'POST'
      })
      const data = await res.json()

      if (data.success) {
        // Update the jobs list with the cancelled status
        setRecentJobs(prev => prev.map(job =>
          job.id === jobId ? { ...job, status: 'cancelled' } : job
        ))

        // If this is the current running job, stop it
        if (currentJobId === jobId) {
          setIsRunning(false)
          setCurrentJobId(null)
        }
      } else {
        alert('Failed to cancel job: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to cancel job:', error)
      alert('Failed to cancel job')
    }
  }

  const retryJob = async (job: PipelineJob) => {
    if (!confirm(`Retry this job?\n\nWebsite: ${job.website_url}\nThis will create a new job with the same parameters.`)) {
      return
    }

    try {
      const res = await fetch(`/api/pipeline-jobs/${job.id}/retry`, {
        method: 'POST'
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

  const checkIfCancelled = async (jobId: string | null): Promise<boolean> => {
    if (!jobId) return false
    try {
      const res = await fetch(`/api/pipeline-jobs/${jobId}`)
      const data = await res.json()
      return data.job?.status === 'cancelled'
    } catch {
      return false
    }
  }

  const runPipeline = async () => {
    if (!websiteUrl) return

    setIsRunning(true)
    setResult(null)
    setSteps(steps.map(s => ({ ...s, status: 'pending' })))

    // Create job in database
    const jobId = await createJob()
    const startTime = Date.now()

    if (jobId) {
      await updateJob(jobId, { status: 'running', started_at: new Date().toISOString() })
    }

    // Helper to calculate ETA based on progress and elapsed time
    const updateETA = async (currentProgress: number) => {
      if (!jobId || currentProgress <= 0) return

      const elapsedMs = Date.now() - startTime
      const elapsedSeconds = Math.floor(elapsedMs / 1000)
      const progressRate = currentProgress / elapsedSeconds // progress per second
      const remainingProgress = 100 - currentProgress
      const etaSeconds = progressRate > 0 ? Math.ceil(remainingProgress / progressRate) : null

      if (etaSeconds) {
        await updateJob(jobId, { eta_seconds: etaSeconds })
      }
    }

    try {
      // Step 1: Crawl website
      setCurrentStep(0)
      updateStep('crawl', 'running')
      if (jobId) {
        await updateJob(jobId, { current_step: 'crawl', progress: 10 })
        await updateETA(10)
      }

      // Check for cancellation
      if (await checkIfCancelled(jobId)) {
        throw new Error('Job cancelled by user')
      }
      
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
      if (jobId) {
        await updateJob(jobId, { crawl_result: crawlData, progress: 25 })
        await updateETA(25)
      }

      // Check for cancellation
      if (await checkIfCancelled(jobId)) {
        throw new Error('Job cancelled by user')
      }

      // Step 2: Analyze SEO
      setCurrentStep(1)
      updateStep('analyze', 'running')
      if (jobId) {
        await updateJob(jobId, { current_step: 'analyze', progress: 35 })
        await updateETA(35)
      }
      
      const seoScore = crawlData.audit?.baseline_score || crawlData.score || 50
      const pagesIndexed = crawlData.audit?.pages_indexed || crawlData.pages?.length || 0
      updateStep('analyze', 'completed', { seoScore, pagesIndexed })
      if (jobId) {
        await updateJob(jobId, {
          analyze_result: { seoScore, pagesIndexed },
          seo_score: seoScore,
          pages_indexed: pagesIndexed,
          progress: 50
        })
        await updateETA(50)
      }

      // Check for cancellation
      if (await checkIfCancelled(jobId)) {
        throw new Error('Job cancelled by user')
      }

      // Step 3: Content Gap Analysis
      setCurrentStep(2)
      updateStep('gaps', 'running')
      if (jobId) {
        await updateJob(jobId, { current_step: 'gaps', progress: 60 })
        await updateETA(60)
      }
      
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
      if (jobId) {
        await updateJob(jobId, { gaps_result: gapsData, progress: 75 })
        await updateETA(75)
      }

      // Check for cancellation
      if (await checkIfCancelled(jobId)) {
        throw new Error('Job cancelled by user')
      }

      // Step 4: Generate Topics
      setCurrentStep(3)
      updateStep('topics', 'running')
      if (jobId) {
        await updateJob(jobId, { current_step: 'topics', progress: 85 })
        await updateETA(85)
      }
      
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
          eta_seconds: null,
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

  const exportTopicsToCSV = async () => {
    if (!currentJobId) {
      alert('No job ID available for export')
      return
    }

    try {
      const res = await fetch(`/api/pipeline-jobs/${currentJobId}/export-topics`)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to export topics')
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = res.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `topics_${new Date().toISOString().split('T')[0]}.csv`

      // Download the CSV file
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (error: any) {
      console.error('Failed to export CSV:', error)
      alert('Failed to export CSV: ' + error.message)
    }
  }

  const toggleTopicSelection = (topicId: string) => {
    setSelectedTopics(prev => {
      const next = new Set(prev)
      if (next.has(topicId)) {
        next.delete(topicId)
      } else {
        next.add(topicId)
      }
      return next
    })
  }

  const toggleAllTopics = () => {
    if (!result?.topics) return

    if (selectedTopics.size === result.topics.length) {
      setSelectedTopics(new Set())
    } else {
      setSelectedTopics(new Set(result.topics.map(t => t.id)))
    }
  }

  const createBatchFromTopics = async () => {
    if (!batchName.trim()) {
      alert('Please enter a batch name')
      return
    }

    if (selectedTopics.size === 0) {
      alert('Please select at least one topic')
      return
    }

    if (!currentJobId) {
      alert('No pipeline job ID available')
      return
    }

    setCreatingBatch(true)

    try {
      // Get the selected topics data
      const topics = result?.topics.filter(t => selectedTopics.has(t.id)) || []

      // Create the batch via API
      const res = await fetch('/api/pipeline-jobs/create-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineJobId: currentJobId,
          batchName: batchName.trim(),
          topics: topics
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create batch')
      }

      alert(`Batch created successfully! ${data.postsCreated} posts added to batch.`)
      setShowBatchModal(false)
      setBatchName('')
      setSelectedTopics(new Set())

    } catch (error: any) {
      console.error('Failed to create batch:', error)
      alert('Failed to create batch: ' + error.message)
    } finally {
      setCreatingBatch(false)
    }
  }

  const generatePitch = async (format: 'email' | 'pdf' | 'slide') => {
    if (!result) return

    setGeneratingPitch(true)
    try {
      // Create a projection from the analysis result
      const projection = {
        current_score: result.seoScore,
        target_score: Math.min(result.seoScore + 15, 95),
        score_increase: Math.min(15, 95 - result.seoScore),
        recommended_posts: result.contentGaps || result.topics.length,
        timeline_months: Math.ceil((result.contentGaps || result.topics.length) / 4),
        confidence: 'medium' as const,
        factors: {
          content_gap_impact: Math.round((result.contentGaps / (result.contentGaps + result.pagesIndexed)) * 10),
          topic_coverage_impact: 3,
          quality_improvement_impact: 2
        },
        cadence: {
          postsPerMonth: 4,
          postsPerWeek: 1,
          schedule: '1 post per week'
        }
      }

      // Find the current job
      const currentJob = recentJobs.find(j => j.id === currentJobId)

      // Create pitch data similar to what the generate-pitch endpoint expects
      const pitchData = {
        website: {
          url: currentJob?.website_url || websiteUrl,
          name: currentJob?.website_url || websiteUrl
        },
        client: {
          name: currentJob?.clients?.name || selectedClient || 'Client',
          productSummary: currentJob?.client_goals,
          targetAudience: currentJob?.ideal_customer_profile || targetMarket
        },
        audit: {
          baselineScore: result.seoScore,
          pagesIndexed: result.pagesIndexed
        },
        projection,
        clusters: result.topics.map(t => ({
          name: t.name,
          primary_keyword: t.primary_keyword,
          estimated_traffic: t.estimated_traffic || 0,
          currently_covered: false
        })),
        gaps: []
      }

      // Generate pitch content directly (inline implementation)
      let content = ''
      let subject = ''
      let html = ''

      if (format === 'email') {
        const clientName = pitchData.client.name || 'there'
        const currentScore = pitchData.projection.current_score
        const targetScore = pitchData.projection.target_score
        const recommendedPosts = pitchData.projection.recommended_posts
        const timelineMonths = pitchData.projection.timeline_months
        const topClusters = pitchData.clusters.slice(0, 3).map(c => c.name)

        subject = `SEO Content Plan to Grow ${clientName}'s Organic Reach`
        content = `Hi ${clientName},

We ran an SEO and content audit on ${pitchData.website.url}. Right now, your content sits around an overall SEO score of ${currentScore}/100, with strong coverage in your current content, but untapped opportunities in:

${topClusters.map(name => `- ${name}`).join('\n')}

Based on your goals, we recommend a ${recommendedPosts}-post blog package over the next ${timelineMonths} months. This would:

- Fill critical topic gaps in your niche
- Target keywords with combined estimated traffic potential
- Realistically move your SEO score from ${currentScore} → ${targetScore} over the campaign window

Our system will:
- Generate high-quality, fact-checked, SEO-optimized blogs tailored to your brand voice
- Route everything through human review before you ever see it
- Push approved posts directly to your WordPress
- Track performance and send you clear, non-fluffy reports each month

If you'd like, I can walk you through the proposed topics and forecast in a quick call this week.

Best regards,
Your CSM Team`

        setPitchContent({ format: 'email', content, subject })

      } else if (format === 'pdf') {
        html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SEO Content Plan - ${pitchData.client.name}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #6366f1; margin: 0; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #6366f1; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .score-comparison { display: flex; justify-content: space-around; margin: 30px 0; }
        .score-box { text-align: center; padding: 20px; border-radius: 8px; }
        .current-score { background: #fee2e2; }
        .target-score { background: #d1fae5; }
        .score-value { font-size: 48px; font-weight: bold; }
        .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 32px; font-weight: bold; color: #6366f1; }
        .metric-label { color: #6b7280; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SEO Content Plan</h1>
        <p>${pitchData.client.name} - ${pitchData.website.url}</p>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
    </div>
    <div class="section">
        <h2>Current SEO Status</h2>
        <p>Baseline SEO Score: <strong>${pitchData.audit.baselineScore}/100</strong></p>
        <p>Pages Indexed: ${pitchData.audit.pagesIndexed || 0}</p>
    </div>
    <div class="section">
        <h2>Projected Growth</h2>
        <div class="score-comparison">
            <div class="score-box current-score">
                <div class="score-value" style="color: #dc2626;">${pitchData.projection.current_score}</div>
                <div>Current Score</div>
            </div>
            <div style="display: flex; align-items: center; font-size: 24px;">→</div>
            <div class="score-box target-score">
                <div class="score-value" style="color: #059669;">${pitchData.projection.target_score}</div>
                <div>Target Score</div>
            </div>
        </div>
        <p style="text-align: center; font-size: 24px; font-weight: bold; color: #059669;">
            +${pitchData.projection.score_increase} Point Improvement
        </p>
    </div>
    <div class="section">
        <h2>Recommended Plan</h2>
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${pitchData.projection.recommended_posts}</div>
                <div class="metric-label">Blog Posts</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${pitchData.projection.timeline_months}</div>
                <div class="metric-label">Months</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(pitchData.projection.recommended_posts / pitchData.projection.timeline_months)}</div>
                <div class="metric-label">Posts/Month</div>
            </div>
        </div>
    </div>
    <div class="section">
        <h2>Key Opportunities</h2>
        <ul>
            ${pitchData.clusters.slice(0, 5).map(c =>
                `<li><strong>${c.name}</strong> - ${c.estimated_traffic || 0} estimated monthly searches</li>`
            ).join('')}
        </ul>
    </div>
</body>
</html>`

        setPitchContent({ format: 'pdf', html })

        // Open in new window for printing/download
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(html)
          printWindow.document.close()
          printWindow.focus()
        }

      } else if (format === 'slide') {
        const slides = [
          `Slide 1: SEO Content Plan\n${pitchData.client.name}\nCurrent Score: ${pitchData.projection.current_score} → Target: ${pitchData.projection.target_score}`,
          `Slide 2: Current Status\nSEO Score: ${pitchData.projection.current_score}/100\nPages Indexed: ${pitchData.audit.pagesIndexed || 0}`,
          `Slide 3: Recommended Plan\n${pitchData.projection.recommended_posts} blog posts over ${pitchData.projection.timeline_months} months`,
          `Slide 4: Key Opportunities\n• ${pitchData.clusters.slice(0, 5).map(c => c.name).join('\n• ')}`,
          `Slide 5: Expected Results\nSEO Score: ${pitchData.projection.current_score} → ${pitchData.projection.target_score}\n+${pitchData.projection.score_increase} point improvement`
        ]

        content = slides.join('\n\n---\n\n')
        subject = 'SEO Content Plan Presentation'
        setPitchContent({ format: 'slide', content, subject })
      }

    } catch (error) {
      console.error('Failed to generate pitch:', error)
      alert('Failed to generate pitch. Please try again.')
    } finally {
      setGeneratingPitch(false)
    }
  }

  const copyPitchToClipboard = () => {
    if (!pitchContent?.content || !pitchContent?.subject) return

    const emailBody = `Subject: ${pitchContent.subject}\n\n${pitchContent.content}`
    navigator.clipboard.writeText(emailBody).then(() => {
      alert('Pitch copied to clipboard!')
    }).catch((err) => {
      console.error('Failed to copy:', err)
      alert('Failed to copy to clipboard')
    })
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
      case 'cancelled':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Cancelled</Badge>
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
                            job.status === 'failed' ? 'bg-red-100' :
                            job.status === 'cancelled' ? 'bg-orange-100' : 'bg-slate-100'
                          }`}>
                            {job.status === 'completed' ? <CheckCircle className="w-6 h-6 text-emerald-600" /> :
                             job.status === 'running' ? <Loader2 className="w-6 h-6 text-blue-600 animate-spin" /> :
                             job.status === 'failed' ? <AlertCircle className="w-6 h-6 text-red-600" /> :
                             job.status === 'cancelled' ? <X className="w-6 h-6 text-orange-600" /> :
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
                          {job.status === 'running' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-orange-600"
                              onClick={() => cancelJob(job.id)}
                              title="Cancel running job"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
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
                        <div className="mt-3 ml-16 space-y-3">
                          {/* Progress Bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-indigo-600">{job.progress}%</span>
                          </div>

                          {/* Current Step and ETA */}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-600 font-medium">
                              {getCurrentStepInfo(job.progress, job.current_step).label}
                            </p>
                            {job.eta_seconds && (
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="w-3 h-3" />
                                <span>{formatETA(job.eta_seconds)}</span>
                              </div>
                            )}
                          </div>

                          {/* Step Indicators */}
                          <div className="flex items-center gap-1">
                            {PIPELINE_STEPS.map((step, index) => {
                              const currentStepIndex = getCurrentStepInfo(job.progress, job.current_step).index
                              const isCompleted = index < currentStepIndex
                              const isCurrent = index === currentStepIndex
                              const isPending = index > currentStepIndex

                              return (
                                <div
                                  key={step.id}
                                  className="flex-1 h-1 rounded-full transition-all duration-300"
                                  style={{
                                    backgroundColor: isCompleted
                                      ? '#10b981'
                                      : isCurrent
                                        ? '#6366f1'
                                        : '#e2e8f0'
                                  }}
                                  title={step.label}
                                />
                              )
                            })}
                          </div>
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
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={result.topics.length > 0 && selectedTopics.size === result.topics.length}
                        onChange={toggleAllTopics}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        title="Select all topics"
                      />
                      <div>
                        <CardTitle className="flex items-center gap-2 text-slate-800">
                          <Sparkles className="w-5 h-5 text-indigo-600" />
                          Recommended Topics
                        </CardTitle>
                        <CardDescription>
                          AI-generated topics based on content gaps, goals, and target audience
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setShowPitchModal(true)}
                        variant="outline"
                        className="border-pink-200 text-pink-600 hover:bg-pink-50"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Generate Pitch
                      </Button>
                      <Button
                        onClick={exportTopicsToCSV}
                        variant="outline"
                        className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button
                        onClick={() => setShowBatchModal(true)}
                        disabled={selectedTopics.size === 0}
                        variant="outline"
                        className="border-purple-200 text-purple-600 hover:bg-purple-50"
                      >
                        <FolderPlus className="w-4 h-4 mr-2" />
                        Create Batch ({selectedTopics.size})
                      </Button>
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
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {result.topics.map((topic, index) => (
                      <div
                        key={topic.id}
                        className={`flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors ${
                          topic.blog_generated ? 'bg-emerald-50/50' : ''
                        } ${selectedTopics.has(topic.id) ? 'bg-indigo-50/50' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selectedTopics.has(topic.id)}
                            onChange={() => toggleTopicSelection(topic.id)}
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
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

      {/* Create Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Create Content Batch</h2>
                    <p className="text-sm text-slate-500">{selectedTopics.size} topic{selectedTopics.size !== 1 ? 's' : ''} selected</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Batch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g., Q1 2024 Content Plan"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                  autoFocus
                />
              </div>

              <div className="bg-indigo-50 rounded-xl p-4">
                <h3 className="font-semibold text-indigo-900 text-sm mb-2">What happens next?</h3>
                <ul className="space-y-1 text-sm text-indigo-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>A new content batch will be created</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Selected topics will be added as blog posts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>You can manage the batch in the Batches section</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <Button
                onClick={() => setShowBatchModal(false)}
                variant="outline"
                className="flex-1"
                disabled={creatingBatch}
              >
                Cancel
              </Button>
              <Button
                onClick={createBatchFromTopics}
                disabled={!batchName.trim() || creatingBatch}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {creatingBatch ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Create Batch
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Pitch Modal */}
      {showPitchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                    <Presentation className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Generate Client Pitch</h2>
                    <p className="text-sm text-slate-500">Create a professional pitch from analysis results</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPitchModal(false)
                    setPitchContent(null)
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {!pitchContent ? (
                <>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-100">
                    <h3 className="font-semibold text-indigo-900 text-sm mb-3">Analysis Summary</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Current SEO Score</div>
                        <div className="text-2xl font-bold text-indigo-600">{result?.seoScore || 0}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Content Gaps</div>
                        <div className="text-2xl font-bold text-amber-600">{result?.contentGaps || 0}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Topics Generated</div>
                        <div className="text-2xl font-bold text-purple-600">{result?.topics.length || 0}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Pages Indexed</div>
                        <div className="text-2xl font-bold text-blue-600">{result?.pagesIndexed || 0}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-700 text-sm mb-3">Choose Pitch Format</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        onClick={() => generatePitch('email')}
                        disabled={generatingPitch}
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 border-2 hover:border-pink-300 hover:bg-pink-50"
                      >
                        <Send className="w-6 h-6 text-pink-600" />
                        <div className="text-center">
                          <div className="font-semibold">Email Draft</div>
                          <div className="text-xs text-slate-500">Ready to send</div>
                        </div>
                      </Button>
                      <Button
                        onClick={() => generatePitch('pdf')}
                        disabled={generatingPitch}
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 border-2 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <FileText className="w-6 h-6 text-blue-600" />
                        <div className="text-center">
                          <div className="font-semibold">PDF Report</div>
                          <div className="text-xs text-slate-500">Print & share</div>
                        </div>
                      </Button>
                      <Button
                        onClick={() => generatePitch('slide')}
                        disabled={generatingPitch}
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 border-2 hover:border-purple-300 hover:bg-purple-50"
                      >
                        <Presentation className="w-6 h-6 text-purple-600" />
                        <div className="text-center">
                          <div className="font-semibold">Slide Deck</div>
                          <div className="text-xs text-slate-500">Presentation</div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {generatingPitch && (
                    <div className="bg-indigo-50 rounded-xl p-4 flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                      <div>
                        <div className="font-semibold text-indigo-900 text-sm">Generating pitch...</div>
                        <div className="text-xs text-indigo-600">This may take a few seconds</div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-green-900 text-sm">Pitch Generated Successfully!</h3>
                    </div>
                    <p className="text-sm text-green-700">Your {pitchContent.format} pitch is ready.</p>
                  </div>

                  {pitchContent.format === 'email' && pitchContent.content && (
                    <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 p-3 border-b border-slate-200">
                        <div className="text-xs text-slate-500 mb-1">Subject Line</div>
                        <div className="font-semibold text-slate-800">{pitchContent.subject}</div>
                      </div>
                      <div className="p-4 max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">{pitchContent.content}</pre>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={copyPitchToClipboard}
                      variant="outline"
                      className="flex-1"
                      disabled={!pitchContent.content}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Copy to Clipboard
                    </Button>
                    <Button
                      onClick={() => {
                        setPitchContent(null)
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Generate Another
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <Button
                onClick={() => {
                  setShowPitchModal(false)
                  setPitchContent(null)
                }}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
