/**
 * Transactional Email Service
 *
 * This service handles sending transactional emails (user invitations, notifications, etc.)
 * using a template system and email queue for reliable delivery.
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Create Supabase client with service role for queue management (bypasses RLS)
const supabaseServiceRole = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export interface TransactionalEmailOptions {
    templateKey: string;        // e.g., 'user_invitation'
    to: string;                 // recipient email
    toName?: string;            // recipient name
    variables: Record<string, string>;  // template variables
    priority?: number;          // 1-10 (1 = highest)
    scheduledAt?: Date;         // when to send (default: now)
    metadata?: Record<string, any>;  // additional tracking data
}

export interface QueueEmailResult {
    success: boolean;
    queueId?: string;
    error?: string;
}

/**
 * Queue a transactional email for sending
 * This is the main function to use when sending transactional emails
 */
export async function queueTransactionalEmail(options: TransactionalEmailOptions): Promise<QueueEmailResult> {
    try {
        const { templateKey, to, toName, variables, priority = 5, scheduledAt, metadata = {} } = options;

        // Fetch template from database
        const { data: template, error: templateError } = await supabaseServiceRole
            .from('transactional_email_templates')
            .select('*')
            .eq('template_key', templateKey)
            .eq('is_active', true)
            .single();

        if (templateError || !template) {
            console.error(`Template not found: ${templateKey}`, templateError);
            return {
                success: false,
                error: `Email template '${templateKey}' not found or inactive`
            };
        }

        // Validate required variables
        const requiredVars = template.variables as string[];
        const missingVars = requiredVars.filter(v => !variables[v]);
        if (missingVars.length > 0) {
            return {
                success: false,
                error: `Missing required variables: ${missingVars.join(', ')}`
            };
        }

        // Render template with variables
        const subject = renderTemplate(template.subject_template, variables);
        const htmlContent = renderTemplate(template.html_content, variables);
        const textContent = template.text_content ? renderTemplate(template.text_content, variables) : undefined;

        // Insert into email queue
        const { data: queueItem, error: queueError } = await supabaseServiceRole
            .from('email_queue')
            .insert({
                template_key: templateKey,
                to_email: to,
                to_name: toName,
                subject,
                html_content: htmlContent,
                text_content: textContent,
                variables,
                priority,
                scheduled_at: scheduledAt || new Date(),
                metadata,
                status: 'pending'
            })
            .select('id')
            .single();

        if (queueError) {
            console.error('Failed to queue email:', queueError);
            return {
                success: false,
                error: 'Failed to queue email'
            };
        }

        return {
            success: true,
            queueId: queueItem.id
        };

    } catch (error: any) {
        console.error('Error queuing transactional email:', error);
        return {
            success: false,
            error: error.message || 'Unknown error'
        };
    }
}

/**
 * Process email queue - sends all pending emails
 * This should be called by a cron job every 1-5 minutes
 */
export async function processEmailQueue(limit: number = 50): Promise<{
    processed: number;
    sent: number;
    failed: number;
}> {
    const stats = { processed: 0, sent: 0, failed: 0 };

    try {
        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured, skipping email queue processing');
            return stats;
        }

        // Fetch pending emails (ordered by priority and scheduled time)
        const { data: pendingEmails, error: fetchError } = await supabaseServiceRole
            .from('email_queue')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_at', new Date().toISOString())
            .lt('attempts', 3)  // max 3 attempts
            .order('priority', { ascending: true })
            .order('scheduled_at', { ascending: true })
            .limit(limit);

        if (fetchError || !pendingEmails) {
            console.error('Failed to fetch email queue:', fetchError);
            return stats;
        }

        // Process each email
        for (const email of pendingEmails) {
            stats.processed++;

            // Mark as sending
            await supabaseServiceRole
                .from('email_queue')
                .update({ status: 'sending', attempts: email.attempts + 1 })
                .eq('id', email.id);

            try {
                // Send via Resend
                const result = await resend.emails.send({
                    from: email.from_email,
                    to: email.to_email,
                    subject: email.subject,
                    html: email.html_content,
                    text: email.text_content || undefined
                });

                // Mark as sent
                await supabaseServiceRole
                    .from('email_queue')
                    .update({
                        status: 'sent',
                        sent_at: new Date().toISOString(),
                        resend_id: result.data?.id || null,
                        error_message: null
                    })
                    .eq('id', email.id);

                // Create tracking record
                if (result.data?.id) {
                    await supabaseServiceRole
                        .from('email_delivery_tracking')
                        .insert({
                            email_queue_id: email.id,
                            resend_id: result.data.id,
                            event_type: 'queued',
                            event_data: { provider: 'resend' }
                        });
                }

                stats.sent++;

            } catch (error: any) {
                console.error(`Failed to send email ${email.id}:`, error);

                // Mark as failed if max attempts reached
                const newStatus = email.attempts + 1 >= 3 ? 'failed' : 'pending';
                await supabaseServiceRole
                    .from('email_queue')
                    .update({
                        status: newStatus,
                        failed_at: newStatus === 'failed' ? new Date().toISOString() : null,
                        error_message: error.message || 'Unknown error'
                    })
                    .eq('id', email.id);

                stats.failed++;
            }
        }

        return stats;

    } catch (error: any) {
        console.error('Error processing email queue:', error);
        return stats;
    }
}

/**
 * Render a template string with variables
 * Replaces {{variable_name}} with values from variables object
 */
function renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, value);
    }
    return rendered;
}

/**
 * Send a transactional email immediately (bypasses queue)
 * Only use this for critical, time-sensitive emails
 */
export async function sendTransactionalEmailImmediate(options: TransactionalEmailOptions): Promise<{
    success: boolean;
    emailId?: string;
    error?: string;
}> {
    try {
        const { templateKey, to, toName, variables } = options;

        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            return {
                success: false,
                error: 'Email service not configured'
            };
        }

        // Fetch template
        const { data: template, error: templateError } = await supabaseServiceRole
            .from('transactional_email_templates')
            .select('*')
            .eq('template_key', templateKey)
            .eq('is_active', true)
            .single();

        if (templateError || !template) {
            return {
                success: false,
                error: `Template '${templateKey}' not found`
            };
        }

        // Validate variables
        const requiredVars = template.variables as string[];
        const missingVars = requiredVars.filter(v => !variables[v]);
        if (missingVars.length > 0) {
            return {
                success: false,
                error: `Missing variables: ${missingVars.join(', ')}`
            };
        }

        // Render template
        const subject = renderTemplate(template.subject_template, variables);
        const htmlContent = renderTemplate(template.html_content, variables);
        const textContent = template.text_content ? renderTemplate(template.text_content, variables) : undefined;

        // Send immediately via Resend
        const result = await resend.emails.send({
            from: 'BlogCanvas <noreply@blogcanvas.app>',
            to,
            subject,
            html: htmlContent,
            text: textContent || undefined
        });

        return {
            success: true,
            emailId: result.data?.id
        };

    } catch (error: any) {
        console.error('Error sending immediate email:', error);
        return {
            success: false,
            error: error.message || 'Unknown error'
        };
    }
}

/**
 * Get email queue statistics
 */
export async function getEmailQueueStats(): Promise<{
    pending: number;
    sending: number;
    sent: number;
    failed: number;
}> {
    try {
        const { data, error } = await supabaseServiceRole
            .from('email_queue')
            .select('status');

        if (error || !data) {
            return { pending: 0, sending: 0, sent: 0, failed: 0 };
        }

        const stats = {
            pending: data.filter(e => e.status === 'pending').length,
            sending: data.filter(e => e.status === 'sending').length,
            sent: data.filter(e => e.status === 'sent').length,
            failed: data.filter(e => e.status === 'failed').length
        };

        return stats;

    } catch (error) {
        console.error('Error getting queue stats:', error);
        return { pending: 0, sending: 0, sent: 0, failed: 0 };
    }
}

/**
 * Retry a failed email
 */
export async function retryFailedEmail(queueId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabaseServiceRole
            .from('email_queue')
            .update({
                status: 'pending',
                attempts: 0,
                error_message: null,
                failed_at: null
            })
            .eq('id', queueId)
            .eq('status', 'failed');

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Cancel a pending email
 */
export async function cancelEmail(queueId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabaseServiceRole
            .from('email_queue')
            .update({ status: 'cancelled' })
            .eq('id', queueId)
            .in('status', ['pending', 'failed']);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
