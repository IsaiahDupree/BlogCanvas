import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List WordPress sites for vendor
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('vendor_id')
            .eq('id', user.id)
            .single()

        if (!profile?.vendor_id) {
            return NextResponse.json({ success: false, error: 'Not a vendor user' }, { status: 403 })
        }

        const { data: sites, error } = await supabase
            .from('wordpress_sites')
            .select(`
                id,
                name,
                site_url,
                api_url,
                status,
                last_publish_at,
                last_error,
                created_at,
                clients (id, name)
            `)
            .eq('vendor_id', profile.vendor_id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching WordPress sites:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, sites })

    } catch (error: any) {
        console.error('WordPress sites GET error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// POST - Add a new WordPress site
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('vendor_id')
            .eq('id', user.id)
            .single()

        if (!profile?.vendor_id) {
            return NextResponse.json({ success: false, error: 'Not a vendor user' }, { status: 403 })
        }

        const body = await request.json()
        const { name, site_url, api_username, api_key, client_id } = body

        if (!name || !site_url) {
            return NextResponse.json({ success: false, error: 'Name and site URL are required' }, { status: 400 })
        }

        // Derive API URL from site URL
        const apiUrl = site_url.replace(/\/$/, '') + '/wp-json/wp/v2'

        // Test the connection if credentials provided
        let connectionStatus = 'active'
        if (api_username && api_key) {
            try {
                const testRes = await fetch(`${apiUrl}/posts?per_page=1`, {
                    headers: {
                        'Authorization': 'Basic ' + Buffer.from(`${api_username}:${api_key}`).toString('base64')
                    }
                })
                if (!testRes.ok) {
                    connectionStatus = 'error'
                }
            } catch {
                connectionStatus = 'error'
            }
        }

        const { data: site, error } = await supabase
            .from('wordpress_sites')
            .insert({
                vendor_id: profile.vendor_id,
                client_id: client_id || null,
                name,
                site_url: site_url.replace(/\/$/, ''),
                api_url: apiUrl,
                api_username: api_username || null,
                api_key_encrypted: api_key || null, // In production, encrypt this
                status: connectionStatus
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating WordPress site:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, site })

    } catch (error: any) {
        console.error('WordPress sites POST error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
