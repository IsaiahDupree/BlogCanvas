/**
 * Generic notification email template with branding support
 */

import {
  wrapEmailContent,
  generateButton,
  generateInfoBox,
  type EmailBranding,
} from '../branding';

export interface NotificationEmailProps {
  branding: EmailBranding;
  recipientName: string;
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  infoBoxTitle?: string;
  infoBoxContent?: string;
  infoBoxVariant?: 'info' | 'success' | 'warning';
}

export function NotificationEmail({
  branding,
  recipientName,
  title,
  message,
  actionText,
  actionUrl,
  infoBoxTitle,
  infoBoxContent,
  infoBoxVariant = 'info',
}: NotificationEmailProps): string {
  const content = `
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi ${recipientName},
    </p>

    <p style="font-size: 16px; margin-bottom: 30px;">
      ${message}
    </p>

    ${
      infoBoxContent
        ? generateInfoBox(branding, infoBoxTitle || '', infoBoxContent, infoBoxVariant)
        : ''
    }

    ${
      actionText && actionUrl
        ? generateButton(branding, actionText, actionUrl)
        : ''
    }
  `;

  return wrapEmailContent(branding, title, content);
}

export function generateNotificationEmail(props: NotificationEmailProps): string {
  return NotificationEmail(props);
}
