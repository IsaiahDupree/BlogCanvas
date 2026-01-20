import { NextResponse } from 'next/server'

/**
 * GET /api/push/vapid-key
 *
 * Returns the public VAPID key for push notification subscription
 */
export async function GET() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  if (!vapidPublicKey) {
    return NextResponse.json(
      { error: 'VAPID public key not configured' },
      { status: 500 }
    )
  }

  return NextResponse.json({ publicKey: vapidPublicKey })
}
