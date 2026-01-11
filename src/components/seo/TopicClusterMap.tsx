'use client'

import { useState, useEffect } from 'react'
import { Target, TrendingUp, Circle, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

interface TopicClusterMapProps {
    clusters: TopicCluster[]
    onClusterClick?: (cluster: TopicCluster) => void
}

export default function TopicClusterMap({ clusters, onClusterClick }: TopicClusterMapProps) {
    const [selectedCluster, setSelectedCluster] = useState<string | null>(null)
    const [hoveredCluster, setHoveredCluster] = useState<string | null>(null)

    const getDifficultyColor = (difficulty: number) => {
        if (difficulty < 40) return '#10b981' // green
        if (difficulty < 65) return '#f59e0b' // yellow
        return '#ef4444' // red
    }

    const getIntentColor = (intent: string) => {
        switch (intent) {
            case 'informational': return '#3b82f6' // blue
            case 'commercial': return '#8b5cf6' // purple
            case 'transactional': return '#10b981' // green
            default: return '#6b7280' // gray
        }
    }

    // Group clusters by search intent for better visualization
    const clustersByIntent = clusters.reduce((acc, cluster) => {
        const intent = cluster.search_intent || 'unknown'
        if (!acc[intent]) acc[intent] = []
        acc[intent].push(cluster)
        return acc
    }, {} as Record<string, TopicCluster[]>)

    const intents = Object.keys(clustersByIntent)

    // Calculate node positions in a circular/radial layout
    const calculateNodePositions = () => {
        const width = 800
        const height = 600
        const centerX = width / 2
        const centerY = height / 2
        const radiusBase = 180

        const positions: Record<string, { x: number; y: number; cluster: TopicCluster }> = {}

        intents.forEach((intent, intentIndex) => {
            const intentClusters = clustersByIntent[intent]
            const angleStep = (2 * Math.PI) / intents.length
            const intentAngle = intentIndex * angleStep

            intentClusters.forEach((cluster, clusterIndex) => {
                const clusterCount = intentClusters.length
                const subAngleStep = (Math.PI / 3) / Math.max(clusterCount, 1)
                const subAngle = intentAngle + (clusterIndex - clusterCount / 2) * subAngleStep

                // Vary radius based on traffic (higher traffic = closer to center)
                const maxTraffic = Math.max(...clusters.map(c => c.estimated_traffic))
                const radiusVariation = cluster.estimated_traffic / maxTraffic * 100
                const radius = radiusBase + (100 - radiusVariation)

                positions[cluster.id] = {
                    x: centerX + Math.cos(subAngle) * radius,
                    y: centerY + Math.sin(subAngle) * radius,
                    cluster
                }
            })
        })

        return positions
    }

    const nodePositions = calculateNodePositions()

    const handleClusterClick = (cluster: TopicCluster) => {
        setSelectedCluster(cluster.id)
        if (onClusterClick) {
            onClusterClick(cluster)
        }
    }

    if (!clusters || clusters.length === 0) {
        return (
            <Card className="p-12 text-center border-gray-200 bg-gray-50">
                <Target className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No topic clusters to visualize</p>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-blue-500" fill="currentColor" />
                        <span className="text-sm text-gray-600">Informational</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-purple-500" fill="currentColor" />
                        <span className="text-sm text-gray-600">Commercial</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-green-500" fill="currentColor" />
                        <span className="text-sm text-gray-600">Transactional</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Covered</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-orange-600" />
                        <span>Opportunity</span>
                    </div>
                    <div>
                        <span>Size = Traffic Potential</span>
                    </div>
                </div>
            </div>

            {/* Visualization */}
            <Card className="p-6 bg-gradient-to-br from-slate-50 to-indigo-50">
                <div className="w-full overflow-x-auto">
                    <svg width="800" height="600" className="mx-auto">
                        {/* Background grid */}
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
                            </pattern>

                            {/* Gradient definitions for nodes */}
                            <radialGradient id="coveredGradient">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
                            </radialGradient>
                            <radialGradient id="opportunityGradient">
                                <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#ea580c" stopOpacity="0.9" />
                            </radialGradient>
                        </defs>

                        <rect width="800" height="600" fill="url(#grid)" />

                        {/* Center point indicator */}
                        <circle cx="400" cy="300" r="5" fill="#6366f1" opacity="0.3" />
                        <text x="400" y="290" textAnchor="middle" className="text-xs fill-gray-400">
                            Center
                        </text>

                        {/* Connection lines from center to each node */}
                        {Object.values(nodePositions).map(({ x, y, cluster }) => (
                            <line
                                key={`line-${cluster.id}`}
                                x1="400"
                                y1="300"
                                x2={x}
                                y2={y}
                                stroke={getIntentColor(cluster.search_intent)}
                                strokeWidth="1"
                                strokeDasharray="4,4"
                                opacity="0.2"
                            />
                        ))}

                        {/* Cluster nodes */}
                        {Object.values(nodePositions).map(({ x, y, cluster }) => {
                            const maxTraffic = Math.max(...clusters.map(c => c.estimated_traffic))
                            const nodeSize = 15 + (cluster.estimated_traffic / maxTraffic) * 25
                            const isSelected = selectedCluster === cluster.id
                            const isHovered = hoveredCluster === cluster.id

                            return (
                                <g
                                    key={cluster.id}
                                    cursor="pointer"
                                    onClick={() => handleClusterClick(cluster)}
                                    onMouseEnter={() => setHoveredCluster(cluster.id)}
                                    onMouseLeave={() => setHoveredCluster(null)}
                                >
                                    {/* Outer glow on hover/select */}
                                    {(isSelected || isHovered) && (
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r={nodeSize + 8}
                                            fill={getIntentColor(cluster.search_intent)}
                                            opacity="0.2"
                                        >
                                            <animate
                                                attributeName="r"
                                                from={nodeSize + 8}
                                                to={nodeSize + 15}
                                                dur="1s"
                                                repeatCount="indefinite"
                                            />
                                        </circle>
                                    )}

                                    {/* Main node circle */}
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={nodeSize}
                                        fill={cluster.currently_covered ? 'url(#coveredGradient)' : 'url(#opportunityGradient)'}
                                        stroke={isSelected ? '#1f2937' : getIntentColor(cluster.search_intent)}
                                        strokeWidth={isSelected ? 3 : 2}
                                        opacity={isHovered ? 1 : 0.9}
                                    />

                                    {/* Checkmark for covered topics */}
                                    {cluster.currently_covered && (
                                        <text
                                            x={x}
                                            y={y + 5}
                                            textAnchor="middle"
                                            className="text-xs font-bold fill-white"
                                        >
                                            ✓
                                        </text>
                                    )}

                                    {/* Cluster name label */}
                                    <text
                                        x={x}
                                        y={y + nodeSize + 15}
                                        textAnchor="middle"
                                        className="text-xs font-medium fill-gray-700"
                                        style={{ fontSize: isHovered ? '13px' : '11px' }}
                                    >
                                        {cluster.name.length > 20
                                            ? cluster.name.substring(0, 20) + '...'
                                            : cluster.name}
                                    </text>

                                    {/* Traffic indicator */}
                                    <text
                                        x={x}
                                        y={y + nodeSize + 28}
                                        textAnchor="middle"
                                        className="text-xs fill-gray-500"
                                        style={{ fontSize: '10px' }}
                                    >
                                        {(cluster.estimated_traffic / 1000).toFixed(1)}k/mo
                                    </text>

                                    {/* Difficulty ring */}
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={nodeSize + 3}
                                        fill="none"
                                        stroke={getDifficultyColor(cluster.difficulty)}
                                        strokeWidth="2"
                                        strokeDasharray={`${cluster.difficulty / 100 * (2 * Math.PI * (nodeSize + 3))} ${2 * Math.PI * (nodeSize + 3)}`}
                                        opacity="0.6"
                                    />
                                </g>
                            )
                        })}
                    </svg>
                </div>
            </Card>

            {/* Selected cluster details */}
            {selectedCluster && nodePositions[selectedCluster] && (
                <Card className="p-6 border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                {nodePositions[selectedCluster].cluster.currently_covered ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                ) : (
                                    <Circle className="w-6 h-6 text-orange-600" />
                                )}
                                <h3 className="text-xl font-bold text-gray-900">
                                    {nodePositions[selectedCluster].cluster.name}
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <div className="text-xs text-gray-600 mb-1">Primary Keyword</div>
                                    <div className="font-semibold text-indigo-600">
                                        "{nodePositions[selectedCluster].cluster.primary_keyword}"
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-600 mb-1">Est. Traffic</div>
                                    <div className="text-xl font-bold text-green-600">
                                        {nodePositions[selectedCluster].cluster.estimated_traffic.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-600 mb-1">Difficulty</div>
                                    <div className="text-xl font-bold" style={{ color: getDifficultyColor(nodePositions[selectedCluster].cluster.difficulty) }}>
                                        {nodePositions[selectedCluster].cluster.difficulty}/100
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-600 mb-1">Articles Needed</div>
                                    <div className="text-xl font-bold text-purple-600">
                                        {nodePositions[selectedCluster].cluster.recommended_article_count}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedCluster(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>
                </Card>
            )}
        </div>
    )
}
