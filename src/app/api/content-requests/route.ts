import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List content requests (filtered by role)
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, client_id, vendor_id, role')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const limit = parseInt(searchParams.get('limit') || '50')

        let query = supabase
            .from('content_requests')
            .select(`
                *,
                clients (id, name),
                profiles!content_requests_requested_by_fkey (id, full_name, email)
            `)
            .order('created_at', { ascending: false })
            .limit(limit)

        // Filter based on role
        if (profile.vendor_id) {
            // Vendor sees requests from their clients
            query = query.eq('vendor_id', profile.vendor_id)
        } else if (profile.client_id) {
            // Client sees their own requests
            query = query.eq('client_id', profile.client_id)
        } else {
            return NextResponse.json({ success: false, error: 'No access' }, { status: 403 })
        }

        if (status && status !== 'all') {
            query = query.eq('status', status)
        }

        const { data: requests, error } = await query

        if (error) {
            console.error('Error fetching content requests:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, requests })

    } catch (error: any) {
        console.error('Content requests GET error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// POST - Create new content request (client only)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, client_id, full_name, email')
            .eq('id', user.id)
            .single()

        if (!profile?.client_id) {
            return NextResponse.json({ success: false, error: 'Only clients can create content requests' }, { status: 403 })
        }

        // Get client's vendor
        const { data: client } = await supabase
            .from('clients')
            .select('id, vendor_id')
            .eq('id', profile.client_id)
            .single()

        if (!client?.vendor_id) {
            return NextResponse.json({ success: false, error: 'No vendor assigned to client' }, { status: 400 })
        }

        const body = await request.json()
        const { content_type, title, message, priority, attachments } = body

        if (!content_type || !message) {
            return NextResponse.json({ success: false, error: 'Content type and message are required' }, { status: 400 })
        }

        // Create the request
        const { data: contentRequest, error } = await supabase
            .from('content_requests')
            .insert({
                client_id: profile.client_id,
                vendor_id: client.vendor_id,
                requested_by: profile.id,
                content_type,
                title: title || null,
                message,
                priority: priority || 'normal',
                attachments: attachments || []
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating content request:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        // Notify vendor users
        const { data: vendorUsers } = await supabase
            .from('profiles')
            .select('id')
            .eq('vendor_id', client.vendor_id)

        if (vendorUsers && vendorUsers.length > 0) {
            const notifications = vendorUsers.map(vendorUser => ({
                user_id: vendorUser.id,
                type: 'content_request',
                title: 'New content request',
                message: `${profile.full_name || 'A client'} submitted a ${content_type.replace('_', ' ')} request.`,
                link: `/app/requests/${contentRequest.id}`,
                metadata: {
                    content_request_id: contentRequest.id,
                    content_type,
                    client_id: profile.client_id
                }
            }))

            await supabase.from('notifications').insert(notifications)
        }

        return NextResponse.json({ success: true, request: contentRequest })

    } catch (error: any) {
        console.error('Content requests POST error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
