import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/portal/complete-onboarding - Complete client onboarding process
 * Saves onboarding data and marks client as active
 */
export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user profile to check client_id
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('client_id, role')
            .eq('id', user.id)
            .single();

        if (profileError || !profile || !profile.client_id) {
            return NextResponse.json(
                { success: false, error: 'Client profile not found' },
                { status: 404 }
            );
        }

        // Check if user is a client
        if (!['client', 'client_admin', 'client_reviewer'].includes(profile.role || '')) {
            return NextResponse.json(
                { success: false, error: 'Access denied. Client access required.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            industry,
            company_size,
            target_audience,
            brand_voice,
            tone_preferences,
            primary_goals,
            content_topics,
            competitors,
            key_differentiators
        } = body;

        // Update client with onboarding data
        const { data: client, error: updateError } = await supabaseAdmin
            .from('clients')
            .update({
                industry,
                company_size,
                target_audience,
                onboarding_data: {
                    brand_voice,
                    tone_preferences,
                    primary_goals,
                    content_topics,
                    competitors,
                    key_differentiators,
                    completed_at: new Date().toISOString()
                },
                status: 'active', // Mark as active after onboarding
                updated_at: new Date().toISOString()
            })
            .eq('id', profile.client_id)
            .select()
            .single();

        if (updateError) {
            console.error('Failed to update client:', updateError);
            throw updateError;
        }

        // Create brand guide quick-start entry
        try {
            const { data: brandGuide, error: brandGuideError } = await supabaseAdmin
                .from('brand_guides')
                .insert({
                    client_id: profile.client_id,
                    brand_voice: brand_voice,
                    tone: tone_preferences?.join(', ') || '',
                    target_audience: target_audience,
                    key_differentiators: key_differentiators,
                    status: 'draft'
                })
                .select()
                .single();

            if (brandGuideError) {
                console.error('Failed to create brand guide:', brandGuideError);
                // Don't fail the whole request if brand guide creation fails
            }
        } catch (brandError) {
            console.error('Brand guide creation error:', brandError);
            // Continue anyway
        }

        return NextResponse.json({
            success: true,
            message: 'Onboarding completed successfully',
            client
        });
    } catch (error: any) {
        console.error('Error completing onboarding:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to complete onboarding' },
            { status: 500 }
        );
    }
}
