/**
 * Email Sending Library
 * Uses Resend to send transactional emails
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailOptions {
    to: string | string[];
    subject: string;
    body: string;
    from?: string;
    attachments?: Array<{
        filename: string;
        content: Buffer;
    }>;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        // Check if API key is configured
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured, skipping email send');
            return {
                success: false,
                error: 'Email service not configured'
            };
        }

        const { to, subject, body, from = 'BlogCanvas <reports@blogcanvas.app>', attachments } = options;

        // Convert body to HTML with proper formatting (preserve line breaks)
        const htmlBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 8px 8px 0 0;
                        text-align: center;
                    }
                    .content {
                        background: #f9fafb;
                        padding: 30px;
                        border-radius: 0 0 8px 8px;
                    }
                    .content pre {
                        white-space: pre-wrap;
                        font-family: 'Courier New', monospace;
                        background: white;
                        padding: 20px;
                        border-radius: 4px;
                        border-left: 4px solid #6366f1;
                    }
                    .footer {
                        margin-top: 20px;
                        padding-top: 20px;
                        border-top: 1px solid #e5e7eb;
                        font-size: 12px;
                        color: #6b7280;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 style="margin: 0;">BlogCanvas SEO Report</h1>
                </div>
                <div class="content">
                    <pre>${body}</pre>
                </div>
                <div class="footer">
                    <p>Powered by BlogCanvas - Your SEO Content Partner</p>
                </div>
            </body>
            </html>
        `;

        const result = await resend.emails.send({
            from,
            to: Array.isArray(to) ? to : [to],
            subject,
            html: htmlBody,
            attachments: attachments?.map(att => ({
                filename: att.filename,
                content: att.content
            }))
        });

        return {
            success: true,
            id: result.data?.id
        };

    } catch (error: any) {
        console.error('Email sending error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send email'
        };
    }
}

/**
 * Send a report email with optional PDF attachment
 */
export async function sendReportEmail(
    recipientEmail: string,
    subject: string,
    body: string,
    pdfAttachment?: { filename: string; content: Buffer }
): Promise<{ success: boolean; id?: string; error?: string }> {
    return sendEmail({
        to: recipientEmail,
        subject,
        body,
        attachments: pdfAttachment ? [pdfAttachment] : undefined
    });
}
