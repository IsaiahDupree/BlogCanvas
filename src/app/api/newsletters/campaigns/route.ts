/**
 * Newsletter Campaigns API Endpoints
 * GET /api/newsletters/campaigns - List all campaigns
 * POST /api/newsletters/campaigns - Create a new campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get vendor ID from user
        const { data: userData } = await supabase
            .from('users')
            .select('vendor_id')
            .eq('id', user.id)
            .single();

        if (!userData?.vendor_id) {
            return NextResponse.json(
                { error: 'Vendor not found' },
                { status: 404 }
            );
        }

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query
        let query = supabase
            .from('newsletter_campaigns')
            .select('*, newsletter_templates(name)', { count: 'exact' })
            .eq('vendor_id', userData.vendor_id);

        // Filter by status if provided
        if (status) {
            query = query.eq('status', status);
        }

        // Apply pagination and ordering
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: campaigns, error, count } = await query;

        if (error) {
            console.error('Error fetching campaigns:', error);
            return NextResponse.json(
                { error: 'Failed to fetch campaigns' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            campaigns,
            total: count,
            limit,
            offset
        });

    } catch (error: any) {
        console.error('Unexpected error in GET /api/newsletters/campaigns:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get vendor ID from user
        const { data: userData } = await supabase
            .from('users')
            .select('vendor_id')
            .eq('id', user.id)
            .single();

        if (!userData?.vendor_id) {
            return NextResponse.json(
                { error: 'Vendor not found' },
                { status: 404 }
            );
        }

        // Parse request body
        const body = await request.json();
        const {
            template_id,
            subject,
            preview_text,
            html_content,
            json_content,
            scheduled_at,
            recipient_emails
        } = body;

        // Validate required fields
        if (!subject || !html_content) {
            return NextResponse.json(
                { error: 'Missing required fields: subject and html_content' },
                { status: 400 }
            );
        }

        // Create campaign
        const { data: campaign, error: campaignError } = await supabase
            .from('newsletter_campaigns')
            .insert({
                vendor_id: userData.vendor_id,
                template_id: template_id || null,
                subject,
                preview_text,
                html_content,
                json_content,
                status: scheduled_at ? 'scheduled' : 'draft',
                scheduled_at: scheduled_at || null,
                recipient_count: recipient_emails ? recipient_emails.length : 0
            })
            .select()
            .single();

        if (campaignError) {
            console.error('Error creating campaign:', campaignError);
            return NextResponse.json(
                { error: 'Failed to create campaign' },
                { status: 500 }
            );
        }

        // If recipient emails provided, create recipient records
        if (recipient_emails && recipient_emails.length > 0) {
            // Get client IDs for the emails
            const { data: clients } = await supabase
                .from('clients')
                .select('id, email')
                .eq('vendor_id', userData.vendor_id)
                .in('email', recipient_emails);

            const clientMap = new Map(clients?.map(c => [c.email, c.id]) || []);

            const recipients = recipient_emails.map((email: string) => ({
                campaign_id: campaign.id,
                email,
                client_id: clientMap.get(email) || null,
                status: 'pending'
            }));

            const { error: recipientsError } = await supabase
                .from('newsletter_recipients')
                .insert(recipients);

            if (recipientsError) {
                console.error('Error creating recipients:', recipientsError);
                // Don't fail the whole request, just log the error
            }
        }

        return NextResponse.json({ campaign }, { status: 201 });

    } catch (error: any) {
        console.error('Unexpected error in POST /api/newsletters/campaigns:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
