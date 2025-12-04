import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/clients - List all clients
export async function GET(request: Request) {
    try {
        // Fetch all clients from Supabase
        const { data: clients, error } = await supabaseAdmin
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            clients
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch clients' },
            { status: 500 }
        );
    }
}

// POST /api/clients - Create new client
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, website, contact_email, onboarding_method } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Client name is required' },
                { status: 400 }
            );
        }

        // Generate slug from name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Insert client into Supabase
        const { data: client, error } = await supabaseAdmin
            .from('clients')
            .insert({
                name,
                slug,
                website: website || '',
                contact_email: contact_email || '',
                status: 'onboarding',
                onboarded_via: onboarding_method || 'manual_intake'
            })
            .select()
            .single();

        if (error) throw error;

        console.log('Client created:', client);

        // TODO: Create client user account, send welcome email

        return NextResponse.json({
            success: true,
            client,
            message: 'Client created successfully'
        });
    } catch (error) {
        console.error('Error creating client:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create client' },
            { status: 500 }
        );
    }
}
