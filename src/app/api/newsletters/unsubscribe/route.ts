import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/newsletters/unsubscribe
 * Unsubscribe a recipient from newsletters
 * Body: { token: string } or { email: string, campaign_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { token, email, campaign_id } = await request.json();

    // Create supabase client (no auth required for unsubscribe)
    const supabase = await createClient();

    let recipientEmail: string;
    let campaignId: string;

    if (token) {
      // Decode token (format: base64(email:campaign_id:timestamp))
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const parts = decoded.split(':');
        if (parts.length !== 3) {
          return NextResponse.json(
            { error: 'Invalid unsubscribe token' },
            { status: 400 }
          );
        }

        recipientEmail = parts[0];
        campaignId = parts[1];
        const timestamp = parseInt(parts[2]);

        // Check if token is expired (30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        if (timestamp < thirtyDaysAgo) {
          return NextResponse.json(
            { error: 'Unsubscribe link has expired' },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid unsubscribe token' },
          { status: 400 }
        );
      }
    } else if (email && campaign_id) {
      recipientEmail = email;
      campaignId = campaign_id;
    } else {
      return NextResponse.json(
        { error: 'Either token or email+campaign_id is required' },
        { status: 400 }
      );
    }

    // Find the recipient
    const { data: recipient, error: findError } = await supabase
      .from('newsletter_recipients')
      .select('id, status')
      .eq('email', recipientEmail)
      .eq('campaign_id', campaignId)
      .single();

    if (findError || !recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Update status to unsubscribed
    const { error: updateError } = await supabase
      .from('newsletter_recipients')
      .update({ status: 'unsubscribed' })
      .eq('id', recipient.id);

    if (updateError) {
      console.error('Error unsubscribing:', updateError);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully unsubscribed',
      email: recipientEmail,
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
 * GET /api/newsletters/unsubscribe?token=...
 * Unsubscribe via GET request (for email links)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/unsubscribe?error=missing_token', request.url));
  }

  try {
    // Decode token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 3) {
      return NextResponse.redirect(new URL('/unsubscribe?error=invalid_token', request.url));
    }

    const recipientEmail = parts[0];
    const campaignId = parts[1];
    const timestamp = parseInt(parts[2]);

    // Check if token is expired (30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    if (timestamp < thirtyDaysAgo) {
      return NextResponse.redirect(new URL('/unsubscribe?error=expired', request.url));
    }

    // Perform unsubscribe
    const supabase = await createClient();

    const { data: recipient } = await supabase
      .from('newsletter_recipients')
      .select('id')
      .eq('email', recipientEmail)
      .eq('campaign_id', campaignId)
      .single();

    if (!recipient) {
      return NextResponse.redirect(new URL('/unsubscribe?error=not_found', request.url));
    }

    await supabase
      .from('newsletter_recipients')
      .update({ status: 'unsubscribed' })
      .eq('id', recipient.id);

    return NextResponse.redirect(new URL('/unsubscribe?success=true', request.url));
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.redirect(new URL('/unsubscribe?error=server_error', request.url));
  }
}
