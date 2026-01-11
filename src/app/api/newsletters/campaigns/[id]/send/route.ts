/**
 * Send Newsletter Campaign
 * POST /api/newsletters/campaigns/[id]/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: campaignId } = await params;
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get vendor ID from user
        const { data: userData } = await supabase
            .from('users')
            .select('vendor_id')
            .eq('id', user.id)
            .single();

        if (!userData?.vendor_id) {
            return NextResponse.json(
                { error: 'Vendor not found' },
                { status: 404 }
            );
        }

        // Fetch campaign
        const { data: campaign, error: campaignError } = await supabase
            .from('newsletter_campaigns')
            .select('*')
            .eq('id', campaignId)
            .eq('vendor_id', userData.vendor_id)
            .single();

        if (campaignError || !campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Check if campaign can be sent
        if (campaign.status === 'sent') {
            return NextResponse.json(
                { error: 'Campaign already sent' },
                { status: 400 }
            );
        }

        if (campaign.status === 'sending') {
            return NextResponse.json(
                { error: 'Campaign is currently being sent' },
                { status: 400 }
            );
        }

        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json(
                { error: 'Email service not configured' },
                { status: 503 }
            );
        }

        // Update campaign status to sending
        await supabase
            .from('newsletter_campaigns')
            .update({ status: 'sending' })
            .eq('id', campaignId);

        // Fetch recipients
        const { data: recipients, error: recipientsError } = await supabase
            .from('newsletter_recipients')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('status', 'pending');

        if (recipientsError || !recipients || recipients.length === 0) {
            // Update campaign status back to draft
            await supabase
                .from('newsletter_campaigns')
                .update({ status: 'failed' })
                .eq('id', campaignId);

            return NextResponse.json(
                { error: 'No recipients found' },
                { status: 400 }
            );
        }

        // Send emails in batches
        const results: { success: number; failed: number; errors: string[] } = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const recipient of recipients) {
            try {
                // Generate unsubscribe token (format: base64(email:campaign_id:timestamp))
                const unsubscribeToken = Buffer.from(
                    `${recipient.email}:${campaignId}:${Date.now()}`
                ).toString('base64');

                const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848'}/api/newsletters/unsubscribe?token=${unsubscribeToken}`;

                // Add unsubscribe link to HTML content
                const htmlWithUnsubscribe = campaign.html_content.replace(
                    '{{unsubscribe_url}}',
                    unsubscribeUrl
                ) + `
                    <div style="margin-top: 40px; padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
                        <p>You received this email because you're subscribed to our newsletter.</p>
                        <p><a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> from this list</p>
                    </div>
                `;

                // Send email via Resend
                await resend.emails.send({
                    from: 'BlogCanvas <newsletters@blogcanvas.app>',
                    to: recipient.email,
                    subject: campaign.subject,
                    html: htmlWithUnsubscribe
                });

                // Update recipient status
                await supabase
                    .from('newsletter_recipients')
                    .update({
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    })
                    .eq('id', recipient.id);

                results.success++;

            } catch (error: any) {
                console.error(`Error sending to ${recipient.email}:`, error);
                results.failed++;
                results.errors.push(`${recipient.email}: ${error.message}`);

                // Update recipient status to failed
                await supabase
                    .from('newsletter_recipients')
                    .update({ status: 'bounced' })
                    .eq('id', recipient.id);
            }
        }

        // Update campaign status
        const finalStatus = results.failed === 0 ? 'sent' : (results.success === 0 ? 'failed' : 'sent');
        await supabase
            .from('newsletter_campaigns')
            .update({
                status: finalStatus,
                sent_at: new Date().toISOString()
            })
            .eq('id', campaignId);

        return NextResponse.json({
            success: true,
            results: {
                total: recipients.length,
                sent: results.success,
                failed: results.failed,
                errors: results.errors
            }
        });

    } catch (error: any) {
        console.error('Unexpected error in POST /api/newsletters/campaigns/[id]/send:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
