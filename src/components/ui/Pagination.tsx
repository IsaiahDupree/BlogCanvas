'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
  baseUrl?: string
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  baseUrl,
  className,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showEllipsis = totalPages > 7

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  const PageButton = ({
    page,
    children,
    isCurrent = false,
    isEllipsis = false,
  }: {
    page?: number
    children: React.ReactNode
    isCurrent?: boolean
    isEllipsis?: boolean
  }) => {
    const className_str = cn(
      'inline-flex items-center justify-center w-10 h-10 rounded-md text-sm font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      isCurrent
        ? 'bg-primary text-primary-foreground pointer-events-none'
        : isEllipsis
        ? 'pointer-events-none'
        : 'hover:bg-accent hover:text-accent-foreground'
    )

    if (isEllipsis) {
      return (
        <span className={className_str} aria-hidden="true">
          {children}
        </span>
      )
    }

    if (isCurrent) {
      return (
        <span className={className_str} aria-current="page" aria-label={`Page ${page}`}>
          {children}
        </span>
      )
    }

    if (baseUrl && page) {
      const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`
      return (
        <Link href={url} className={className_str} aria-label={`Go to page ${page}`}>
          {children}
        </Link>
      )
    }

    if (onPageChange && page) {
      return (
        <button
          onClick={() => onPageChange(page)}
          className={className_str}
          aria-label={`Go to page ${page}`}
        >
          {children}
        </button>
      )
    }

    return null
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center gap-1', className)}
    >
      {/* Previous Button */}
      {currentPage > 1 && (
        <PageButton page={currentPage - 1}>
          <ChevronLeft className="w-4 h-4" />
          <span className="sr-only">Previous page</span>
        </PageButton>
      )}

      {/* Page Numbers */}
      {pages.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <PageButton key={`ellipsis-${index}`} isEllipsis>
              <MoreHorizontal className="w-4 h-4" />
            </PageButton>
          )
        }

        return (
          <PageButton key={page} page={page} isCurrent={page === currentPage}>
            {page}
          </PageButton>
        )
      })}

      {/* Next Button */}
      {currentPage < totalPages && (
        <PageButton page={currentPage + 1}>
          <ChevronRight className="w-4 h-4" />
          <span className="sr-only">Next page</span>
        </PageButton>
      )}
    </nav>
  )
}

interface PaginationInfo {
  currentPage: number
  pageSize: number
  totalItems: number
  className?: string
}

export function PaginationInfo({
  currentPage,
  pageSize,
  totalItems,
  className,
}: PaginationInfo) {
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      Showing <strong>{start}</strong> to <strong>{end}</strong> of{' '}
      <strong>{totalItems}</strong> results
    </p>
  )
}

// Helper function to calculate pagination metadata
export function getPaginationMeta(totalItems: number, page: number, pageSize: number) {
  const totalPages = Math.ceil(totalItems / pageSize)
  const currentPage = Math.max(1, Math.min(page, totalPages))
  const offset = (currentPage - 1) * pageSize
  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  return {
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    offset,
    hasNextPage,
    hasPreviousPage,
  }
}
