/**
 * Transactional Email Sending API
 * POST /api/emails/send
 *
 * Queue a transactional email for sending
 */

import { NextRequest, NextResponse } from 'next/server';
import { queueTransactionalEmail } from '@/lib/emails/transactional-email-service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { templateKey, to, toName, variables, priority, scheduledAt, metadata } = body;

        // Validate required fields
        if (!templateKey || !to || !variables) {
            return NextResponse.json(
                { error: 'Missing required fields: templateKey, to, variables' },
                { status: 400 }
            );
        }

        // Queue the email
        const result = await queueTransactionalEmail({
            templateKey,
            to,
            toName,
            variables,
            priority,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
            metadata: {
                ...metadata,
                queued_by: user.id
            }
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            queueId: result.queueId
        });

    } catch (error: any) {
        console.error('Error sending transactional email:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
