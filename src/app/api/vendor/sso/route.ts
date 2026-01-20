/**
 * SSO Connections API
 * Manage SAML and OIDC SSO configurations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listSSOConnections, upsertSSOConnection } from '@/lib/auth/sso'

/**
 * GET /api/vendor/sso
 * List all SSO connections for the authenticated vendor
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const connections = await listSSOConnections(user.id)

    return NextResponse.json({
      connections,
      count: connections.length
    })
  } catch (error) {
    console.error('Error fetching SSO connections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SSO connections' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/vendor/sso
 * Create a new SSO connection
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.provider || !body.name || !body.domain || !body.config) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, name, domain, config' },
        { status: 400 }
      )
    }

    // Validate provider type
    if (!['saml', 'oidc'].includes(body.provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "saml" or "oidc"' },
        { status: 400 }
      )
    }

    // Validate domain format
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i
    if (!domainRegex.test(body.domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      )
    }

    // Validate SAML config
    if (body.provider === 'saml') {
      if (!body.config.idpMetadata || !body.config.spEntityId || !body.config.acsUrl) {
        return NextResponse.json(
          { error: 'SAML config requires: idpMetadata, spEntityId, acsUrl' },
          { status: 400 }
        )
      }
    }

    // Validate OIDC config
    if (body.provider === 'oidc') {
      if (!body.config.issuer || !body.config.clientId || !body.config.clientSecret) {
        return NextResponse.json(
          { error: 'OIDC config requires: issuer, clientId, clientSecret' },
          { status: 400 }
        )
      }
    }

    const connection = await upsertSSOConnection(user.id, {
      provider: body.provider,
      name: body.name,
      domain: body.domain,
      enabled: body.enabled ?? true,
      config: body.config,
      vendorId: user.id
    })

    return NextResponse.json({
      connection,
      message: 'SSO connection created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating SSO connection:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create SSO connection' },
      { status: 500 }
    )
  }
}
