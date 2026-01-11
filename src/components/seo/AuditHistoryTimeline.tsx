'use client'

import { useState } from 'react'
import { Clock, TrendingUp, TrendingDown, Minus, BarChart3, FileText, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SEOAudit {
    id: string
    website_id: string
    baseline_score: number
    pages_indexed: number
    audit_date: string
    raw_metrics?: any
}

interface AuditHistoryTimelineProps {
    audits: SEOAudit[]
    websiteId: string
}

export default function AuditHistoryTimeline({
    audits,
    websiteId,
}: AuditHistoryTimelineProps) {
    const [selectedAudit, setSelectedAudit] = useState<string | null>(null)

    const getScoreChangeColor = (change: number) => {
        if (change > 0) return 'text-green-600'
        if (change < 0) return 'text-red-600'
        return 'text-gray-600'
    }

    const getScoreBadgeColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 text-green-800'
        if (score >= 60) return 'bg-yellow-100 text-yellow-800'
        if (score >= 40) return 'bg-orange-100 text-orange-800'
        return 'bg-red-100 text-red-800'
    }

    const getScoreRating = (score: number) => {
        if (score >= 80) return 'Excellent'
        if (score >= 60) return 'Good'
        if (score >= 40) return 'Fair'
        return 'Needs Improvement'
    }

    const toggleAuditDetails = (auditId: string) => {
        setSelectedAudit(selectedAudit === auditId ? null : auditId)
    }

    if (!audits || audits.length === 0) {
        return (
            <Card className="p-6 border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-gray-400" />
                    <div>
                        <p className="font-semibold text-gray-900">No Audit History</p>
                        <p className="text-sm text-gray-600">
                            Run your first SEO audit to start building your audit history
                        </p>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Audit History Timeline</h3>
                <Badge variant="outline" className="text-xs">
                    {audits.length} audit{audits.length !== 1 ? 's' : ''}
                </Badge>
            </div>

            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500"></div>

                {/* Audit cards */}
                <div className="space-y-6">
                    {audits.map((audit, index) => {
                        const isFirst = index === 0
                        const previousAudit = index < audits.length - 1 ? audits[index + 1] : null
                        const scoreChange = previousAudit
                            ? audit.baseline_score - previousAudit.baseline_score
                            : 0
                        const isExpanded = selectedAudit === audit.id

                        return (
                            <div key={audit.id} className="relative pl-16">
                                {/* Timeline dot */}
                                <div className={`absolute left-3 top-3 w-6 h-6 rounded-full border-4 ${
                                    isFirst
                                        ? 'bg-indigo-600 border-indigo-200'
                                        : 'bg-white border-gray-300'
                                }`}>
                                    {isFirst && (
                                        <div className="absolute inset-0 rounded-full animate-ping bg-indigo-600 opacity-75"></div>
                                    )}
                                </div>

                                {/* Audit card */}
                                <Card
                                    className={`cursor-pointer transition-all hover:shadow-lg ${
                                        isFirst ? 'border-2 border-indigo-300 bg-indigo-50' : ''
                                    } ${isExpanded ? 'ring-2 ring-indigo-400' : ''}`}
                                    onClick={() => toggleAuditDetails(audit.id)}
                                >
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Left side: Score and date */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl font-bold text-gray-900">
                                                                {audit.baseline_score}
                                                            </span>
                                                            <span className="text-lg text-gray-500">/100</span>
                                                            {isFirst && (
                                                                <Badge className="bg-indigo-600 text-white">
                                                                    Latest
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <Badge className={getScoreBadgeColor(audit.baseline_score)}>
                                                            {getScoreRating(audit.baseline_score)}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span>
                                                        {new Date(audit.audit_date).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>

                                                {audit.pages_indexed > 0 && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                        <FileText className="w-4 h-4" />
                                                        <span>{audit.pages_indexed} pages indexed</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right side: Change indicator */}
                                            {previousAudit && (
                                                <div className={`flex items-center gap-2 ${getScoreChangeColor(scoreChange)}`}>
                                                    {scoreChange > 0 ? (
                                                        <TrendingUp className="w-5 h-5" />
                                                    ) : scoreChange < 0 ? (
                                                        <TrendingDown className="w-5 h-5" />
                                                    ) : (
                                                        <Minus className="w-5 h-5" />
                                                    )}
                                                    <div className="text-right">
                                                        <div className="font-semibold">
                                                            {scoreChange > 0 ? '+' : ''}{scoreChange}
                                                        </div>
                                                        <div className="text-xs">
                                                            {previousAudit.baseline_score > 0
                                                                ? `${((scoreChange / previousAudit.baseline_score) * 100).toFixed(1)}%`
                                                                : '—'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Expanded details */}
                                        {isExpanded && audit.raw_metrics && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                                    Audit Details
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {Object.entries(audit.raw_metrics).map(([key, value]) => (
                                                        <div key={key} className="bg-white rounded-lg p-3 border border-gray-200">
                                                            <div className="text-xs text-gray-500 mb-1">
                                                                {key.replace(/_/g, ' ').toUpperCase()}
                                                            </div>
                                                            <div className="text-sm font-semibold text-gray-900">
                                                                {typeof value === 'number'
                                                                    ? value.toLocaleString()
                                                                    : typeof value === 'boolean'
                                                                    ? value ? 'Yes' : 'No'
                                                                    : String(value)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* First audit indicator */}
                                {index === audits.length - 1 && (
                                    <div className="absolute -left-1 -bottom-4 text-xs text-gray-500 font-medium">
                                        First Audit
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Summary footer */}
            {audits.length >= 2 && (
                <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-indigo-600" />
                        <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                                Total Score Change:
                            </span>
                            <span className={`ml-2 font-bold ${
                                getScoreChangeColor(audits[0].baseline_score - audits[audits.length - 1].baseline_score)
                            }`}>
                                {audits[0].baseline_score > audits[audits.length - 1].baseline_score ? '+' : ''}
                                {audits[0].baseline_score - audits[audits.length - 1].baseline_score} points
                            </span>
                            <span className="text-gray-600 ml-2">
                                from {new Date(audits[audits.length - 1].audit_date).toLocaleDateString()} to{' '}
                                {new Date(audits[0].audit_date).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    )
}
