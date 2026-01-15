/**
 * Gap Report Generator
 * Creates comprehensive gap analysis reports with recommendations
 */

import { ContentGap } from '@/lib/analysis/gap-analyzer';
import { supabaseAdmin } from '@/lib/supabase';

export interface GapReportData {
  websiteUrl: string;
  websiteName: string;
  generatedDate: string;
  overallScore: number;
  gaps: ContentGap[];
  summary: {
    totalGaps: number;
    criticalGaps: number;
    highSeverityGaps: number;
    mediumSeverityGaps: number;
    lowSeverityGaps: number;
    estimatedImprovement: number;
  };
  prioritizedActions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  recommendations: {
    category: string;
    recommendation: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
  }[];
}

/**
 * Generate gap report data for a website
 */
export async function generateGapReport(websiteId: string): Promise<GapReportData> {
  // Fetch website details
  const { data: website, error: websiteError } = await supabaseAdmin
    .from('websites')
    .select('url, client_id')
    .eq('id', websiteId)
    .single();

  if (websiteError || !website) {
    throw new Error('Website not found');
  }

  // Fetch gaps
  const { data: gaps, error: gapsError } = await supabaseAdmin
    .from('content_gaps')
    .select('*')
    .eq('website_id', websiteId)
    .order('severity', { ascending: false });

  if (gapsError) {
    throw new Error('Failed to fetch content gaps');
  }

  const gapList = gaps || [];

  // Fetch latest SEO audit for overall score
  const { data: audit } = await supabaseAdmin
    .from('seo_audits')
    .select('baseline_score')
    .eq('website_id', websiteId)
    .order('audit_date', { ascending: false })
    .limit(1)
    .single();

  const overallScore = audit?.baseline_score || 0;

  // Calculate summary statistics
  const summary = {
    totalGaps: gapList.length,
    criticalGaps: 0, // Not used in current gap system, but kept for future
    highSeverityGaps: gapList.filter(g => g.severity === 'high').length,
    mediumSeverityGaps: gapList.filter(g => g.severity === 'medium').length,
    lowSeverityGaps: gapList.filter(g => g.severity === 'low').length,
    estimatedImprovement: calculateEstimatedImprovement(gapList),
  };

  // Generate prioritized actions
  const prioritizedActions = generatePrioritizedActions(gapList);

  // Generate recommendations
  const recommendations = generateRecommendations(gapList);

  return {
    websiteUrl: website.url,
    websiteName: extractDomain(website.url),
    generatedDate: new Date().toISOString(),
    overallScore,
    gaps: gapList,
    summary,
    prioritizedActions,
    recommendations,
  };
}

/**
 * Calculate estimated improvement from fixing all gaps
 */
function calculateEstimatedImprovement(gaps: ContentGap[]): number {
  let improvement = 0;

  for (const gap of gaps) {
    const metadata = gap.metadata as any;
    if (metadata?.potential_score && metadata?.current_score) {
      improvement += (metadata.potential_score - metadata.current_score);
    } else {
      // Default improvement estimates by severity
      if (gap.severity === 'high') improvement += 15;
      else if (gap.severity === 'medium') improvement += 8;
      else improvement += 3;
    }
  }

  // Cap at realistic maximum improvement
  return Math.min(improvement, 40);
}

/**
 * Generate prioritized action list
 */
function generatePrioritizedActions(gaps: ContentGap[]): {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
} {
  const immediate: string[] = [];
  const shortTerm: string[] = [];
  const longTerm: string[] = [];

  // High severity gaps -> Immediate
  const highGaps = gaps.filter(g => g.severity === 'high');
  for (const gap of highGaps.slice(0, 3)) {
    immediate.push(gap.suggested_action);
  }

  // Medium severity gaps -> Short term
  const mediumGaps = gaps.filter(g => g.severity === 'medium');
  for (const gap of mediumGaps.slice(0, 5)) {
    shortTerm.push(gap.suggested_action);
  }

  // Low severity gaps -> Long term
  const lowGaps = gaps.filter(g => g.severity === 'low');
  for (const gap of lowGaps.slice(0, 3)) {
    longTerm.push(gap.suggested_action);
  }

  return { immediate, shortTerm, longTerm };
}

/**
 * Generate specific recommendations with impact and effort ratings
 */
function generateRecommendations(gaps: ContentGap[]): {
  category: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}[] {
  const recommendations: any[] = [];

  // Group gaps by type
  const gapsByType = gaps.reduce((acc, gap) => {
    const type = gap.gap_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(gap);
    return acc;
  }, {} as Record<string, ContentGap[]>);

  // Generate recommendations for each gap type
  for (const [type, typeGaps] of Object.entries(gapsByType)) {
    const count = typeGaps.length;
    const severity = typeGaps[0].severity;

    switch (type) {
      case 'thin_content':
        recommendations.push({
          category: 'Content Quality',
          recommendation: `Expand ${count} thin content pages to at least 800-1200 words with valuable information, examples, and visuals.`,
          impact: severity === 'high' ? 'high' : 'medium',
          effort: 'high',
        });
        break;

      case 'poor_seo':
        recommendations.push({
          category: 'SEO Optimization',
          recommendation: `Fix ${count} SEO issues including missing meta descriptions, alt text, and keyword optimization.`,
          impact: 'high',
          effort: 'low',
        });
        break;

      case 'broken_structure':
        recommendations.push({
          category: 'Technical Structure',
          recommendation: `Improve site structure for ${count} pages by fixing heading hierarchy and internal linking.`,
          impact: 'medium',
          effort: 'medium',
        });
        break;

      case 'missing_topic':
        recommendations.push({
          category: 'Content Strategy',
          recommendation: `Develop content calendar to fill topic gaps. Create 2-4 comprehensive blog posts per month.`,
          impact: 'high',
          effort: 'high',
        });
        break;

      case 'weak_keywords':
        recommendations.push({
          category: 'Keyword Strategy',
          recommendation: `Research and target ${count} keyword opportunities with low competition and high search volume.`,
          impact: 'high',
          effort: 'medium',
        });
        break;
    }
  }

  // Add general recommendations if gaps exist
  if (gaps.length > 5) {
    recommendations.push({
      category: 'Overall Strategy',
      recommendation: 'Implement systematic content audit process. Review and update 2-3 pages weekly.',
      impact: 'medium',
      effort: 'low',
    });
  }

  return recommendations;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Format gap report as text for email/preview
 */
export function formatGapReportAsText(report: GapReportData): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push(`CONTENT GAP ANALYSIS REPORT`);
  lines.push(`${report.websiteName}`);
  lines.push(`Generated: ${new Date(report.generatedDate).toLocaleDateString()}`);
  lines.push('='.repeat(60));
  lines.push('');

  lines.push('EXECUTIVE SUMMARY');
  lines.push('-'.repeat(60));
  lines.push(`Current SEO Score: ${report.overallScore}/100`);
  lines.push(`Total Gaps Identified: ${report.summary.totalGaps}`);
  lines.push(`  • High Severity: ${report.summary.highSeverityGaps}`);
  lines.push(`  • Medium Severity: ${report.summary.mediumSeverityGaps}`);
  lines.push(`  • Low Severity: ${report.summary.lowSeverityGaps}`);
  lines.push(`Estimated Improvement: +${report.summary.estimatedImprovement} points`);
  lines.push('');

  lines.push('PRIORITY ACTIONS');
  lines.push('-'.repeat(60));
  lines.push('');
  lines.push('IMMEDIATE (This Week):');
  report.prioritizedActions.immediate.forEach((action, i) => {
    lines.push(`${i + 1}. ${action}`);
  });
  lines.push('');
  lines.push('SHORT TERM (This Month):');
  report.prioritizedActions.shortTerm.forEach((action, i) => {
    lines.push(`${i + 1}. ${action}`);
  });
  lines.push('');
  lines.push('LONG TERM (Next Quarter):');
  report.prioritizedActions.longTerm.forEach((action, i) => {
    lines.push(`${i + 1}. ${action}`);
  });
  lines.push('');

  lines.push('DETAILED RECOMMENDATIONS');
  lines.push('-'.repeat(60));
  report.recommendations.forEach((rec, i) => {
    lines.push(`${i + 1}. ${rec.category}: ${rec.recommendation}`);
    lines.push(`   Impact: ${rec.impact.toUpperCase()} | Effort: ${rec.effort.toUpperCase()}`);
    lines.push('');
  });

  lines.push('IDENTIFIED GAPS');
  lines.push('-'.repeat(60));
  report.gaps.forEach((gap, i) => {
    lines.push(`${i + 1}. ${gap.title} [${gap.severity.toUpperCase()}]`);
    lines.push(`   ${gap.description}`);
    lines.push(`   Action: ${gap.suggested_action}`);
    if (gap.affected_pages.length > 0) {
      lines.push(`   Affected: ${gap.affected_pages.slice(0, 3).join(', ')}${gap.affected_pages.length > 3 ? '...' : ''}`);
    }
    lines.push('');
  });

  lines.push('='.repeat(60));
  lines.push('End of Report');
  lines.push('='.repeat(60));

  return lines.join('\n');
}
