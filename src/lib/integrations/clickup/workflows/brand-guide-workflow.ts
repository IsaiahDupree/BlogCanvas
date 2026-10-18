/**
 * Brand Messaging Guide Workflow
 * Triggered by ClickUp tags: automation:brand-guide, automation:brand-messaging
 */

import { ClickUpWebhookData } from '../webhook-processor';
import { AutomationResult } from '../automation-trigger';
import { generateBrandGuide } from '@/lib/ai/brand-generator';
import { saveToGoogleDrive } from '@/lib/integrations/google-drive/drive-client';
import { updateClickUpTask } from '@/lib/integrations/clickup/clickup-client';
import { supabaseAdmin } from '@/lib/supabase';

export async function createBrandGuideWorkflow(
    data: ClickUpWebhookData
): Promise<AutomationResult> {
    try {
        // Extract brand requirements
        const requirements = extractBrandRequirements(data);
        
        // Generate brand guide
        const brandGuide = await generateBrandGuide(requirements);
        
        // Save to Google Drive
        const driveResult = await saveToGoogleDrive({
            name: `${data.taskName} - Brand Messaging Guide`,
            type: 'document',
            content: brandGuide,
            folderId: process.env.GOOGLE_DRIVE_BRAND_FOLDER_ID
        });
        
        // Update ClickUp task
        await updateClickUpTask(data.taskId, {
            description: `Brand messaging guide created!\n\nGoogle Drive: ${driveResult.url}`
        });
        
        // Save to database
        await supabaseAdmin
            .from('generated_content')
            .insert({
                source: 'clickup',
                source_id: data.taskId,
                content_type: 'brand-guide',
                title: brandGuide.title,
                content: brandGuide.content,
                metadata: {
                    drive_url: driveResult.url,
                    requirements
                },
                created_at: new Date().toISOString()
            });
        
        return {
            success: true,
            workflowType: 'brand-guide',
            output: {
                guideId: brandGuide.id,
                title: brandGuide.title,
                driveUrl: driveResult.url
            }
        };
        
    } catch (error: any) {
        console.error('Error in brand guide workflow:', error);
        return {
            success: false,
            workflowType: 'brand-guide',
            error: error.message || 'Failed to create brand guide'
        };
    }
}

function extractBrandRequirements(data: ClickUpWebhookData): any {
    return {
        brandName: data.taskName,
        industry: data.customFields?.['Industry'],
        targetAudience: data.customFields?.['Target Audience'],
        values: data.customFields?.['Brand Values'],
        description: data.description
    };
}



