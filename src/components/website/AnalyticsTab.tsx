'use client'

import { useState, useEffect } from 'react'
import { Download, BarChart3, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SEOScoreTrendChart from '@/components/seo/SEOScoreTrendChart'
import AuditHistoryTimeline from '@/components/seo/AuditHistoryTimeline'
import TopicClusterMap from '@/components/seo/TopicClusterMap'
import { TopicClustersTab } from './TopicClustersTab'

interface SEOAudit {
    id: string
    website_id: string
    baseline_score: number
    pages_indexed: number
    audit_date: string
    raw_metrics?: any
}

interface TopicCluster {
    id: string
    name: string
    primary_keyword: string
    search_intent: string
    difficulty: number
    estimated_traffic: number
    currently_covered: boolean
    recommended_article_count: number
}

export function AnalyticsTab({ websiteId }: { websiteId: string }) {
    const [audits, setAudits] = useState<SEOAudit[]>([])
    const [clusters, setClusters] = useState<TopicCluster[]>([])
    const [loading, setLoading] = useState(true)
    const [exportingAudit, setExportingAudit] = useState(false)

    useEffect(() => {
        fetchData()
    }, [websiteId])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch audit history
            const auditsResponse = await fetch(`/api/websites/${websiteId}/seo-audits?limit=30`)
            const auditsData = await auditsResponse.json()
            if (auditsData.success) {
                setAudits(auditsData.audits || [])
            }

            // Fetch topic clusters
            const clustersResponse = await fetch(`/api/websites/${websiteId}/topic-clusters`)
            const clustersData = await clustersResponse.json()
            if (clustersData.success) {
                setClusters(clustersData.clusters || [])
            }
        } catch (error) {
            console.error('Failed to fetch analytics data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleExportAudit = async () => {
        try {
            setExportingAudit(true)

            const response = await fetch(`/api/websites/${websiteId}/export-audit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    includeHistory: true,
                    limit: 10,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to generate audit report')
            }

            // Create a blob from the response and trigger download
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url

            // Extract filename from Content-Disposition header if available
            const contentDisposition = response.headers.get('Content-Disposition')
            const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/)
            const filename = filenameMatch ? filenameMatch[1] : `seo_audit_${websiteId}.pdf`

            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Error exporting audit:', error)
            alert('Failed to export audit report. Please try again.')
        } finally {
            setExportingAudit(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Loading analytics data...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with Export Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">SEO Analytics & Insights</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Comprehensive analysis of your website's SEO performance and opportunities
                    </p>
                </div>
                <Button
                    onClick={handleExportAudit}
                    disabled={exportingAudit || audits.length === 0}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                >
                    <Download className="w-4 h-4 mr-2" />
                    {exportingAudit ? 'Generating PDF...' : 'Export Audit Report'}
                </Button>
            </div>

            {/* Analytics Views */}
            <Tabs defaultValue="trends" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="trends" className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Score Trends
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Audit History
                    </TabsTrigger>
                    <TabsTrigger value="clusters" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Topic Map
                    </TabsTrigger>
                </TabsList>

                {/* Score Trends Tab */}
                <TabsContent value="trends" className="space-y-6">
                    <SEOScoreTrendChart
                        websiteId={websiteId}
                        limit={30}
                        showFullChart={true}
                    />
                </TabsContent>

                {/* Audit History Timeline Tab */}
                <TabsContent value="history" className="space-y-6">
                    <AuditHistoryTimeline
                        audits={audits}
                        websiteId={websiteId}
                    />
                </TabsContent>

                {/* Topic Cluster Map Tab */}
                <TabsContent value="clusters" className="space-y-6">
                    <TopicClusterMap clusters={clusters} />

                    {/* Optional: Show traditional list view below the map */}
                    {clusters.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <h3 className="text-lg font-semibold mb-4">Detailed Cluster View</h3>
                            <TopicClustersTab websiteId={websiteId} />
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
