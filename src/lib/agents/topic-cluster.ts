/**
 * Topic Cluster Agent
 * Generates SEO topic clusters based on website analysis and niche
 * PRD: Gap & Opportunity Analysis - builds Topic Map with clusters, pillar topics, long-tail ideas
 */

import { LLMProvider, AgentResult } from './types';
import { createOpenAIProvider } from './openai-provider';

export interface TopicCluster {
  name: string;
  pillarTopic: string;
  primaryKeyword: string;
  searchIntent: 'informational' | 'transactional' | 'navigational' | 'commercial';
  estimatedMonthlySearches: number;
  difficulty: 'low' | 'medium' | 'high';
  currentlyCovered: boolean;
  suggestedArticles: SuggestedArticle[];
  relatedKeywords: string[];
  estimatedTrafficPotential: number;
}

export interface SuggestedArticle {
  title: string;
  targetKeyword: string;
  searchIntent: string;
  wordCountRecommendation: number;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number;
}

export interface TopicClusterResult {
  clusters: TopicCluster[];
  totalArticlesNeeded: number;
  estimatedTrafficGain: number;
  prioritizedTopics: SuggestedArticle[];
  gaps: string[];
  recommendations: string[];
}

export interface TopicClusterInput {
  websiteUrl?: string;
  industry: string;
  niche: string;
  currentTopics?: string[];
  targetAudience: string;
  competitorUrls?: string[];
  currentSeoScore?: number;
  targetSeoScore?: number;
  businessGoals?: string[];
}

/**
 * Generate topic clusters for a website/niche
 */
export async function runTopicClusterAgent(
  input: TopicClusterInput,
  provider?: LLMProvider
): Promise<AgentResult<TopicClusterResult>> {
  const llm = provider || createOpenAIProvider();

  try {
    const systemPrompt = `You are an expert SEO strategist and content planner. Your role is to analyze a business niche and generate comprehensive topic clusters that will improve organic search visibility and traffic.`;

    const userPrompt = `Generate a comprehensive topic cluster strategy for this business:

BUSINESS CONTEXT:
- Website: ${input.websiteUrl || 'New website'}
- Industry: ${input.industry}
- Niche: ${input.niche}
- Target Audience: ${input.targetAudience}
- Current SEO Score: ${input.currentSeoScore || 'Unknown'}
- Target SEO Score: ${input.targetSeoScore || '80+'}

CURRENT TOPIC COVERAGE:
${input.currentTopics?.length ? input.currentTopics.map(t => `- ${t}`).join('\n') : 'No existing content'}

COMPETITORS TO ANALYZE:
${input.competitorUrls?.length ? input.competitorUrls.join('\n') : 'None specified'}

BUSINESS GOALS:
${input.businessGoals?.length ? input.businessGoals.map(g => `- ${g}`).join('\n') : 'Increase organic traffic and leads'}

INSTRUCTIONS:
1. Identify 5-8 topic clusters relevant to this niche
2. For each cluster, suggest 3-5 specific article ideas
3. Prioritize topics by traffic potential and business impact
4. Identify content gaps compared to typical competitor coverage
5. Provide actionable recommendations

Return a JSON object with this structure:
{
  "clusters": [
    {
      "name": "Cluster name",
      "pillarTopic": "Main pillar topic for this cluster",
      "primaryKeyword": "Main keyword to target",
      "searchIntent": "informational" | "transactional" | "navigational" | "commercial",
      "estimatedMonthlySearches": 5000,
      "difficulty": "low" | "medium" | "high",
      "currentlyCovered": false,
      "suggestedArticles": [
        {
          "title": "Article title with keyword",
          "targetKeyword": "long-tail keyword",
          "searchIntent": "informational",
          "wordCountRecommendation": 1500,
          "priority": "high" | "medium" | "low",
          "estimatedImpact": 85
        }
      ],
      "relatedKeywords": ["keyword1", "keyword2"],
      "estimatedTrafficPotential": 2000
    }
  ],
  "totalArticlesNeeded": 25,
  "estimatedTrafficGain": 15000,
  "prioritizedTopics": [top 10 articles sorted by priority],
  "gaps": ["Gap 1", "Gap 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}

IMPORTANT: Return ONLY valid JSON.`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 4000
    });

    const result: TopicClusterResult = JSON.parse(response);

    // Validate and provide defaults
    if (!result.clusters) result.clusters = [];
    if (!result.prioritizedTopics) result.prioritizedTopics = [];
    if (!result.gaps) result.gaps = [];
    if (!result.recommendations) result.recommendations = [];

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Topic cluster generation failed'
    };
  }
}

/**
 * Generate SEO forecast based on topic clusters
 */
export interface SEOForecast {
  currentScore: number;
  projectedScore: number;
  timelineMonths: number;
  postsRequired: number;
  monthlyPostCadence: number;
  trafficProjection: {
    month: number;
    estimatedTraffic: number;
    cumulativePosts: number;
  }[];
  confidenceLevel: 'low' | 'medium' | 'high';
  assumptions: string[];
}

export async function generateSEOForecast(
  clusters: TopicCluster[],
  currentScore: number,
  targetScore: number,
  timelineMonths: number = 6,
  provider?: LLMProvider
): Promise<AgentResult<SEOForecast>> {
  const llm = provider || createOpenAIProvider();

  try {
    const totalArticles = clusters.reduce((sum, c) => sum + c.suggestedArticles.length, 0);
    const totalTrafficPotential = clusters.reduce((sum, c) => sum + c.estimatedTrafficPotential, 0);

    const systemPrompt = `You are an SEO forecasting expert. Generate realistic traffic and score projections based on content plans.`;

    const userPrompt = `Generate an SEO forecast:

CURRENT STATE:
- Current SEO Score: ${currentScore}
- Target SEO Score: ${targetScore}

CONTENT PLAN:
- Total Articles Planned: ${totalArticles}
- Total Traffic Potential: ${totalTrafficPotential}
- Timeline: ${timelineMonths} months
- Topic Clusters: ${clusters.length}

CLUSTER BREAKDOWN:
${clusters.map(c => `- ${c.name}: ${c.suggestedArticles.length} articles, ${c.estimatedTrafficPotential} traffic potential`).join('\n')}

Return a JSON object:
{
  "currentScore": ${currentScore},
  "projectedScore": number (realistic target),
  "timelineMonths": ${timelineMonths},
  "postsRequired": ${totalArticles},
  "monthlyPostCadence": number,
  "trafficProjection": [
    { "month": 1, "estimatedTraffic": number, "cumulativePosts": number },
    ...for each month
  ],
  "confidenceLevel": "low" | "medium" | "high",
  "assumptions": ["assumption 1", "assumption 2"]
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: 1500
    });

    const result: SEOForecast = JSON.parse(response);

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

/**
 * Generate content batch from prioritized topics
 */
export function generateContentBatch(
  clusters: TopicCluster[],
  count: number = 10
): SuggestedArticle[] {
  // Flatten all articles and sort by priority and impact
  const allArticles = clusters.flatMap(c => c.suggestedArticles);
  
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  
  return allArticles
    .sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // Then by impact
      return b.estimatedImpact - a.estimatedImpact;
    })
    .slice(0, count);
}
