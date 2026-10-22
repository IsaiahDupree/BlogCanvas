import { NextResponse } from 'next/server'

/** The former endpoint returned fabricated results for every analysis ID. */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'This legacy analysis endpoint is retired. Sign in to BlogCanvas to review a recorded workspace scan.',
    },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  )
}
