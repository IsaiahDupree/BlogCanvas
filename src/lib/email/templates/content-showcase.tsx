/**
 * Content showcase email template
 * Sent when a vendor showcases content to a client for approval
 */

interface ContentShowcaseEmailProps {
  vendorName: string;
  clientName: string;
  contentTitle: string;
  vendorMessage?: string;
  approvalUrl: string;
  portalUrl: string;
}

export function ContentShowcaseEmail({
  vendorName,
  clientName,
  contentTitle,
  vendorMessage,
  approvalUrl,
  portalUrl
}: ContentShowcaseEmailProps) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Content Ready for Review</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📝 Content Ready for Review</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi ${clientName},
    </p>

    <p style="font-size: 16px; margin-bottom: 30px;">
      ${vendorName} has shared new content with you for review and approval.
    </p>

    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #10b981;">
      <h2 style="margin-top: 0; color: #10b981; font-size: 20px;">Content Details</h2>
      <p style="margin: 10px 0;"><strong>Title:</strong> ${contentTitle}</p>
      <p style="margin: 10px 0;"><strong>From:</strong> ${vendorName}</p>
      <p style="margin: 10px 0;"><strong>Status:</strong> Pending Your Review</p>
    </div>

    ${vendorMessage ? `
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
      <h3 style="margin-top: 0; color: #3b82f6; font-size: 18px;">Message from ${vendorName}</h3>
      <p style="margin: 0; color: #374151; white-space: pre-wrap;">${vendorMessage}</p>
    </div>
    ` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${approvalUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Review Content Now
      </a>
    </div>

    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
      <h3 style="margin-top: 0; color: #667eea; font-size: 18px;">What You Can Do</h3>
      <ul style="color: #6b7280; padding-left: 20px;">
        <li style="margin: 10px 0;">Review the content in detail</li>
        <li style="margin: 10px 0;">Leave comments or feedback</li>
        <li style="margin: 10px 0;">Request revisions if needed</li>
        <li style="margin: 10px 0;">Approve the content when ready</li>
      </ul>
    </div>

    <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 25px;">
      <p style="margin: 0; color: #1e40af;">
        <strong>💡 Tip:</strong> Provide specific feedback to help ${vendorName} deliver exactly what you need. The faster you review, the faster we can move forward!
      </p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
      You can also access this content and all your projects from your <a href="${portalUrl}" style="color: #667eea;">client portal</a>.
    </p>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      Powered by <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #667eea; text-decoration: none; font-weight: bold;">BlogCanvas</a>
    </p>
  </div>
</body>
</html>
  `;
}

export function generateContentShowcaseEmail(props: ContentShowcaseEmailProps): string {
  return ContentShowcaseEmail(props);
}
