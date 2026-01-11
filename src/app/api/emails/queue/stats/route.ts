/**
 * Email Queue Statistics API
 * GET /api/emails/queue/stats
 *
 * Returns statistics about the email queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmailQueueStats } from '@/lib/emails/transactional-email-service';
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

        // Get queue statistics
        const stats = await getEmailQueueStats();

        return NextResponse.json(stats);

    } catch (error: any) {
        console.error('Error fetching queue stats:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
