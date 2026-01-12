import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase/server';

/**
 * GET /api/scheduled-reports
 * List all scheduled reports for the authenticated vendor
 */
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        const { data: schedules, error } = await supabaseAdmin
            .from('scheduled_reports')
            .select(`
                *,
                website:websites(
                    id,
                    url,
                    name,
                    client:clients(
                        id,
                        name
                    )
                ),
                content_batch:content_batches(
                    id,
                    name
                )
            `)
            .eq('vendor_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching scheduled reports:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            schedules: schedules || []
        });

    } catch (error: any) {
        console.error('Error in GET /api/scheduled-reports:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch scheduled reports' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/scheduled-reports
 * Create a new scheduled report
 *
 * Body: {
 *   name: string,
 *   description?: string,
 *   websiteId: string,
 *   batchId?: string,
 *   reportType: 'email' | 'pdf' | 'slide_deck',
 *   frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly',
 *   dayOfWeek?: number (0-6),
 *   dayOfMonth?: number (1-31),
 *   quarterMonth?: number (1-3),
 *   periodLength: number,
 *   periodUnit: 'days' | 'weeks' | 'months',
 *   recipientEmails: string[],
 *   includePdfAttachment?: boolean
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();

        const {
            name,
            description,
            websiteId,
            batchId,
            reportType,
            frequency,
            dayOfWeek,
            dayOfMonth,
            quarterMonth,
            periodLength,
            periodUnit,
            recipientEmails,
            includePdfAttachment
        } = body;

        // Validation
        if (!name || !websiteId || !reportType || !frequency || !periodLength || !periodUnit || !recipientEmails || recipientEmails.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate frequency-specific fields
        if (frequency === 'weekly' && (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6)) {
            return NextResponse.json(
                { success: false, error: 'dayOfWeek (0-6) is required for weekly schedules' },
                { status: 400 }
            );
        }

        if (frequency === 'monthly' && (dayOfMonth === undefined || dayOfMonth < 1 || dayOfMonth > 31)) {
            return NextResponse.json(
                { success: false, error: 'dayOfMonth (1-31) is required for monthly schedules' },
                { status: 400 }
            );
        }

        if (frequency === 'quarterly' && (quarterMonth === undefined || quarterMonth < 1 || quarterMonth > 3)) {
            return NextResponse.json(
                { success: false, error: 'quarterMonth (1-3) is required for quarterly schedules' },
                { status: 400 }
            );
        }

        // Calculate next run time
        const nextRunAt = calculateNextRunTime({
            frequency,
            dayOfWeek,
            dayOfMonth,
            quarterMonth,
            lastRunAt: null
        });

        // Create scheduled report
        const { data: schedule, error } = await supabaseAdmin
            .from('scheduled_reports')
            .insert({
                vendor_id: user.id,
                name,
                description,
                website_id: websiteId,
                content_batch_id: batchId || null,
                report_type: reportType,
                frequency,
                day_of_week: dayOfWeek !== undefined ? dayOfWeek : null,
                day_of_month: dayOfMonth !== undefined ? dayOfMonth : null,
                quarter_month: quarterMonth !== undefined ? quarterMonth : null,
                period_length: periodLength,
                period_unit: periodUnit,
                recipient_emails: recipientEmails,
                include_pdf_attachment: includePdfAttachment || false,
                is_active: true,
                next_run_at: nextRunAt
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating scheduled report:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            schedule
        });

    } catch (error: any) {
        console.error('Error in POST /api/scheduled-reports:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create scheduled report' },
            { status: 500 }
        );
    }
}

/**
 * Calculate next run time based on frequency
 */
function calculateNextRunTime(params: {
    frequency: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    quarterMonth?: number;
    lastRunAt: Date | null;
}): Date {
    const { frequency, dayOfWeek, dayOfMonth, lastRunAt } = params;
    const baseTime = lastRunAt || new Date();
    let nextRun = new Date(baseTime);

    switch (frequency) {
        case 'daily':
            nextRun.setDate(nextRun.getDate() + 1);
            break;

        case 'weekly':
            // Find next occurrence of the specified day of week
            nextRun.setDate(nextRun.getDate() + 7);
            const currentDay = nextRun.getDay();
            const daysUntilTarget = (dayOfWeek! - currentDay + 7) % 7;
            if (daysUntilTarget === 0 && nextRun <= baseTime) {
                nextRun.setDate(nextRun.getDate() + 7);
            } else {
                nextRun.setDate(nextRun.getDate() + daysUntilTarget);
            }
            break;

        case 'monthly':
            // Add one month and set to specified day
            nextRun.setMonth(nextRun.getMonth() + 1);
            nextRun.setDate(Math.min(dayOfMonth!, new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate()));
            if (nextRun <= baseTime) {
                nextRun.setMonth(nextRun.getMonth() + 1);
            }
            break;

        case 'quarterly':
            // Add 3 months
            nextRun.setMonth(nextRun.getMonth() + 3);
            break;

        default:
            nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
}
