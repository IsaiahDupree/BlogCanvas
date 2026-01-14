/**
 * SEO Audit Agent
 * Comprehensive SEO analysis of websites
 */

import { LLMProvider, AgentResult } from './types';
import { createOpenAIProvider } from './openai-provider';
import { PageData, CrawlResult } from './website-crawler';

export interface SEOIssue {
  type: 'critical' | 'warning' | 'info';
  category: 'meta' | 'content' | 'structure' | 'performance' | 'mobile' | 'links';
  page?: string;
  issue: string;
  impact: string;
  recommendation: string;
}

export interface PageSEOScore {
  url: string;
  score: number;
  titleScore: number;
  metaScore: number;
  headingScore: number;
  contentScore: number;
  linkScore: number;
  issues: string[];
}

export interface SEOAuditResult {
  websiteUrl: string;
  overallScore: number;
  grades: {
    technical: string;
    content: string;
    onPage: string;
    userExperience: string;
  };
  scores: {
    technical: number;
    content: number;
    onPage: number;
    userExperience: number;
  };
  issues: SEOIssue[];
  pageScores: PageSEOScore[];
  topPriorities: string[];
  quickWins: string[];
  longTermImprovements: string[];
  competitivePosition: string;
  estimatedTrafficPotential: number;
}

export interface SEOAuditInput {
  crawlResult: CrawlResult;
  industry?: string;
  targetKeywords?: string[];
}

/**
 * Calculate SEO score for a single page
 */
export function calculatePageSEOScore(page: PageData): PageSEOScore {
  const issues: string[] = [];
  let totalScore = 0;

  // Title score (0-20)
  let titleScore = 0;
  if (page.title) {
    titleScore = 10;
    if (page.title.length >= 30 && page.title.length <= 60) {
      titleScore = 20;
    } else if (page.title.length > 60) {
      issues.push('Title too long (>60 chars)');
      titleScore = 15;
    } else {
      issues.push('Title too short (<30 chars)');
    }
  } else {
    issues.push('Missing page title');
  }
  totalScore += titleScore;

  // Meta description score (0-20)
  let metaScore = 0;
  if (page.metaDescription) {
    metaScore = 10;
    if (page.metaDescription.length >= 120 && page.metaDescription.length <= 160) {
      metaScore = 20;
    } else if (page.metaDescription.length > 160) {
      issues.push('Meta description too long (>160 chars)');
      metaScore = 15;
    } else {
      issues.push('Meta description too short (<120 chars)');
    }
  } else {
    issues.push('Missing meta description');
  }
  totalScore += metaScore;

  // Heading score (0-20)
  let headingScore = 0;
  if (page.h1) {
    headingScore = 10;
    const h2Count = page.headings.filter(h => h.level === 2).length;
    if (h2Count >= 2) {
      headingScore = 20;
    } else {
      issues.push('Needs more H2 subheadings');
      headingScore = 15;
    }
  } else {
    issues.push('Missing H1 heading');
  }
  totalScore += headingScore;

  // Content score (0-20)
  let contentScore = 0;
  if (page.wordCount >= 1000) {
    contentScore = 20;
  } else if (page.wordCount >= 500) {
    contentScore = 15;
  } else if (page.wordCount >= 300) {
    contentScore = 10;
    issues.push('Content is thin (300-500 words)');
  } else {
    contentScore = 5;
    issues.push('Content very thin (<300 words)');
  }
  totalScore += contentScore;

  // Link score (0-20)
  let linkScore = 0;
  if (page.internalLinks.length >= 3) {
    linkScore = 10;
  } else {
    issues.push('Needs more internal links');
  }
  if (page.externalLinks.length >= 1) {
    linkScore += 5;
  }
  // Check for images with alt text
  const imagesWithAlt = page.images.filter(img => img.alt && img.alt.length > 0);
  if (imagesWithAlt.length > 0) {
    linkScore += 5;
  } else if (page.images.length > 0) {
    issues.push('Images missing alt text');
  }
  totalScore += linkScore;

  return {
    url: page.url,
    score: totalScore,
    titleScore,
    metaScore,
    headingScore,
    contentScore,
    linkScore,
    issues
  };
}

/**
 * Run comprehensive SEO audit
 */
export async function runSEOAudit(
  input: SEOAuditInput,
  provider?: LLMProvider
): Promise<AgentResult<SEOAuditResult>> {
  const llm = provider || createOpenAIProvider();

  try {
    // Calculate page scores
    const pageScores = input.crawlResult.pages.map(calculatePageSEOScore);
    const avgScore = pageScores.reduce((sum, p) => sum + p.score, 0) / pageScores.length;

    // Collect all issues
    const allIssues: SEOIssue[] = [];

    // Check for sitemap
    if (!input.crawlResult.sitemapFound) {
      allIssues.push({
        type: 'warning',
        category: 'structure',
        issue: 'No sitemap.xml found',
        impact: 'Search engines may not discover all pages',
        recommendation: 'Create and submit a sitemap.xml'
      });
    }

    // Check for common issues across pages
    const pagesWithoutMeta = input.crawlResult.pages.filter(p => !p.metaDescription);
    if (pagesWithoutMeta.length > 0) {
      allIssues.push({
        type: 'critical',
        category: 'meta',
        issue: `${pagesWithoutMeta.length} pages missing meta descriptions`,
        impact: 'Lower click-through rates from search results',
        recommendation: 'Add unique meta descriptions to all pages'
      });
    }

    const pagesWithoutH1 = input.crawlResult.pages.filter(p => !p.h1);
    if (pagesWithoutH1.length > 0) {
      allIssues.push({
        type: 'critical',
        category: 'content',
        issue: `${pagesWithoutH1.length} pages missing H1 headings`,
        impact: 'Poor content structure signals to search engines',
        recommendation: 'Add a single H1 heading to each page'
      });
    }

    const thinContentPages = input.crawlResult.pages.filter(p => p.wordCount < 300);
    if (thinContentPages.length > 0) {
      allIssues.push({
        type: 'warning',
        category: 'content',
        issue: `${thinContentPages.length} pages with thin content (<300 words)`,
        impact: 'May be seen as low-value by search engines',
        recommendation: 'Expand content or consolidate thin pages'
      });
    }

    // AI-powered analysis
    const systemPrompt = `You are an SEO audit expert. Analyze website data and provide actionable insights.`;

    const userPrompt = `Analyze this website SEO data:

WEBSITE: ${input.crawlResult.baseUrl}
PAGES ANALYZED: ${input.crawlResult.pagesCrawled}
AVERAGE PAGE SCORE: ${avgScore.toFixed(1)}/100
${input.industry ? `INDUSTRY: ${input.industry}` : ''}
${input.targetKeywords?.length ? `TARGET KEYWORDS: ${input.targetKeywords.join(', ')}` : ''}

PAGE SCORES (top 10):
${pageScores.slice(0, 10).map(p => `${p.url}: ${p.score}/100 - Issues: ${p.issues.join(', ') || 'None'}`).join('\n')}

EXISTING ISSUES:
${allIssues.map(i => `[${i.type}] ${i.issue}`).join('\n')}

Provide SEO recommendations. Return JSON:
{
  "overallScore": ${Math.round(avgScore)},
  "grades": {
    "technical": "A/B/C/D/F",
    "content": "A/B/C/D/F",
    "onPage": "A/B/C/D/F",
    "userExperience": "A/B/C/D/F"
  },
  "scores": {
    "technical": 0-100,
    "content": 0-100,
    "onPage": 0-100,
    "userExperience": 0-100
  },
  "topPriorities": ["priority 1", "priority 2", "priority 3"],
  "quickWins": ["quick improvement 1", "quick improvement 2"],
  "longTermImprovements": ["long term 1", "long term 2"],
  "competitivePosition": "assessment of competitive position",
  "estimatedTrafficPotential": number (monthly visits if optimized)
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: 2000
    });

    const aiAnalysis = JSON.parse(response);

    return {
      success: true,
      data: {
        websiteUrl: input.crawlResult.baseUrl,
        overallScore: aiAnalysis.overallScore || Math.round(avgScore),
        grades: aiAnalysis.grades,
        scores: aiAnalysis.scores,
        issues: allIssues,
        pageScores: pageScores.slice(0, 20),
        topPriorities: aiAnalysis.topPriorities || [],
        quickWins: aiAnalysis.quickWins || [],
        longTermImprovements: aiAnalysis.longTermImprovements || [],
        competitivePosition: aiAnalysis.competitivePosition || '',
        estimatedTrafficPotential: aiAnalysis.estimatedTrafficPotential || 0
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'SEO audit failed'
    };
  }
}

/**
 * Generate SEO improvement roadmap
 */
export interface SEORoadmap {
  phase1: { weeks: string; tasks: string[]; expectedGain: string }[];
  phase2: { weeks: string; tasks: string[]; expectedGain: string }[];
  phase3: { weeks: string; tasks: string[]; expectedGain: string }[];
  totalTimeframe: string;
  projectedScoreImprovement: number;
}

export async function generateSEORoadmap(
  auditResult: SEOAuditResult,
  provider?: LLMProvider
): Promise<AgentResult<SEORoadmap>> {
  const llm = provider || createOpenAIProvider();

  try {
    const systemPrompt = `You are an SEO consultant. Create actionable improvement roadmaps.`;

    const userPrompt = `Create an SEO improvement roadmap based on this audit:

CURRENT SCORE: ${auditResult.overallScore}/100
TOP PRIORITIES: ${auditResult.topPriorities.join(', ')}
QUICK WINS: ${auditResult.quickWins.join(', ')}
LONG TERM: ${auditResult.longTermImprovements.join(', ')}

Return a phased roadmap JSON:
{
  "phase1": [{ "weeks": "1-2", "tasks": ["task1"], "expectedGain": "5-10 points" }],
  "phase2": [{ "weeks": "3-4", "tasks": ["task1"], "expectedGain": "10-15 points" }],
  "phase3": [{ "weeks": "5-8", "tasks": ["task1"], "expectedGain": "5-10 points" }],
  "totalTimeframe": "8 weeks",
  "projectedScoreImprovement": number
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.5,
      maxTokens: 1500
    });

    const result: SEORoadmap = JSON.parse(response);

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
