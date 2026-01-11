/**
 * Email Queue Processor Endpoint
 * POST /api/emails/queue/process
 *
 * Processes pending emails in the queue
 * Should be called by a cron job every 1-5 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { processEmailQueue } from '@/lib/emails/transactional-email-service';

export async function POST(request: NextRequest) {
    try {
        // Authenticate cron request
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Process queue
        const stats = await processEmailQueue();

        return NextResponse.json({
            success: true,
            ...stats
        });

    } catch (error: any) {
        console.error('Email queue processing error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: 'Email queue processor endpoint. Use POST to process queue.',
        endpoint: '/api/emails/queue/process',
        method: 'POST',
        authentication: 'Bearer token in Authorization header',
        cronSetup: 'See docs/TRANSACTIONAL_EMAIL_SETUP.md'
    });
}
