'use client'

import { useState } from 'react'
import { Globe, Search, CheckCircle, XCircle, AlertCircle, TrendingUp, FileText, Link as LinkIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function WebsiteAnalysisPage() {
    const [url, setUrl] = useState('')
    const [scraping, setScraping] = useState(false)
    const [analyzed, setAnalyzed] = useState(false)

    const handleScrape = async (e: React.FormEvent) => {
        e.preventDefault()
        setScraping(true)

        // Simulate scraping
        setTimeout(() => {
            setScraping(false)
            setAnalyzed(true)
        }, 3000)
    }

    // Mock data - would come from API
    const analysisResults = {
        domain: 'example.com',
        pagesScraped: 47,
        totalWords: 52340,
        avgWordCount: 1113,
        thinContent: 8,
        gaps: [
            {
                type: 'Missing Topic',
                severity: 'high',
                title: 'No content about AI automation',
                description: 'Competitors are covering AI automation extensively. This is a major gap.',
                impact: 'High traffic opportunity'
            },
            {
                type: 'Thin Content',
                severity: 'medium',
                title: '8 pages with < 300 words',
                description: 'Several pages have insufficient content depth',
                impact: 'SEO ranking impact'
            },
            {
                type: 'Poor SEO',
                severity: 'medium',
                title: 'Missing meta descriptions on 15 pages',
                description: 'Many pages lack optimized meta descriptions',
                impact: 'Lower click-through rates'
            }
        ],
        suggestions: [
            {
                title: 'Create "Ultimate Guide to AI CRM Automation"',
                type: 'New Blog Post',
                keyword: 'AI CRM automation',
                estimatedWords: 2500,
                priority: 10,
                impact: 'high',
                reasoning: 'High search volume, low competition, fills major gap'
            },
            {
                title: 'Expand "Getting Started" page',
                type: 'Update Page',
                keyword: 'how to use CRM',
                estimatedWords: 800,
                priority: 8,
                impact: 'medium',
                reasoning: 'Currently only 250 words, needs more depth'
            },
            {
                title: 'Create "CRM vs Spreadsheet Comparison"',
                type: 'New Resource',
                keyword: 'CRM comparison',
                estimatedWords: 1500,
                priority: 7,
                impact: 'high',
                reasoning: 'Common question, good conversion potential'
            }
        ],
        topicsCovered: [
            'CRM basics',
            'Sales pipeline',
            'Contact management',
            'Email integration',
            'Reporting'
        ],
        missingTopics: [
            'AI automation',
            'Mobile app features',
            'API integration',
            'Security & compliance',
            'Team collaboration'
        ]
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                        Website Analysis
                    </h1>
                    <p className="text-muted-foreground">
                        Scrape any website to identify content gaps and improvement opportunities
                    </p>
                </div>

                {/* URL Input */}
                <Card className="p-6 bg-white shadow-xl mb-8">
                    <form onSubmit={handleScrape}>
                        <label className="block mb-3 font-semibold text-gray-900 text-lg">
                            Website URL to Analyze
                        </label>
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-lg"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={scraping}
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg flex items-center gap-2 whitespace-nowrap"
                            >
                                {scraping ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        Analyze Website
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-3">
                            We'll scrape up to 50 pages to analyze content, SEO, and opportunities
                        </p>
                    </form>
                </Card>

                {analyzed && (
                    <>
                        {/* Overview Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <Card className="p-6 bg-white border-2 border-purple-100">
                                <div className="flex items-center justify-between mb-3">
                                    <FileText className="w-8 h-8 text-purple-600" />
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900">{analysisResults.pagesScraped}</h3>
                                <p className="text-sm text-muted-foreground">Pages Analyzed</p>
                            </Card>

                            <Card className="p-6 bg-white border-2 border-blue-100">
                                <div className="flex items-center justify-between mb-3">
                                    <LinkIcon className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900">{analysisResults.avgWordCount}</h3>
                                <p className="text-sm text-muted-foreground">Avg Word Count</p>
                            </Card>

                            <Card className="p-6 bg-white border-2 border-yellow-100">
                                <div className="flex items-center justify-between mb-3">
                                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900">{analysisResults.gaps.length}</h3>
                                <p className="text-sm text-muted-foreground">Content Gaps</p>
                            </Card>

                            <Card className="p-6 bg-white border-2 border-green-100">
                                <div className="flex items-center justify-between mb-3">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900">{analysisResults.suggestions.length}</h3>
                                <p className="text-sm text-muted-foreground">Suggestions</p>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Content Gaps */}
                            <Card className="p-6 bg-white shadow-xl">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                                    Content Gaps Identified
                                </h2>
                                <div className="space-y-4">
                                    {analysisResults.gaps.map((gap, i) => (
                                        <div key={i} className="p-4 border-2 border-gray-100 rounded-lg hover:border-purple-200 transition-colors">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge className={
                                                            gap.severity === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                gap.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                                    'bg-blue-100 text-blue-700 border-blue-200'
                                                        }>
                                                            {gap.severity.toUpperCase()}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">{gap.type}</span>
                                                    </div>
                                                    <h3 className="font-semibold text-gray-900">{gap.title}</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">{gap.description}</p>
                                                    <p className="text-xs text-purple-600 mt-2 font-medium">Impact: {gap.impact}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Content Suggestions */}
                            <Card className="p-6 bg-white shadow-xl">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                    Recommended Actions
                                </h2>
                                <div className="space-y-4">
                                    {analysisResults.suggestions.map((suggestion, i) => (
                                        <div key={i} className="p-4 border-2 border-gray-100 rounded-lg hover:border-green-200 transition-colors group">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                                                            Priority {suggestion.priority}/10
                                                        </Badge>
                                                        <Badge variant="outline" className={
                                                            suggestion.impact === 'high' ? 'border-green-500 text-green-700' :
                                                                suggestion.impact === 'medium' ? 'border-yellow-500 text-yellow-700' :
                                                                    'border-blue-500 text-blue-700'
                                                        }>
                                                            {suggestion.impact} impact
                                                        </Badge>
                                                    </div>
                                                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                                        {suggestion.title}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground mt-1">{suggestion.reasoning}</p>
                                                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                        <span>Keyword: {suggestion.keyword}</span>
                                                        <span>•</span>
                                                        <span>~{suggestion.estimatedWords} words</span>
                                                        <span>•</span>
                                                        <span className="text-purple-600 font-medium">{suggestion.type}</span>
                                                    </div>
                                                </div>
                                                <button className="ml-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
                                                    Create
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* Topics Coverage */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                            <Card className="p-6 bg-white shadow-xl">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    Topics Currently Covered
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {analysisResults.topicsCovered.map((topic, i) => (
                                        <Badge key={i} className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                                            ✓ {topic}
                                        </Badge>
                                    ))}
                                </div>
                            </Card>

                            <Card className="p-6 bg-white shadow-xl">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    Missing Topics (Opportunities)
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {analysisResults.missingTopics.map((topic, i) => (
                                        <Badge key={i} className="bg-red-100 text-red-700 border-red-200 px-3 py-1">
                                            ✗ {topic}
                                        </Badge>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
