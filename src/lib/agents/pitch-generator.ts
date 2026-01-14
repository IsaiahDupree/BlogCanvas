/**
 * Pitch Generator Agent
 * Generates client pitch decks and proposals based on SEO analysis
 * PRD: Forecast & Package Proposal - generates pitch deck and client-facing summary
 */

import { LLMProvider, AgentResult } from './types';
import { createOpenAIProvider } from './openai-provider';
import { TopicCluster, SEOForecast } from './topic-cluster';

export interface PitchProposal {
  emailSubject: string;
  emailBody: string;
  executiveSummary: string;
  currentState: {
    seoScore: number;
    topicCoverage: string;
    strengths: string[];
    weaknesses: string[];
  };
  proposedPlan: {
    totalPosts: number;
    timelineMonths: number;
    monthlyCadence: number;
    targetSeoScore: number;
    topicClusters: string[];
  };
  expectedOutcomes: {
    seoScoreImprovement: string;
    trafficProjection: string;
    keywordRankings: string;
    businessImpact: string;
  };
  investmentSummary: {
    packageName: string;
    postsIncluded: number;
    priceRange?: string;
    deliverables: string[];
  };
  nextSteps: string[];
  callToAction: string;
}

export interface PitchInput {
  clientName: string;
  websiteUrl: string;
  industry: string;
  currentSeoScore: number;
  targetSeoScore: number;
  clusters: TopicCluster[];
  forecast?: SEOForecast;
  customPackageOptions?: {
    postsPerMonth: number;
    timelineMonths: number;
    priceRange?: string;
  };
  csmName?: string;
  companyName?: string;
}

/**
 * Generate a client pitch proposal
 */
export async function runPitchGenerator(
  input: PitchInput,
  provider?: LLMProvider
): Promise<AgentResult<PitchProposal>> {
  const llm = provider || createOpenAIProvider();

  try {
    const totalArticles = input.clusters.reduce(
      (sum, c) => sum + c.suggestedArticles.length, 0
    );
    const totalTrafficPotential = input.clusters.reduce(
      (sum, c) => sum + c.estimatedTrafficPotential, 0
    );

    const systemPrompt = `You are an expert SEO sales consultant. Generate compelling, professional pitch proposals that clearly communicate value and ROI to potential clients.`;

    const userPrompt = `Generate a comprehensive pitch proposal for this client:

CLIENT INFORMATION:
- Name: ${input.clientName}
- Website: ${input.websiteUrl}
- Industry: ${input.industry}
- Current SEO Score: ${input.currentSeoScore}/100
- Target SEO Score: ${input.targetSeoScore}/100

TOPIC CLUSTERS IDENTIFIED:
${input.clusters.map(c => `- ${c.name}: ${c.suggestedArticles.length} articles, ${c.estimatedTrafficPotential} traffic potential`).join('\n')}

ANALYSIS SUMMARY:
- Total Articles Recommended: ${totalArticles}
- Total Traffic Potential: ${totalTrafficPotential} monthly visits
- Content Gaps: ${input.clusters.filter(c => !c.currentlyCovered).length} uncovered clusters

${input.forecast ? `
SEO FORECAST:
- Projected Score: ${input.forecast.projectedScore}
- Timeline: ${input.forecast.timelineMonths} months
- Posts Required: ${input.forecast.postsRequired}
- Confidence: ${input.forecast.confidenceLevel}
` : ''}

${input.customPackageOptions ? `
PROPOSED PACKAGE:
- Posts/Month: ${input.customPackageOptions.postsPerMonth}
- Timeline: ${input.customPackageOptions.timelineMonths} months
- Price Range: ${input.customPackageOptions.priceRange || 'TBD'}
` : ''}

CSM: ${input.csmName || 'Your Account Manager'}
COMPANY: ${input.companyName || 'BlogCanvas'}

Generate a complete pitch proposal with:
1. Professional email subject line and body
2. Executive summary
3. Current state analysis
4. Proposed plan details
5. Expected outcomes with specific projections
6. Investment summary
7. Clear next steps and CTA

Return a JSON object:
{
  "emailSubject": "compelling subject line",
  "emailBody": "full professional email in plain text",
  "executiveSummary": "2-3 paragraph summary",
  "currentState": {
    "seoScore": number,
    "topicCoverage": "description of current coverage",
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"]
  },
  "proposedPlan": {
    "totalPosts": number,
    "timelineMonths": number,
    "monthlyCadence": number,
    "targetSeoScore": number,
    "topicClusters": ["cluster 1", "cluster 2"]
  },
  "expectedOutcomes": {
    "seoScoreImprovement": "62 → 78 (26% increase)",
    "trafficProjection": "15,000 additional monthly visits",
    "keywordRankings": "50+ keywords in top 10",
    "businessImpact": "estimated lead increase"
  },
  "investmentSummary": {
    "packageName": "Growth Package",
    "postsIncluded": number,
    "priceRange": "optional",
    "deliverables": ["deliverable 1", "deliverable 2"]
  },
  "nextSteps": ["step 1", "step 2", "step 3"],
  "callToAction": "clear CTA"
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 3000
    });

    const result: PitchProposal = JSON.parse(response);

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Pitch generation failed'
    };
  }
}

/**
 * Generate monthly report content
 */
export interface MonthlyReport {
  summary: string;
  seoProgress: {
    previousScore: number;
    currentScore: number;
    change: number;
  };
  contentProduced: {
    postsPublished: number;
    totalWordCount: number;
    topPerformers: string[];
  };
  trafficMetrics: {
    totalSessions: number;
    organicGrowth: string;
    topKeywords: string[];
  };
  recommendations: string[];
  nextMonthPlan: string[];
}

export async function generateMonthlyReport(
  clientName: string,
  previousScore: number,
  currentScore: number,
  postsPublished: number,
  topPosts: string[],
  provider?: LLMProvider
): Promise<AgentResult<MonthlyReport>> {
  const llm = provider || createOpenAIProvider();

  try {
    const systemPrompt = `You are an SEO reporting specialist. Generate clear, professional monthly reports that communicate value and progress.`;

    const userPrompt = `Generate a monthly SEO report:

CLIENT: ${clientName}
PERIOD: Last 30 days

PROGRESS:
- Previous SEO Score: ${previousScore}
- Current SEO Score: ${currentScore}
- Posts Published: ${postsPublished}
- Top Performers: ${topPosts.join(', ')}

Generate a report JSON:
{
  "summary": "executive summary paragraph",
  "seoProgress": {
    "previousScore": ${previousScore},
    "currentScore": ${currentScore},
    "change": ${currentScore - previousScore}
  },
  "contentProduced": {
    "postsPublished": ${postsPublished},
    "totalWordCount": estimated,
    "topPerformers": ["post 1", "post 2"]
  },
  "trafficMetrics": {
    "totalSessions": estimated,
    "organicGrowth": "percentage",
    "topKeywords": ["keyword 1", "keyword 2"]
  },
  "recommendations": ["rec 1", "rec 2"],
  "nextMonthPlan": ["plan 1", "plan 2"]
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.5,
      maxTokens: 1500
    });

    const result: MonthlyReport = JSON.parse(response);

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
