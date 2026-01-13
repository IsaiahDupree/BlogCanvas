/**
 * SLA Monitoring and Alert Endpoint
 * POST /api/sla/check-and-alert
 *
 * Checks pending reviews against SLA deadlines and sends alerts
 * Should be called by a cron job every 15-30 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { queueTransactionalEmail } from '@/lib/emails/transactional-email-service';

interface SLARecord {
  id: string;
  blog_post_id: string;
  vendor_id: string;
  client_id: string | null;
  sla_type: 'editor_review' | 'client_review';
  submitted_at: string;
  sla_deadline_at: string;
  alert_threshold_at: string;
  alert_sent_at: string | null;
  status: string;
  metadata: any;
}

interface BlogPost {
  id: string;
  topic: string;
  title: string | null;
  status: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface VendorSettings {
  alert_recipients: string[];
  enable_alerts: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const now = new Date();

    // Get all pending SLA records that need attention
    const { data: pendingSLAs, error: slaError } = await supabase
      .from('review_sla_tracking')
      .select('*')
      .in('status', ['pending', 'alerted'])
      .order('sla_deadline_at', { ascending: true });

    if (slaError) {
      console.error('Error fetching SLA records:', slaError);
      return NextResponse.json(
        { error: 'Failed to fetch SLA records' },
        { status: 500 }
      );
    }

    if (!pendingSLAs || pendingSLAs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending SLA records to check',
        checked: 0,
        alertsSent: 0,
        breaches: 0
      });
    }

    let alertsSent = 0;
    let breachesDetected = 0;
    const errors: string[] = [];

    // Process each SLA record
    for (const sla of pendingSLAs as SLARecord[]) {
      try {
        const deadlineTime = new Date(sla.sla_deadline_at).getTime();
        const alertThresholdTime = new Date(sla.alert_threshold_at).getTime();
        const nowTime = now.getTime();

        // Check if SLA is breached
        if (nowTime > deadlineTime && sla.status !== 'alerted') {
          // SLA breached - send urgent alert
          await sendSLABreachAlert(supabase, sla);
          breachesDetected++;
          alertsSent++;

          // Update status
          await supabase
            .from('review_sla_tracking')
            .update({
              status: 'alerted',
              breached: true,
              updated_at: now.toISOString()
            })
            .eq('id', sla.id);

        } else if (nowTime > alertThresholdTime && !sla.alert_sent_at) {
          // Approaching deadline - send warning
          await sendSLAWarningAlert(supabase, sla);
          alertsSent++;

          // Update alert sent timestamp
          await supabase
            .from('review_sla_tracking')
            .update({
              alert_sent_at: now.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', sla.id);
        }
      } catch (error: any) {
        console.error(`Error processing SLA ${sla.id}:`, error);
        errors.push(`SLA ${sla.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      checked: pendingSLAs.length,
      alertsSent,
      breaches: breachesDetected,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('SLA check error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'SLA monitoring endpoint. Use POST to check SLAs and send alerts.',
    endpoint: '/api/sla/check-and-alert',
    method: 'POST',
    authentication: 'Bearer token in Authorization header',
    cronSetup: 'Run every 15-30 minutes',
    example: 'curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:4848/api/sla/check-and-alert'
  });
}

/**
 * Send SLA breach alert (deadline has passed)
 */
async function sendSLABreachAlert(supabase: any, sla: SLARecord) {
  const now = new Date();

  // Get blog post details
  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, topic, title, status')
    .eq('id', sla.blog_post_id)
    .single() as { data: BlogPost | null };

  if (!post) {
    console.error(`Post not found for SLA ${sla.id}`);
    return;
  }

  // Get vendor settings
  const { data: settings } = await supabase
    .from('vendor_sla_settings')
    .select('alert_recipients, enable_alerts')
    .eq('vendor_id', sla.vendor_id)
    .single() as { data: VendorSettings | null };

  if (!settings?.enable_alerts) {
    console.log(`Alerts disabled for vendor ${sla.vendor_id}`);
    return;
  }

  const submittedAt = new Date(sla.submitted_at);
  const deadlineAt = new Date(sla.sla_deadline_at);
  const hoursOverdue = Math.round((now.getTime() - deadlineAt.getTime()) / (1000 * 60 * 60));
  const slaHours = sla.metadata?.sla_hours || 24;

  // Get recipients
  let recipients: string[] = [];

  if (sla.sla_type === 'editor_review') {
    // For editor reviews, send to alert recipients from settings
    if (settings.alert_recipients && Array.isArray(settings.alert_recipients)) {
      recipients = settings.alert_recipients;
    }

    // Also get editors/admins from vendor team
    const { data: editors } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('vendor_id', sla.vendor_id)
      .in('role', ['admin', 'editor']) as { data: Profile[] | null };

    if (editors) {
      const editorEmails = editors.map(e => e.email).filter(Boolean);
      recipients = [...new Set([...recipients, ...editorEmails])];
    }

  } else if (sla.sla_type === 'client_review' && sla.client_id) {
    // For client reviews, notify the client
    const { data: client } = await supabase
      .from('clients')
      .select('email, name')
      .eq('id', sla.client_id)
      .single() as { data: Client | null };

    if (client?.email) {
      recipients.push(client.email);
    }
  }

  if (recipients.length === 0) {
    console.warn(`No recipients found for SLA ${sla.id}`);
    return;
  }

  const postTitle = post.title || post.topic;
  const postUrl = `${process.env.NEXT_PUBLIC_APP_URL}/app/posts/${post.id}`;

  // Get client name
  let clientName = 'Unknown Client';
  if (sla.client_id) {
    const { data: client } = await supabase
      .from('clients')
      .select('name')
      .eq('id', sla.client_id)
      .single() as { data: Pick<Client, 'name'> | null };

    if (client) {
      clientName = client.name;
    }
  }

  // Queue emails for all recipients
  for (const recipientEmail of recipients) {
    await queueTransactionalEmail({
      to: recipientEmail,
      templateKey: 'editor_review_sla_breach',
      variables: {
        reviewer_name: recipientEmail.split('@')[0], // Simple fallback
        post_title: postTitle,
        client_name: clientName,
        submitted_at: submittedAt.toLocaleString(),
        hours_overdue: hoursOverdue.toString(),
        sla_deadline: deadlineAt.toLocaleString(),
        sla_hours: slaHours.toString(),
        post_url: postUrl
      },
      priority: 1 // High priority for breaches
    });
  }

  console.log(`SLA breach alert sent for post ${post.id} (${recipients.length} recipients)`);
}

/**
 * Send SLA warning alert (approaching deadline)
 */
async function sendSLAWarningAlert(supabase: any, sla: SLARecord) {
  const now = new Date();

  // Get blog post details
  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, topic, title, status')
    .eq('id', sla.blog_post_id)
    .single() as { data: BlogPost | null };

  if (!post) {
    console.error(`Post not found for SLA ${sla.id}`);
    return;
  }

  // Get vendor settings
  const { data: settings } = await supabase
    .from('vendor_sla_settings')
    .select('alert_recipients, enable_alerts')
    .eq('vendor_id', sla.vendor_id)
    .single() as { data: VendorSettings | null };

  if (!settings?.enable_alerts) {
    console.log(`Alerts disabled for vendor ${sla.vendor_id}`);
    return;
  }

  const submittedAt = new Date(sla.submitted_at);
  const deadlineAt = new Date(sla.sla_deadline_at);
  const hoursPending = Math.round((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60));
  const hoursRemaining = Math.max(0, Math.round((deadlineAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const slaHours = sla.metadata?.sla_hours || 24;

  // Get recipients
  let recipients: string[] = [];
  let templateKey = 'editor_review_sla_warning';
  const variables: Record<string, string> = {};

  if (sla.sla_type === 'editor_review') {
    // For editor reviews, send to alert recipients
    if (settings.alert_recipients && Array.isArray(settings.alert_recipients)) {
      recipients = settings.alert_recipients;
    }

    // Also get editors from vendor team
    const { data: editors } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('vendor_id', sla.vendor_id)
      .in('role', ['admin', 'editor']) as { data: Profile[] | null };

    if (editors) {
      const editorEmails = editors.map(e => e.email).filter(Boolean);
      recipients = [...new Set([...recipients, ...editorEmails])];
    }

    templateKey = 'editor_review_sla_warning';

    // Get client name
    let clientName = 'Unknown Client';
    if (sla.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('name')
        .eq('id', sla.client_id)
        .single() as { data: Pick<Client, 'name'> | null };

      if (client) {
        clientName = client.name;
      }
    }

    Object.assign(variables, {
      reviewer_name: 'Team', // Generic for multiple recipients
      post_title: post.title || post.topic,
      client_name: clientName,
      submitted_at: submittedAt.toLocaleString(),
      hours_pending: hoursPending.toString(),
      sla_deadline: deadlineAt.toLocaleString(),
      hours_remaining: hoursRemaining.toString(),
      sla_hours: slaHours.toString(),
      post_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/posts/${post.id}`
    });

  } else if (sla.sla_type === 'client_review' && sla.client_id) {
    // For client reviews, notify the client
    const { data: client } = await supabase
      .from('clients')
      .select('email, name')
      .eq('id', sla.client_id)
      .single() as { data: Client | null };

    if (client?.email) {
      recipients.push(client.email);

      templateKey = 'client_review_sla_warning';

      const daysPending = Math.round(hoursPending / 24);

      Object.assign(variables, {
        client_name: client.name,
        post_title: post.title || post.topic,
        submitted_at: submittedAt.toLocaleDateString(),
        days_pending: daysPending.toString(),
        sla_deadline: deadlineAt.toLocaleDateString(),
        post_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/posts/${post.id}`
      });
    }
  }

  if (recipients.length === 0) {
    console.warn(`No recipients found for SLA warning ${sla.id}`);
    return;
  }

  // Queue emails for all recipients
  for (const recipientEmail of recipients) {
    await queueTransactionalEmail({
      to: recipientEmail,
      templateKey,
      variables: {
        ...variables,
        // Override reviewer_name with actual email for individual messages
        reviewer_name: recipientEmail.split('@')[0]
      },
      priority: 3 // Medium priority for warnings
    });
  }

  console.log(`SLA warning sent for post ${post.id} (${recipients.length} recipients)`);
}
