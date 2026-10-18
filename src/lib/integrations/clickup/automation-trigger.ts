/**
 * ClickUp Automation Trigger
 * Triggers content creation workflows based on ClickUp tags
 */

import { ClickUpWebhookData } from './webhook-processor';
import { extractAutomationTags } from './webhook-processor';
import { createBlogWorkflow } from './workflows/blog-workflow';
import { createEmailCampaignWorkflow } from './workflows/email-campaign-workflow';
import { createBrandGuideWorkflow } from './workflows/brand-guide-workflow';
import { supabaseAdmin } from '@/lib/supabase';

export interface AutomationResult {
    success: boolean;
    workflowType: string;
    output?: any;
    error?: string;
}

/**
 * Automation tag mappings
 */
const AUTOMATION_MAP: Record<string, {
    name: string;
    handler: (data: ClickUpWebhookData) => Promise<AutomationResult>;
}> = {
    'blog': {
        name: 'Blog Creation',
        handler: createBlogWorkflow
    },
    'blog-post': {
        name: 'Blog Post',
        handler: createBlogWorkflow
    },
    'email-campaign': {
        name: 'Email Campaign',
        handler: createEmailCampaignWorkflow
    },
    'email': {
        name: 'Email Campaign',
        handler: createEmailCampaignWorkflow
    },
    'brand-guide': {
        name: 'Brand Messaging Guide',
        handler: createBrandGuideWorkflow
    },
    'brand-messaging': {
        name: 'Brand Messaging Guide',
        handler: createBrandGuideWorkflow
    },
    'content-batch': {
        name: 'Content Batch',
        handler: createBlogWorkflow // Can be extended for batch processing
    }
};

/**
 * Trigger automation based on tag
 */
export async function triggerAutomation(
    tag: string,
    webhookData: ClickUpWebhookData
): Promise<AutomationResult | null> {
    // Extract automation type from tag
    const automationTags = extractAutomationTags([tag]);
    
    if (automationTags.length === 0) {
        // Check if tag matches any automation directly
        const normalizedTag = tag.toLowerCase().trim();
        const automation = AUTOMATION_MAP[normalizedTag];
        
        if (!automation) {
            return null; // No automation for this tag
        }
        
        return await executeAutomation(automation, webhookData);
    }
    
    // Process each automation tag
    const results: AutomationResult[] = [];
    for (const automationTag of automationTags) {
        const automation = AUTOMATION_MAP[automationTag];
        
        if (automation) {
            const result = await executeAutomation(automation, webhookData);
            results.push(result);
        }
    }
    
    return results.length > 0 ? results[0] : null;
}

/**
 * Execute automation workflow
 */
async function executeAutomation(
    automation: { name: string; handler: (data: ClickUpWebhookData) => Promise<AutomationResult> },
    webhookData: ClickUpWebhookData
): Promise<AutomationResult> {
    try {
        // Log automation start
        const { data: run } = await supabaseAdmin
            .from('automation_runs')
            .insert({
                trigger_source: 'clickup',
                trigger_type: 'tag',
                trigger_value: automation.name,
                task_id: webhookData.taskId,
                status: 'running',
                started_at: new Date().toISOString()
            })
            .select()
            .single();
        
        // Execute workflow
        const result = await automation.handler(webhookData);
        
        // Update automation run
        await supabaseAdmin
            .from('automation_runs')
            .update({
                status: result.success ? 'completed' : 'failed',
                completed_at: new Date().toISOString(),
                output: result.output,
                error: result.error
            })
            .eq('id', run?.id);
        
        return result;
        
    } catch (error: any) {
        console.error(`Error executing automation ${automation.name}:`, error);
        
        return {
            success: false,
            workflowType: automation.name,
            error: error.message || 'Unknown error'
        };
    }
}

/**
 * Get available automation types
 */
export function getAvailableAutomations(): string[] {
    return Object.keys(AUTOMATION_MAP);
}



