import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/cms-connections - List all CMS connections for a client
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const { data: connections, error } = await supabase
      .from('cms_connections')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching CMS connections:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Remove sensitive auth_payload data from response
    const sanitizedConnections = connections.map(conn => ({
      ...conn,
      auth_payload: conn.auth_payload ? { hasCredentials: true } : null
    }))

    return NextResponse.json({
      success: true,
      connections: sanitizedConnections
    })
  } catch (error: any) {
    console.error('Failed to fetch CMS connections:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/cms-connections - Create a new CMS connection
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      clientId,
      cmsType,
      baseUrl,
      username,
      password,
      appPassword // WordPress Application Password
    } = body

    // Validate required fields
    if (!clientId || !cmsType || !baseUrl) {
      return NextResponse.json(
        { success: false, error: 'clientId, cmsType, and baseUrl are required' },
        { status: 400 }
      )
    }

    // WordPress requires either username+appPassword or username+password
    if (cmsType === 'wordpress') {
      if (!username || (!appPassword && !password)) {
        return NextResponse.json(
          { success: false, error: 'WordPress requires username and appPassword/password' },
          { status: 400 }
        )
      }
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create auth payload based on CMS type
    let authPayload: any = {}
    if (cmsType === 'wordpress') {
      authPayload = {
        username,
        app_password: appPassword || password
      }
    }

    // Test the connection first
    let testResult: any = { success: false, message: 'Connection not tested' }
    let connectionStatus = 'inactive'

    if (cmsType === 'wordpress') {
      try {
        // Test WordPress REST API
        const testUrl = `${baseUrl}/wp-json/wp/v2/posts?per_page=1`
        const auth = Buffer.from(`${username}:${appPassword || password}`).toString('base64')

        const testResponse = await fetch(testUrl, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        })

        if (testResponse.ok) {
          testResult = { success: true, message: 'Connection successful' }
          connectionStatus = 'active'
        } else {
          testResult = {
            success: false,
            message: `Connection failed: ${testResponse.status} ${testResponse.statusText}`
          }
          connectionStatus = 'error'
        }
      } catch (testError: any) {
        testResult = { success: false, message: `Connection failed: ${testError.message}` }
        connectionStatus = 'error'
      }
    }

    // Insert into database
    const { data: connection, error: insertError } = await supabase
      .from('cms_connections')
      .insert({
        client_id: clientId,
        cms_type: cmsType,
        base_url: baseUrl,
        auth_payload: authPayload,
        connection_status: connectionStatus,
        last_tested_at: new Date().toISOString(),
        test_result: testResult,
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating CMS connection:', insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }

    // Remove sensitive data from response
    const sanitizedConnection = {
      ...connection,
      auth_payload: { hasCredentials: true }
    }

    return NextResponse.json({
      success: true,
      connection: sanitizedConnection,
      testResult
    })
  } catch (error: any) {
    console.error('Failed to create CMS connection:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
