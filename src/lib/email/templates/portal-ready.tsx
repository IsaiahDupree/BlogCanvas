/**
 * Portal ready email template
 * Sent when a workspace is created after checkout
 */

interface PortalReadyEmailProps {
  vendorName: string;
  vendorEmail: string;
  clientName: string;
  workspaceName: string;
  portalUrl: string;
  offerName: string;
  totalAmount: number;
  currency: string;
}

export function PortalReadyEmail({
  vendorName,
  vendorEmail,
  clientName,
  workspaceName,
  portalUrl,
  offerName,
  totalAmount,
  currency
}: PortalReadyEmailProps) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Client Portal is Ready</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome! 🎉</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi ${clientName},
    </p>

    <p style="font-size: 16px; margin-bottom: 30px;">
      Thank you for your purchase! Your client portal is now ready. This is your central hub for everything related to your project with ${vendorName}.
    </p>

    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #10b981;">
      <h2 style="margin-top: 0; color: #10b981; font-size: 20px;">Purchase Summary</h2>
      <p style="margin: 10px 0;"><strong>Service:</strong> ${offerName}</p>
      <p style="margin: 10px 0;"><strong>Amount Paid:</strong> ${currency} $${totalAmount.toFixed(2)}</p>
      <p style="margin: 10px 0;"><strong>Workspace:</strong> ${workspaceName}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Access Your Portal
      </a>
    </div>

    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
      <h3 style="margin-top: 0; color: #667eea; font-size: 18px;">What's Next?</h3>
      <ul style="color: #6b7280; padding-left: 20px;">
        <li style="margin: 10px 0;">Complete your onboarding checklist</li>
        <li style="margin: 10px 0;">Fill out the intake forms</li>
        <li style="margin: 10px 0;">Upload any required files</li>
        <li style="margin: 10px 0;">Schedule your kickoff call if needed</li>
        <li style="margin: 10px 0;">Communicate with ${vendorName} through the messaging feature</li>
      </ul>
    </div>

    <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 25px;">
      <p style="margin: 0; color: #1e40af;">
        <strong>💡 Tip:</strong> Bookmark your portal URL for easy access. You'll receive updates via email when there are new deliverables or messages.
      </p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
      Questions or need help? Contact ${vendorName} at <a href="mailto:${vendorEmail}" style="color: #667eea;">${vendorEmail}</a>
    </p>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      Powered by <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #667eea; text-decoration: none; font-weight: bold;">BlogCanvas</a>
    </p>
  </div>
</body>
</html>
  `;
}

export function generatePortalReadyEmail(props: PortalReadyEmailProps): string {
  return PortalReadyEmail(props);
}
