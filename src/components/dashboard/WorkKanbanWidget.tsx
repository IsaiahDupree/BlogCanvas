'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ClipboardList, Clock, Play, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface WorkDeclaration {
  id: string
  title: string
  client_id: string
  client?: { name: string }
  status: 'planned' | 'in_progress' | 'review' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  progress_percentage: number
}

const statusConfig = {
  planned: { label: 'Planned', color: 'bg-gray-100 text-gray-800', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Play },
  review: { label: 'Review', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
}

const priorityColors = {
  low: 'border-l-gray-400',
  medium: 'border-l-blue-400',
  high: 'border-l-orange-400',
  urgent: 'border-l-red-500',
}

export function WorkKanbanWidget() {
  const [declarations, setDeclarations] = useState<WorkDeclaration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkDeclarations()
  }, [])

  const fetchWorkDeclarations = async () => {
    try {
      const res = await fetch('/api/work-declarations?limit=12')
      const data = await res.json()
      setDeclarations(data.declarations || [])
    } catch (error) {
      console.error('Failed to fetch work declarations:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupedDeclarations = {
    planned: declarations.filter(d => d.status === 'planned'),
    in_progress: declarations.filter(d => d.status === 'in_progress'),
    review: declarations.filter(d => d.status === 'review'),
    completed: declarations.filter(d => d.status === 'completed').slice(0, 3),
  }

  const totalActive = declarations.filter(d => d.status !== 'completed').length

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Work Declarations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-indigo-600" />
          Work Declarations
          {totalActive > 0 && (
            <Badge variant="secondary" className="ml-2">{totalActive} active</Badge>
          )}
        </CardTitle>
        <Link href="/app/work-declarations">
          <Button variant="ghost" size="sm" className="text-indigo-600">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {declarations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No work declarations yet</p>
            <Link href="/app/work-declarations">
              <Button className="mt-4" size="sm">Create Declaration</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['planned', 'in_progress', 'review', 'completed'] as const).map((status) => {
              const config = statusConfig[status]
              const StatusIcon = config.icon
              const items = groupedDeclarations[status]
              
              return (
                <div key={status} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <StatusIcon className="w-4 h-4" />
                    <span className="font-medium text-sm">{config.label}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {items.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 min-h-[100px]">
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No items
                      </p>
                    ) : (
                      items.map((declaration) => (
                        <Link
                          key={declaration.id}
                          href={`/app/work-declarations/${declaration.id}`}
                        >
                          <div className={`p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 ${priorityColors[declaration.priority]}`}>
                            <p className="text-sm font-medium line-clamp-2 mb-1">
                              {declaration.title}
                            </p>
                            {declaration.client?.name && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {declaration.client.name}
                              </p>
                            )}
                            {declaration.progress_percentage > 0 && declaration.status !== 'completed' && (
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-indigo-600 h-1.5 rounded-full transition-all"
                                  style={{ width: `${declaration.progress_percentage}%` }}
                                />
                              </div>
                            )}
                            {declaration.due_date && (
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(declaration.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
