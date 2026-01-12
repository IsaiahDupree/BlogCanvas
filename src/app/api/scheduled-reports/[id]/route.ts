import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase/server';

/**
 * GET /api/scheduled-reports/[id]
 * Get details of a specific scheduled report
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();
        const { id } = params;

        const { data: schedule, error } = await supabaseAdmin
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
            .eq('id', id)
            .eq('vendor_id', user.id)
            .single();

        if (error || !schedule) {
            return NextResponse.json(
                { success: false, error: 'Scheduled report not found' },
                { status: 404 }
            );
        }

        // Fetch execution history
        const { data: executions } = await supabaseAdmin
            .from('scheduled_report_executions')
            .select('*')
            .eq('scheduled_report_id', id)
            .order('started_at', { ascending: false })
            .limit(10);

        return NextResponse.json({
            success: true,
            schedule,
            executions: executions || []
        });

    } catch (error: any) {
        console.error('Error in GET /api/scheduled-reports/[id]:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch scheduled report' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/scheduled-reports/[id]
 * Update a scheduled report
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();
        const { id } = params;
        const body = await request.json();

        // Only allow updating certain fields
        const allowedFields = [
            'name',
            'description',
            'report_type',
            'frequency',
            'day_of_week',
            'day_of_month',
            'quarter_month',
            'period_length',
            'period_unit',
            'recipient_emails',
            'include_pdf_attachment',
            'is_active'
        ];

        const updates: any = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        // If frequency changed, recalculate next_run_at
        if (body.frequency || body.dayOfWeek !== undefined || body.dayOfMonth !== undefined) {
            const { data: currentSchedule } = await supabaseAdmin
                .from('scheduled_reports')
                .select('*')
                .eq('id', id)
                .eq('vendor_id', user.id)
                .single();

            if (currentSchedule) {
                updates.next_run_at = calculateNextRunTime({
                    frequency: body.frequency || currentSchedule.frequency,
                    dayOfWeek: body.dayOfWeek !== undefined ? body.dayOfWeek : currentSchedule.day_of_week,
                    dayOfMonth: body.dayOfMonth !== undefined ? body.dayOfMonth : currentSchedule.day_of_month,
                    quarterMonth: body.quarterMonth !== undefined ? body.quarterMonth : currentSchedule.quarter_month,
                    lastRunAt: currentSchedule.last_run_at ? new Date(currentSchedule.last_run_at) : null
                });
            }
        }

        const { data: schedule, error } = await supabaseAdmin
            .from('scheduled_reports')
            .update(updates)
            .eq('id', id)
            .eq('vendor_id', user.id)
            .select()
            .single();

        if (error || !schedule) {
            return NextResponse.json(
                { success: false, error: 'Failed to update scheduled report' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            schedule
        });

    } catch (error: any) {
        console.error('Error in PATCH /api/scheduled-reports/[id]:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update scheduled report' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/scheduled-reports/[id]
 * Delete a scheduled report
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();
        const { id } = params;

        const { error } = await supabaseAdmin
            .from('scheduled_reports')
            .delete()
            .eq('id', id)
            .eq('vendor_id', user.id);

        if (error) {
            return NextResponse.json(
                { success: false, error: 'Failed to delete scheduled report' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true
        });

    } catch (error: any) {
        console.error('Error in DELETE /api/scheduled-reports/[id]:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete scheduled report' },
            { status: 500 }
        );
    }
}

/**
 * Calculate next run time based on frequency
 */
function calculateNextRunTime(params: {
    frequency: string;
    dayOfWeek?: number | null;
    dayOfMonth?: number | null;
    quarterMonth?: number | null;
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
            if (dayOfWeek !== null && dayOfWeek !== undefined) {
                nextRun.setDate(nextRun.getDate() + 7);
                const currentDay = nextRun.getDay();
                const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
                if (daysUntilTarget === 0 && nextRun <= baseTime) {
                    nextRun.setDate(nextRun.getDate() + 7);
                } else {
                    nextRun.setDate(nextRun.getDate() + daysUntilTarget);
                }
            }
            break;

        case 'monthly':
            if (dayOfMonth !== null && dayOfMonth !== undefined) {
                nextRun.setMonth(nextRun.getMonth() + 1);
                nextRun.setDate(Math.min(dayOfMonth, new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate()));
                if (nextRun <= baseTime) {
                    nextRun.setMonth(nextRun.getMonth() + 1);
                }
            }
            break;

        case 'quarterly':
            nextRun.setMonth(nextRun.getMonth() + 3);
            break;

        default:
            nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
}
