import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/newsletters/campaigns/[id]/recipients/[recipientId]
 * Remove a specific recipient from a campaign
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; recipientId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaignId = params.id;
    const recipientId = params.recipientId;

    // Verify campaign belongs to vendor
    const { data: campaign } = await supabase
      .from('newsletter_campaigns')
      .select('vendor_id')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Verify recipient belongs to campaign
    const { data: recipient } = await supabase
      .from('newsletter_recipients')
      .select('id, campaign_id')
      .eq('id', recipientId)
      .eq('campaign_id', campaignId)
      .single();

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Delete recipient
    const { error } = await supabase
      .from('newsletter_recipients')
      .delete()
      .eq('id', recipientId);

    if (error) {
      console.error('Error deleting recipient:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update recipient count on campaign
    const { data: allRecipients } = await supabase
      .from('newsletter_recipients')
      .select('id', { count: 'exact' })
      .eq('campaign_id', campaignId);

    await supabase
      .from('newsletter_campaigns')
      .update({ recipient_count: allRecipients?.length || 0 })
      .eq('id', campaignId);

    return NextResponse.json({
      message: 'Recipient removed successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
