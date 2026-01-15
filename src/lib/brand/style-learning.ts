/**
 * Style Learning Service
 *
 * Automatically learns writing patterns from high-performing blog posts
 * and updates the brand guide's styles_to_keep field.
 *
 * @feat-170 PRD Brand: Auto-learn styles from top performing posts
 */

import { createClient } from '@/lib/supabase/server';

interface BlogPostMetrics {
  blog_post_id: string;
  impressions: number;
  clicks: number;
  ctr: number | null;
  avg_position: number | null;
  sessions: number;
  time_on_page: number | null;
  conversions: number;
  seo_score: number | null;
}

interface BlogPostWithContent {
  id: string;
  title: string;
  content: string;
  target_keyword: string | null;
  word_count: number | null;
  metrics: BlogPostMetrics[];
}

interface ExtractedPattern {
  pattern: string;
  type: 'intro_style' | 'paragraph_structure' | 'sentence_length' | 'heading_style' | 'cta_placement' | 'list_usage';
  example: string;
  frequency: number;
}

interface LearnedStyle {
  pattern: string;
  confidence: number;
  impact: string;
  source: string;
  avgEngagementScore: number;
  sampleSize: number;
  extractedAt: string;
}

/**
 * Calculate engagement score based on multiple metrics
 */
function calculateEngagementScore(metrics: BlogPostMetrics): number {
  let score = 0;

  // Time on page (max 25 points)
  if (metrics.time_on_page) {
    score += Math.min((metrics.time_on_page / 180) * 25, 25); // 3 minutes = max
  }

  // CTR (max 25 points)
  if (metrics.ctr) {
    score += Math.min(metrics.ctr * 5, 25); // 5% CTR = max
  }

  // Position (max 25 points)
  if (metrics.avg_position) {
    score += Math.max(0, 25 - (metrics.avg_position * 2.5)); // Position 1 = 25, Position 10 = 0
  }

  // Conversions ratio (max 25 points)
  if (metrics.sessions > 0 && metrics.conversions) {
    const conversionRate = (metrics.conversions / metrics.sessions) * 100;
    score += Math.min(conversionRate * 5, 25); // 5% conversion = max
  }

  return Math.round(score);
}

/**
 * Extract patterns from blog post content
 */
function extractPatterns(post: BlogPostWithContent): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = [];
  const content = post.content || '';
  const lines = content.split('\n').filter(line => line.trim());

  // Analyze intro style
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.includes('?')) {
      patterns.push({
        pattern: 'Question-based introduction',
        type: 'intro_style',
        example: firstLine.substring(0, 100) + '...',
        frequency: 1
      });
    } else if (firstLine.match(/\d+/)) {
      patterns.push({
        pattern: 'Statistics in opening',
        type: 'intro_style',
        example: firstLine.substring(0, 100) + '...',
        frequency: 1
      });
    } else if (firstLine.toLowerCase().includes('imagine') || firstLine.toLowerCase().includes('picture')) {
      patterns.push({
        pattern: 'Scenario-based introduction',
        type: 'intro_style',
        example: firstLine.substring(0, 100) + '...',
        frequency: 1
      });
    }
  }

  // Analyze list usage
  const bulletLists = content.match(/^[•\-\*]\s/gm)?.length || 0;
  const numberedLists = content.match(/^\d+\.\s/gm)?.length || 0;
  if (bulletLists > 3) {
    patterns.push({
      pattern: 'Heavy use of bullet lists',
      type: 'list_usage',
      example: `${bulletLists} bullet points found`,
      frequency: bulletLists
    });
  }
  if (numberedLists > 2) {
    patterns.push({
      pattern: 'Numbered step-by-step format',
      type: 'list_usage',
      example: `${numberedLists} numbered items found`,
      frequency: numberedLists
    });
  }

  // Analyze sentence length
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  const avgSentenceLength = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length
    : 0;
  if (avgSentenceLength < 15) {
    patterns.push({
      pattern: 'Short, punchy sentences',
      type: 'sentence_length',
      example: `Average ${Math.round(avgSentenceLength)} words per sentence`,
      frequency: 1
    });
  } else if (avgSentenceLength > 25) {
    patterns.push({
      pattern: 'Long, detailed sentences',
      type: 'sentence_length',
      example: `Average ${Math.round(avgSentenceLength)} words per sentence`,
      frequency: 1
    });
  }

  // Analyze heading style
  const h2Headings = content.match(/^##\s+(.+)$/gm) || [];
  const h3Headings = content.match(/^###\s+(.+)$/gm) || [];
  if (h2Headings.length > 0) {
    const questionHeadings = h2Headings.filter(h => h.includes('?')).length;
    const howToHeadings = h2Headings.filter(h => h.toLowerCase().includes('how to')).length;

    if (questionHeadings > h2Headings.length * 0.5) {
      patterns.push({
        pattern: 'Question-format headings',
        type: 'heading_style',
        example: `${questionHeadings} of ${h2Headings.length} headings are questions`,
        frequency: questionHeadings
      });
    }

    if (howToHeadings > 1) {
      patterns.push({
        pattern: 'Action-oriented "How to" headings',
        type: 'heading_style',
        example: `${howToHeadings} "how to" headings found`,
        frequency: howToHeadings
      });
    }
  }

  // Analyze CTA placement
  const paragraphs = content.split('\n\n');
  const lastParagraph = paragraphs[paragraphs.length - 1] || '';
  if (lastParagraph.toLowerCase().includes('get started') ||
      lastParagraph.toLowerCase().includes('try') ||
      lastParagraph.toLowerCase().includes('contact')) {
    patterns.push({
      pattern: 'Strong CTA at conclusion',
      type: 'cta_placement',
      example: lastParagraph.substring(0, 100) + '...',
      frequency: 1
    });
  }

  // Check for mid-content CTAs
  const midContentCTAs = content.match(/\[.*\]\(.*\)/g)?.length || 0;
  if (midContentCTAs > 2) {
    patterns.push({
      pattern: 'Multiple CTAs throughout content',
      type: 'cta_placement',
      example: `${midContentCTAs} CTAs found in content`,
      frequency: midContentCTAs
    });
  }

  return patterns;
}

/**
 * Aggregate patterns across multiple posts
 */
function aggregatePatterns(allPatterns: ExtractedPattern[][]): Map<string, { count: number; examples: string[] }> {
  const aggregated = new Map<string, { count: number; examples: string[] }>();

  allPatterns.forEach(postPatterns => {
    postPatterns.forEach(pattern => {
      const existing = aggregated.get(pattern.pattern);
      if (existing) {
        existing.count++;
        if (existing.examples.length < 3) {
          existing.examples.push(pattern.example);
        }
      } else {
        aggregated.set(pattern.pattern, {
          count: 1,
          examples: [pattern.example]
        });
      }
    });
  });

  return aggregated;
}

/**
 * Analyze top-performing posts for a client and extract learned styles
 *
 * @param clientId - The client UUID
 * @param minPosts - Minimum number of posts to analyze (default: 5)
 * @param engagementThreshold - Minimum engagement score (default: 60 out of 100)
 * @returns Array of learned styles with metrics
 */
export async function learnStylesFromTopPosts(
  clientId: string,
  minPosts: number = 5,
  engagementThreshold: number = 60
): Promise<LearnedStyle[]> {
  const supabase = await createClient();

  // Get blog posts for this client with their latest metrics
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select(`
      id,
      title,
      content,
      target_keyword,
      word_count,
      blog_post_metrics (
        blog_post_id,
        impressions,
        clicks,
        ctr,
        avg_position,
        sessions,
        time_on_page,
        conversions,
        seo_score,
        snapshot_date
      )
    `)
    .eq('client_id', clientId)
    .eq('status', 'published')
    .not('content', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50); // Analyze recent 50 posts max

  if (error || !posts || posts.length === 0) {
    console.error('Error fetching posts or no posts found:', error);
    return [];
  }

  // Calculate engagement scores and filter high performers
  const postsWithScores = posts
    .map(post => {
      // Get latest metrics for each post
      const latestMetrics = (post.blog_post_metrics as any[] || [])
        .sort((a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime())[0];

      if (!latestMetrics) return null;

      const engagementScore = calculateEngagementScore(latestMetrics);

      return {
        ...post,
        metrics: [latestMetrics],
        engagementScore
      };
    })
    .filter(post => post !== null && post.engagementScore >= engagementThreshold)
    .sort((a, b) => b!.engagementScore - a!.engagementScore) as (BlogPostWithContent & { engagementScore: number })[];

  // Need at least minPosts to learn from
  if (postsWithScores.length < minPosts) {
    console.log(`Only ${postsWithScores.length} high-performing posts found, need at least ${minPosts}`);
    return [];
  }

  // Extract patterns from top performers
  const topPosts = postsWithScores.slice(0, 20); // Analyze top 20
  const allPatterns = topPosts.map(post => extractPatterns(post));

  // Aggregate and rank patterns
  const aggregatedPatterns = aggregatePatterns(allPatterns);

  // Convert to learned styles with confidence and impact
  const learnedStyles: LearnedStyle[] = [];
  const avgEngagement = topPosts.reduce((sum, p) => sum + p.engagementScore, 0) / topPosts.length;

  aggregatedPatterns.forEach((data, pattern) => {
    if (data.count >= Math.min(3, minPosts)) { // Pattern must appear in at least 3 posts or minPosts
      const confidence = Math.min((data.count / topPosts.length) * 100, 100);
      const impactPercentage = Math.round(((avgEngagement - 50) / 50) * 100); // Relative to baseline 50

      learnedStyles.push({
        pattern,
        confidence: Math.round(confidence),
        impact: impactPercentage > 0 ? `+${impactPercentage}% engagement` : `${impactPercentage}% engagement`,
        source: `Analysis of top ${topPosts.length} posts`,
        avgEngagementScore: Math.round(avgEngagement),
        sampleSize: data.count,
        extractedAt: new Date().toISOString()
      });
    }
  });

  // Sort by confidence
  learnedStyles.sort((a, b) => b.confidence - a.confidence);

  return learnedStyles;
}

/**
 * Update brand guide with learned styles
 *
 * @param clientId - The client UUID
 * @param learnedStyles - Array of learned styles to add
 * @returns Success status
 */
export async function updateBrandGuideWithLearnedStyles(
  clientId: string,
  learnedStyles: LearnedStyle[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get client to find their brand guide
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    return { success: false, error: 'Client not found' };
  }

  // Get brand guide
  const { data: brandGuide, error: brandError } = await supabase
    .from('brand_guides')
    .select('id, styles_to_keep')
    .eq('brand_name', client.name)
    .single();

  if (brandError || !brandGuide) {
    return { success: false, error: 'Brand guide not found' };
  }

  // Parse existing styles_to_keep
  const existingStyles = (brandGuide.styles_to_keep as any) || {
    preferred_patterns: [],
    successful_examples: [],
    engagement_metrics: {}
  };

  // Add learned patterns to preferred_patterns
  const newPatterns = learnedStyles.map(style =>
    `${style.pattern} (${style.impact}, confidence: ${style.confidence}%, sample: ${style.sampleSize} posts)`
  );

  // Merge with existing patterns, avoiding duplicates
  const existingPatterns = existingStyles.preferred_patterns || [];
  const mergedPatterns = Array.from(new Set([...existingPatterns, ...newPatterns]));

  // Calculate overall engagement metrics
  const avgEngagement = learnedStyles.reduce((sum, s) => sum + s.avgEngagementScore, 0) / learnedStyles.length;

  // Update styles_to_keep
  const updatedStyles = {
    ...existingStyles,
    preferred_patterns: mergedPatterns,
    engagement_metrics: {
      ...existingStyles.engagement_metrics,
      avg_engagement_score: Math.round(avgEngagement),
      top_performing_style: learnedStyles[0]?.pattern || null,
      last_analyzed: new Date().toISOString(),
      analyzed_posts_count: learnedStyles[0]?.sampleSize || 0
    },
    auto_learned: {
      patterns: learnedStyles,
      last_update: new Date().toISOString()
    }
  };

  // Update brand guide
  const { error: updateError } = await supabase
    .from('brand_guides')
    .update({ styles_to_keep: updatedStyles })
    .eq('id', brandGuide.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
