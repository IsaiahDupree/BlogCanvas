import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { processClickUpWebhook } from '@/lib/integrations/clickup/webhook-processor';
import { triggerAutomation } from '@/lib/integrations/clickup/automation-trigger';

/**
 * POST /api/webhooks/clickup
 * Receives webhooks from ClickUp and triggers automations based on tags
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // Verify webhook signature if configured
        const signature = request.headers.get('x-clickup-signature');
        if (process.env.CLICKUP_WEBHOOK_SECRET) {
            // TODO: Implement signature verification
            // const isValid = verifyClickUpSignature(body, signature);
            // if (!isValid) {
            //     return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            // }
        }

        // Log webhook event
        await supabaseAdmin
            .from('webhook_events')
            .insert({
                source: 'clickup',
                event_type: body.event?.event || body.event_type || 'unknown',
                payload: body,
                received_at: new Date().toISOString()
            });

        // Process webhook and extract tags
        const webhookData = await processClickUpWebhook(body);
        
        // Check for automation triggers based on tags
        if (webhookData.tags && webhookData.tags.length > 0) {
            for (const tag of webhookData.tags) {
                const automation = await triggerAutomation(tag, webhookData);
                
                if (automation) {
                    // Log automation trigger
                    await supabaseAdmin
                        .from('automation_runs')
                        .insert({
                            trigger_source: 'clickup',
                            trigger_type: 'tag',
                            trigger_value: tag,
                            task_id: webhookData.taskId,
                            status: 'started',
                            started_at: new Date().toISOString()
                        });
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Webhook processed',
            tags: webhookData.tags,
            automations_triggered: webhookData.tags?.length || 0
        });

    } catch (error: any) {
        console.error('Error processing ClickUp webhook:', error);
        
        // Log error
        await supabaseAdmin
            .from('webhook_events')
            .insert({
                source: 'clickup',
                event_type: 'error',
                payload: { error: error.message },
                received_at: new Date().toISOString()
            });

        return NextResponse.json(
            { success: false, error: error.message || 'Failed to process webhook' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/webhooks/clickup
 * Webhook verification endpoint for ClickUp
 */
export async function GET(request: NextRequest) {
    const challenge = request.nextUrl.searchParams.get('challenge');
    
    if (challenge) {
        // ClickUp webhook verification
        return NextResponse.json({ challenge });
    }
    
    return NextResponse.json({ message: 'ClickUp webhook endpoint' });
}



