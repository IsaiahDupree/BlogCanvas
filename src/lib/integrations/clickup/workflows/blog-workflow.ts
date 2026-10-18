/**
 * Blog Creation Workflow
 * Triggered by ClickUp tags: automation:blog, automation:blog-post
 */

import { ClickUpWebhookData } from '../webhook-processor';
import { AutomationResult } from '../automation-trigger';
import { generateBlogPost } from '@/lib/ai/content-generator';
import { saveToGoogleDrive } from '@/lib/integrations/google-drive/drive-client';
import { updateClickUpTask } from '@/lib/integrations/clickup/clickup-client';
import { supabaseAdmin } from '@/lib/supabase';

export async function createBlogWorkflow(
    data: ClickUpWebhookData
): Promise<AutomationResult> {
    try {
        // Extract blog requirements from task
        const requirements = extractBlogRequirements(data);
        
        // Generate blog content
        const blogContent = await generateBlogPost(
            requirements.title || data.taskName,
            requirements.targetKeyword || 'content marketing',
            {
                wordCount: requirements.wordCount || 1500,
                style: requirements.tone || 'professional'
            }
        );
        
        // Format content for Google Drive
        const formattedContent = {
            title: blogContent.title || data.taskName,
            content: blogContent.content || ''
        };
        
        // Save to Google Drive
        const driveResult = await saveToGoogleDrive({
            name: `${data.taskName} - Blog Post`,
            type: 'document',
            content: formattedContent,
            folderId: process.env.GOOGLE_DRIVE_BLOGS_FOLDER_ID
        });
        
        // Update ClickUp task with results
        await updateClickUpTask(data.taskId, {
            description: `Blog created successfully!\n\nGoogle Drive: ${driveResult.url}\n\nTitle: ${blogContent.title}\nWord Count: ${blogContent.wordCount || 'N/A'}`
        });
        
        // Save to database
        await supabaseAdmin
            .from('generated_content')
            .insert({
                source: 'clickup',
                source_id: data.taskId,
                content_type: 'blog',
                title: blogContent.title || data.taskName,
                content: blogContent.content || '',
                metadata: {
                    drive_url: driveResult.url,
                    drive_file_id: driveResult.fileId,
                    requirements,
                    wordCount: blogContent.wordCount,
                    qualityScore: blogContent.qualityScore
                },
                created_at: new Date().toISOString()
            });
        
        return {
            success: true,
            workflowType: 'blog-creation',
            output: {
                title: blogContent.title || data.taskName,
                driveUrl: driveResult.url,
                wordCount: blogContent.wordCount
            }
        };
        
    } catch (error: any) {
        console.error('Error in blog workflow:', error);
        return {
            success: false,
            workflowType: 'blog-creation',
            error: error.message || 'Failed to create blog'
        };
    }
}

/**
 * Extract blog requirements from ClickUp task
 */
function extractBlogRequirements(data: ClickUpWebhookData): {
    title?: string;
    topic?: string;
    targetKeyword?: string;
    wordCount?: number;
    tone?: string;
    audience?: string;
} {
    const requirements: any = {};
    
    // Extract from task name
    requirements.title = data.taskName;
    
    // Extract from description
    if (data.description) {
        // Try to parse structured requirements from description
        const keywordMatch = data.description.match(/keyword[:\s]+([^\n]+)/i);
        if (keywordMatch) {
            requirements.targetKeyword = keywordMatch[1].trim();
        }
        
        const wordCountMatch = data.description.match(/word[:\s]+count[:\s]+(\d+)/i);
        if (wordCountMatch) {
            requirements.wordCount = parseInt(wordCountMatch[1]);
        }
        
        const toneMatch = data.description.match(/tone[:\s]+([^\n]+)/i);
        if (toneMatch) {
            requirements.tone = toneMatch[1].trim();
        }
    }
    
    // Extract from custom fields
    if (data.customFields) {
        requirements.targetKeyword = requirements.targetKeyword || data.customFields['Target Keyword'];
        requirements.wordCount = requirements.wordCount || data.customFields['Word Count'];
        requirements.tone = requirements.tone || data.customFields['Tone'];
        requirements.audience = data.customFields['Audience'];
    }
    
    return requirements;
}

