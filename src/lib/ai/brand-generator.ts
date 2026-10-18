/**
 * Brand Messaging Guide Generator
 * Generates brand messaging guides using AI
 */

import { openaiProvider } from './openai-provider';
import { LLMRequest } from '@/lib/agents/types';

export interface BrandGuide {
    id: string;
    title: string;
    content: string;
    sections: {
        mission: string;
        values: string[];
        voice: string;
        tone: string;
        messaging: string;
        targetAudience: string;
    };
}

export async function generateBrandGuide(requirements: {
    brandName: string;
    industry?: string;
    targetAudience?: string;
    values?: string;
    description?: string;
}): Promise<BrandGuide> {
    const systemPrompt = `You are an expert brand strategist. Create comprehensive brand messaging guides that define a brand's voice, values, and messaging framework.`;
    
    const userPrompt = `Create a brand messaging guide for:
Brand Name: ${requirements.brandName}
${requirements.industry ? `Industry: ${requirements.industry}` : ''}
${requirements.targetAudience ? `Target Audience: ${requirements.targetAudience}` : ''}
${requirements.values ? `Brand Values: ${requirements.values}` : ''}
${requirements.description ? `Description: ${requirements.description}` : ''}

Generate a comprehensive guide including:
1. Brand Mission Statement
2. Core Brand Values (3-5 values)
3. Brand Voice Description
4. Tone Guidelines
5. Key Messaging Pillars
6. Target Audience Persona`;

    const response = await openaiProvider.call({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        maxTokens: 2500
    });

    // Parse response and structure as brand guide
    const id = `brand-${Date.now()}`;
    
    return {
        id,
        title: `${requirements.brandName} Brand Messaging Guide`,
        content: response,
        sections: {
            mission: extractSection(response, 'Mission') || 'To be defined',
            values: extractList(response, 'Values') || ['Innovation', 'Quality', 'Customer Focus'],
            voice: extractSection(response, 'Voice') || 'Professional and approachable',
            tone: extractSection(response, 'Tone') || 'Confident and friendly',
            messaging: extractSection(response, 'Messaging') || response,
            targetAudience: requirements.targetAudience || 'General audience'
        }
    };
}

function extractSection(text: string, section: string): string | undefined {
    const regex = new RegExp(`${section}[:\n]+([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z][^:]+:|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : undefined;
}

function extractList(text: string, section: string): string[] {
    const sectionText = extractSection(text, section);
    if (!sectionText) return [];
    
    // Extract bullet points or numbered items
    const items = sectionText
        .split(/\n/)
        .map(line => line.replace(/^[-•*]\s*|\d+\.\s*/, '').trim())
        .filter(item => item.length > 0);
    
    return items.length > 0 ? items : [sectionText];
}



