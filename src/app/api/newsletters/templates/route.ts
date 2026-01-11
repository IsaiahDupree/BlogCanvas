/**
 * Newsletter Templates API Endpoints
 * GET /api/newsletters/templates - List all templates
 * POST /api/newsletters/templates - Create a new template
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

        // Fetch templates (both system and vendor-specific)
        const { data: templates, error } = await supabase
            .from('newsletter_templates')
            .select('*')
            .or(`vendor_id.eq.${userData.vendor_id},is_system_template.eq.true`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching templates:', error);
            return NextResponse.json(
                { error: 'Failed to fetch templates' },
                { status: 500 }
            );
        }

        return NextResponse.json({ templates });

    } catch (error: any) {
        console.error('Unexpected error in GET /api/newsletters/templates:', error);
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
        const { name, description, html_content, json_content, thumbnail_url } = body;

        // Validate required fields
        if (!name || !html_content) {
            return NextResponse.json(
                { error: 'Missing required fields: name and html_content' },
                { status: 400 }
            );
        }

        // Create template
        const { data: template, error } = await supabase
            .from('newsletter_templates')
            .insert({
                vendor_id: userData.vendor_id,
                name,
                description,
                html_content,
                json_content,
                thumbnail_url,
                is_system_template: false
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating template:', error);
            return NextResponse.json(
                { error: 'Failed to create template' },
                { status: 500 }
            );
        }

        return NextResponse.json({ template }, { status: 201 });

    } catch (error: any) {
        console.error('Unexpected error in POST /api/newsletters/templates:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
