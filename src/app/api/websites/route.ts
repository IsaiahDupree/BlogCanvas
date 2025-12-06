import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/websites - List all websites
export async function GET(request: NextRequest) {
    try {
        const { data: websites, error } = await supabaseAdmin
            .from('websites')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            websites
        });
    } catch (error) {
        console.error('Error fetching websites:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch websites' },
            { status: 500 }
        );
    }
}

// POST /api/websites - Create new website
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, clientId } = body;

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL is required' },
                { status: 400 }
            );
        }

        // Validate and parse URL
        let websiteUrl: URL;
        try {
            websiteUrl = new URL(url);
        } catch (e) {
            return NextResponse.json(
                { success: false, error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        // Create website record
        const { data: website, error } = await supabaseAdmin
            .from('websites')
            .insert({
                url: websiteUrl.origin,
                domain: websiteUrl.hostname,
                scrape_status: 'pending'
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { success: false, error: 'Failed to create website' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            website
        });
    } catch (error) {
        console.error('Error creating website:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
