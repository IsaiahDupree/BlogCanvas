'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Mail, 
  Loader2,
  Target,
  Calendar,
  TrendingUp,
  Users,
  BarChart3,
  Sparkles,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Client {
  id: string
  name: string
  website_url?: string
}

interface Website {
  id: string
  url: string
  client_id: string
}

interface PitchPreview {
  clientName: string
  currentSeoScore: number
  targetSeoScore: number
  recommendedPosts: number
  timelineMonths: number
  projectedTrafficIncrease: number
  topicGaps: { cluster: string; priority: string }[]
}

export default function PitchDeckPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<PitchPreview | null>(null)
  
  // Form state
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedWebsite, setSelectedWebsite] = useState('')
  const [targetScore, setTargetScore] = useState(80)
  const [timelineMonths, setTimelineMonths] = useState(6)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      fetchWebsites(selectedClient)
    }
  }, [selectedClient])

  const fetchData = async () => {
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

  const fetchWebsites = async (clientId: string) => {
    try {
      const res = await fetch(`/api/websites?clientId=${clientId}`)
      const data = await res.json()
      setWebsites(data.websites || [])
      if (data.websites?.length > 0) {
        setSelectedWebsite(data.websites[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch websites:', error)
    }
  }

  const generatePreview = async () => {
    if (!selectedClient) return
    
    setGenerating(true)
    try {
      const res = await fetch('/api/pitch-deck/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          websiteId: selectedWebsite || undefined,
          targetScore,
          timelineMonths,
          format: 'json'
        })
      })

      const data = await res.json()
      if (data.success) {
        setPreview(data.data)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const downloadPdf = async () => {
    if (!selectedClient) return
    
    setGenerating(true)
    try {
      const res = await fetch('/api/pitch-deck/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          websiteId: selectedWebsite || undefined,
          targetScore,
          timelineMonths,
          format: 'pdf'
        })
      })

      const data = await res.json()
      if (data.success && data.pdf) {
        // Convert base64 to blob and download
        const byteCharacters = atob(data.pdf)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/app" className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pitch Deck Generator</h1>
              <p className="text-muted-foreground">
                Create professional SEO content proposals for your clients
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Set up your pitch deck parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Select Client
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => {
                      setSelectedClient(e.target.value)
                      setPreview(null)
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="">Choose a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>

                {/* Website Selection */}
                {websites.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Website
                    </label>
                    <select
                      value={selectedWebsite}
                      onChange={(e) => setSelectedWebsite(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600"
                    >
                      {websites.map((website) => (
                        <option key={website.id} value={website.id}>{website.url}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Target Score */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Target SEO Score: {targetScore}
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="95"
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>60</span>
                    <span>95</span>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Campaign Timeline
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 6, 9, 12].map((months) => (
                      <button
                        key={months}
                        onClick={() => setTimelineMonths(months)}
                        className={`py-2 text-sm rounded-lg border transition-colors ${
                          timelineMonths === months
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {months}mo
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  <Button
                    onClick={generatePreview}
                    disabled={!selectedClient || generating}
                    className="w-full"
                    variant="outline"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    Preview
                  </Button>
                  <Button
                    onClick={downloadPdf}
                    disabled={!selectedClient || generating}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="bg-indigo-50 border-indigo-200">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-indigo-900 mb-1">Tips for Better Pitches</h4>
                    <ul className="text-sm text-indigo-700 space-y-1">
                      <li>• Run an SEO audit first for accurate baseline</li>
                      <li>• Set realistic target scores (+15-25 points)</li>
                      <li>• Match timeline to client budget</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            {!preview ? (
              <Card className="h-full flex items-center justify-center min-h-[500px]">
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Preview Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Select a client and click Preview to see your pitch deck
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Preview Header */}
                <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <CardContent className="pt-6">
                    <h2 className="text-2xl font-bold mb-2">SEO Content Strategy</h2>
                    <p className="text-indigo-100">for {preview.clientName}</p>
                  </CardContent>
                </Card>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Target className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                      <div className="text-2xl font-bold">
                        {preview.currentSeoScore} → {preview.targetSeoScore}
                      </div>
                      <p className="text-xs text-muted-foreground">SEO Score</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold">{preview.recommendedPosts}</div>
                      <p className="text-xs text-muted-foreground">Blog Posts</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-cyan-600" />
                      <div className="text-2xl font-bold">{preview.timelineMonths}mo</div>
                      <p className="text-xs text-muted-foreground">Timeline</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold">+{preview.projectedTrafficIncrease}%</div>
                      <p className="text-xs text-muted-foreground">Traffic Increase</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Topic Gaps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      Content Gaps to Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {preview.topicGaps.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No topic gaps found. Run an SEO audit to identify opportunities.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {preview.topicGaps.slice(0, 8).map((gap, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">{gap.cluster}</span>
                            <Badge variant={
                              gap.priority === 'high' ? 'destructive' : 
                              gap.priority === 'medium' ? 'default' : 'secondary'
                            }>
                              {gap.priority}
                            </Badge>
                          </div>
                        ))}
                        {preview.topicGaps.length > 8 && (
                          <p className="text-sm text-muted-foreground text-center pt-2">
                            +{preview.topicGaps.length - 8} more gaps in full PDF
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Download CTA */}
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Ready to share with your client?</h4>
                        <p className="text-sm text-muted-foreground">
                          Download the full 6-slide pitch deck as PDF
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" disabled>
                          <Mail className="w-4 h-4 mr-2" />
                          Email (Coming Soon)
                        </Button>
                        <Button 
                          onClick={downloadPdf}
                          disabled={generating}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
