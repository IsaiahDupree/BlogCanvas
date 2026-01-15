'use client'

import { useEffect, useRef } from 'react'

interface BlogPreviewProps {
  content: string
  className?: string
  readOnly?: boolean
}

/**
 * BlogPreview - A read-only blog content preview component
 *
 * Features:
 * - Renders HTML content safely with proper styling
 * - Supports images with responsive sizing
 * - Styles tables with proper borders and spacing
 * - Enforces read-only mode (prevents editing, disables forms)
 * - Uses Tailwind prose classes for beautiful typography
 */
export default function BlogPreview({ content, className = '', readOnly = true }: BlogPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!readOnly || !contentRef.current) return

    // Enforce read-only mode by disabling all interactive elements
    const container = contentRef.current

    // Disable all form elements
    const formElements = container.querySelectorAll('input, textarea, select, button')
    formElements.forEach((el) => {
      (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement).disabled = true
    })

    // Remove contenteditable attributes
    const editableElements = container.querySelectorAll('[contenteditable]')
    editableElements.forEach((el) => {
      el.removeAttribute('contenteditable')
    })

    // Prevent drag events on images
    const images = container.querySelectorAll('img')
    images.forEach((img) => {
      img.setAttribute('draggable', 'false')
    })
  }, [readOnly, content])

  return (
    <div
      ref={contentRef}
      className={`
        prose prose-lg max-w-none
        prose-headings:font-bold prose-headings:text-gray-900
        prose-h1:text-4xl prose-h1:mt-0 prose-h1:mb-6
        prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-6
        prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
        prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-3
        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
        prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
        prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
        prose-li:my-2 prose-li:text-gray-700
        prose-strong:text-gray-900 prose-strong:font-semibold
        prose-em:italic prose-em:text-gray-700
        prose-blockquote:border-l-4 prose-blockquote:border-indigo-600
        prose-blockquote:pl-6 prose-blockquote:italic
        prose-blockquote:text-gray-700 prose-blockquote:bg-gray-50
        prose-blockquote:py-4 prose-blockquote:my-6
        prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
        prose-code:text-indigo-600 prose-code:bg-gray-100
        prose-code:px-2 prose-code:py-1 prose-code:rounded
        prose-pre:bg-gray-900 prose-pre:text-gray-100
        prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
        prose-img:rounded-lg prose-img:shadow-md prose-img:my-8
        prose-img:w-full prose-img:h-auto prose-img:max-w-full
        prose-table:w-full prose-table:my-8
        prose-table:border-collapse prose-table:border prose-table:border-gray-300
        prose-thead:bg-gray-100
        prose-th:border prose-th:border-gray-300
        prose-th:px-4 prose-th:py-3 prose-th:text-left
        prose-th:font-semibold prose-th:text-gray-900
        prose-td:border prose-td:border-gray-300
        prose-td:px-4 prose-td:py-3 prose-td:text-gray-700
        prose-tr:border-b prose-tr:border-gray-200
        ${readOnly ? 'select-text cursor-text' : ''}
        ${className}
      `}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        // Additional inline styles for better image and table handling
        wordWrap: 'break-word',
        overflowWrap: 'break-word'
      }}
    />
  )
}
