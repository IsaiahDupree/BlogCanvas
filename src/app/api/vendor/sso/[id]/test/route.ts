/**
 * Test SSO Connection API
 * Verify SSO configuration is valid
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testSSOConnection } from '@/lib/auth/sso'

/**
 * POST /api/vendor/sso/[id]/test
 * Test an SSO connection configuration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ownership
    const { data: connection } = await supabase
      .from('sso_connections')
      .select('id')
      .eq('id', params.id)
      .eq('vendor_id', user.id)
      .single()

    if (!connection) {
      return NextResponse.json(
        { error: 'SSO connection not found' },
        { status: 404 }
      )
    }

    const result = await testSSOConnection(params.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error testing SSO connection:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test SSO connection'
      },
      { status: 500 }
    )
  }
}
