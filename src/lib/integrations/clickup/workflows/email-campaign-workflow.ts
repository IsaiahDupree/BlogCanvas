/**
 * Email Campaign Workflow
 * Triggered by ClickUp tags: automation:email-campaign, automation:email
 */

import { ClickUpWebhookData } from '../webhook-processor';
import { AutomationResult } from '../automation-trigger';
import { generateEmailCampaign } from '@/lib/ai/email-generator';
import { saveToGoogleDrive } from '@/lib/integrations/google-drive/drive-client';
import { updateClickUpTask } from '@/lib/integrations/clickup/clickup-client';
import { supabaseAdmin } from '@/lib/supabase';

export async function createEmailCampaignWorkflow(
    data: ClickUpWebhookData
): Promise<AutomationResult> {
    try {
        // Extract email campaign requirements
        const requirements = extractEmailRequirements(data);
        
        // Generate email campaign
        const campaign = await generateEmailCampaign(requirements);
        
        // Save to Google Drive (as Google Doc)
        const driveResult = await saveToGoogleDrive({
            name: `${data.taskName} - Email Campaign`,
            type: 'document',
            content: campaign,
            folderId: process.env.GOOGLE_DRIVE_EMAILS_FOLDER_ID
        });
        
        // Also save as Google Sheet for campaign tracking
        const sheetResult = await saveToGoogleDrive({
            name: `${data.taskName} - Campaign Tracking`,
            type: 'spreadsheet',
            content: campaign.trackingData,
            folderId: process.env.GOOGLE_DRIVE_EMAILS_FOLDER_ID
        });
        
        // Update ClickUp task
        await updateClickUpTask(data.taskId, {
            description: `Email campaign created!\n\nCampaign Doc: ${driveResult.url}\nTracking Sheet: ${sheetResult.url}`
        });
        
        // Save to database
        await supabaseAdmin
            .from('generated_content')
            .insert({
                source: 'clickup',
                source_id: data.taskId,
                content_type: 'email-campaign',
                title: campaign.subject,
                content: campaign.content,
                metadata: {
                    drive_url: driveResult.url,
                    sheet_url: sheetResult.url,
                    requirements
                },
                created_at: new Date().toISOString()
            });
        
        return {
            success: true,
            workflowType: 'email-campaign',
            output: {
                campaignId: campaign.id,
                subject: campaign.subject,
                driveUrl: driveResult.url,
                sheetUrl: sheetResult.url
            }
        };
        
    } catch (error: any) {
        console.error('Error in email campaign workflow:', error);
        return {
            success: false,
            workflowType: 'email-campaign',
            error: error.message || 'Failed to create email campaign'
        };
    }
}

function extractEmailRequirements(data: ClickUpWebhookData): any {
    // Similar to blog requirements extraction
    return {
        subject: data.taskName,
        audience: data.customFields?.['Audience'],
        goal: data.customFields?.['Campaign Goal'],
        tone: data.customFields?.['Tone']
    };
}



