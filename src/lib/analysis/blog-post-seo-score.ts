/**
 * Blog Post SEO Quality Score Calculator
 * Calculates comprehensive SEO score for blog posts based on:
 * - Keyword density and usage
 * - Content structure (headings, paragraphs)
 * - Readability metrics
 * - Meta information
 * - Technical SEO factors
 */

interface BlogPostData {
  final_html?: string | null;
  target_keyword?: string | null;
  topic?: string;
  seo_metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  } | null;
  word_count_goal?: number | null;
}

interface SEOScoreBreakdown {
  score: number;
  breakdown: {
    keywordUsage: number;
    contentStructure: number;
    readability: number;
    metaOptimization: number;
    technicalSEO: number;
  };
  issues: string[];
  recommendations: string[];
}

/**
 * Extract plain text from HTML
 */
function extractTextFromHTML(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Count word occurrences in text
 */
function countWordOccurrences(text: string, word: string): number {
  const lowerText = text.toLowerCase();
  const lowerWord = word.toLowerCase();
  const regex = new RegExp(`\\b${lowerWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
  const matches = lowerText.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Extract headings from HTML
 */
function extractHeadings(html: string): { h1: string[], h2: string[], h3: string[] } {
  const headings = { h1: [] as string[], h2: [] as string[], h3: [] as string[] };

  const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
  const h3Matches = html.match(/<h3[^>]*>(.*?)<\/h3>/gi) || [];

  headings.h1 = h1Matches.map(h => extractTextFromHTML(h));
  headings.h2 = h2Matches.map(h => extractTextFromHTML(h));
  headings.h3 = h3Matches.map(h => extractTextFromHTML(h));

  return headings;
}

/**
 * Count images and alt text
 */
function analyzeImages(html: string): { total: number; withAlt: number } {
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const total = imgMatches.length;
  const withAlt = imgMatches.filter(img => /alt=["'][^"']+["']/i.test(img)).length;

  return { total, withAlt };
}

/**
 * Count links
 */
function analyzeLinks(html: string): { internal: number; external: number } {
  const linkMatches = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi) || [];

  let internal = 0;
  let external = 0;

  linkMatches.forEach(link => {
    const hrefMatch = link.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
      const href = hrefMatch[1];
      if (href.startsWith('http://') || href.startsWith('https://')) {
        external++;
      } else if (href.startsWith('/') || href.startsWith('#')) {
        internal++;
      }
    }
  });

  return { internal, external };
}

/**
 * Calculate readability score (Flesch Reading Ease approximation)
 */
function calculateReadability(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => {
    // Simple syllable counting heuristic
    return count + Math.max(1, word.toLowerCase().match(/[aeiou]{1,2}/g)?.length || 1);
  }, 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease formula (simplified)
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

  // Convert to 0-100 scale where higher is better
  return Math.max(0, Math.min(100, score)) / 100 * 100;
}

/**
 * Score keyword usage (0-25 points)
 */
function scoreKeywordUsage(
  text: string,
  html: string,
  keyword: string,
  headings: { h1: string[], h2: string[], h3: string[] }
): { score: number; issues: string[]; recommendations: string[] } {
  let score = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!keyword) {
    issues.push('No target keyword defined');
    recommendations.push('Define a target keyword for SEO optimization');
    return { score: 0, issues, recommendations };
  }

  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const keywordCount = countWordOccurrences(text, keyword);
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  // Keyword density (0-10 points) - optimal 0.5% to 2.5%
  if (keywordDensity >= 0.5 && keywordDensity <= 2.5) {
    score += 10;
  } else if (keywordDensity > 0 && keywordDensity < 0.5) {
    score += 5;
    issues.push('Keyword density too low');
    recommendations.push(`Increase keyword usage (current: ${keywordDensity.toFixed(2)}%, target: 0.5-2.5%)`);
  } else if (keywordDensity > 2.5) {
    score += 3;
    issues.push('Keyword density too high (keyword stuffing)');
    recommendations.push(`Reduce keyword usage (current: ${keywordDensity.toFixed(2)}%, target: 0.5-2.5%)`);
  } else {
    issues.push('Target keyword not found in content');
    recommendations.push('Include target keyword naturally in the content');
  }

  // Keyword in H1 (5 points)
  const keywordInH1 = headings.h1.some(h => h.toLowerCase().includes(keyword.toLowerCase()));
  if (keywordInH1) {
    score += 5;
  } else {
    issues.push('Target keyword not in H1');
    recommendations.push('Include target keyword in the main heading (H1)');
  }

  // Keyword in H2/H3 (5 points)
  const keywordInH2H3 = [...headings.h2, ...headings.h3].some(h =>
    h.toLowerCase().includes(keyword.toLowerCase())
  );
  if (keywordInH2H3) {
    score += 5;
  } else {
    recommendations.push('Include target keyword in subheadings (H2 or H3)');
  }

  // Keyword in first 100 words (5 points)
  const first100Words = text.split(/\s+/).slice(0, 100).join(' ');
  if (first100Words.toLowerCase().includes(keyword.toLowerCase())) {
    score += 5;
  } else {
    issues.push('Target keyword not in first 100 words');
    recommendations.push('Include target keyword early in the content');
  }

  return { score, issues, recommendations };
}

/**
 * Score content structure (0-25 points)
 */
function scoreContentStructure(
  html: string,
  text: string,
  headings: { h1: string[], h2: string[], h3: string[] },
  wordCountGoal?: number | null
): { score: number; issues: string[]; recommendations: string[] } {
  let score = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];

  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  // Word count (0-10 points)
  const targetWordCount = wordCountGoal || 1500;
  if (wordCount >= targetWordCount) {
    score += 10;
  } else if (wordCount >= targetWordCount * 0.8) {
    score += 7;
    recommendations.push(`Add ${targetWordCount - wordCount} more words to reach target`);
  } else if (wordCount >= targetWordCount * 0.5) {
    score += 4;
    issues.push('Content significantly shorter than target');
    recommendations.push(`Add ${targetWordCount - wordCount} more words to reach target`);
  } else {
    issues.push('Content too short');
    recommendations.push(`Expand content to at least ${targetWordCount} words`);
  }

  // Heading structure (0-8 points)
  if (headings.h1.length === 1) {
    score += 3;
  } else if (headings.h1.length === 0) {
    issues.push('Missing H1 heading');
    recommendations.push('Add a single H1 heading');
  } else {
    issues.push('Multiple H1 headings');
    recommendations.push('Use only one H1 heading per page');
  }

  if (headings.h2.length >= 3 && headings.h2.length <= 10) {
    score += 5;
  } else if (headings.h2.length < 3) {
    issues.push('Too few H2 headings');
    recommendations.push('Add more H2 sections (target: 3-10)');
  } else {
    recommendations.push('Consider consolidating some H2 sections');
  }

  // Paragraph structure (0-4 points)
  const paragraphs = html.match(/<p[^>]*>.*?<\/p>/gi) || [];
  if (paragraphs.length >= 5) {
    score += 4;
  } else if (paragraphs.length >= 3) {
    score += 2;
  } else {
    issues.push('Too few paragraphs');
    recommendations.push('Break content into more paragraphs for readability');
  }

  // Lists (0-3 points)
  const lists = (html.match(/<ul[^>]*>/gi) || []).length + (html.match(/<ol[^>]*>/gi) || []).length;
  if (lists >= 1) {
    score += 3;
  } else {
    recommendations.push('Add bullet or numbered lists to improve scannability');
  }

  return { score, issues, recommendations };
}

/**
 * Score readability (0-20 points)
 */
function scoreReadability(text: string): { score: number; issues: string[]; recommendations: string[] } {
  let score = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];

  const readabilityScore = calculateReadability(text);

  // Readability score (0-15 points) - target 60-80 (fairly easy to read)
  if (readabilityScore >= 60 && readabilityScore <= 80) {
    score += 15;
  } else if (readabilityScore >= 50 && readabilityScore < 60) {
    score += 10;
    recommendations.push('Simplify sentences for better readability');
  } else if (readabilityScore >= 40 && readabilityScore < 50) {
    score += 5;
    issues.push('Content difficult to read');
    recommendations.push('Use shorter sentences and simpler words');
  } else if (readabilityScore < 40) {
    issues.push('Content very difficult to read');
    recommendations.push('Significantly simplify the writing style');
  } else {
    score += 12;
  }

  // Average sentence length (0-5 points)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;

  if (avgSentenceLength >= 15 && avgSentenceLength <= 20) {
    score += 5;
  } else if (avgSentenceLength > 20 && avgSentenceLength <= 25) {
    score += 3;
    recommendations.push('Shorten some sentences (average is slightly long)');
  } else if (avgSentenceLength > 25) {
    score += 1;
    issues.push('Sentences too long on average');
    recommendations.push('Break up long sentences for better readability');
  } else if (avgSentenceLength < 15 && avgSentenceLength > 10) {
    score += 4;
  } else if (avgSentenceLength <= 10) {
    score += 2;
    recommendations.push('Some sentences may be too short; vary sentence length');
  }

  return { score, issues, recommendations };
}

/**
 * Score meta optimization (0-15 points)
 */
function scoreMetaOptimization(
  seoMetadata: BlogPostData['seo_metadata'],
  keyword: string,
  topic: string
): { score: number; issues: string[]; recommendations: string[] } {
  let score = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Title optimization (0-8 points)
  const title = seoMetadata?.title || '';
  if (title.length >= 30 && title.length <= 60) {
    score += 5;
    if (keyword && title.toLowerCase().includes(keyword.toLowerCase())) {
      score += 3;
    } else {
      recommendations.push('Include target keyword in title tag');
    }
  } else if (title.length > 0 && title.length < 30) {
    score += 2;
    issues.push('Title tag too short');
    recommendations.push('Expand title to 30-60 characters');
  } else if (title.length > 60) {
    score += 3;
    issues.push('Title tag too long (may be truncated)');
    recommendations.push('Shorten title to under 60 characters');
  } else {
    issues.push('Missing title tag');
    recommendations.push('Add a title tag (30-60 characters)');
  }

  // Meta description (0-7 points)
  const description = seoMetadata?.description || '';
  if (description.length >= 120 && description.length <= 160) {
    score += 5;
    if (keyword && description.toLowerCase().includes(keyword.toLowerCase())) {
      score += 2;
    } else {
      recommendations.push('Include target keyword in meta description');
    }
  } else if (description.length > 0 && description.length < 120) {
    score += 2;
    issues.push('Meta description too short');
    recommendations.push('Expand meta description to 120-160 characters');
  } else if (description.length > 160) {
    score += 3;
    issues.push('Meta description too long (may be truncated)');
  } else {
    issues.push('Missing meta description');
    recommendations.push('Add a meta description (120-160 characters)');
  }

  return { score, issues, recommendations };
}

/**
 * Score technical SEO factors (0-15 points)
 */
function scoreTechnicalSEO(
  html: string,
  images: { total: number; withAlt: number },
  links: { internal: number; external: number }
): { score: number; issues: string[]; recommendations: string[] } {
  let score = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Image optimization (0-5 points)
  if (images.total === 0) {
    recommendations.push('Add relevant images to enhance content');
  } else {
    const altRatio = images.withAlt / images.total;
    if (altRatio === 1) {
      score += 5;
    } else if (altRatio >= 0.8) {
      score += 3;
      recommendations.push(`Add alt text to ${images.total - images.withAlt} remaining images`);
    } else {
      score += 1;
      issues.push(`${images.total - images.withAlt} images missing alt text`);
      recommendations.push('Add descriptive alt text to all images');
    }
  }

  // Internal linking (0-6 points)
  if (links.internal >= 5) {
    score += 6;
  } else if (links.internal >= 3) {
    score += 4;
    recommendations.push('Add 2-3 more internal links');
  } else if (links.internal >= 1) {
    score += 2;
    issues.push('Too few internal links');
    recommendations.push('Add more internal links to related content');
  } else {
    issues.push('No internal links');
    recommendations.push('Add internal links to improve site architecture');
  }

  // External linking (0-4 points)
  if (links.external >= 2 && links.external <= 5) {
    score += 4;
  } else if (links.external === 1) {
    score += 2;
    recommendations.push('Add 1-2 more external authoritative sources');
  } else if (links.external > 5) {
    score += 3;
    recommendations.push('Consider reducing external links (current: ' + links.external + ')');
  } else {
    recommendations.push('Add external links to authoritative sources');
  }

  return { score, issues, recommendations };
}

/**
 * Calculate comprehensive SEO quality score for a blog post
 */
export function calculateBlogPostSEOScore(post: BlogPostData): SEOScoreBreakdown {
  const html = post.final_html || '';
  const keyword = post.target_keyword || '';
  const topic = post.topic || '';
  const metadata = post.seo_metadata;

  if (!html) {
    return {
      score: 0,
      breakdown: {
        keywordUsage: 0,
        contentStructure: 0,
        readability: 0,
        metaOptimization: 0,
        technicalSEO: 0,
      },
      issues: ['No content to analyze'],
      recommendations: ['Generate content for this blog post'],
    };
  }

  const text = extractTextFromHTML(html);
  const headings = extractHeadings(html);
  const images = analyzeImages(html);
  const links = analyzeLinks(html);

  // Calculate scores for each category
  const keywordResult = scoreKeywordUsage(text, html, keyword, headings);
  const structureResult = scoreContentStructure(html, text, headings, post.word_count_goal);
  const readabilityResult = scoreReadability(text);
  const metaResult = scoreMetaOptimization(metadata, keyword, topic);
  const technicalResult = scoreTechnicalSEO(html, images, links);

  const totalScore = Math.round(
    keywordResult.score +
    structureResult.score +
    readabilityResult.score +
    metaResult.score +
    technicalResult.score
  );

  // Combine all issues and recommendations
  const allIssues = [
    ...keywordResult.issues,
    ...structureResult.issues,
    ...readabilityResult.issues,
    ...metaResult.issues,
    ...technicalResult.issues,
  ];

  const allRecommendations = [
    ...keywordResult.recommendations,
    ...structureResult.recommendations,
    ...readabilityResult.recommendations,
    ...metaResult.recommendations,
    ...technicalResult.recommendations,
  ];

  return {
    score: Math.max(0, Math.min(100, totalScore)),
    breakdown: {
      keywordUsage: keywordResult.score,
      contentStructure: structureResult.score,
      readability: readabilityResult.score,
      metaOptimization: metaResult.score,
      technicalSEO: technicalResult.score,
    },
    issues: allIssues,
    recommendations: allRecommendations,
  };
}

/**
 * Get SEO quality grade from score
 */
export function getSEOQualityGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}
