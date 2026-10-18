/**
 * Email Campaign Generator
 * Generates email campaign content using AI
 */

import { openaiProvider } from './openai-provider';
import { LLMRequest } from '@/lib/agents/types';

export interface EmailCampaign {
    id: string;
    subject: string;
    preheader: string;
    content: string;
    htmlContent: string;
    trackingData: any;
    segments?: string[];
}

export async function generateEmailCampaign(requirements: {
    subject?: string;
    audience?: string;
    goal?: string;
    tone?: string;
    topic?: string;
}): Promise<EmailCampaign> {
    const systemPrompt = `You are an expert email marketing copywriter. Create compelling email campaigns that drive engagement and conversions.`;
    
    const userPrompt = `Create an email campaign with the following requirements:
${requirements.subject ? `Subject: ${requirements.subject}` : ''}
${requirements.audience ? `Target Audience: ${requirements.audience}` : ''}
${requirements.goal ? `Campaign Goal: ${requirements.goal}` : ''}
${requirements.tone ? `Tone: ${requirements.tone}` : ''}
${requirements.topic ? `Topic: ${requirements.topic}` : ''}

Generate:
1. A compelling subject line
2. A preheader text
3. Email body content (engaging, clear call-to-action)
4. HTML version of the email
5. Tracking data structure for campaign metrics`;

    const response = await openaiProvider.call({
        systemPrompt,
        userPrompt,
        temperature: 0.8,
        maxTokens: 2000
    });

    // Parse response and structure as email campaign
    // In production, this would parse structured JSON from the AI
    const id = `email-${Date.now()}`;
    const lines = response.split('\n');
    
    return {
        id,
        subject: requirements.subject || extractField(lines, 'Subject:') || 'New Email Campaign',
        preheader: extractField(lines, 'Preheader:') || 'Check out our latest update',
        content: response,
        htmlContent: convertToHTML(response),
        trackingData: {
            campaignId: id,
            subject: requirements.subject,
            sentDate: new Date().toISOString(),
            segments: requirements.audience ? [requirements.audience] : []
        }
    };
}

function extractField(lines: string[], prefix: string): string | undefined {
    const line = lines.find(l => l.startsWith(prefix));
    return line ? line.replace(prefix, '').trim() : undefined;
}

function convertToHTML(text: string): string {
    // Simple conversion - in production, use a proper markdown to HTML converter
    return `<html><body><p>${text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p></body></html>`;
}



