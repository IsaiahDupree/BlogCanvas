'use client'

import { useState } from 'react'
import { 
  Globe, 
  Search, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Target,
  FileText
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ComparisonResult {
  ourSite: {
    url: string
    pagesAnalyzed: number
    avgScore: number
    topKeywords: string[]
  }
  competitor: {
    url: string
    pagesAnalyzed: number
    avgScore: number
    topKeywords: string[]
  }
  gaps: {
    missingTopics: string[]
    weakAreas: string[]
    opportunities: string[]
  }
  strengths: string[]
  recommendations: string[]
}

export function CompetitorComparison() {
  const [ourUrl, setOurUrl] = useState('')
  const [competitorUrl, setCompetitorUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runComparison = async () => {
    if (!ourUrl || !competitorUrl) {
      setError('Please enter both URLs')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // First, analyze our site
      const ourAnalysis = await fetch('/api/ai/content-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: ourUrl,
          action: 'full',
          competitorUrl: competitorUrl,
          maxPages: 30
        })
      })

      const ourData = await ourAnalysis.json()

      if (!ourData.success) {
        throw new Error(ourData.error || 'Analysis failed')
      }

      // Build comparison result
      const comparisonResult: ComparisonResult = {
        ourSite: {
          url: ourUrl,
          pagesAnalyzed: ourData.scoring?.pagesScored || 0,
          avgScore: ourData.scoring?.averageScore || 0,
          topKeywords: ourData.keywords?.primaryKeywords?.slice(0, 10).map((k: any) => k.keyword) || []
        },
        competitor: {
          url: competitorUrl,
          pagesAnalyzed: 0,
          avgScore: 0,
          topKeywords: []
        },
        gaps: {
          missingTopics: ourData.competitorGaps?.slice(0, 10).map((g: any) => g.keyword) || [],
          weakAreas: ourData.scoring?.needsImprovement?.slice(0, 5).map((p: any) => p.url) || [],
          opportunities: ourData.keywords?.missingOpportunities?.slice(0, 10) || []
        },
        strengths: ourData.scoring?.topPerformers?.slice(0, 5).map((p: any) => p.url) || [],
        recommendations: ourData.keywords?.recommendations || []
      }

      setResult(comparisonResult)

    } catch (err: any) {
      setError(err.message || 'Comparison failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Competitor Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Your Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  placeholder="https://yoursite.com"
                  value={ourUrl}
                  onChange={(e) => setOurUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Competitor Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  placeholder="https://competitor.com"
                  value={competitorUrl}
                  onChange={(e) => setCompetitorUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={runComparison}
            disabled={loading || !ourUrl || !competitorUrl}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing... (this may take a few minutes)
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Run Competitor Analysis
              </>
            )}
          </Button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Your Site
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 truncate">{result.ourSite.url}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Pages Analyzed</span>
                    <Badge variant="secondary">{result.ourSite.pagesAnalyzed}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Avg Content Score</span>
                    <span className="text-2xl font-bold text-blue-700">{result.ourSite.avgScore}/100</span>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-2">Top Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {result.ourSite.topKeywords.slice(0, 5).map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  Competitor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 truncate">{result.competitor.url}</p>
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Competitor data captured</p>
                    <p className="text-xs text-gray-400 mt-1">Used for gap analysis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Gaps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                Content Gaps (Topics Competitor Covers That You Don&apos;t)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.gaps.missingTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.gaps.missingTopics.map((topic, i) => (
                    <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-sm text-red-800">{topic}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No major content gaps detected</p>
              )}
            </CardContent>
          </Card>

          {/* Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Keyword Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.gaps.opportunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.gaps.opportunities.map((opp, i) => (
                    <div key={i} className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-green-800">{opp}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No additional opportunities identified</p>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Strategic Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-800">{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-4">No specific recommendations at this time</p>
              )}
            </CardContent>
          </Card>

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Your Top Performing Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.strengths.map((url, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-800 truncate flex-1">{url}</span>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 text-green-600" />
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
