import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { exportUserData, convertToCSV } from '@/lib/gdpr/data-export'

/**
 * GDPR Data Export API
 * feat-045: Data export/deletion/consent
 *
 * Allows users to download all their personal data
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    // Export user data
    const userData = await exportUserData(session.user.id)

    if (format === 'csv') {
      const csv = convertToCSV(userData)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="my-data-${new Date().toISOString()}.csv"`,
        },
      })
    }

    // JSON format
    return new NextResponse(JSON.stringify(userData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="my-data-${new Date().toISOString()}.json"`,
      },
    })
  } catch (error) {
    console.error('Error exporting user data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
