/**
 * Resend email integration
 * Wrapper for Resend email service
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions) {
  const fromAddress = options.from || `BlogCanvas <noreply@${process.env.RESEND_DOMAIN || 'blogcanvas.io'}>`;

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo
    });

    return { success: true, data: response };

  } catch (error: any) {
    console.error('[Resend] Error sending email:', error);
    return { success: false, error: error.message };
  }
}
