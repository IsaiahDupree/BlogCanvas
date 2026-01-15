/**
 * Unit tests for blog post SEO quality score calculation
 */

import { calculateBlogPostSEOScore, getSEOQualityGrade } from '@/lib/analysis/blog-post-seo-score';

describe('Blog Post SEO Score Calculation', () => {
  const mockBlogPost = {
    topic: 'How to Optimize Your Website for SEO',
    target_keyword: 'SEO optimization',
    word_count_goal: 1500,
    seo_metadata: {
      title: 'How to Optimize Your Website for SEO - Complete Guide',
      description: 'Learn the best practices for SEO optimization including keyword research, content structure, and technical improvements to boost your rankings.',
      keywords: ['SEO', 'optimization', 'website'],
    },
    final_html: `
      <h1>How to Optimize Your Website for SEO</h1>
      <p>SEO optimization is crucial for improving your website's visibility in search engines. In this comprehensive guide, we'll explore the key strategies and techniques you need to master.</p>

      <h2>Understanding SEO Optimization Fundamentals</h2>
      <p>Before diving into advanced techniques, it's important to understand the basics of SEO optimization. Search engines like Google use complex algorithms to determine which pages to show for specific queries.</p>
      <ul>
        <li>Keyword research and targeting</li>
        <li>Content quality and relevance</li>
        <li>Technical SEO factors</li>
      </ul>

      <h2>Content Structure Best Practices</h2>
      <p>Proper content structure helps both users and search engines understand your content better. Use heading hierarchies effectively and break your content into digestible sections.</p>

      <h3>Using Headings Properly</h3>
      <p>Headings should be used to organize your content logically. Each page should have one H1, followed by H2s for main sections, and H3s for subsections.</p>

      <h2>Keyword Optimization Strategies</h2>
      <p>While SEO optimization includes many factors, keywords remain important. Use them naturally throughout your content, including in headings and the first 100 words.</p>
      <p>Don't overuse keywords though, as keyword stuffing can harm your rankings. Aim for a natural keyword density of 0.5-2.5%.</p>

      <h3>Long-tail Keywords</h3>
      <p>Long-tail keywords are longer, more specific phrases that often have less competition. They can be valuable for targeting niche audiences.</p>

      <h2>Technical SEO Considerations</h2>
      <p>Beyond content, technical factors like site speed, mobile-friendliness, and structured data play crucial roles in SEO optimization success.</p>
      <img src="/images/seo-diagram.png" alt="SEO optimization workflow diagram" />
      <img src="/images/keyword-research.png" alt="Keyword research process" />

      <p>Internal linking helps distribute page authority throughout your site. Link to related content using descriptive anchor text.</p>
      <a href="/blog/keyword-research">Learn about keyword research</a>
      <a href="/blog/content-strategy">Content strategy guide</a>
      <a href="/blog/technical-seo">Technical SEO checklist</a>
      <a href="/resources/seo-tools">Best SEO tools</a>

      <p>External links to authoritative sources can also improve credibility. For example, <a href="https://developers.google.com/search/docs">Google's SEO documentation</a> is a valuable resource.</p>
      <p>You can also learn from <a href="https://moz.com/learn/seo">Moz's SEO guide</a>.</p>

      <h2>Measuring SEO Success</h2>
      <p>Track your progress using tools like Google Analytics and Search Console. Monitor rankings, traffic, and user engagement metrics to understand what's working.</p>

      <h3>Key Metrics to Track</h3>
      <p>Focus on organic traffic growth, keyword rankings, click-through rates, and conversion rates. These metrics help you understand your SEO optimization ROI.</p>

      <h2>Conclusion</h2>
      <p>SEO optimization is an ongoing process that requires patience and consistent effort. By following these best practices and staying up-to-date with algorithm changes, you can achieve sustainable organic growth.</p>
      <p>Remember that quality content that genuinely helps your audience will always be the foundation of effective SEO optimization.</p>
    `,
  };

  test('calculates comprehensive SEO score for well-optimized post', () => {
    const result = calculateBlogPostSEOScore(mockBlogPost);

    // Should get a good score
    expect(result.score).toBeGreaterThan(60);
    expect(result.score).toBeLessThanOrEqual(100);

    // Should have breakdown
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.keywordUsage).toBeGreaterThan(0);
    expect(result.breakdown.contentStructure).toBeGreaterThan(0);
    expect(result.breakdown.readability).toBeGreaterThan(0);
    expect(result.breakdown.metaOptimization).toBeGreaterThan(0);
    expect(result.breakdown.technicalSEO).toBeGreaterThan(0);

    // Should have issues and recommendations arrays
    expect(Array.isArray(result.issues)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  test('returns 0 score for post with no content', () => {
    const emptyPost = {
      topic: 'Test Post',
      target_keyword: null,
      final_html: null,
      seo_metadata: null,
    };

    const result = calculateBlogPostSEOScore(emptyPost);

    expect(result.score).toBe(0);
    expect(result.issues).toContain('No content to analyze');
    expect(result.recommendations).toContain('Generate content for this blog post');
  });

  test('penalizes missing target keyword', () => {
    const postWithoutKeyword = {
      ...mockBlogPost,
      target_keyword: null,
    };

    const result = calculateBlogPostSEOScore(postWithoutKeyword);

    // Should have lower keyword usage score
    expect(result.breakdown.keywordUsage).toBe(0);
    expect(result.issues.some(issue => issue.toLowerCase().includes('keyword'))).toBe(true);
  });

  test('detects keyword stuffing', () => {
    const stuffedPost = {
      topic: 'SEO SEO SEO',
      target_keyword: 'SEO',
      final_html: '<h1>SEO SEO SEO</h1><p>SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO</p>',
      seo_metadata: null,
    };

    const result = calculateBlogPostSEOScore(stuffedPost);

    // Should detect keyword stuffing
    expect(result.issues.some(issue => issue.toLowerCase().includes('keyword density too high') || issue.toLowerCase().includes('stuffing'))).toBe(true);
  });

  test('rewards good meta optimization', () => {
    const result = calculateBlogPostSEOScore(mockBlogPost);

    // Meta optimization should score well
    expect(result.breakdown.metaOptimization).toBeGreaterThan(10);
  });

  test('penalizes short content', () => {
    const shortPost = {
      topic: 'Short Post',
      target_keyword: 'test',
      final_html: '<h1>Title</h1><p>This is a very short post with minimal content.</p>',
      seo_metadata: null,
      word_count_goal: 1500,
    };

    const result = calculateBlogPostSEOScore(shortPost);

    // Should have issues about content length
    expect(result.issues.some(issue => issue.toLowerCase().includes('content') && issue.toLowerCase().includes('short'))).toBe(true);
  });

  test('detects missing alt text on images', () => {
    const postWithBadImages = {
      topic: 'Test',
      target_keyword: 'test',
      final_html: '<h1>Title</h1><p>Content with images</p><img src="test.jpg"><img src="test2.jpg">',
      seo_metadata: null,
    };

    const result = calculateBlogPostSEOScore(postWithBadImages);

    // Should detect missing alt text
    expect(result.issues.some(issue => issue.toLowerCase().includes('alt'))).toBe(true);
  });

  test('getSEOQualityGrade returns correct grades', () => {
    expect(getSEOQualityGrade(95)).toBe('A');
    expect(getSEOQualityGrade(90)).toBe('A');
    expect(getSEOQualityGrade(85)).toBe('B');
    expect(getSEOQualityGrade(80)).toBe('B');
    expect(getSEOQualityGrade(75)).toBe('C');
    expect(getSEOQualityGrade(70)).toBe('C');
    expect(getSEOQualityGrade(65)).toBe('D');
    expect(getSEOQualityGrade(60)).toBe('D');
    expect(getSEOQualityGrade(55)).toBe('F');
    expect(getSEOQualityGrade(0)).toBe('F');
  });

  test('rewards proper heading structure', () => {
    const wellStructuredPost = {
      topic: 'Test',
      target_keyword: 'test',
      final_html: `
        <h1>Main Title</h1>
        <p>Introduction paragraph</p>
        <h2>Section 1</h2>
        <p>Content for section 1</p>
        <h2>Section 2</h2>
        <p>Content for section 2</p>
        <h3>Subsection 2.1</h3>
        <p>Subsection content</p>
        <h2>Section 3</h2>
        <p>More content</p>
      `,
      seo_metadata: null,
    };

    const result = calculateBlogPostSEOScore(wellStructuredPost);

    // Should have good content structure score
    expect(result.breakdown.contentStructure).toBeGreaterThan(5);
  });

  test('penalizes multiple H1 tags', () => {
    const multiH1Post = {
      topic: 'Test',
      target_keyword: 'test',
      final_html: '<h1>First Title</h1><h1>Second Title</h1><p>Content</p>',
      seo_metadata: null,
    };

    const result = calculateBlogPostSEOScore(multiH1Post);

    // Should have issue about multiple H1s
    expect(result.issues.some(issue => issue.toLowerCase().includes('multiple h1'))).toBe(true);
  });

  test('rewards internal linking', () => {
    const result = calculateBlogPostSEOScore(mockBlogPost);

    // Should get points for internal links
    expect(result.breakdown.technicalSEO).toBeGreaterThan(5);
  });
});
