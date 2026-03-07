'use client'

import { useEffect } from 'react'
import { onCLS, onLCP, onINP, onFCP, onTTFB, Metric } from 'web-vitals'

/**
 * Web Vitals monitoring component
 * Tracks Core Web Vitals and reports them to analytics
 *
 * @see https://web.dev/vitals/
 */
export function WebVitals() {
  useEffect(() => {
    function sendToAnalytics(metric: Metric) {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Web Vitals]', {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
        })
      }

      // Send to analytics endpoint
      if (typeof window !== 'undefined' && 'navigator' in window && 'sendBeacon' in navigator) {
        const body = JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
        })

        // Use sendBeacon for reliability
        navigator.sendBeacon('/api/analytics/web-vitals', body)
      }
    }

    // Register all Core Web Vitals
    onCLS(sendToAnalytics)  // Cumulative Layout Shift
    onLCP(sendToAnalytics)  // Largest Contentful Paint
    onINP(sendToAnalytics)  // Interaction to Next Paint (replaces deprecated FID)
    onFCP(sendToAnalytics)  // First Contentful Paint
    onTTFB(sendToAnalytics) // Time to First Byte
  }, [])

  return null
}
