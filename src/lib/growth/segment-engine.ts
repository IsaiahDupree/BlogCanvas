/**
 * Segment Engine
 * Evaluates segment membership and triggers automations
 */

import { createClient } from '@/lib/supabase/server';
import type { Segment, PersonFeatures } from '@/types/growth-data-plane';

/**
 * Evaluate if a person matches segment criteria
 */
export async function evaluateSegmentMembership(
  personId: string,
  segmentId: string
): Promise<boolean> {
  const supabase = await createClient();

  // Get segment criteria
  const { data: segment } = await supabase
    .from('segment')
    .select('criteria')
    .eq('id', segmentId)
    .single();

  if (!segment) {
    console.error('Segment not found:', segmentId);
    return false;
  }

  // Get person features
  const { data: features } = await supabase
    .from('person_features')
    .select('*')
    .eq('person_id', personId)
    .single();

  if (!features) {
    console.error('Person features not found:', personId);
    return false;
  }

  // Evaluate criteria
  return evaluateCriteria(features, segment.criteria);
}

/**
 * Evaluate criteria against person features
 * Supports simple boolean checks and comparison operators
 */
function evaluateCriteria(
  features: PersonFeatures,
  criteria: Record<string, any>
): boolean {
  for (const [key, value] of Object.entries(criteria)) {
    const featureValue = (features as any)[key];

    // Handle boolean criteria (e.g., {"demo_requested": true})
    if (typeof value === 'boolean') {
      if (featureValue !== value) return false;
    }

    // Handle comparison operators (e.g., {"email_click_rate": {"$gte": 10}})
    else if (typeof value === 'object' && value !== null) {
      if (value.$gte !== undefined && !(featureValue >= value.$gte)) return false;
      if (value.$gt !== undefined && !(featureValue > value.$gt)) return false;
      if (value.$lte !== undefined && !(featureValue <= value.$lte)) return false;
      if (value.$lt !== undefined && !(featureValue < value.$lt)) return false;
      if (value.$eq !== undefined && featureValue !== value.$eq) return false;
      if (value.$ne !== undefined && featureValue === value.$ne) return false;
    }

    // Handle exact match
    else {
      if (featureValue !== value) return false;
    }
  }

  return true;
}

/**
 * Check segment membership for a person and update database
 */
export async function updateSegmentMembership(personId: string): Promise<void> {
  const supabase = await createClient();

  // Get all segments
  const { data: segments } = await supabase
    .from('segment')
    .select('id, slug, criteria, trigger_email_campaign, trigger_webhook_url');

  if (!segments) return;

  for (const segment of segments) {
    const isMember = await evaluateSegmentMembership(personId, segment.id);

    // Check current membership
    const { data: existingMembership } = await supabase
      .from('segment_membership')
      .select('id, exited_at')
      .eq('segment_id', segment.id)
      .eq('person_id', personId)
      .single();

    if (isMember) {
      // Should be in segment
      if (!existingMembership || existingMembership.exited_at) {
        // Add to segment (or re-add)
        await supabase.from('segment_membership').upsert({
          segment_id: segment.id,
          person_id: personId,
          entered_at: new Date().toISOString(),
          exited_at: null,
        });

        // Trigger automations (only on entry)
        if (!existingMembership) {
          await triggerSegmentAutomations(
            personId,
            segment.slug,
            segment.trigger_email_campaign,
            segment.trigger_webhook_url
          );
        }
      }
    } else {
      // Should NOT be in segment
      if (existingMembership && !existingMembership.exited_at) {
        // Exit from segment
        await supabase
          .from('segment_membership')
          .update({ exited_at: new Date().toISOString() })
          .eq('id', existingMembership.id);
      }
    }
  }

  // Update segment member counts
  await updateSegmentCounts();
}

/**
 * Trigger automations when a person enters a segment
 */
async function triggerSegmentAutomations(
  personId: string,
  segmentSlug: string,
  emailCampaign?: string | null,
  webhookUrl?: string | null
): Promise<void> {
  console.log('Triggering automations for segment:', segmentSlug, personId);

  const supabase = await createClient();

  // Get person details
  const { data: person } = await supabase
    .from('person')
    .select('email, name')
    .eq('id', personId)
    .single();

  if (!person) return;

  // Trigger email campaign
  if (emailCampaign && person.email) {
    await sendSegmentEmail(
      person.email,
      person.name || undefined,
      segmentSlug,
      emailCampaign
    );
  }

  // Trigger webhook
  if (webhookUrl) {
    await callSegmentWebhook(webhookUrl, {
      person_id: personId,
      segment: segmentSlug,
      email: person.email,
      name: person.name,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Send email for segment entry
 */
async function sendSegmentEmail(
  email: string,
  name: string | undefined,
  segmentSlug: string,
  campaignName: string
): Promise<void> {
  // Map segment slugs to email templates
  const emailTemplates: Record<string, { subject: string; body: string }> = {
    agency_signup_no_client_48h: {
      subject: 'Add your first client in 2 minutes',
      body: `Hi ${name || 'there'},

We noticed you signed up for BlogCanvas but haven't added your first client yet.

Adding a client takes just 2 minutes and unlocks the power of AI-generated content for your agency.

[Add Your First Client]

Need help? Reply to this email anytime.

Best,
The BlogCanvas Team`,
    },
    client_added_no_blog_72h: {
      subject: 'Generate your first AI blog',
      body: `Hi ${name || 'there'},

You've added a client—great start!

Now let's create your first AI-generated blog post. It takes less than a minute.

[Generate Your First Blog]

The BlogCanvas Team`,
    },
    blog_pending_approval_48h: {
      subject: 'Review pending content',
      body: `Hi ${name || 'there'},

You have content waiting for your approval in BlogCanvas.

[Review Now]

The BlogCanvas Team`,
    },
    high_volume_free_tier: {
      subject: 'Upgrade for unlimited clients',
      body: `Hi ${name || 'there'},

You're using BlogCanvas extensively—that's awesome!

Upgrade to unlock unlimited clients and advanced features.

[View Plans]

The BlogCanvas Team`,
    },
  };

  const template = emailTemplates[segmentSlug];
  if (!template) {
    console.warn('No email template for segment:', segmentSlug);
    return;
  }

  // TODO: Send via Resend
  // For now, just log
  console.log('Segment email triggered:', {
    to: email,
    subject: template.subject,
    segment: segmentSlug,
    campaign: campaignName,
  });

  // In production:
  // await fetch('/api/email/send', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     to: email,
  //     subject: template.subject,
  //     body: template.body,
  //     tags: [`segment:${segmentSlug}`, `campaign:${campaignName}`]
  //   })
  // });
}

/**
 * Call webhook for segment entry
 */
async function callSegmentWebhook(
  webhookUrl: string,
  payload: Record<string, any>
): Promise<void> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BlogCanvas-SegmentEngine/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Webhook call failed:', response.status, await response.text());
    } else {
      console.log('Webhook called successfully:', webhookUrl);
    }
  } catch (error) {
    console.error('Error calling webhook:', error);
  }
}

/**
 * Update member counts for all segments
 */
async function updateSegmentCounts(): Promise<void> {
  const supabase = await createClient();

  const { data: segments } = await supabase.from('segment').select('id');

  if (!segments) return;

  for (const segment of segments) {
    const { count } = await supabase
      .from('segment_membership')
      .select('*', { count: 'exact', head: true })
      .eq('segment_id', segment.id)
      .is('exited_at', null);

    await supabase
      .from('segment')
      .update({ member_count: count || 0 })
      .eq('id', segment.id);
  }
}

/**
 * Evaluate all segment memberships for all persons
 * Should be run periodically (e.g., via cron)
 */
export async function evaluateAllSegments(): Promise<void> {
  const supabase = await createClient();

  const { data: persons } = await supabase.from('person').select('id');

  if (!persons) return;

  console.log(`Evaluating segments for ${persons.length} persons...`);

  for (const person of persons) {
    await updateSegmentMembership(person.id);
  }

  console.log('Segment evaluation complete');
}
