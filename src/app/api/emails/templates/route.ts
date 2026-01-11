/**
 * Email Templates API
 * GET /api/emails/templates - List all templates
 * POST /api/emails/templates - Create custom template (future feature)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch all active templates (system templates are accessible to all)
        const { data: templates, error } = await supabase
            .from('transactional_email_templates')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) {
            console.error('Error fetching templates:', error);
            return NextResponse.json(
                { error: 'Failed to fetch templates' },
                { status: 500 }
            );
        }

        return NextResponse.json({ templates });

    } catch (error: any) {
        console.error('Error in templates API:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
