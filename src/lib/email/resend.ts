/**
 * Resend email integration
 * Wrapper for Resend email service with branding support
 */

import { Resend } from 'resend';
import { getVendorBranding, type EmailBranding } from './branding';
import { captureException } from '@/lib/monitoring/sentry';
import { trackEvent, EventCategory, EventAction } from '@/lib/analytics/event-tracker';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  replyTo?: string;
  vendorId?: string; // Optional vendor ID to apply branding
  tags?: string[]; // Optional tags for email tracking
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions) {
  const fromAddress = options.from || `BlogCanvas <noreply@${process.env.RESEND_DOMAIN || 'blogcanvas.io'}>`;

  try {
    // Track email send event
    await trackEvent({
      category: EventCategory.ENGAGEMENT,
      action: EventAction.SHARE,
      label: 'email_sent',
      metadata: {
        subject: options.subject,
        vendorId: options.vendorId,
        tags: options.tags,
      },
    });

    const response = await resend.emails.send({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      tags: options.tags?.map(tag => ({ name: tag, value: 'true' })),
    });

    return { success: true, data: response };

  } catch (error: unknown) {
    console.error('[Resend] Error sending email:', error);

    captureException(error as Error, {
      tags: {
        service: 'resend',
        email_subject: options.subject,
      },
      extra: {
        to: options.to,
        vendorId: options.vendorId,
      },
      level: 'error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send a branded email using vendor branding settings
 */
export async function sendBrandedEmail(
  vendorId: string,
  options: Omit<EmailOptions, 'vendorId'>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return sendEmail({
    ...options,
    vendorId,
  });
}

/**
 * Get vendor branding for email templates
 */
export async function getEmailBranding(vendorId: string): Promise<EmailBranding> {
  return getVendorBranding(vendorId);
}
