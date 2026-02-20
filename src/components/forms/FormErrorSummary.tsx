'use client'

import { useEffect, useRef } from 'react'
import { AlertCircle } from 'lucide-react'

interface FormError {
  field: string
  message: string
  fieldId?: string
}

interface FormErrorSummaryProps {
  errors: FormError[]
  title?: string
  className?: string
}

export function FormErrorSummary({
  errors,
  title = 'Please correct the following errors:',
  className = '',
}: FormErrorSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (errors.length > 0 && summaryRef.current) {
      // Focus the error summary when errors appear for screen reader announcement
      summaryRef.current.focus()

      // Optionally scroll to first error field
      const firstErrorId = errors[0]?.fieldId
      if (firstErrorId) {
        const firstErrorElement = document.getElementById(firstErrorId)
        if (firstErrorElement) {
          // Wait a bit for the summary to be announced first
          setTimeout(() => {
            firstErrorElement.focus()
          }, 100)
        }
      }
    }
  }, [errors])

  if (errors.length === 0) {
    return null
  }

  return (
    <div
      ref={summaryRef}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={-1}
      className={`rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
            {title}
          </h2>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700 dark:text-red-300">
                {error.fieldId ? (
                  <a
                    href={`#${error.fieldId}`}
                    onClick={(e) => {
                      e.preventDefault()
                      const element = document.getElementById(error.fieldId!)
                      if (element) {
                        element.focus()
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }
                    }}
                    className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-sm"
                  >
                    <strong>{error.field}:</strong> {error.message}
                  </a>
                ) : (
                  <>
                    <strong>{error.field}:</strong> {error.message}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

interface FormFieldErrorProps {
  id: string
  error?: string
  className?: string
}

export function FormFieldError({ id, error, className = '' }: FormFieldErrorProps) {
  if (!error) {
    return null
  }

  return (
    <p
      id={`${id}-error`}
      role="alert"
      aria-live="polite"
      className={`text-sm text-red-600 dark:text-red-400 mt-1 ${className}`}
    >
      {error}
    </p>
  )
}
