import { NextRequest, NextResponse } from 'next/server';
import { getDueCheckBacks } from '@/lib/analytics/check-back-scheduler';
import { processCheckBack } from '@/lib/analytics/analytics-collector';

/**
 * POST /api/check-backs/process - Process due check-backs
 * This endpoint should be called by a cron job or scheduled task
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { limit = 50, checkBackId } = body;

        // If specific check-back ID provided, process just that one
        if (checkBackId) {
            const result = await processCheckBack(checkBackId);
            return NextResponse.json(result);
        }

        // Otherwise, process all due check-backs
        const dueCheckBacks = await getDueCheckBacks(limit);

        if (dueCheckBacks.length === 0) {
            return NextResponse.json({
                success: true,
                processed: 0,
                message: 'No check-backs due'
            });
        }

        const results = {
            total: dueCheckBacks.length,
            succeeded: 0,
            failed: 0,
            errors: [] as string[]
        };

        // Process each check-back
        for (const checkBack of dueCheckBacks) {
            try {
                const result = await processCheckBack(checkBack.id);
                if (result.success) {
                    results.succeeded++;
                } else {
                    results.failed++;
                    results.errors.push(`${checkBack.id}: ${result.error}`);
                }
            } catch (error: any) {
                results.failed++;
                results.errors.push(`${checkBack.id}: ${error.message}`);
            }

            // Rate limiting: wait 500ms between check-backs
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        return NextResponse.json({
            success: true,
            ...results
        });

    } catch (error: any) {
        console.error('Error processing check-backs:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET /api/check-backs/process - Get due check-backs (for monitoring)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '50');

        const dueCheckBacks = await getDueCheckBacks(limit);

        return NextResponse.json({
            success: true,
            count: dueCheckBacks.length,
            checkBacks: dueCheckBacks
        });

    } catch (error: any) {
        console.error('Error fetching due check-backs:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

