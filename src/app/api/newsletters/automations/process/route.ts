import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/newsletters/automations/process
 * Process all due automations (called by cron job)
 *
 * This endpoint should be called periodically (e.g., every hour) by a cron job
 * or scheduled task to check for and execute due automations.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create service role client (bypasses RLS)
    const supabase = await createClient();

    // Find all enabled automations that are due for execution
    const now = new Date().toISOString();
    const { data: dueAutomations, error: fetchError } = await supabase
      .from('newsletter_automations')
      .select(`
        *,
        newsletter_templates (
          id,
          name,
          html_content,
          json_content
        )
      `)
      .eq('enabled', true)
      .not('next_execution_at', 'is', null)
      .lte('next_execution_at', now);

    if (fetchError) {
      console.error('Error fetching due automations:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch automations' },
        { status: 500 }
      );
    }

    if (!dueAutomations || dueAutomations.length === 0) {
      return NextResponse.json({
        message: 'No automations due for execution',
        processed: 0,
      });
    }

    const results: Array<{
      automation_id: string;
      automation_name: string;
      status: string;
      campaign_id?: string;
      error?: string;
    }> = [];

    // Process each due automation
    for (const automation of dueAutomations) {
      try {
        // Determine recipients based on recipient_selection
        let recipientEmails: string[] = [];

        switch (automation.recipient_selection) {
          case 'all_clients':
            // Fetch all clients for this vendor
            const { data: clients } = await supabase
              .from('clients')
              .select('email')
              .eq('vendor_id', automation.vendor_id)
              .not('email', 'is', null);

            recipientEmails = (clients || []).map((c) => c.email);
            break;

          case 'custom_list':
            recipientEmails = automation.recipient_config?.emails || [];
            break;

          case 'client_ids':
            const clientIds = automation.recipient_config?.client_ids || [];
            if (clientIds.length > 0) {
              const { data: selectedClients } = await supabase
                .from('clients')
                .select('email')
                .in('id', clientIds)
                .not('email', 'is', null);

              recipientEmails = (selectedClients || []).map((c) => c.email);
            }
            break;
        }

        if (recipientEmails.length === 0) {
          // Log as skipped
          await supabase.from('newsletter_automation_executions').insert({
            automation_id: automation.id,
            status: 'skipped',
            error_message: 'No recipients found',
            recipients_count: 0,
          });

          results.push({
            automation_id: automation.id,
            automation_name: automation.name,
            status: 'skipped',
            error: 'No recipients found',
          });

          continue;
        }

        // Determine HTML content (use automation content or template content)
        const htmlContent =
          automation.html_content ||
          automation.newsletter_templates?.html_content ||
          '';

        const jsonContent =
          automation.json_content ||
          automation.newsletter_templates?.json_content ||
          null;

        if (!htmlContent) {
          await supabase.from('newsletter_automation_executions').insert({
            automation_id: automation.id,
            status: 'failed',
            error_message: 'No HTML content available',
            recipients_count: recipientEmails.length,
          });

          results.push({
            automation_id: automation.id,
            automation_name: automation.name,
            status: 'failed',
            error: 'No HTML content available',
          });

          continue;
        }

        // Create a campaign for this automation execution
        const { data: campaign, error: campaignError } = await supabase
          .from('newsletter_campaigns')
          .insert({
            vendor_id: automation.vendor_id,
            template_id: automation.template_id,
            subject: automation.subject || `Newsletter - ${automation.name}`,
            preview_text: automation.preview_text,
            html_content: htmlContent,
            json_content: jsonContent,
            status: 'draft',
            recipient_count: recipientEmails.length,
          })
          .select()
          .single();

        if (campaignError || !campaign) {
          console.error('Error creating campaign:', campaignError);

          await supabase.from('newsletter_automation_executions').insert({
            automation_id: automation.id,
            status: 'failed',
            error_message: campaignError?.message || 'Failed to create campaign',
            recipients_count: recipientEmails.length,
          });

          results.push({
            automation_id: automation.id,
            automation_name: automation.name,
            status: 'failed',
            error: campaignError?.message || 'Failed to create campaign',
          });

          continue;
        }

        // Create recipient records
        const recipientRecords = recipientEmails.map((email) => ({
          campaign_id: campaign.id,
          email,
          status: 'pending' as const,
        }));

        const { error: recipientsError } = await supabase
          .from('newsletter_recipients')
          .insert(recipientRecords);

        if (recipientsError) {
          console.error('Error creating recipients:', recipientsError);

          await supabase.from('newsletter_automation_executions').insert({
            automation_id: automation.id,
            campaign_id: campaign.id,
            status: 'failed',
            error_message: recipientsError.message,
            recipients_count: recipientEmails.length,
          });

          results.push({
            automation_id: automation.id,
            automation_name: automation.name,
            status: 'failed',
            campaign_id: campaign.id,
            error: recipientsError.message,
          });

          continue;
        }

        // Trigger the campaign send
        // (In production, you might want to queue this or send via background job)
        const sendResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848'}/api/newsletters/campaigns/${campaign.id}/send`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${cronSecret}`,
            },
          }
        );

        if (!sendResponse.ok) {
          await supabase.from('newsletter_automation_executions').insert({
            automation_id: automation.id,
            campaign_id: campaign.id,
            status: 'failed',
            error_message: 'Failed to send campaign',
            recipients_count: recipientEmails.length,
          });

          results.push({
            automation_id: automation.id,
            automation_name: automation.name,
            status: 'failed',
            campaign_id: campaign.id,
            error: 'Failed to send campaign',
          });

          continue;
        }

        const sendResult = await sendResponse.json();

        // Log successful execution
        await supabase.from('newsletter_automation_executions').insert({
          automation_id: automation.id,
          campaign_id: campaign.id,
          status: 'success',
          recipients_count: recipientEmails.length,
          emails_sent: sendResult.results?.sent || 0,
          emails_failed: sendResult.results?.failed || 0,
        });

        // Update automation execution tracking
        await supabase
          .from('newsletter_automations')
          .update({
            last_executed_at: new Date().toISOString(),
            execution_count: automation.execution_count + 1,
          })
          .eq('id', automation.id);

        results.push({
          automation_id: automation.id,
          automation_name: automation.name,
          status: 'success',
          campaign_id: campaign.id,
        });
      } catch (error: any) {
        console.error(`Error processing automation ${automation.id}:`, error);

        await supabase.from('newsletter_automation_executions').insert({
          automation_id: automation.id,
          status: 'failed',
          error_message: error.message,
          recipients_count: 0,
        });

        results.push({
          automation_id: automation.id,
          automation_name: automation.name,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      message: 'Automations processed',
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Unexpected error in automation processor:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing/monitoring
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Find all enabled automations that are due
    const now = new Date().toISOString();
    const { data: dueAutomations } = await supabase
      .from('newsletter_automations')
      .select('id, name, trigger_type, next_execution_at')
      .eq('enabled', true)
      .not('next_execution_at', 'is', null)
      .lte('next_execution_at', now);

    return NextResponse.json({
      message: 'Automation status check',
      due_count: dueAutomations?.length || 0,
      due_automations: dueAutomations || [],
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
