/**
 * Readiness probe for Kubernetes/container orchestration
 * Returns 200 when service is ready to accept traffic
 */

import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  // Check if all required environment variables are set
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missing = requiredEnvVars.filter(key => !process.env[key])

  if (missing.length > 0) {
    return NextResponse.json({
      ready: false,
      reason: 'Missing required environment variables',
      missing
    }, { status: 503 })
  }

  return NextResponse.json({
    ready: true,
    timestamp: new Date().toISOString()
  })
}
