'use client'

import { Change } from 'diff'

interface DiffViewerProps {
  diff: Change[]
  title?: string
}

export default function DiffViewer({ diff, title }: DiffViewerProps) {
  if (!diff || diff.length === 0) {
    return (
      <div className="text-gray-500 italic p-4">No changes detected</div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {title && (
        <div className="bg-gray-100 px-4 py-2 font-semibold text-sm text-gray-700 border-b">
          {title}
        </div>
      )}
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
    </div>
  )
}
