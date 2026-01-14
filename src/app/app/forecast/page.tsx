'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Target, 
  Building2,
  Globe,
  Loader2,
  FileText,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ForecastSlider } from '@/components/seo/ForecastSlider'

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

interface AuditData {
  baseline_score: number
  pages_indexed: number
}

interface TopicCluster {
  id: string
  name: string
  currently_covered: boolean
  difficulty?: number
  estimated_traffic?: number
}

export default function ForecastPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [websites, setWebsites] = useState<Website[]>([])
  const [topicClusters, setTopicClusters] = useState<TopicCluster[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  
  // Selection state
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedWebsite, setSelectedWebsite] = useState('')
  
  // Data state
  const [currentScore, setCurrentScore] = useState(50)
  const [currentTraffic, setCurrentTraffic] = useState(1000)
  const [topicGaps, setTopicGaps] = useState(20)
  const [avgDifficulty, setAvgDifficulty] = useState(50)

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      fetchWebsites(selectedClient)
    }
  }, [selectedClient])

  useEffect(() => {
    if (selectedWebsite) {
      fetchWebsiteData(selectedWebsite)
    }
  }, [selectedWebsite])

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

  const fetchWebsiteData = async (websiteId: string) => {
    setLoadingData(true)
    try {
      // Fetch website with audit data
      const websiteRes = await fetch(`/api/websites/${websiteId}`)
      const websiteData = await websiteRes.json()
      
      if (websiteData.website) {
        // Get latest audit score
        if (websiteData.website.seo_audits?.length > 0) {
          const latestAudit = websiteData.website.seo_audits.sort(
            (a: any, b: any) => new Date(b.audit_date).getTime() - new Date(a.audit_date).getTime()
          )[0]
          setCurrentScore(latestAudit.baseline_score || 50)
        }
      }

      // Fetch topic clusters
      const clustersRes = await fetch(`/api/topic-clusters?websiteId=${websiteId}`)
      const clustersData = await clustersRes.json()
      
      if (clustersData.clusters) {
        setTopicClusters(clustersData.clusters)
        const uncovered = clustersData.clusters.filter((c: TopicCluster) => !c.currently_covered)
        setTopicGaps(uncovered.length)
        
        // Calculate average difficulty
        const difficulties = uncovered
          .filter((c: TopicCluster) => c.difficulty)
          .map((c: TopicCluster) => c.difficulty!)
        if (difficulties.length > 0) {
          setAvgDifficulty(Math.round(difficulties.reduce((a: number, b: number) => a + b, 0) / difficulties.length))
        }
      }
    } catch (error) {
      console.error('Failed to fetch website data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleGeneratePitch = (targetScore: number, timeline: number) => {
    router.push(`/app/pitch-deck?clientId=${selectedClient}&targetScore=${targetScore}&timeline=${timeline}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/app" className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SEO Forecast Tool</h1>
              <p className="text-muted-foreground">
                Plan your content strategy with interactive projections
              </p>
            </div>
          </div>
        </div>

        {/* Client/Website Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Select Client & Website</CardTitle>
            <CardDescription>Choose a client to load their SEO data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Client
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => {
                    setSelectedClient(e.target.value)
                    setSelectedWebsite('')
                    setWebsites([])
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="">Choose a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Website
                </label>
                <select
                  value={selectedWebsite}
                  onChange={(e) => setSelectedWebsite(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600"
                  disabled={!selectedClient || websites.length === 0}
                >
                  <option value="">
                    {!selectedClient ? 'Select a client first' : 
                     websites.length === 0 ? 'No websites found' : 'Choose a website...'}
                  </option>
                  {websites.map((website) => (
                    <option key={website.id} value={website.id}>{website.url}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick stats when data loaded */}
            {selectedWebsite && !loadingData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">{currentScore}</div>
                    <div className="text-xs text-gray-500">Current Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{topicGaps}</div>
                    <div className="text-xs text-gray-500">Topic Gaps</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-cyan-600">{avgDifficulty}</div>
                    <div className="text-xs text-gray-500">Avg Difficulty</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{topicClusters.length}</div>
                    <div className="text-xs text-gray-500">Total Clusters</div>
                  </div>
                </div>
              </div>
            )}

            {loadingData && (
              <div className="mt-4 flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
                <span className="text-gray-600">Loading SEO data...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Forecast Slider */}
        {selectedClient ? (
          <ForecastSlider
            currentScore={currentScore}
            topicGaps={topicGaps}
            currentTraffic={currentTraffic}
            avgKeywordDifficulty={avgDifficulty}
            onGeneratePitch={handleGeneratePitch}
          />
        ) : (
          <Card className="text-center py-16">
            <CardContent>
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Client to Begin</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Choose a client from the dropdown above to load their SEO data and start building your forecast.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {selectedClient && (
          <div className="mt-8 flex justify-center gap-4">
            <Link href={`/app/websites/${selectedWebsite}`}>
              <Button variant="outline">
                <Globe className="w-4 h-4 mr-2" />
                View Website Details
              </Button>
            </Link>
            <Link href="/app/pitch-deck">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Create Pitch Deck
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
