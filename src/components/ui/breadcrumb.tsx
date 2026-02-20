import * as React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      <ol className="flex items-center space-x-1">
        {showHome && (
          <>
            <li>
              <Link
                href="/"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Home"
              >
                <Home className="h-4 w-4" />
              </Link>
            </li>
            {items.length > 0 && (
              <li aria-hidden="true">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </li>
            )}
          </>
        )}
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <React.Fragment key={index}>
              <li>
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      isLast
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </li>
              )}
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Hook to automatically generate breadcrumbs from pathname
 */
export function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  return React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)

    return segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/')
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      return { label, href }
    })
  }, [pathname])
}
