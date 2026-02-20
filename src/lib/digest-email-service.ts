/**
 * Digest Email Service
 *
 * Generates and sends digest summary emails to users
 * - Daily digests: New blog posts, comments, approvals
 * - Weekly digests: Analytics summaries, team activity
 * - Monthly digests: Performance reports, billing summaries
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export type DigestFrequency = 'daily' | 'weekly' | 'monthly';

export interface DigestContent {
  user_id: string;
  email: string;
  full_name: string;
  frequency: DigestFrequency;
  period_start: string;
  period_end: string;
  data: {
    new_blog_posts?: number;
    pending_approvals?: number;
    new_comments?: number;
    completed_posts?: number;
    total_pageviews?: number;
    active_clients?: number;
    revenue?: number;
    highlights?: string[];
  };
}

/**
 * Get digest recipients for a specific frequency
 */
export async function getDigestRecipients(
  supabaseUrl: string,
  supabaseServiceKey: string,
  frequency: DigestFrequency
): Promise<DigestContent[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Calculate period based on frequency
  const now = new Date();
  let periodStart: Date;

  switch (frequency) {
    case 'daily':
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 1);
      break;
    case 'weekly':
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      periodStart = new Date(now);
      periodStart.setMonth(now.getMonth() - 1);
      break;
  }

  // Get users who have opted in for this digest frequency
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, vendor_id, notification_preferences')
    .not('email', 'is', null)
    .eq('role', 'owner'); // Only send to vendors for now

  if (error) {
    console.error('Error fetching digest recipients:', error);
    return [];
  }

  if (!users) {
    return [];
  }

  const recipients: DigestContent[] = [];

  for (const user of users) {
    // Check if user has opted in for this frequency
    const prefs = user.notification_preferences || {};
    if (prefs[`digest_${frequency}`] === false) {
      continue; // User opted out
    }

    // Gather digest data for this user
    const digestData = await gatherDigestData(
      supabase,
      user.id,
      user.vendor_id,
      periodStart.toISOString(),
      now.toISOString()
    );

    recipients.push({
      user_id: user.id,
      email: user.email,
      full_name: user.full_name || 'there',
      frequency,
      period_start: periodStart.toISOString(),
      period_end: now.toISOString(),
      data: digestData,
    });
  }

  return recipients;
}

/**
 * Gather digest data for a user
 */
async function gatherDigestData(
  supabase: any,
  userId: string,
  vendorId: string,
  periodStart: string,
  periodEnd: string
): Promise<DigestContent['data']> {
  const data: DigestContent['data'] = {
    highlights: [],
  };

  try {
    // Get new blog posts count
    const { count: newPosts } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);

    data.new_blog_posts = newPosts || 0;

    // Get pending approvals count
    const { count: pendingApprovals } = await supabase
      .from('content_approvals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);

    data.pending_approvals = pendingApprovals || 0;

    // Get new comments count
    const { count: newComments } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);

    data.new_comments = newComments || 0;

    // Get completed posts count
    const { count: completedPosts } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', periodStart)
      .lte('published_at', periodEnd);

    data.completed_posts = completedPosts || 0;

    // Get active clients count
    const { count: activeClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('updated_at', periodStart);

    data.active_clients = activeClients || 0;

    // Generate highlights
    if (data.new_blog_posts && data.new_blog_posts > 0) {
      data.highlights?.push(`Created ${data.new_blog_posts} new blog post${data.new_blog_posts > 1 ? 's' : ''}`);
    }
    if (data.completed_posts && data.completed_posts > 0) {
      data.highlights?.push(`Published ${data.completed_posts} blog post${data.completed_posts > 1 ? 's' : ''}`);
    }
    if (data.pending_approvals && data.pending_approvals > 0) {
      data.highlights?.push(`${data.pending_approvals} approval${data.pending_approvals > 1 ? 's' : ''} waiting for review`);
    }
  } catch (error) {
    console.error('Error gathering digest data:', error);
  }

  return data;
}

/**
 * Generate digest email HTML
 */
export function generateDigestEmailHTML(content: DigestContent): string {
  const { full_name, frequency, data } = content;

  const periodLabel =
    frequency === 'daily'
      ? 'Yesterday'
      : frequency === 'weekly'
      ? 'This Week'
      : 'This Month';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${periodLabel} on BlogCanvas</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">BlogCanvas</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${periodLabel}'s Summary</p>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${full_name},</p>

    <p style="font-size: 14px; color: #666;">Here's what happened ${periodLabel.toLowerCase()} on your BlogCanvas account:</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h2 style="margin-top: 0; font-size: 18px; color: #667eea;">Activity Summary</h2>

      <table style="width: 100%; border-collapse: collapse;">
        ${data.new_blog_posts !== undefined ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <strong>New Blog Posts</strong>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${data.new_blog_posts}
          </td>
        </tr>
        ` : ''}

        ${data.completed_posts !== undefined ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <strong>Published Posts</strong>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${data.completed_posts}
          </td>
        </tr>
        ` : ''}

        ${data.pending_approvals !== undefined ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <strong>Pending Approvals</strong>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${data.pending_approvals}
          </td>
        </tr>
        ` : ''}

        ${data.new_comments !== undefined ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <strong>New Comments</strong>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${data.new_comments}
          </td>
        </tr>
        ` : ''}

        ${data.active_clients !== undefined ? `
        <tr>
          <td style="padding: 8px 0;">
            <strong>Active Clients</strong>
          </td>
          <td style="padding: 8px 0; text-align: right;">
            ${data.active_clients}
          </td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${data.highlights && data.highlights.length > 0 ? `
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; font-size: 16px; color: #333;">✨ Highlights</h3>
      <ul style="margin: 10px 0; padding-left: 20px;">
        ${data.highlights.map((h) => `<li style="margin: 5px 0; color: #666;">${h}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Dashboard</a>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 12px; color: #999; text-align: center; margin-bottom: 0;">
      You're receiving this because you're subscribed to ${frequency} digests.<br>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #667eea; text-decoration: none;">Manage email preferences</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send digest email to a user
 */
export async function sendDigestEmail(
  resendApiKey: string,
  content: DigestContent
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = new Resend(resendApiKey);

    const html = generateDigestEmailHTML(content);

    const frequencyLabel =
      content.frequency.charAt(0).toUpperCase() + content.frequency.slice(1);

    const { error } = await resend.emails.send({
      from: 'BlogCanvas <digest@updates.blogcanvas.com>',
      to: content.email,
      subject: `Your ${frequencyLabel} BlogCanvas Summary`,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Send all digests for a specific frequency
 */
export async function sendDigests(
  supabaseUrl: string,
  supabaseServiceKey: string,
  resendApiKey: string,
  frequency: DigestFrequency
): Promise<{
  sent: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    const recipients = await getDigestRecipients(
      supabaseUrl,
      supabaseServiceKey,
      frequency
    );

    console.log(`Sending ${frequency} digests to ${recipients.length} recipients`);

    for (const recipient of recipients) {
      const result = await sendDigestEmail(resendApiKey, recipient);

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push(
          `Failed to send to ${recipient.email}: ${result.error}`
        );
      }

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Log digest send to database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from('digest_send_log').insert({
      frequency,
      recipients_count: recipients.length,
      sent_count: results.sent,
      failed_count: results.failed,
      sent_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error sending digests:', error);
    results.errors.push(error.message || 'Unknown error');
  }

  return results;
}
