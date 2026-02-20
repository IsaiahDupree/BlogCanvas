/**
 * Liveness probe for Kubernetes/container orchestration
 * Returns 200 when service is alive (doesn't check dependencies)
 */

import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    alive: true,
    timestamp: new Date().toISOString()
  })
}
