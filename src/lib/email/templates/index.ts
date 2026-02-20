/**
 * Email Templates Library
 * Centralized exports for all email templates
 */

export * from './portal-ready';
export * from './meeting-confirmation';
export * from './ai-insights';
export * from './content-showcase';
export * from './notification';

import { getVendorBranding, DEFAULT_BRANDING } from '../branding';
import { generateNotificationEmail } from './notification';

/**
 * Template types for easier usage
 */
export enum EmailTemplate {
  PORTAL_READY = 'portal_ready',
  MEETING_CONFIRMATION = 'meeting_confirmation',
  AI_INSIGHTS = 'ai_insights',
  CONTENT_SHOWCASE = 'content_showcase',
  NOTIFICATION = 'notification',
  APPROVAL_REQUEST = 'approval_request',
  APPROVAL_APPROVED = 'approval_approved',
  APPROVAL_REJECTED = 'approval_rejected',
  ORDER_CONFIRMATION = 'order_confirmation',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  INVITATION = 'invitation',
}

/**
 * Send approval request email
 */
export async function sendApprovalRequestEmail(
  vendorId: string,
  recipientName: string,
  recipientEmail: string,
  postTitle: string,
  approvalUrl: string
): Promise<string> {
  const branding = await getVendorBranding(vendorId);

  return generateNotificationEmail({
    branding,
    recipientName,
    title: 'New Content Ready for Your Review',
    message: `Your vendor has submitted "${postTitle}" for your review and approval.`,
    actionText: 'Review Content',
    actionUrl: approvalUrl,
    infoBoxTitle: 'What happens next?',
    infoBoxContent:
      'Review the content and either approve it for publishing or request changes. Your vendor will be notified of your decision.',
    infoBoxVariant: 'info',
  });
}

/**
 * Send approval approved email
 */
export async function sendApprovalApprovedEmail(
  vendorId: string,
  recipientName: string,
  recipientEmail: string,
  postTitle: string,
  message?: string
): Promise<string> {
  const branding = await getVendorBranding(vendorId);

  return generateNotificationEmail({
    branding,
    recipientName,
    title: 'Content Approved! 🎉',
    message: `Great news! "${postTitle}" has been approved${message ? ': ' + message : '.'}`,
    infoBoxTitle: 'Next Steps',
    infoBoxContent:
      'The content is now ready for publishing. You can proceed with scheduling or publishing it to your blog.',
    infoBoxVariant: 'success',
  });
}

/**
 * Send approval rejected email
 */
export async function sendApprovalRejectedEmail(
  vendorId: string,
  recipientName: string,
  recipientEmail: string,
  postTitle: string,
  feedback: string
): Promise<string> {
  const branding = await getVendorBranding(vendorId);

  return generateNotificationEmail({
    branding,
    recipientName,
    title: 'Changes Requested',
    message: `Your client has requested changes to "${postTitle}".`,
    infoBoxTitle: 'Client Feedback',
    infoBoxContent: feedback,
    infoBoxVariant: 'warning',
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  vendorId: string,
  recipientName: string,
  recipientEmail: string,
  orderDetails: {
    orderId: string;
    offerName: string;
    amount: number;
    currency: string;
  }
): Promise<string> {
  const branding = await getVendorBranding(vendorId);

  return generateNotificationEmail({
    branding,
    recipientName,
    title: 'Order Confirmation',
    message: `Thank you for your order! We've received your payment and are excited to get started.`,
    infoBoxTitle: 'Order Details',
    infoBoxContent: `
      Order ID: ${orderDetails.orderId}<br>
      Service: ${orderDetails.offerName}<br>
      Amount: ${orderDetails.currency} $${orderDetails.amount.toFixed(2)}
    `,
    infoBoxVariant: 'success',
  });
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(
  vendorId: string,
  recipientName: string,
  recipientEmail: string,
  orderDetails: {
    orderId: string;
    offerName: string;
    amount: number;
    currency: string;
  },
  retryUrl: string
): Promise<string> {
  const branding = await getVendorBranding(vendorId);

  return generateNotificationEmail({
    branding,
    recipientName,
    title: 'Payment Failed',
    message: `We were unable to process your payment for "${orderDetails.offerName}".`,
    actionText: 'Retry Payment',
    actionUrl: retryUrl,
    infoBoxTitle: 'What to do next',
    infoBoxContent:
      'Please check your payment method and try again. If you continue to experience issues, please contact support.',
    infoBoxVariant: 'warning',
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  vendorId: string,
  recipientName: string,
  recipientEmail: string,
  dashboardUrl: string
): Promise<string> {
  const branding = vendorId ? await getVendorBranding(vendorId) : DEFAULT_BRANDING;

  return generateNotificationEmail({
    branding,
    recipientName,
    title: 'Welcome to BlogCanvas! 🎉',
    message: `We're excited to have you on board. Let's get you started!`,
    actionText: 'Go to Dashboard',
    actionUrl: dashboardUrl,
    infoBoxTitle: 'Getting Started',
    infoBoxContent:
      'Complete your profile, explore the features, and start creating amazing content with your clients.',
    infoBoxVariant: 'info',
  });
}

/**
 * Send invitation email
 */
export async function sendInvitationEmail(
  vendorId: string,
  recipientName: string,
  recipientEmail: string,
  inviterName: string,
  invitationUrl: string,
  role: string
): Promise<string> {
  const branding = await getVendorBranding(vendorId);

  return generateNotificationEmail({
    branding,
    recipientName,
    title: `You've Been Invited!`,
    message: `${inviterName} has invited you to join their workspace as a ${role}.`,
    actionText: 'Accept Invitation',
    actionUrl: invitationUrl,
    infoBoxTitle: 'What is BlogCanvas?',
    infoBoxContent:
      'BlogCanvas is a comprehensive platform for managing blogger-vendor relationships, content creation, and project collaboration.',
    infoBoxVariant: 'info',
  });
}
