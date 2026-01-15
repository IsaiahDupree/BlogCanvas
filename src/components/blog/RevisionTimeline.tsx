'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  PenTool,
  Search,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  XCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AgentOutput {
  id: string
  blog_post_id: string
  agent_name: string
  agent_version: string
  input: any
  output: any
  duration_ms: number
  model_used: string
  token_count: number | null
  status: 'completed' | 'failed' | 'skipped'
  error_message: string | null
  created_at: string
}

interface RevisionTimelineProps {
  postId: string
  autoRefresh?: boolean
  refreshInterval?: number // milliseconds
}

const AGENT_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  research: {
    icon: Search,
    label: 'Research',
    color: 'text-purple-600'
  },
  outline: {
    icon: FileText,
    label: 'Outline',
    color: 'text-blue-600'
  },
  draft: {
    icon: PenTool,
    label: 'Draft',
    color: 'text-green-600'
  },
  seo: {
    icon: Sparkles,
    label: 'SEO Optimization',
    color: 'text-yellow-600'
  },
  fact_check: {
    icon: CheckCircle2,
    label: 'Fact Check',
    color: 'text-indigo-600'
  },
  enhance: {
    icon: Sparkles,
    label: 'Enhancement',
    color: 'text-pink-600'
  },
  orchestrator: {
    icon: Clock,
    label: 'Orchestrator',
    color: 'text-gray-600'
  }
}

export function RevisionTimeline({ postId, autoRefresh = false, refreshInterval = 10000 }: RevisionTimelineProps) {
  const [agentOutputs, setAgentOutputs] = useState<AgentOutput[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchAgentOutputs()

    if (autoRefresh) {
      const interval = setInterval(fetchAgentOutputs, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [postId, autoRefresh, refreshInterval])

  const fetchAgentOutputs = async () => {
    try {
      const res = await fetch(`/api/blog-posts/${postId}/agent-outputs`)
      const data = await res.json()

      if (data.success) {
        setAgentOutputs(data.agentOutputs)
      }
    } catch (error) {
      console.error('Failed to fetch agent outputs:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'skipped':
        return <Badge className="bg-gray-100 text-gray-800">Skipped</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const renderOutputPreview = (output: any, agentName: string) => {
    if (!output) return <p className="text-gray-500">No output available</p>

    try {
      // Format based on agent type
      switch (agentName) {
        case 'outline':
          return (
            <div className="space-y-2">
              {output.outline?.sections?.map((section: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <p className="font-semibold">{section.heading}</p>
                  {section.subheadings?.map((sub: string, subIdx: number) => (
                    <p key={subIdx} className="ml-4 text-gray-600">• {sub}</p>
                  ))}
                </div>
              ))}
            </div>
          )

        case 'draft':
          return (
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-gray-700 line-clamp-4">
                {typeof output === 'string' ? output : output.content || output.draft || JSON.stringify(output).substring(0, 200)}
              </p>
            </div>
          )

        case 'seo':
          return (
            <div className="space-y-2 text-sm">
              {output.suggestions && (
                <>
                  <p className="font-semibold">Suggestions:</p>
                  <ul className="list-disc ml-4 text-gray-700">
                    {output.suggestions.slice(0, 3).map((suggestion: string, idx: number) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )

        default:
          // Generic JSON preview
          const preview = typeof output === 'string'
            ? output.substring(0, 200)
            : JSON.stringify(output, null, 2).substring(0, 200)

          return (
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40">
              {preview}...
            </pre>
          )
      }
    } catch (error) {
      return <p className="text-gray-500 text-sm">Unable to preview output</p>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Pipeline Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (agentOutputs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Agent Pipeline Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">No agent executions yet</p>
            <p className="text-sm mt-1">Agent outputs will appear here as they complete</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Agent Pipeline Timeline
          </span>
          <Badge variant="outline">{agentOutputs.length} executions</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agentOutputs.map((output, index) => {
            const config = AGENT_CONFIG[output.agent_name] || {
              icon: FileText,
              label: output.agent_name,
              color: 'text-gray-600'
            }
            const Icon = config.icon
            const isExpanded = expandedNodes.has(output.id)
            const isLast = index === agentOutputs.length - 1

            return (
              <div key={output.id} className="relative">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-[15px] top-[40px] bottom-[-16px] w-[2px] bg-gray-200" />
                )}

                {/* Timeline node */}
                <div className="flex gap-4">
                  {/* Icon circle */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    output.status === 'completed' ? 'bg-green-100' :
                    output.status === 'failed' ? 'bg-red-100' :
                    'bg-gray-100'
                  }`}>
                    {output.status === 'completed' ? (
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    ) : output.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div
                      className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                      onClick={() => toggleNode(output.id)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{config.label}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTimestamp(output.created_at)} • {formatDuration(output.duration_ms)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(output.status)}
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <span>Model: {output.model_used || 'Unknown'}</span>
                        <span>•</span>
                        <span>Version: {output.agent_version}</span>
                        {output.token_count && (
                          <>
                            <span>•</span>
                            <span>{output.token_count.toLocaleString()} tokens</span>
                          </>
                        )}
                      </div>

                      {/* Error message */}
                      {output.status === 'failed' && output.error_message && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                          <p className="font-semibold flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Error:
                          </p>
                          <p className="mt-1">{output.error_message}</p>
                        </div>
                      )}

                      {/* Expanded content */}
                      {isExpanded && output.status === 'completed' && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-semibold mb-2">Output Preview:</h4>
                          {renderOutputPreview(output.output, output.agent_name)}

                          {output.input && (
                            <details className="mt-4">
                              <summary className="text-sm font-semibold cursor-pointer text-gray-700 hover:text-gray-900">
                                View Input
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto max-h-60">
                                {JSON.stringify(output.input, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
