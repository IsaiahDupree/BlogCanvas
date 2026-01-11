import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PUT /api/cms-connections/[id] - Test or update a connection
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()
    const { action } = body

    // Get the connection
    const { data: connection, error: fetchError } = await supabase
      .from('cms_connections')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      )
    }

    // Test connection action
    if (action === 'test') {
      let testResult: any = { success: false, message: 'Unknown CMS type' }
      let connectionStatus = 'error'

      if (connection.cms_type === 'wordpress') {
        try {
          const testUrl = `${connection.base_url}/wp-json/wp/v2/posts?per_page=1`
          const { username, app_password } = connection.auth_payload

          const auth = Buffer.from(`${username}:${app_password}`).toString('base64')

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

      // Update connection status
      const { error: updateError } = await supabase
        .from('cms_connections')
        .update({
          connection_status: connectionStatus,
          last_tested_at: new Date().toISOString(),
          test_result: testResult
        })
        .eq('id', id)

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        testResult,
        connectionStatus
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Failed to update CMS connection:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/cms-connections/[id] - Delete a connection
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
      .from('cms_connections')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting CMS connection:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete CMS connection:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
