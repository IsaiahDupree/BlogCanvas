'use client'

import { useState } from 'react'
import { Change } from 'diff'
import { Columns2, List } from 'lucide-react'

interface DiffViewerProps {
  diff: Change[]
  title?: string
  defaultView?: 'split' | 'unified'
}

export default function DiffViewer({ diff, title, defaultView = 'unified' }: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>(defaultView)

  if (!diff || diff.length === 0) {
    return (
      <div className="text-gray-500 italic p-4">No changes detected</div>
    )
  }

  // Process diff into lines for split view
  const processDiffForSplitView = () => {
    const leftLines: Array<{ content: string; type: 'removed' | 'unchanged' | 'empty' }> = []
    const rightLines: Array<{ content: string; type: 'added' | 'unchanged' | 'empty' }> = []

    diff.forEach((part) => {
      const lines = part.value.split('\n').filter((line, idx, arr) => {
        // Filter out empty last line from split
        return !(idx === arr.length - 1 && line === '')
      })

      if (part.added) {
        // Add empty lines to left, actual lines to right
        lines.forEach(line => {
          leftLines.push({ content: '', type: 'empty' })
          rightLines.push({ content: line, type: 'added' })
        })
      } else if (part.removed) {
        // Add actual lines to left, empty lines to right
        lines.forEach(line => {
          leftLines.push({ content: line, type: 'removed' })
          rightLines.push({ content: '', type: 'empty' })
        })
      } else {
        // Add same content to both sides
        lines.forEach(line => {
          leftLines.push({ content: line, type: 'unchanged' })
          rightLines.push({ content: line, type: 'unchanged' })
        })
      }
    })

    return { leftLines, rightLines }
  }

  const renderUnifiedView = () => {
    return (
      <div className="font-mono text-sm">
        {diff.map((part, index) => {
          let bgColor = 'bg-white'
          let textColor = 'text-gray-900'
          let prefix = ' '

          if (part.added) {
            bgColor = 'bg-green-50'
            textColor = 'text-green-900'
            prefix = '+'
          } else if (part.removed) {
            bgColor = 'bg-red-50'
            textColor = 'text-red-900'
            prefix = '-'
          }

          // Split value into lines for better display
          const lines = part.value.split('\n')

          return lines.map((line, lineIndex) => {
            // Don't show empty last line from split
            if (lineIndex === lines.length - 1 && line === '') {
              return null
            }

            return (
              <div
                key={`${index}-${lineIndex}`}
                className={`${bgColor} ${textColor} px-4 py-1 hover:bg-opacity-80`}
              >
                <span className="inline-block w-4 text-gray-400 select-none">
                  {prefix}
                </span>
                <span className="whitespace-pre-wrap">{line || ' '}</span>
              </div>
            )
          })
        })}
      </div>
    )
  }

  const renderSplitView = () => {
    const { leftLines, rightLines } = processDiffForSplitView()
    const maxLines = Math.max(leftLines.length, rightLines.length)

    return (
      <div className="grid grid-cols-2 divide-x font-mono text-sm">
        {/* Left side - Removed */}
        <div>
          <div className="bg-red-100 px-4 py-1 text-red-900 font-semibold text-xs border-b">
            Original
          </div>
          {leftLines.map((line, index) => {
            let bgColor = 'bg-white'
            let textColor = 'text-gray-900'
            let prefix = ' '

            if (line.type === 'removed') {
              bgColor = 'bg-red-50'
              textColor = 'text-red-900'
              prefix = '-'
            } else if (line.type === 'empty') {
              bgColor = 'bg-gray-50'
              textColor = 'text-gray-400'
            }

            return (
              <div
                key={`left-${index}`}
                className={`${bgColor} ${textColor} px-4 py-1 hover:bg-opacity-80 min-h-[28px]`}
              >
                {line.type !== 'empty' && (
                  <>
                    <span className="inline-block w-4 text-gray-400 select-none">
                      {prefix}
                    </span>
                    <span className="whitespace-pre-wrap">{line.content || ' '}</span>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Right side - Added */}
        <div>
          <div className="bg-green-100 px-4 py-1 text-green-900 font-semibold text-xs border-b">
            Modified
          </div>
          {rightLines.map((line, index) => {
            let bgColor = 'bg-white'
            let textColor = 'text-gray-900'
            let prefix = ' '

            if (line.type === 'added') {
              bgColor = 'bg-green-50'
              textColor = 'text-green-900'
              prefix = '+'
            } else if (line.type === 'empty') {
              bgColor = 'bg-gray-50'
              textColor = 'text-gray-400'
            }

            return (
              <div
                key={`right-${index}`}
                className={`${bgColor} ${textColor} px-4 py-1 hover:bg-opacity-80 min-h-[28px]`}
              >
                {line.type !== 'empty' && (
                  <>
                    <span className="inline-block w-4 text-gray-400 select-none">
                      {prefix}
                    </span>
                    <span className="whitespace-pre-wrap">{line.content || ' '}</span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
        <div className="font-semibold text-sm text-gray-700">
          {title || 'Changes'}
        </div>
        <div className="flex items-center gap-1 bg-white border rounded-md p-1">
          <button
            onClick={() => setViewMode('unified')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${
              viewMode === 'unified'
                ? 'bg-indigo-100 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            title="Unified view"
          >
            <List className="w-3.5 h-3.5" />
            Unified
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${
              viewMode === 'split'
                ? 'bg-indigo-100 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            title="Split view"
          >
            <Columns2 className="w-3.5 h-3.5" />
            Split
          </button>
        </div>
      </div>
      {viewMode === 'unified' ? renderUnifiedView() : renderSplitView()}
    </div>
  )
}
