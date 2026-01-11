import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parse } from 'csv-parse/sync';

/**
 * POST /api/newsletters/campaigns/[id]/recipients/import
 * Bulk import recipients from CSV file
 * Expected CSV format: email,name (headers optional)
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

    // Verify campaign belongs to vendor
    const { data: campaign } = await supabase
      .from('newsletter_campaigns')
      .select('vendor_id')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'CSV file is required' },
        { status: 400 }
      );
    }

    // Read CSV file
    const fileContent = await file.text();

    // Parse CSV with flexible column name matching
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    // Extract emails from CSV (support multiple column names)
    const emails: string[] = [];
    const errors: string[] = [];

    records.forEach((record: any, index: number) => {
      const email =
        record.email ||
        record.Email ||
        record.EMAIL ||
        record['Email Address'] ||
        record['email address'] ||
        '';

      if (email && /\S+@\S+\.\S+/.test(email)) {
        emails.push(email.toLowerCase().trim());
      } else if (email) {
        errors.push(`Row ${index + 2}: Invalid email format - "${email}"`);
      } else {
        errors.push(`Row ${index + 2}: Missing email address`);
      }
    });

    if (emails.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid emails found in CSV',
          errors,
        },
        { status: 400 }
      );
    }

    // Remove duplicates from uploaded emails
    const uniqueEmails = Array.from(new Set(emails));

    // Check for existing recipients
    const { data: existingRecipients } = await supabase
      .from('newsletter_recipients')
      .select('email')
      .eq('campaign_id', campaignId)
      .in('email', uniqueEmails);

    const existingEmails = new Set(
      (existingRecipients || []).map((r) => r.email)
    );

    const newEmails = uniqueEmails.filter((email) => !existingEmails.has(email));

    if (newEmails.length === 0) {
      return NextResponse.json({
        message: 'All emails already exist in campaign',
        imported: 0,
        duplicates: uniqueEmails.length,
        errors,
      });
    }

    // Map emails to clients
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

    const { data: newRecipients, error: insertError } = await supabase
      .from('newsletter_recipients')
      .insert(recipientRecords)
      .select();

    if (insertError) {
      console.error('Error inserting recipients:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
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
      message: 'Recipients imported successfully',
      imported: newRecipients?.length || 0,
      duplicates: uniqueEmails.length - newEmails.length,
      total_in_csv: emails.length,
      unique_in_csv: uniqueEmails.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
