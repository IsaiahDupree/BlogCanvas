/**
 * SSO Login Initiation API
 * Start SAML or OIDC authentication flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSSOConnectionByEmail, initiateSAMLLogin, initiateOIDCLogin } from '@/lib/auth/sso'

/**
 * POST /api/auth/sso/login
 * Initiate SSO login for a given email address
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find SSO connection for this email domain
    const connection = await getSSOConnectionByEmail(body.email)

    if (!connection) {
      return NextResponse.json(
        { error: 'No SSO connection found for this email domain' },
        { status: 404 }
      )
    }

    if (!connection.enabled) {
      return NextResponse.json(
        { error: 'SSO is disabled for this domain' },
        { status: 403 }
      )
    }

    let authUrl: string

    // Initiate login based on provider type
    if (connection.provider === 'saml') {
      authUrl = await initiateSAMLLogin(connection.id, body.redirectTo)
    } else {
      authUrl = await initiateOIDCLogin(connection.id, body.redirectTo)
    }

    return NextResponse.json({
      authUrl,
      provider: connection.provider,
      name: connection.name
    })
  } catch (error) {
    console.error('Error initiating SSO login:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate SSO login' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/sso/login?email=user@company.com
 * Check if SSO is available for an email domain
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const connection = await getSSOConnectionByEmail(email)

    if (!connection) {
      return NextResponse.json({
        available: false,
        message: 'No SSO connection found for this email domain'
      })
    }

    return NextResponse.json({
      available: connection.enabled,
      provider: connection.provider,
      name: connection.name,
      domain: connection.domain
    })
  } catch (error) {
    console.error('Error checking SSO availability:', error)
    return NextResponse.json(
      { error: 'Failed to check SSO availability' },
      { status: 500 }
    )
  }
}
