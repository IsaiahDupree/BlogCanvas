'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Clock, RefreshCw, Zap } from 'lucide-react'

interface PipelineEvent {
    type: string
    timestamp: string
    agentName?: string
    gateName?: string
    data?: {
        score?: number
        passed?: boolean
        issues?: string[]
        retryCount?: number
    }
}

interface AgentStatus {
    name: string
    displayName: string
    status: 'pending' | 'running' | 'success' | 'failed'
    startTime?: string
    endTime?: string
    qualityGate?: {
        score: number
        passed: boolean
        issues: string[]
    }
}

export default function PipelineVisualizer({ blogPostId }: { blogPostId: string }) {
    const [agents, setAgents] = useState<AgentStatus[]>([
        { name: 'research', displayName: 'Research Agent', status: 'pending' },
        { name: 'outline', displayName: 'Outline Agent', status: 'pending' },
        { name: 'draft', displayName: 'Draft Agent', status: 'pending' },
        { name: 'seo', displayName: 'SEO Agent', status: 'pending' },
        { name: 'voice-tone', displayName: 'Voice & Tone', status: 'pending' }
    ])
    const [retryCount, setRetryCount] = useState(0)
    const [pipelineStatus, setPipelineStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle')
    const [events, setEvents] = useState<PipelineEvent[]>([])

    // Simulate pipeline events for demo
    useEffect(() => {
        if (pipelineStatus === 'running') {
            const simulateEvents = async () => {
                // Research
                await updateAgent('research', 'running')
                await delay(1500)
                await updateAgent('research', 'success')

                // Outline
                await delay(500)
                await updateAgent('outline', 'running')
                await delay(2000)
                await updateAgent('outline', 'success', { score: 85, passed: true, issues: [] })

                // Draft
                await delay(500)
                await updateAgent('draft', 'running')
                await delay(3000)
                await updateAgent('draft', 'success')

                // SEO
                await delay(500)
                await updateAgent('seo', 'running')
                await delay(1500)
                await updateAgent('seo', 'success', { score: 82, passed: true, issues: ['Meta description could be more compelling'] })

                // Voice/Tone
                await delay(500)
                await updateAgent('voice-tone', 'running')
                await delay(2000)
                await updateAgent('voice-tone', 'success', { score: 88, passed: true, issues: [] })

                setPipelineStatus('completed')
            }

            simulateEvents()
        }
    }, [pipelineStatus])

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    const updateAgent = async (name: string, status: AgentStatus['status'], qualityGate?: any) => {
        setAgents(prev => prev.map(agent =>
            agent.name === name
                ? {
                    ...agent,
                    status,
                    [status === 'running' ? 'startTime' : 'endTime']: new Date().toISOString(),
                    ...(qualityGate && { qualityGate })
                }
                : agent
        ))
    }

    const getStatusIcon = (status: AgentStatus['status']) => {
        switch (status) {
            case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />
            case 'failed': return <XCircle className="w-5 h-5 text-red-500" />
            case 'running': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
            default: return <Clock className="w-5 h-5 text-gray-300" />
        }
    }

    const getStatusColor = (status: AgentStatus['status']) => {
        switch (status) {
            case 'success': return 'border-green-500 bg-green-50'
            case 'failed': return 'border-red-500 bg-red-50'
            case 'running': return 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-200'
            default: return 'border-gray-200 bg-gray-50'
        }
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold mb-2">AI Pipeline Execution</h2>
                    <p className="text-muted-foreground">Watch the multi-agent system create your blog post</p>
                </div>
                {pipelineStatus === 'idle' && (
                    <button
                        onClick={() => {
                            setPipelineStatus('running')
                            setAgents(prev => prev.map(a => ({ ...a, status: 'pending' })))
                        }}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 flex items-center gap-2"
                    >
                        <Zap className="w-5 h-5" />
                        Start Pipeline
                    </button>
                )}
                {pipelineStatus === 'running' && (
                    <Badge variant="outline" className="px-4 py-2 text-base">
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                    </Badge>
                )}
                {pipelineStatus === 'completed' && (
                    <Badge className="px-4 py-2 text-base bg-green-500">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Complete
                    </Badge>
                )}
            </div>

            {retryCount > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-yellow-600" />
                    <div>
                        <p className="font-medium text-yellow-900">Quality Gate Failed - Retry {retryCount}/2</p>
                        <p className="text-sm text-yellow-700">The AI is self-correcting and regenerating content...</p>
                    </div>
                </div>
            )}

            {/* Pipeline Flow */}
            <div className="relative">
                {/* Connection Lines */}
                <div className="absolute top-16 left-0 w-full h-1 bg-gradient-to-r from-gray-200 via-blue-200 to-green-200 -z-10" />

                <div className="grid grid-cols-5 gap-4">
                    {agents.map((agent, index) => (
                        <div key={agent.name} className="relative">
                            <Card className={`p-6 border-2 transition-all duration-300 ${getStatusColor(agent.status)}`}>
                                <div className="flex flex-col items-center text-center space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-white border-2 border-current flex items-center justify-center">
                                        {getStatusIcon(agent.status)}
                                    </div>
                                    <h3 className="font-semibold text-sm">{agent.displayName}</h3>
                                    {agent.status === 'running' && (
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
                                        </div>
                                    )}
                                    {agent.qualityGate && (
                                        <div className="w-full pt-3 border-t space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Quality</span>
                                                <Badge variant={agent.qualityGate.passed ? 'default' : 'destructive'} className="text-xs">
                                                    {agent.qualityGate.score}%
                                                </Badge>
                                            </div>
                                            {agent.qualityGate.issues.length > 0 && (
                                                <p className="text-xs text-yellow-600">{agent.qualityGate.issues[0]}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>

            {/* Live Event Log */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Live Event Log</h3>
                <Card className="p-4 bg-gray-900 text-gray-100 font-mono text-sm max-h-64 overflow-y-auto">
                    {agents.filter(a => a.startTime).map((agent, i) => (
                        <div key={i} className="mb-2">
                            <span className="text-blue-400">[{new Date(agent.startTime!).toLocaleTimeString()}]</span>{' '}
                            <span className="text-green-400">{agent.displayName}</span>{' '}
                            {agent.status === 'running' ? 'started...' : agent.status === 'success' ? '✓ completed' : '✗ failed'}
                            {agent.qualityGate && (
                                <span className="text-yellow-300"> | Quality Score: {agent.qualityGate.score}%</span>
                            )}
                        </div>
                    ))}
                    {pipelineStatus === 'completed' && (
                        <div className="mt-4 pt-4 border-t border-gray-700 text-green-400 font-bold">
                            🎉 Pipeline completed successfully! Blog post ready for review.
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
