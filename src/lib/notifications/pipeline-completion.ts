/**
 * Pipeline Completion Notification Service
 * Sends email notifications when pipeline jobs complete
 */

import { createClient } from '@supabase/supabase-js';
import { queueTransactionalEmail } from '@/lib/emails/transactional-email-service';

// Create Supabase client with service role for bypassing RLS
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

export interface PipelineCompletionNotificationOptions {
    jobId: string;
}

/**
 * Send pipeline completion notification email
 * Checks vendor notification preferences before sending
 */
export async function sendPipelineCompletionNotification(
    options: PipelineCompletionNotificationOptions
): Promise<{ success: boolean; error?: string }> {
    try {
        const { jobId } = options;

        // 1. Fetch pipeline job details
        const { data: job, error: jobError } = await supabaseServiceRole
            .from('pipeline_jobs')
            .select(`
                *,
                vendors (
                    id,
                    name,
                    email,
                    notification_settings
                )
            `)
            .eq('id', jobId)
            .single();

        if (jobError || !job) {
            console.error(`Pipeline job not found: ${jobId}`, jobError);
            return {
                success: false,
                error: 'Pipeline job not found'
            };
        }

        // 2. Check if job completed successfully
        if (job.status !== 'completed') {
            return {
                success: false,
                error: 'Job has not completed successfully'
            };
        }

        // 3. Check vendor notification preferences
        const vendor = job.vendors;
        if (!vendor) {
            return {
                success: false,
                error: 'Vendor not found for job'
            };
        }

        const notificationSettings = vendor.notification_settings as any || {};
        const emailEnabled = notificationSettings.email_enabled !== false; // Default to true
        const pipelineNotificationsEnabled = notificationSettings.pipeline_completion !== false; // Default to true

        if (!emailEnabled || !pipelineNotificationsEnabled) {
            console.log(`Pipeline completion notifications disabled for vendor ${vendor.id}`);
            return {
                success: true,
                error: 'Notifications disabled by user preference'
            };
        }

        // 4. Get vendor user email (from the creator or owner)
        const { data: profile, error: profileError } = await supabaseServiceRole
            .from('profiles')
            .select('id, email')
            .eq('vendor_id', vendor.id)
            .eq('id', job.vendor_id) // Get the user who owns the vendor
            .single();

        let recipientEmail = vendor.email; // Fallback to vendor email
        if (profile && profile.email) {
            recipientEmail = profile.email;
        }

        // 5. Format duration
        let duration = 'N/A';
        if (job.started_at && job.completed_at) {
            const start = new Date(job.started_at);
            const end = new Date(job.completed_at);
            const diffMs = end.getTime() - start.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffSecs = Math.floor((diffMs % 60000) / 1000);

            if (diffMins > 0) {
                duration = `${diffMins}m ${diffSecs}s`;
            } else {
                duration = `${diffSecs}s`;
            }
        }

        // 6. Format completed_at timestamp
        const completedAt = job.completed_at
            ? new Date(job.completed_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
            : 'N/A';

        // 7. Build job URL (assuming app runs on same domain)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848';
        const jobUrl = `${baseUrl}/app/pipeline?job=${jobId}`;

        // 8. Queue the email
        const result = await queueTransactionalEmail({
            templateKey: 'pipeline_job_completed',
            to: recipientEmail,
            toName: vendor.name,
            variables: {
                website_url: job.website_url,
                seo_score: String(job.seo_score || 0),
                pages_indexed: String(job.pages_indexed || 0),
                content_gaps: String(job.content_gaps || 0),
                topics_generated: String(job.topics_generated || 0),
                blogs_created: String(job.blogs_created || 0),
                duration,
                completed_at: completedAt,
                job_url: jobUrl
            },
            priority: 3, // Medium priority
            metadata: {
                job_id: jobId,
                vendor_id: vendor.id,
                notification_type: 'pipeline_completion'
            }
        });

        if (!result.success) {
            console.error('Failed to queue pipeline completion email:', result.error);
            return {
                success: false,
                error: result.error
            };
        }

        console.log(`Pipeline completion notification queued for job ${jobId}`);
        return {
            success: true
        };

    } catch (error: any) {
        console.error('Error sending pipeline completion notification:', error);
        return {
            success: false,
            error: error.message || 'Unknown error'
        };
    }
}
