import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/newsletters/campaigns/[id]/analytics
 * Get analytics for a campaign (open rate, click rate, bounce rate, etc.)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaignId = params.id;

    // Verify campaign belongs to vendor
    const { data: campaign } = await supabase
      .from('newsletter_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get all recipients with their status
    const { data: recipients, error } = await supabase
      .from('newsletter_recipients')
      .select('status, sent_at, opened_at, clicked_at')
      .eq('campaign_id', campaignId);

    if (error) {
      console.error('Error fetching recipients:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate analytics
    const total = recipients?.length || 0;
    const sent = recipients?.filter((r) => r.status === 'sent' || r.status === 'delivered' || r.status === 'opened' || r.status === 'clicked').length || 0;
    const delivered = recipients?.filter((r) => r.status === 'delivered' || r.status === 'opened' || r.status === 'clicked').length || 0;
    const opened = recipients?.filter((r) => r.status === 'opened' || r.status === 'clicked').length || 0;
    const clicked = recipients?.filter((r) => r.status === 'clicked').length || 0;
    const bounced = recipients?.filter((r) => r.status === 'bounced').length || 0;
    const unsubscribed = recipients?.filter((r) => r.status === 'unsubscribed').length || 0;
    const pending = recipients?.filter((r) => r.status === 'pending').length || 0;

    // Calculate rates
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;
    const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;
    const unsubscribeRate = delivered > 0 ? (unsubscribed / delivered) * 100 : 0;

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        subject: campaign.subject,
        status: campaign.status,
        scheduled_at: campaign.scheduled_at,
        sent_at: campaign.sent_at,
      },
      stats: {
        total,
        sent,
        delivered,
        opened,
        clicked,
        bounced,
        unsubscribed,
        pending,
      },
      rates: {
        open_rate: parseFloat(openRate.toFixed(2)),
        click_rate: parseFloat(clickRate.toFixed(2)),
        bounce_rate: parseFloat(bounceRate.toFixed(2)),
        unsubscribe_rate: parseFloat(unsubscribeRate.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
