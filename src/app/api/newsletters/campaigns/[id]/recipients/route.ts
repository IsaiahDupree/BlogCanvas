import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/newsletters/campaigns/[id]/recipients
 * List all recipients for a campaign with optional filtering and pagination
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Filter by recipient status
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify campaign belongs to vendor
    const { data: campaign } = await supabase
      .from('newsletter_campaigns')
      .select('vendor_id')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('newsletter_recipients')
      .select(`
        id,
        email,
        client_id,
        status,
        sent_at,
        opened_at,
        clicked_at,
        created_at,
        clients (
          id,
          company_name,
          contact_name
        )
      `, { count: 'exact' })
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: recipients, count, error } = await query;

    if (error) {
      console.error('Error fetching recipients:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      recipients: recipients || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/newsletters/campaigns/[id]/recipients
 * Add recipients to a campaign
 * Body: { emails: string[] }
 */
export async function POST(
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
    const { emails } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'emails array is required' },
        { status: 400 }
      );
    }

    // Verify campaign belongs to vendor
    const { data: campaign } = await supabase
      .from('newsletter_campaigns')
      .select('vendor_id')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check for existing recipients to prevent duplicates
    const { data: existingRecipients } = await supabase
      .from('newsletter_recipients')
      .select('email')
      .eq('campaign_id', campaignId)
      .in('email', emails);

    const existingEmails = new Set(
      (existingRecipients || []).map((r) => r.email)
    );

    const newEmails = emails.filter((email) => !existingEmails.has(email));

    if (newEmails.length === 0) {
      return NextResponse.json({
        message: 'All emails already exist in campaign',
        added: 0,
        duplicates: emails.length,
      });
    }

    // Map emails to clients (if they exist)
    const { data: clients } = await supabase
      .from('clients')
      .select('id, email')
      .eq('vendor_id', campaign.vendor_id)
      .in('email', newEmails);

    const emailToClientId = new Map(
      (clients || []).map((c) => [c.email, c.id])
    );

    // Create recipient records
    const recipientRecords = newEmails.map((email) => ({
      campaign_id: campaignId,
      email,
      client_id: emailToClientId.get(email) || null,
      status: 'pending' as const,
    }));

    const { data: newRecipients, error } = await supabase
      .from('newsletter_recipients')
      .insert(recipientRecords)
      .select();

    if (error) {
      console.error('Error creating recipients:', error);
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
      message: 'Recipients added successfully',
      added: newRecipients?.length || 0,
      duplicates: emails.length - newEmails.length,
      recipients: newRecipients,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
