/**
 * Vendor Platform Email Notifications
 * Handles all email notifications for the vendor offer platform
 */

import { sendEmail } from '@/lib/email/resend';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848';

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

const baseStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6; }
  .container { max-width: 600px; margin: 0 auto; background: white; }
  .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 32px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
  .content { padding: 32px; }
  .button { display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
  .button:hover { background: #2563eb; }
  .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .details-table td { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
  .details-table td:first-child { color: #6b7280; width: 140px; }
  .footer { background: #f9fafb; padding: 24px 32px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
`;

// ============================================================================
// MEETING NOTIFICATIONS
// ============================================================================

interface MeetingBookedEmailOptions {
  clientEmail: string;
  clientName?: string;
  vendorName: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  meetingDuration: number;
  meetingLink?: string;
  timezone: string;
}

export async function sendMeetingBookedEmail(options: MeetingBookedEmailOptions) {
  const {
    clientEmail,
    clientName,
    vendorName,
    meetingTitle,
    meetingDate,
    meetingTime,
    meetingDuration,
    meetingLink,
    timezone
  } = options;

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Meeting Confirmed! ✓</h1>
    </div>
    <div class="content">
      <p>Hi ${clientName || 'there'},</p>
      <p>Your meeting with <strong>${vendorName}</strong> has been scheduled successfully.</p>
      
      <div class="info-box">
        <table class="details-table">
          <tr><td>Meeting</td><td><strong>${meetingTitle}</strong></td></tr>
          <tr><td>Date</td><td><strong>${meetingDate}</strong></td></tr>
          <tr><td>Time</td><td><strong>${meetingTime}</strong> (${timezone})</td></tr>
          <tr><td>Duration</td><td>${meetingDuration} minutes</td></tr>
        </table>
      </div>
      
      ${meetingLink ? `
      <p style="text-align: center;">
        <a href="${meetingLink}" class="button">Join Meeting</a>
      </p>
      <p style="text-align: center; color: #6b7280; font-size: 14px;">
        Meeting link: <a href="${meetingLink}">${meetingLink}</a>
      </p>
      ` : ''}
      
      <p>We look forward to speaking with you!</p>
    </div>
    <div class="footer">
      <p>This email was sent by ${vendorName} via BlogCanvas</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: clientEmail,
    subject: `Meeting Confirmed: ${meetingTitle} with ${vendorName}`,
    html
  });
}

export async function sendMeetingBookedToVendor(options: MeetingBookedEmailOptions & { vendorEmail: string }) {
  const {
    vendorEmail,
    clientEmail,
    clientName,
    vendorName,
    meetingTitle,
    meetingDate,
    meetingTime,
    meetingDuration,
    meetingLink,
    timezone
  } = options;

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Meeting Booked 📅</h1>
    </div>
    <div class="content">
      <p>Hi ${vendorName},</p>
      <p>A new meeting has been scheduled with you.</p>
      
      <div class="info-box">
        <table class="details-table">
          <tr><td>Client</td><td><strong>${clientName || clientEmail}</strong></td></tr>
          <tr><td>Email</td><td>${clientEmail}</td></tr>
          <tr><td>Meeting</td><td><strong>${meetingTitle}</strong></td></tr>
          <tr><td>Date</td><td><strong>${meetingDate}</strong></td></tr>
          <tr><td>Time</td><td><strong>${meetingTime}</strong> (${timezone})</td></tr>
          <tr><td>Duration</td><td>${meetingDuration} minutes</td></tr>
        </table>
      </div>
      
      <p style="text-align: center;">
        <a href="${APP_URL}/vendor/meetings" class="button">View in Dashboard</a>
      </p>
    </div>
    <div class="footer">
      <p>This is an automated notification from BlogCanvas</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: vendorEmail,
    subject: `New Meeting: ${clientName || clientEmail} booked ${meetingTitle}`,
    html
  });
}

// ============================================================================
// ORDER NOTIFICATIONS
// ============================================================================

interface OrderConfirmationEmailOptions {
  clientEmail: string;
  clientName?: string;
  vendorName: string;
  orderNumber: string;
  offerName: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
}

export async function sendOrderConfirmationEmail(options: OrderConfirmationEmailOptions) {
  const {
    clientEmail,
    clientName,
    vendorName,
    orderNumber,
    offerName,
    amount,
    currency
  } = options;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed! 🎉</h1>
    </div>
    <div class="content">
      <p>Hi ${clientName || 'there'},</p>
      <p>Thank you for your purchase! Your order has been confirmed.</p>
      
      <div class="info-box">
        <table class="details-table">
          <tr><td>Order #</td><td><strong>${orderNumber}</strong></td></tr>
          <tr><td>Product</td><td><strong>${offerName}</strong></td></tr>
          <tr><td>Amount</td><td><strong>${formattedAmount}</strong></td></tr>
          <tr><td>Vendor</td><td>${vendorName}</td></tr>
        </table>
      </div>
      
      <p style="text-align: center;">
        <a href="${APP_URL}/client-portal" class="button">Access Client Portal</a>
      </p>
      
      <p>${vendorName} will be in touch with you shortly with next steps.</p>
    </div>
    <div class="footer">
      <p>This email was sent by ${vendorName} via BlogCanvas</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: clientEmail,
    subject: `Order Confirmed: ${offerName} - Order #${orderNumber}`,
    html
  });
}

export async function sendNewOrderToVendor(options: OrderConfirmationEmailOptions & { vendorEmail: string }) {
  const {
    vendorEmail,
    clientEmail,
    clientName,
    vendorName,
    orderNumber,
    offerName,
    amount,
    currency
  } = options;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
      <h1>New Order Received! 💰</h1>
    </div>
    <div class="content">
      <p>Hi ${vendorName},</p>
      <p>Great news! You have a new order.</p>
      
      <div class="info-box" style="background: #ecfdf5; border-left-color: #10b981;">
        <table class="details-table">
          <tr><td>Order #</td><td><strong>${orderNumber}</strong></td></tr>
          <tr><td>Customer</td><td><strong>${clientName || clientEmail}</strong></td></tr>
          <tr><td>Email</td><td>${clientEmail}</td></tr>
          <tr><td>Product</td><td><strong>${offerName}</strong></td></tr>
          <tr><td>Amount</td><td><strong style="color: #059669;">${formattedAmount}</strong></td></tr>
        </table>
      </div>
      
      <p style="text-align: center;">
        <a href="${APP_URL}/vendor/sales" class="button" style="background: #10b981;">View Order Details</a>
      </p>
    </div>
    <div class="footer">
      <p>This is an automated notification from BlogCanvas</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: vendorEmail,
    subject: `💰 New Order: ${formattedAmount} from ${clientName || clientEmail}`,
    html
  });
}

// ============================================================================
// CLIENT WELCOME
// ============================================================================

interface WelcomeEmailOptions {
  clientEmail: string;
  clientName?: string;
  vendorName: string;
  portalUrl: string;
}

export async function sendClientWelcomeEmail(options: WelcomeEmailOptions) {
  const { clientEmail, clientName, vendorName, portalUrl } = options;

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome! 👋</h1>
    </div>
    <div class="content">
      <p>Hi ${clientName || 'there'},</p>
      <p>Welcome to your client portal with <strong>${vendorName}</strong>!</p>
      
      <p>Your portal is ready and waiting for you. Here you can:</p>
      <ul style="color: #4b5563;">
        <li>Track your project progress</li>
        <li>View and download deliverables</li>
        <li>Send messages to ${vendorName}</li>
        <li>Schedule and manage meetings</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="${portalUrl}" class="button">Access Your Portal</a>
      </p>
      
      <p>If you have any questions, feel free to reach out through your portal.</p>
    </div>
    <div class="footer">
      <p>This email was sent by ${vendorName} via BlogCanvas</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: clientEmail,
    subject: `Welcome to your ${vendorName} Client Portal`,
    html
  });
}

// ============================================================================
// MEETING REMINDERS
// ============================================================================

interface MeetingReminderEmailOptions {
  email: string;
  name?: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  meetingLink?: string;
  timezone: string;
  isVendor: boolean;
  otherPartyName: string;
}

export async function sendMeetingReminderEmail(options: MeetingReminderEmailOptions) {
  const {
    email,
    name,
    meetingTitle,
    meetingDate,
    meetingTime,
    meetingLink,
    timezone,
    isVendor,
    otherPartyName
  } = options;

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      <h1>Meeting Reminder ⏰</h1>
    </div>
    <div class="content">
      <p>Hi ${name || 'there'},</p>
      <p>This is a reminder that you have a meeting coming up ${isVendor ? 'with' : 'with'} <strong>${otherPartyName}</strong>.</p>
      
      <div class="info-box" style="background: #fffbeb; border-left-color: #f59e0b;">
        <table class="details-table">
          <tr><td>Meeting</td><td><strong>${meetingTitle}</strong></td></tr>
          <tr><td>Date</td><td><strong>${meetingDate}</strong></td></tr>
          <tr><td>Time</td><td><strong>${meetingTime}</strong> (${timezone})</td></tr>
        </table>
      </div>
      
      ${meetingLink ? `
      <p style="text-align: center;">
        <a href="${meetingLink}" class="button" style="background: #f59e0b;">Join Meeting</a>
      </p>
      ` : ''}
    </div>
    <div class="footer">
      <p>This is an automated reminder from BlogCanvas</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: email,
    subject: `Reminder: ${meetingTitle} - ${meetingDate} at ${meetingTime}`,
    html
  });
}

// ============================================================================
// DELIVERABLE NOTIFICATIONS
// ============================================================================

interface DeliverableReadyEmailOptions {
  clientEmail: string;
  clientName?: string;
  vendorName: string;
  deliverableName: string;
  workspaceId: string;
}

export async function sendDeliverableReadyEmail(options: DeliverableReadyEmailOptions) {
  const { clientEmail, clientName, vendorName, deliverableName, workspaceId } = options;

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);">
      <h1>New Deliverable Ready! 📦</h1>
    </div>
    <div class="content">
      <p>Hi ${clientName || 'there'},</p>
      <p><strong>${vendorName}</strong> has uploaded a new deliverable for you:</p>
      
      <div class="info-box" style="background: #f5f3ff; border-left-color: #8b5cf6;">
        <p style="margin: 0; font-size: 18px; font-weight: 600;">${deliverableName}</p>
      </div>
      
      <p style="text-align: center;">
        <a href="${APP_URL}/client-portal/${workspaceId}/deliverables" class="button" style="background: #8b5cf6;">View Deliverable</a>
      </p>
      
      <p>Please review and let ${vendorName} know if you need any changes.</p>
    </div>
    <div class="footer">
      <p>This email was sent by ${vendorName} via BlogCanvas</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: clientEmail,
    subject: `New Deliverable: ${deliverableName} from ${vendorName}`,
    html
  });
}
