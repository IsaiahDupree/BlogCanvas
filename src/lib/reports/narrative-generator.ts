/**
 * Report Narrative Generator
 * Generates AI-powered narrative summaries for client reports and calls
 * PRD Story: Report narrative summary for client calls
 */

import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export interface NarrativeInput {
  clientName: string;
  websiteUrl: string;
  periodStart: string;
  periodEnd: string;
  summary: {
    totalPosts: number;
    totalImpressions: number;
    totalClicks: number;
    avgCTR: number;
    avgPosition: number;
    avgSEO: number;
  };
  baseline?: {
    score: number;
    date: string;
    pagesIndexed: number;
  };
  current?: {
    score: number;
    date: string;
    pagesIndexed: number;
  };
  comparison?: {
    scoreChange: number;
    scorePercentChange: string;
    pagesChange: number;
  };
  topicCoverageDelta?: {
    totalTopics: number;
    coveredTopics: number;
    uncoveredTopics: number;
    coveragePercentage: number;
    newPostsThisPeriod: number;
  };
  topPosts?: any[];
  underperformers?: any[];
  trends?: {
    impressions: { change: number; percentChange: number };
    clicks: { change: number; percentChange: number };
  };
  batch?: {
    name: string;
    goalScoreFrom: number;
    goalScoreTo: number;
  };
}

export interface NarrativeSummary {
  executiveSummary: string;
  keyWins: string[];
  concernsAndOpportunities: string[];
  talkingPoints: string[];
  nextSteps: string[];
  callToAction: string;
}

/**
 * Generate an AI narrative summary for a client report
 */
export async function generateReportNarrative(
  input: NarrativeInput
): Promise<NarrativeSummary> {
  const client = getOpenAIClient();

  try {
    const systemPrompt = `You are an expert SEO strategist and client success manager. Generate compelling, professional narrative summaries for client reports that:
- Highlight achievements and wins
- Explain metrics in business terms (not just technical SEO)
- Identify opportunities for improvement
- Provide clear, actionable talking points for client calls
- Maintain a positive, consultative tone
- Focus on ROI and business impact

Your summaries should be concise, engaging, and ready for use in client calls or emails.`;

    const userPrompt = buildNarrativePrompt(input);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const parsed = JSON.parse(content);

    return {
      executiveSummary: parsed.executiveSummary || '',
      keyWins: parsed.keyWins || [],
      concernsAndOpportunities: parsed.concernsAndOpportunities || [],
      talkingPoints: parsed.talkingPoints || [],
      nextSteps: parsed.nextSteps || [],
      callToAction: parsed.callToAction || ''
    };

  } catch (error: any) {
    console.error('Error generating narrative:', error);

    // Return fallback narrative
    return generateFallbackNarrative(input);
  }
}

/**
 * Build the prompt for narrative generation
 */
function buildNarrativePrompt(input: NarrativeInput): string {
  const periodStart = new Date(input.periodStart).toLocaleDateString();
  const periodEnd = new Date(input.periodEnd).toLocaleDateString();

  let prompt = `Generate a narrative summary for this SEO content performance report:

CLIENT: ${input.clientName}
WEBSITE: ${input.websiteUrl}
REPORTING PERIOD: ${periodStart} - ${periodEnd}

PERFORMANCE METRICS:
- Total Posts Published: ${input.summary.totalPosts}
- Total Impressions: ${input.summary.totalImpressions.toLocaleString()}
- Total Clicks: ${input.summary.totalClicks.toLocaleString()}
- Average CTR: ${input.summary.avgCTR}%
- Average Position: ${input.summary.avgPosition}
- Average SEO Score: ${input.summary.avgSEO}/100
`;

  if (input.comparison) {
    prompt += `
SEO SCORE PROGRESSION:
- Baseline Score: ${input.baseline?.score}/100 (${new Date(input.baseline?.date || '').toLocaleDateString()})
- Current Score: ${input.current?.score}/100 (${new Date(input.current?.date || '').toLocaleDateString()})
- Change: ${input.comparison.scoreChange >= 0 ? '+' : ''}${input.comparison.scoreChange} points (${input.comparison.scorePercentChange}%)
- Pages Indexed: ${input.baseline?.pagesIndexed} → ${input.current?.pagesIndexed} (${input.comparison.pagesChange >= 0 ? '+' : ''}${input.comparison.pagesChange})
`;
  }

  if (input.batch) {
    prompt += `
CONTENT BATCH:
- Package: ${input.batch.name}
- Goal: Improve SEO score from ${input.batch.goalScoreFrom} to ${input.batch.goalScoreTo}
`;
  }

  if (input.topicCoverageDelta) {
    prompt += `
TOPIC COVERAGE:
- Total Topics: ${input.topicCoverageDelta.totalTopics}
- Covered: ${input.topicCoverageDelta.coveredTopics} (${input.topicCoverageDelta.coveragePercentage}%)
- New Posts This Period: ${input.topicCoverageDelta.newPostsThisPeriod}
`;
  }

  if (input.trends) {
    prompt += `
TRENDS:
- Impressions: ${input.trends.impressions.change >= 0 ? '+' : ''}${input.trends.impressions.change.toLocaleString()} (${input.trends.impressions.percentChange >= 0 ? '+' : ''}${input.trends.impressions.percentChange.toFixed(1)}%)
- Clicks: ${input.trends.clicks.change >= 0 ? '+' : ''}${input.trends.clicks.change.toLocaleString()} (${input.trends.clicks.percentChange >= 0 ? '+' : ''}${input.trends.clicks.percentChange.toFixed(1)}%)
`;
  }

  if (input.topPosts && input.topPosts.length > 0) {
    prompt += `
TOP PERFORMING POSTS:
${input.topPosts.slice(0, 3).map((p: any, i: number) =>
  `${i + 1}. ${p.target_keyword || 'Untitled'} - ${p.metrics.clicks.toLocaleString()} clicks`
).join('\n')}
`;
  }

  if (input.underperformers && input.underperformers.length > 0) {
    prompt += `
UNDERPERFORMERS IDENTIFIED:
- ${input.underperformers.length} posts need optimization
- Common issues: ${input.underperformers[0]?.recommendations?.[0] || 'CTR and position optimization needed'}
`;
  }

  prompt += `

Generate a JSON response with this structure:
{
  "executiveSummary": "2-3 sentence overview of performance this period",
  "keyWins": ["Win 1", "Win 2", "Win 3"],
  "concernsAndOpportunities": ["Opportunity 1", "Opportunity 2"],
  "talkingPoints": ["Talking point 1 for client call", "Talking point 2", "Talking point 3"],
  "nextSteps": ["Action 1", "Action 2", "Action 3"],
  "callToAction": "Clear next step or question for client"
}

Focus on:
- Business impact and ROI
- Positive framing of opportunities
- Specific, actionable recommendations
- Clear communication of progress toward goals`;

  return prompt;
}

/**
 * Generate a fallback narrative when AI is unavailable
 */
function generateFallbackNarrative(input: NarrativeInput): NarrativeSummary {
  const keyWins: string[] = [];
  const concernsAndOpportunities: string[] = [];
  const talkingPoints: string[] = [];
  const nextSteps: string[] = [];

  // Analyze data for wins
  if (input.comparison && input.comparison.scoreChange > 0) {
    keyWins.push(`SEO score improved by ${input.comparison.scoreChange} points (${input.comparison.scorePercentChange}% increase)`);
  }

  if (input.trends && input.trends.clicks.change > 0) {
    keyWins.push(`Organic traffic increased by ${input.trends.clicks.change.toLocaleString()} clicks (${input.trends.clicks.percentChange.toFixed(1)}%)`);
  }

  if (input.summary.totalPosts > 0) {
    keyWins.push(`Published ${input.summary.totalPosts} new posts this period`);
  }

  // Identify opportunities
  if (input.summary.avgPosition > 20) {
    concernsAndOpportunities.push('Average position is outside page 1 - opportunity to improve rankings with content optimization and backlinks');
  }

  if (input.summary.avgCTR < 2) {
    concernsAndOpportunities.push('CTR is below 2% - optimize titles and meta descriptions for better click-through rates');
  }

  if (input.underperformers && input.underperformers.length > 0) {
    concernsAndOpportunities.push(`${input.underperformers.length} posts identified as underperformers - opportunity for quick wins through optimization`);
  }

  // Generate talking points
  talkingPoints.push(`We published ${input.summary.totalPosts} posts during this period`);
  talkingPoints.push(`Content generated ${input.summary.totalImpressions.toLocaleString()} impressions and ${input.summary.totalClicks.toLocaleString()} clicks`);

  if (input.comparison) {
    talkingPoints.push(`SEO score ${input.comparison.scoreChange >= 0 ? 'improved' : 'changed'} by ${Math.abs(input.comparison.scoreChange)} points`);
  }

  if (input.topicCoverageDelta) {
    talkingPoints.push(`Topic coverage now at ${input.topicCoverageDelta.coveragePercentage}% (${input.topicCoverageDelta.coveredTopics}/${input.topicCoverageDelta.totalTopics} topics)`);
  }

  // Generate next steps
  nextSteps.push('Continue publishing high-quality content consistently');
  nextSteps.push('Optimize underperforming posts identified in this report');
  nextSteps.push('Focus on covering remaining high-value topic clusters');

  const executiveSummary = `During ${new Date(input.periodStart).toLocaleDateString()} - ${new Date(input.periodEnd).toLocaleDateString()}, we published ${input.summary.totalPosts} posts that generated ${input.summary.totalImpressions.toLocaleString()} impressions and ${input.summary.totalClicks.toLocaleString()} clicks. ${input.comparison && input.comparison.scoreChange > 0 ? `SEO score improved by ${input.comparison.scoreChange} points.` : 'We continue to build authority and visibility.'}`;

  return {
    executiveSummary,
    keyWins,
    concernsAndOpportunities,
    talkingPoints,
    nextSteps,
    callToAction: 'What specific topics or keywords would you like us to prioritize in the next batch?'
  };
}
