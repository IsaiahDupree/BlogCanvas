import { NextResponse } from 'next/server'

const retiredResponse = () => NextResponse.json(
  {
    success: false,
    error: 'This legacy endpoint is retired. Sign in to BlogCanvas and run a scan from your workspace.',
  },
  { status: 410, headers: { 'Cache-Control': 'no-store' } },
)

/** The former endpoint returned fabricated scan IDs instead of running a scan. */
export async function POST() {
  return retiredResponse()
}
