'use client'

import { useState, useEffect, useRef } from 'react'
import { Terminal, Copy, Download, Play, Pause, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface LogEntry {
    id: string
    timestamp: Date
    level: 'info' | 'success' | 'warning' | 'error' | 'system'
    message: string
    metadata?: Record<string, any>
}

interface TerminalViewerProps {
    jobId?: string
    onComplete?: () => void
    onResume?: () => void
}

export function TerminalViewer({ jobId, onComplete, onResume }: TerminalViewerProps) {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [progress, setProgress] = useState({ current: 0, total: 0, stage: '' })
    const terminalRef = useRef<HTMLDivElement>(null)
    const eventSourceRef = useRef<EventSource | null>(null)
    const logsRef = useRef<LogEntry[]>([])

    // Auto-scroll to bottom
    useEffect(() => {
        if (terminalRef.current && !isPaused) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
    }, [logs, isPaused])

    // Connect to SSE stream
    useEffect(() => {
        if (!jobId) return

        const eventSource = new EventSource(`/api/workflow/logs/${jobId}`)
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
            setIsConnected(true)
            addLog('system', 'Connected to log stream')
        }

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                
                if (data.type === 'log') {
                    addLog(data.level || 'info', data.message, data.metadata)
                } else if (data.type === 'progress') {
                    setProgress({
                        current: data.current || 0,
                        total: data.total || 0,
                        stage: data.stage || ''
                    })
                } else if (data.type === 'complete') {
                    addLog('success', 'Process completed successfully')
                    setIsConnected(false)
                    eventSource.close()
                    onComplete?.()
                } else if (data.type === 'error') {
                    addLog('error', data.message || 'An error occurred')
                    setIsConnected(false)
                    eventSource.close()
                }
            } catch (err) {
                console.error('Failed to parse SSE message:', err)
            }
        }

        eventSource.onerror = () => {
            setIsConnected(false)
            addLog('error', 'Connection lost. Click Resume to reconnect.')
            eventSource.close()
        }

        return () => {
            eventSource.close()
        }
    }, [jobId, onComplete])

    const addLog = (level: LogEntry['level'], message: string, metadata?: Record<string, any>) => {
        if (isPaused) return

        const entry: LogEntry = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            level,
            message,
            metadata
        }

        logsRef.current = [...logsRef.current, entry]
        setLogs([...logsRef.current])
    }

    const handleResume = () => {
        setIsPaused(false)
        if (onResume) {
            onResume()
        } else if (jobId && !isConnected) {
            // Reconnect
            const eventSource = new EventSource(`/api/workflow/logs/${jobId}`)
            eventSourceRef.current = eventSource
        }
    }

    const handleCopy = () => {
        const text = logs.map(log => 
            `[${log.timestamp.toLocaleTimeString()}] [${log.level.toUpperCase()}] ${log.message}`
        ).join('\n')
        navigator.clipboard.writeText(text)
    }

    const handleDownload = () => {
        const text = logs.map(log => 
            `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] ${log.message}${log.metadata ? ' ' + JSON.stringify(log.metadata) : ''}`
        ).join('\n')
        const blob = new Blob([text], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `workflow-logs-${jobId || Date.now()}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    const getLogColor = (level: LogEntry['level']) => {
        switch (level) {
            case 'success': return 'text-green-400'
            case 'warning': return 'text-yellow-400'
            case 'error': return 'text-red-400'
            case 'system': return 'text-blue-400'
            default: return 'text-gray-300'
        }
    }

    const getLogIcon = (level: LogEntry['level']) => {
        switch (level) {
            case 'success': return '✓'
            case 'warning': return '⚠'
            case 'error': return '✗'
            case 'system': return '●'
            default: return '→'
        }
    }

    return (
        <div className="relative w-full">
            {/* Glassmorphic Terminal Container */}
            <div className="relative rounded-2xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-black/20 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">Workflow Terminal</h3>
                        <Badge 
                            variant={isConnected ? "default" : "secondary"}
                            className={isConnected ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-gray-500/20 text-gray-300 border-gray-500/30"}
                        >
                            {isConnected ? '● Live' : '○ Disconnected'}
                        </Badge>
                        {progress.total > 0 && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30">
                                {progress.current}/{progress.total} {progress.stage}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {!isConnected && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResume}
                                className="text-white hover:bg-white/10"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Resume
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsPaused(!isPaused)}
                            className="text-white hover:bg-white/10"
                        >
                            {isPaused ? (
                                <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Resume
                                </>
                            ) : (
                                <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pause
                                </>
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="text-white hover:bg-white/10"
                        >
                            <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownload}
                            className="text-white hover:bg-white/10"
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Terminal Body */}
                <div
                    ref={terminalRef}
                    className="h-[600px] overflow-y-auto p-6 bg-gradient-to-b from-black/40 to-black/60 font-mono text-sm"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255,255,255,0.2) transparent'
                    }}
                >
                    {logs.length === 0 ? (
                        <div className="text-gray-400 italic">
                            Waiting for logs... {jobId ? `(Job ID: ${jobId})` : ''}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-3 py-1 hover:bg-white/5 rounded px-2 -mx-2 transition-colors"
                                >
                                    <span className="text-gray-500 text-xs mt-0.5 min-w-[80px]">
                                        {log.timestamp.toLocaleTimeString()}
                                    </span>
                                    <span className={`${getLogColor(log.level)} min-w-[20px]`}>
                                        {getLogIcon(log.level)}
                                    </span>
                                    <span className={`flex-1 ${getLogColor(log.level)}`}>
                                        {log.message}
                                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                                            <span className="text-gray-400 ml-2 text-xs">
                                                {JSON.stringify(log.metadata)}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Terminal Footer */}
                <div className="px-6 py-3 bg-black/30 border-t border-white/10 flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                        {logs.length} log entries
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                        {isPaused && '⏸ Paused'} {!isConnected && !isPaused && '⚠ Disconnected'}
                    </div>
                </div>
            </div>

            {/* Custom Scrollbar Styling */}
            <style jsx global>{`
                div[class*="terminal"]::-webkit-scrollbar {
                    width: 8px;
                }
                div[class*="terminal"]::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                }
                div[class*="terminal"]::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }
                div[class*="terminal"]::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>
        </div>
    )
}

