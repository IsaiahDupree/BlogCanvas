import { NextResponse } from 'next/server'

/**
 * Web Vitals Analytics Endpoint
 * Receives and processes Core Web Vitals metrics from the client
 */
export async function POST(request: Request) {
  try {
    const metric = await request.json()

    // Validate metric data
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      )
    }

    // Log metrics (in production, send to analytics service)
    console.log('[Web Vitals]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      timestamp: new Date().toISOString(),
    })

    // TODO: In production, send to analytics service (e.g., Google Analytics, Vercel Analytics, etc.)
    // Example:
    // await sendToAnalyticsService(metric)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Web Vitals] Error processing metric:', error)
    return NextResponse.json(
      { error: 'Failed to process metric' },
      { status: 500 }
    )
  }
}
