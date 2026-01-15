import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get single content request
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('id, client_id, vendor_id')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
        }

        const { data: contentRequest, error } = await supabase
            .from('content_requests')
            .select(`
                *,
                clients (id, name, website_url),
                profiles!content_requests_requested_by_fkey (id, full_name, email, avatar_url)
            `)
            .eq('id', id)
            .single()

        if (error || !contentRequest) {
            return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
        }

        // Check access
        const hasAccess = 
            (profile.vendor_id && contentRequest.vendor_id === profile.vendor_id) ||
            (profile.client_id && contentRequest.client_id === profile.client_id)

        if (!hasAccess) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
        }

        return NextResponse.json({ success: true, request: contentRequest })

    } catch (error: any) {
        console.error('Content request GET error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// PATCH - Update content request (vendor only - status/response)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('id, vendor_id, full_name')
            .eq('id', user.id)
            .single()

        if (!profile?.vendor_id) {
            return NextResponse.json({ success: false, error: 'Only vendors can update requests' }, { status: 403 })
        }

        // Get the request
        const { data: contentRequest } = await supabase
            .from('content_requests')
            .select('*, clients(id, name)')
            .eq('id', id)
            .eq('vendor_id', profile.vendor_id)
            .single()

        if (!contentRequest) {
            return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
        }

        const body = await request.json()
        const { status, vendor_response, result_blog_post_id, result_batch_id } = body

        const updateData: any = {}
        
        if (status) {
            updateData.status = status
        }
        if (vendor_response !== undefined) {
            updateData.vendor_response = vendor_response
            updateData.responded_at = new Date().toISOString()
            updateData.responded_by = profile.id
        }
        if (result_blog_post_id) {
            updateData.result_blog_post_id = result_blog_post_id
        }
        if (result_batch_id) {
            updateData.result_batch_id = result_batch_id
        }

        const { data: updatedRequest, error } = await supabase
            .from('content_requests')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating content request:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        // Notify client if status changed
        if (status) {
            const { data: clientUsers } = await supabase
                .from('profiles')
                .select('id')
                .eq('client_id', contentRequest.client_id)

            if (clientUsers && clientUsers.length > 0) {
                const statusMessages: Record<string, string> = {
                    'in_progress': 'Your content request is now being worked on.',
                    'completed': 'Your content request has been completed!',
                    'declined': 'Your content request has been declined.'
                }

                const notifications = clientUsers.map(clientUser => ({
                    user_id: clientUser.id,
                    type: 'request_update',
                    title: `Request ${status.replace('_', ' ')}`,
                    message: statusMessages[status] || `Your request status changed to ${status}.`,
                    link: `/portal/requests/${id}`,
                    metadata: {
                        content_request_id: id,
                        status
                    }
                }))

                await supabase.from('notifications').insert(notifications)
            }
        }

        return NextResponse.json({ success: true, request: updatedRequest })

    } catch (error: any) {
        console.error('Content request PATCH error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
