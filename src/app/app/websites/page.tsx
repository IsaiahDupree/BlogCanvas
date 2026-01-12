'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Globe, TrendingUp, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Website {
    id: string
    url: string
    domain: string
    title: string | null
    description: string | null
    scrape_status: 'pending' | 'scraping' | 'completed' | 'failed'
    pages_scraped: number | null
    created_at: string
    latestAudit?: {
        baseline_score: number
        pages_indexed: number
    }
}

export default function WebsitesPage() {
    const [websites, setWebsites] = useState<Website[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)

    useEffect(() => {
        fetchWebsites()
    }, [])

    const fetchWebsites = async () => {
        try {
            const response = await fetch('/api/websites')
            const data = await response.json()
            if (data.success) {
                // Fetch audit data for each website
                const websitesWithAudits = await Promise.all(
                    data.websites.map(async (website: Website) => {
                        const auditResponse = await fetch(`/api/websites/${website.id}`)
                        const auditData = await auditResponse.json()
                        return auditData.success ? auditData.website : website
                    })
                )
                setWebsites(websitesWithAudits)
            }
        } catch (error) {
            console.error('Failed to fetch websites:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Analyzed</Badge>
            case 'scraping':
                return <Badge className="bg-blue-100 text-blue-700"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Scraping...</Badge>
            case 'failed':
                return <Badge className="bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>
            default:
                return <Badge className="bg-gray-100 text-gray-700">Pending</Badge>
        }
    }

    const getSEOScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/app" className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                Website Management
                            </h1>
                            <p className="text-muted-foreground">
                                Analyze client websites and track SEO performance
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowAddForm(true)}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Website
                        </Button>
                    </div>
                </div>

                {/* Add Website Form */}
                {showAddForm && (
                    <AddWebsiteForm
                        onClose={() => setShowAddForm(false)}
                        onSuccess={() => {
                            setShowAddForm(false)
                            fetchWebsites()
                        }}
                    />
                )}

                {/* Websites Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                ) : websites.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Globe className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No websites yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Add your first website to start analyzing
                        </p>
                        <Button onClick={() => setShowAddForm(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Website
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {websites.map((website) => (
                            <Link key={website.id} href={`/app/websites/${website.id}`}>
                                <Card className="hover:shadow-xl transition-shadow cursor-pointer h-full">
                                    <CardHeader>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg mb-1 line-clamp-1">
                                                    {website.title || website.domain}
                                                </CardTitle>
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {website.url}
                                                </p>
                                            </div>
                                            {getStatusBadge(website.scrape_status)}
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        {website.latestAudit ? (
                                            <div className="space-y-4">
                                                {/* SEO Score */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-muted-foreground">SEO Score</span>
                                                        <span className={`text-2xl font-bold ${getSEOScoreColor(website.latestAudit.baseline_score)}`}>
                                                            {website.latestAudit.baseline_score}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all"
                                                            style={{ width: `${website.latestAudit.baseline_score}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Pages Analyzed */}
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Pages Analyzed</span>
                                                    <span className="font-semibold">{website.latestAudit.pages_indexed}</span>
                                                </div>

                                                {/* View Details Button */}
                                                <Button className="w-full" variant="outline">
                                                    <Search className="w-4 h-4 mr-2" />
                                                    View Analysis
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    {website.scrape_status === 'pending' ? 'Ready to analyze' : 'No audit data yet'}
                                                </p>
                                                <Button className="w-full" variant="outline">
                                                    <TrendingUp className="w-4 h-4 mr-2" />
                                                    Start Analysis
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function AddWebsiteForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // First create the website
            const createResponse = await fetch('/api/websites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            })

            const createData = await createResponse.json()

            if (!createData.success) {
                setError(createData.error || 'Failed to add website')
                setLoading(false)
                return
            }

            // Then start scraping
            const scrapeResponse = await fetch('/api/websites/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, maxPages: 50 })
            })

            const scrapeData = await scrapeResponse.json()

            if (scrapeData.success) {
                onSuccess()
            } else {
                setError(scrapeData.error || 'Failed to scrape website')
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="mb-6 shadow-xl">
            <CardHeader>
                <CardTitle>Add New Website</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Website URL
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                            required
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Enter the full URL including https://
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add & Analyze
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                    </div>

                    {loading && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-700">
                                This may take 1-2 minutes. We'll scrape up to 50 pages and analyze the content.
                            </p>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}
