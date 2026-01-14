/**
 * Enhancement Agent
 * Proposes tables, bullets, image prompts, and content improvements
 */

import { LLMProvider, AgentResult } from './types';

export interface TableSuggestion {
  title: string;
  headers: string[];
  rows: string[][];
  insertAfterSection: string;
  reasoning: string;
}

export interface ImageSuggestion {
  altText: string;
  prompt: string;
  type: 'hero' | 'inline' | 'infographic' | 'diagram';
  insertAfterSection: string;
  reasoning: string;
}

export interface BulletListSuggestion {
  title?: string;
  items: string[];
  insertAfterSection: string;
  reasoning: string;
}

export interface ContentEnhancement {
  type: 'callout' | 'quote' | 'statistic' | 'example';
  content: string;
  insertAfterSection: string;
  reasoning: string;
}

export interface EnhancementResult {
  tables: TableSuggestion[];
  images: ImageSuggestion[];
  bulletLists: BulletListSuggestion[];
  contentEnhancements: ContentEnhancement[];
  overallScore: number;
  suggestions: string[];
}

export interface EnhancementAgentInput {
  fullDraftContent: string;
  topic: string;
  targetKeyword: string;
  sectionKeys: string[];
  wordCount: number;
}

/**
 * Run the Enhancement agent to propose improvements
 */
export async function runEnhancementAgent(
  provider: LLMProvider,
  input: EnhancementAgentInput
): Promise<AgentResult<EnhancementResult>> {
  try {
    const systemPrompt = `You are a Content Enhancement Specialist. Your role is to analyze blog content and suggest visual and structural improvements that increase engagement, readability, and SEO value.`;

    const userPrompt = `Analyze the following blog post and suggest enhancements:

TOPIC: ${input.topic}
TARGET KEYWORD: ${input.targetKeyword}
WORD COUNT: ${input.wordCount}
SECTION KEYS: ${input.sectionKeys.join(', ')}

CONTENT:
${input.fullDraftContent.substring(0, 6000)}

INSTRUCTIONS:
1. Identify opportunities for DATA TABLES that would help readers compare or understand information
2. Suggest IMAGE IDEAS with detailed prompts for AI image generation or stock photo searches
3. Find content that could be converted to BULLET LISTS for better scannability
4. Propose CONTENT ENHANCEMENTS like callouts, quotes, statistics highlights, or examples

Return a JSON object with this structure:
{
  "tables": [
    {
      "title": "Comparison table title",
      "headers": ["Column 1", "Column 2", "Column 3"],
      "rows": [["Data 1", "Data 2", "Data 3"], ["Data 4", "Data 5", "Data 6"]],
      "insertAfterSection": "section key where to insert",
      "reasoning": "why this table adds value"
    }
  ],
  "images": [
    {
      "altText": "Descriptive alt text for SEO",
      "prompt": "Detailed image generation prompt or stock photo search terms",
      "type": "hero" | "inline" | "infographic" | "diagram",
      "insertAfterSection": "section key",
      "reasoning": "why this image enhances the content"
    }
  ],
  "bulletLists": [
    {
      "title": "Optional list title",
      "items": ["Item 1", "Item 2", "Item 3"],
      "insertAfterSection": "section key",
      "reasoning": "why converting to bullets improves readability"
    }
  ],
  "contentEnhancements": [
    {
      "type": "callout" | "quote" | "statistic" | "example",
      "content": "The enhanced content",
      "insertAfterSection": "section key",
      "reasoning": "why this enhancement adds value"
    }
  ],
  "overallScore": 0-100,
  "suggestions": ["General improvement suggestion 1", "Suggestion 2"]
}

IMPORTANT: 
- Suggest at least 1 table if data comparison is possible
- Suggest at least 2-3 images including a hero image
- Be specific with image prompts for AI generation
- Only suggest enhancements that genuinely add value
- Return ONLY valid JSON`;

    const response = await provider.call({
      systemPrompt,
      userPrompt,
      temperature: 0.6,
      maxTokens: 3000
    });

    const result: EnhancementResult = JSON.parse(response);

    // Validate and provide defaults
    if (!result.tables) result.tables = [];
    if (!result.images) result.images = [];
    if (!result.bulletLists) result.bulletLists = [];
    if (!result.contentEnhancements) result.contentEnhancements = [];
    if (!result.suggestions) result.suggestions = [];
    if (typeof result.overallScore !== 'number') result.overallScore = 70;

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Enhancement agent failed'
    };
  }
}

/**
 * Apply table enhancements to content
 */
export function generateMarkdownTable(table: TableSuggestion): string {
  const headerRow = `| ${table.headers.join(' | ')} |`;
  const separator = `| ${table.headers.map(() => '---').join(' | ')} |`;
  const dataRows = table.rows.map(row => `| ${row.join(' | ')} |`).join('\n');
  
  return `\n### ${table.title}\n\n${headerRow}\n${separator}\n${dataRows}\n`;
}

/**
 * Generate image placeholder markdown
 */
export function generateImagePlaceholder(image: ImageSuggestion): string {
  return `\n![${image.altText}](IMAGE_PLACEHOLDER: ${image.prompt})\n`;
}

/**
 * Generate bullet list markdown
 */
export function generateBulletList(list: BulletListSuggestion): string {
  const title = list.title ? `\n**${list.title}**\n` : '\n';
  const items = list.items.map(item => `- ${item}`).join('\n');
  return `${title}${items}\n`;
}

/**
 * Generate callout/enhancement markdown
 */
export function generateEnhancement(enhancement: ContentEnhancement): string {
  switch (enhancement.type) {
    case 'callout':
      return `\n> 💡 **Key Insight:** ${enhancement.content}\n`;
    case 'quote':
      return `\n> "${enhancement.content}"\n`;
    case 'statistic':
      return `\n📊 **${enhancement.content}**\n`;
    case 'example':
      return `\n**Example:** ${enhancement.content}\n`;
    default:
      return `\n${enhancement.content}\n`;
  }
}
