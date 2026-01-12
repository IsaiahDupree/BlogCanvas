'use client'

import { FactCheckResult, FactCheckClaim } from '@/lib/agents/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, XCircle, ExternalLink, Shield } from 'lucide-react'

interface FactCheckReportProps {
    factCheckReport: FactCheckResult
    className?: string
}

export function FactCheckReport({ factCheckReport, className }: FactCheckReportProps) {
    const getStatusIcon = (status: FactCheckClaim['status']) => {
        switch (status) {
            case 'verified':
                return <CheckCircle2 className="w-4 h-4 text-green-600" />
            case 'needs_source':
                return <ExternalLink className="w-4 h-4 text-yellow-600" />
            case 'questionable':
                return <AlertTriangle className="w-4 h-4 text-orange-600" />
            case 'unverified':
                return <XCircle className="w-4 h-4 text-red-600" />
        }
    }

    const getStatusColor = (status: FactCheckClaim['status']) => {
        switch (status) {
            case 'verified':
                return 'bg-green-50 border-green-200'
            case 'needs_source':
                return 'bg-yellow-50 border-yellow-200'
            case 'questionable':
                return 'bg-orange-50 border-orange-200'
            case 'unverified':
                return 'bg-red-50 border-red-200'
        }
    }

    const getSeverityBadge = (severity: FactCheckClaim['severity']) => {
        const colors = {
            low: 'bg-gray-100 text-gray-700',
            medium: 'bg-yellow-100 text-yellow-700',
            high: 'bg-red-100 text-red-700'
        }
        return (
            <Badge className={colors[severity]}>
                {severity}
            </Badge>
        )
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    const highSeverityClaims = factCheckReport.claims.filter(c => c.severity === 'high')
    const needsSourceClaims = factCheckReport.claims.filter(c => c.status === 'needs_source' || c.status === 'questionable')

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <CardTitle>Fact-Check Report</CardTitle>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className={`text-2xl font-bold ${getScoreColor(factCheckReport.factCheckScore)}`}>
                                {factCheckReport.factCheckScore}
                            </div>
                            <div className="text-xs text-gray-500">Score</div>
                        </div>
                        <Badge className={factCheckReport.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {factCheckReport.passed ? 'Passed' : 'Needs Review'}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Overall Feedback */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{factCheckReport.overallFeedback}</p>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{factCheckReport.totalClaims}</div>
                        <div className="text-xs text-gray-500">Total Claims</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{factCheckReport.verifiedClaims}</div>
                        <div className="text-xs text-gray-500">Verified</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{factCheckReport.unverifiedClaims}</div>
                        <div className="text-xs text-gray-500">Needs Attention</div>
                    </div>
                </div>

                {/* High Priority Issues */}
                {highSeverityClaims.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            High Priority Issues ({highSeverityClaims.length})
                        </h4>
                        <div className="space-y-2">
                            {highSeverityClaims.map((claim, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 border rounded-lg ${getStatusColor(claim.status)}`}
                                >
                                    <div className="flex items-start gap-2">
                                        {getStatusIcon(claim.status)}
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{claim.claim}</p>
                                            <p className="text-xs text-gray-600 mt-1">{claim.reasoning}</p>
                                            {claim.suggestedSource && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                    💡 {claim.suggestedSource}
                                                </p>
                                            )}
                                        </div>
                                        {getSeverityBadge(claim.severity)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Claims */}
                {factCheckReport.claims.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            All Claims ({factCheckReport.claims.length})
                        </h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {factCheckReport.claims.map((claim, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 border rounded-lg ${getStatusColor(claim.status)}`}
                                >
                                    <div className="flex items-start gap-2">
                                        {getStatusIcon(claim.status)}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-medium text-gray-900">{claim.claim}</p>
                                                {getSeverityBadge(claim.severity)}
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">{claim.reasoning}</p>
                                            {claim.suggestedSource && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                    💡 Suggested: {claim.suggestedSource}
                                                </p>
                                            )}
                                            {claim.sectionKey && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Section: {claim.sectionKey}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Claims Found */}
                {factCheckReport.claims.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <Shield className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No verifiable claims detected in this content.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default FactCheckReport
