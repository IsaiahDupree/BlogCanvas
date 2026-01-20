/**
 * Meeting confirmation email template
 */

interface MeetingConfirmationEmailProps {
  vendorName: string;
  vendorEmail: string;
  clientName: string;
  meetingType: string;
  meetingDescription?: string;
  startTime: string;
  endTime: string;
  timezone: string;
  meetingLink?: string;
  locationDetails?: string;
  notes?: string;
}

export function MeetingConfirmationEmail({
  vendorName,
  vendorEmail,
  clientName,
  meetingType,
  meetingDescription,
  startTime,
  endTime,
  timezone,
  meetingLink,
  locationDetails,
  notes
}: MeetingConfirmationEmailProps) {
  const formattedStartTime = new Date(startTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Meeting Confirmed</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi ${clientName},
    </p>

    <p style="font-size: 16px; margin-bottom: 30px;">
      Your meeting with <strong>${vendorName}</strong> has been confirmed!
    </p>

    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #667eea;">
      <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">${meetingType}</h2>

      ${meetingDescription ? `<p style="color: #6b7280; margin: 10px 0;">${meetingDescription}</p>` : ''}

      <div style="margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>📅 When:</strong> ${formattedStartTime}</p>
        <p style="margin: 5px 0;"><strong>⏱️ Duration:</strong> ${Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)} minutes</p>
        <p style="margin: 5px 0;"><strong>🌍 Timezone:</strong> ${timezone}</p>
      </div>

      ${meetingLink ? `
        <div style="margin: 20px 0;">
          <a href="${meetingLink}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Join Meeting
          </a>
        </div>
      ` : ''}

      ${locationDetails ? `
        <div style="margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${locationDetails}</p>
        </div>
      ` : ''}

      ${notes ? `
        <div style="margin: 20px 0; padding-top: 15px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 5px 0;"><strong>📝 Notes:</strong></p>
          <p style="color: #6b7280; margin: 10px 0;">${notes}</p>
        </div>
      ` : ''}
    </div>

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
      <p style="margin: 0; color: #92400e;">
        <strong>⚠️ Important:</strong> Please add this meeting to your calendar and arrive on time. If you need to reschedule or cancel, please contact ${vendorName} as soon as possible.
      </p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
      Questions? Reply to this email or contact ${vendorName} at <a href="mailto:${vendorEmail}" style="color: #667eea;">${vendorEmail}</a>
    </p>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      This meeting was scheduled through BlogCanvas.<br>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #667eea; text-decoration: none;">Visit BlogCanvas</a>
    </p>
  </div>
</body>
</html>
  `;
}

export function generateMeetingConfirmationEmail(props: MeetingConfirmationEmailProps): string {
  return MeetingConfirmationEmail(props);
}
