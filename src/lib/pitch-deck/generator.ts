/**
 * Pitch Deck PDF Generator
 * Generates professional pitch decks for SEO content proposals
 */

import jsPDF from 'jspdf';

export interface PitchDeckData {
  // Client info
  clientName: string;
  clientWebsite: string;
  contactName?: string;

  // Baseline metrics
  currentSeoScore: number;
  targetSeoScore: number;
  pagesIndexed: number;
  currentTopicCoverage: number; // percentage

  // Gap analysis
  topicGaps: {
    cluster: string;
    keyword: string;
    difficulty: number;
    estimatedTraffic: number;
    priority: 'high' | 'medium' | 'low';
  }[];

  // Proposal
  recommendedPosts: number;
  timelineMonths: number;
  postsPerMonth: number;
  proposedTopics?: string[]; // List of topic titles for the package

  // Pricing
  pricingTier?: string;
  monthlyPrice?: number;
  totalPrice?: number;

  // Projections (now with ranges)
  projectedTrafficIncrease: number; // percentage (conservative estimate)
  projectedTrafficIncreaseRange: {
    min: number;
    expected: number;
    max: number;
    confidence: 'low' | 'medium' | 'high';
  };
  projectedKeywordRankings: number; // conservative estimate
  projectedKeywordRankingsRange: {
    min: number;
    expected: number;
    max: number;
    confidence: 'low' | 'medium' | 'high';
  };

  // Vendor info
  vendorName: string;
  vendorLogo?: string;
  csmName: string;
  csmEmail: string;

  // Date
  generatedDate: string;
}

export interface SlideContent {
  title: string;
  content: string[];
  type: 'title' | 'metrics' | 'gaps' | 'proposal' | 'timeline' | 'next-steps';
}

// Colors
const COLORS = {
  primary: '#4F46E5', // Indigo
  secondary: '#7C3AED', // Purple  
  accent: '#06B6D4', // Cyan
  success: '#10B981', // Green
  warning: '#F59E0B', // Amber
  danger: '#EF4444', // Red
  dark: '#1F2937',
  light: '#F9FAFB',
  muted: '#6B7280',
};

export class PitchDeckGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 40;
  
  constructor() {
    this.doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'letter'
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  generate(data: PitchDeckData): Blob {
    // Slide 1: Title
    this.createTitleSlide(data);

    // Slide 2: Current State
    this.doc.addPage();
    this.createCurrentStateSlide(data);

    // Slide 3: Topic Gaps
    this.doc.addPage();
    this.createGapAnalysisSlide(data);

    // Slide 4: Our Proposal
    this.doc.addPage();
    this.createProposalSlide(data);

    // Slide 5: Blog Package Details (NEW)
    this.doc.addPage();
    this.createPackageDetailsSlide(data);

    // Slide 6: Expected Results
    this.doc.addPage();
    this.createResultsSlide(data);

    // Slide 7: Next Steps
    this.doc.addPage();
    this.createNextStepsSlide(data);

    return this.doc.output('blob');
  }

  private createTitleSlide(data: PitchDeckData) {
    // Background gradient effect (simplified)
    this.doc.setFillColor(79, 70, 229); // Primary
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    
    // Accent bar
    this.doc.setFillColor(124, 58, 237); // Secondary
    this.doc.rect(0, this.pageHeight - 100, this.pageWidth, 100, 'F');
    
    // Title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(42);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SEO Content Strategy', this.pageWidth / 2, 180, { align: 'center' });
    
    // Subtitle
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`for ${data.clientName}`, this.pageWidth / 2, 230, { align: 'center' });
    
    // Tagline
    this.doc.setFontSize(18);
    this.doc.setTextColor(200, 200, 255);
    this.doc.text('A data-driven approach to organic growth', this.pageWidth / 2, 280, { align: 'center' });
    
    // Date and presenter
    this.doc.setFontSize(14);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(`Prepared by: ${data.csmName}`, this.margin, this.pageHeight - 60);
    this.doc.text(`${data.vendorName}`, this.margin, this.pageHeight - 40);
    this.doc.text(data.generatedDate, this.pageWidth - this.margin, this.pageHeight - 50, { align: 'right' });
  }

  private createCurrentStateSlide(data: PitchDeckData) {
    this.drawSlideHeader('Current SEO Performance');
    
    const startY = 140;
    const colWidth = (this.pageWidth - this.margin * 3) / 2;
    
    // Left column - Score gauge
    this.doc.setFillColor(249, 250, 251);
    this.doc.roundedRect(this.margin, startY, colWidth, 280, 10, 10, 'F');
    
    this.doc.setTextColor(31, 41, 55);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SEO Score', this.margin + colWidth / 2, startY + 40, { align: 'center' });
    
    // Current score
    this.doc.setFontSize(72);
    const scoreColor = data.currentSeoScore >= 70 ? COLORS.success : 
                       data.currentSeoScore >= 50 ? COLORS.warning : COLORS.danger;
    this.doc.setTextColor(scoreColor);
    this.doc.text(`${data.currentSeoScore}`, this.margin + colWidth / 2, startY + 130, { align: 'center' });
    
    this.doc.setFontSize(16);
    this.doc.setTextColor(107, 114, 128);
    this.doc.text('out of 100', this.margin + colWidth / 2, startY + 160, { align: 'center' });
    
    // Target arrow
    this.doc.setFontSize(14);
    this.doc.setTextColor(79, 70, 229);
    this.doc.text(`Target: ${data.targetSeoScore}`, this.margin + colWidth / 2, startY + 200, { align: 'center' });
    
    // Improvement needed
    const improvement = data.targetSeoScore - data.currentSeoScore;
    this.doc.setFontSize(12);
    this.doc.setTextColor(16, 185, 129);
    this.doc.text(`+${improvement} points needed`, this.margin + colWidth / 2, startY + 230, { align: 'center' });
    
    // Right column - Key metrics
    const rightX = this.margin * 2 + colWidth;
    this.doc.setFillColor(249, 250, 251);
    this.doc.roundedRect(rightX, startY, colWidth, 280, 10, 10, 'F');
    
    this.doc.setTextColor(31, 41, 55);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Key Metrics', rightX + colWidth / 2, startY + 40, { align: 'center' });
    
    // Metrics list
    const metrics = [
      { label: 'Pages Indexed', value: data.pagesIndexed.toString() },
      { label: 'Topic Coverage', value: `${data.currentTopicCoverage}%` },
      { label: 'Content Gaps', value: data.topicGaps.length.toString() },
      { label: 'High Priority Gaps', value: data.topicGaps.filter(g => g.priority === 'high').length.toString() }
    ];
    
    let metricY = startY + 80;
    metrics.forEach((metric) => {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(107, 114, 128);
      this.doc.text(metric.label, rightX + 30, metricY);
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(31, 41, 55);
      this.doc.text(metric.value, rightX + colWidth - 30, metricY, { align: 'right' });
      
      metricY += 45;
    });
    
    // Website
    this.doc.setFontSize(12);
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(`Website: ${data.clientWebsite}`, this.margin, this.pageHeight - 50);
  }

  private createGapAnalysisSlide(data: PitchDeckData) {
    this.drawSlideHeader('Content Gap Analysis');
    
    const startY = 140;
    const tableWidth = this.pageWidth - this.margin * 2;
    const colWidths = [tableWidth * 0.3, tableWidth * 0.3, tableWidth * 0.15, tableWidth * 0.15, tableWidth * 0.1];
    
    // Table header
    this.doc.setFillColor(79, 70, 229);
    this.doc.rect(this.margin, startY, tableWidth, 35, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    
    let headerX = this.margin + 10;
    ['Topic Cluster', 'Target Keyword', 'Difficulty', 'Est. Traffic', 'Priority'].forEach((header, i) => {
      this.doc.text(header, headerX, startY + 23);
      headerX += colWidths[i];
    });
    
    // Table rows (show top 6 gaps)
    const gaps = data.topicGaps.slice(0, 6);
    let rowY = startY + 35;
    
    gaps.forEach((gap, index) => {
      // Alternating row colors
      if (index % 2 === 0) {
        this.doc.setFillColor(249, 250, 251);
        this.doc.rect(this.margin, rowY, tableWidth, 35, 'F');
      }
      
      this.doc.setTextColor(31, 41, 55);
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      
      let cellX = this.margin + 10;
      
      // Cluster
      this.doc.text(gap.cluster.substring(0, 30), cellX, rowY + 22);
      cellX += colWidths[0];
      
      // Keyword
      this.doc.text(gap.keyword.substring(0, 30), cellX, rowY + 22);
      cellX += colWidths[1];
      
      // Difficulty
      const diffColor = gap.difficulty <= 30 ? COLORS.success : 
                        gap.difficulty <= 60 ? COLORS.warning : COLORS.danger;
      this.doc.setTextColor(diffColor);
      this.doc.text(`${gap.difficulty}/100`, cellX, rowY + 22);
      cellX += colWidths[2];
      
      // Traffic
      this.doc.setTextColor(31, 41, 55);
      this.doc.text(`${gap.estimatedTraffic.toLocaleString()}/mo`, cellX, rowY + 22);
      cellX += colWidths[3];
      
      // Priority badge
      const priorityColor = gap.priority === 'high' ? COLORS.danger : 
                           gap.priority === 'medium' ? COLORS.warning : COLORS.muted;
      this.doc.setTextColor(priorityColor);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(gap.priority.toUpperCase(), cellX, rowY + 22);
      
      rowY += 35;
    });
    
    // Summary
    if (data.topicGaps.length > 6) {
      this.doc.setTextColor(107, 114, 128);
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text(`+ ${data.topicGaps.length - 6} more topic gaps identified`, this.margin, rowY + 30);
    }
    
    // Total traffic potential
    const totalTraffic = data.topicGaps.reduce((sum, g) => sum + g.estimatedTraffic, 0);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(79, 70, 229);
    this.doc.text(
      `Total Traffic Potential: ${totalTraffic.toLocaleString()} monthly searches`,
      this.pageWidth - this.margin,
      this.pageHeight - 50,
      { align: 'right' }
    );
  }

  private createProposalSlide(data: PitchDeckData) {
    this.drawSlideHeader('Our Proposal');
    
    const startY = 140;
    const cardWidth = (this.pageWidth - this.margin * 4) / 3;
    
    // Card 1: Blog Posts
    this.drawProposalCard(
      this.margin,
      startY,
      cardWidth,
      data.recommendedPosts.toString(),
      'Blog Posts',
      'High-quality, SEO-optimized articles targeting your content gaps',
      COLORS.primary
    );
    
    // Card 2: Timeline
    this.drawProposalCard(
      this.margin * 2 + cardWidth,
      startY,
      cardWidth,
      `${data.timelineMonths}`,
      'Months',
      `Delivered at ${data.postsPerMonth} posts per month for consistent growth`,
      COLORS.secondary
    );
    
    // Card 3: Target Score
    this.drawProposalCard(
      this.margin * 3 + cardWidth * 2,
      startY,
      cardWidth,
      data.targetSeoScore.toString(),
      'Target SEO Score',
      `From ${data.currentSeoScore} → ${data.targetSeoScore} (+${data.targetSeoScore - data.currentSeoScore} points)`,
      COLORS.success
    );
    
    // Process description
    const processY = startY + 220;
    this.doc.setFillColor(249, 250, 251);
    this.doc.roundedRect(this.margin, processY, this.pageWidth - this.margin * 2, 120, 10, 10, 'F');
    
    this.doc.setTextColor(31, 41, 55);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Our Process', this.margin + 20, processY + 30);
    
    const steps = [
      '1. AI-powered research & outline generation',
      '2. Expert human review & fact-checking',
      '3. SEO optimization & quality scoring',
      '4. Client approval via dedicated portal',
      '5. Direct publish to your WordPress'
    ];
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    let stepX = this.margin + 20;
    steps.forEach((step, i) => {
      if (i === 3) {
        stepX = this.margin + 20;
      }
      const stepY = i < 3 ? processY + 60 : processY + 85;
      this.doc.text(step, stepX, stepY);
      stepX += 200;
    });
  }

  private drawProposalCard(x: number, y: number, width: number, value: string, label: string, description: string, color: string) {
    // Card background
    this.doc.setFillColor(255, 255, 255);
    this.doc.roundedRect(x, y, width, 180, 10, 10, 'F');

    // Border
    this.doc.setDrawColor(color);
    this.doc.setLineWidth(3);
    this.doc.roundedRect(x, y, width, 180, 10, 10, 'S');

    // Value
    this.doc.setTextColor(color);
    this.doc.setFontSize(48);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(value, x + width / 2, y + 70, { align: 'center' });

    // Label
    this.doc.setTextColor(31, 41, 55);
    this.doc.setFontSize(16);
    this.doc.text(label, x + width / 2, y + 100, { align: 'center' });

    // Description
    this.doc.setTextColor(107, 114, 128);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(description, width - 20);
    this.doc.text(lines, x + width / 2, y + 130, { align: 'center' });
  }

  private createPackageDetailsSlide(data: PitchDeckData) {
    this.drawSlideHeader('Blog Package Details');

    const startY = 140;
    const colWidth = (this.pageWidth - this.margin * 3) / 2;

    // Left column - Topic list
    this.doc.setFillColor(249, 250, 251);
    this.doc.roundedRect(this.margin, startY, colWidth, 340, 10, 10, 'F');

    this.doc.setTextColor(31, 41, 55);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Proposed Blog Topics', this.margin + 20, startY + 30);

    this.doc.setFontSize(11);
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(`${data.recommendedPosts} SEO-optimized articles`, this.margin + 20, startY + 50);

    // Topic list (show up to 12 topics)
    const topics = data.proposedTopics || data.topicGaps.map(g => g.cluster).slice(0, 12);
    const displayTopics = topics.slice(0, 12);

    let topicY = startY + 75;
    displayTopics.forEach((topic, index) => {
      // Topic number badge
      this.doc.setFillColor(79, 70, 229);
      this.doc.circle(this.margin + 30, topicY + 5, 8, 'F');

      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}`, this.margin + 30, topicY + 8, { align: 'center' });

      // Topic title
      this.doc.setTextColor(31, 41, 55);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      const truncated = topic.length > 50 ? topic.substring(0, 50) + '...' : topic;
      this.doc.text(truncated, this.margin + 45, topicY + 8);

      topicY += 20;
    });

    if (data.recommendedPosts > displayTopics.length) {
      this.doc.setTextColor(107, 114, 128);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text(`+ ${data.recommendedPosts - displayTopics.length} more topics`, this.margin + 45, topicY + 5);
    }

    // Right column - Package summary & pricing
    const rightX = this.margin * 2 + colWidth;
    this.doc.setFillColor(249, 250, 251);
    this.doc.roundedRect(rightX, startY, colWidth, 340, 10, 10, 'F');

    this.doc.setTextColor(31, 41, 55);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Package Summary', rightX + 20, startY + 30);

    // Package details
    const details = [
      { label: 'Total Blog Posts', value: `${data.recommendedPosts} articles` },
      { label: 'Timeline', value: `${data.timelineMonths} months` },
      { label: 'Cadence', value: `${data.postsPerMonth} posts/month` },
      { label: 'Target SEO Score', value: `${data.currentSeoScore} → ${data.targetSeoScore}` }
    ];

    let detailY = startY + 65;
    details.forEach((detail) => {
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(79, 70, 229);
      this.doc.text(detail.label, rightX + 20, detailY);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(31, 41, 55);
      this.doc.text(detail.value, rightX + colWidth - 20, detailY, { align: 'right' });

      detailY += 30;
    });

    // Pricing section
    if (data.pricingTier || data.monthlyPrice || data.totalPrice) {
      detailY += 20;

      // Divider line
      this.doc.setDrawColor(200, 200, 200);
      this.doc.setLineWidth(1);
      this.doc.line(rightX + 20, detailY, rightX + colWidth - 20, detailY);

      detailY += 30;

      this.doc.setTextColor(31, 41, 55);
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Investment', rightX + 20, detailY);

      detailY += 30;

      if (data.pricingTier) {
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(79, 70, 229);
        this.doc.text(data.pricingTier, rightX + 20, detailY);
        detailY += 25;
      }

      if (data.monthlyPrice) {
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(31, 41, 55);
        this.doc.text('Monthly:', rightX + 20, detailY);

        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(16, 185, 129);
        this.doc.text(`$${data.monthlyPrice.toLocaleString()}/mo`, rightX + colWidth - 20, detailY, { align: 'right' });
        detailY += 25;
      }

      if (data.totalPrice) {
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(31, 41, 55);
        this.doc.text('Total Investment:', rightX + 20, detailY);

        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(14);
        this.doc.setTextColor(79, 70, 229);
        this.doc.text(`$${data.totalPrice.toLocaleString()}`, rightX + colWidth - 20, detailY, { align: 'right' });
      }
    }

    // What's included
    const includedY = startY + 260;
    this.doc.setFillColor(79, 70, 229, 0.05);
    this.doc.roundedRect(rightX, includedY, colWidth, 80, 10, 10, 'F');

    this.doc.setTextColor(31, 41, 55);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('What\'s Included:', rightX + 20, includedY + 20);

    const included = [
      'AI-powered research & outlines',
      'Expert writing & fact-checking',
      'SEO optimization & scoring',
      'Direct WordPress publishing'
    ];

    let includedItemY = includedY + 40;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    included.forEach((item) => {
      this.doc.setTextColor(16, 185, 129);
      this.doc.text('✓', rightX + 20, includedItemY);

      this.doc.setTextColor(31, 41, 55);
      this.doc.text(item, rightX + 35, includedItemY);

      includedItemY += 15;
    });
  }

  private createResultsSlide(data: PitchDeckData) {
    this.drawSlideHeader('Expected Results');

    const startY = 140;
    const colWidth = (this.pageWidth - this.margin * 3) / 2;

    // Left: Traffic projection with range
    this.doc.setFillColor(16, 185, 129, 0.1);
    this.doc.roundedRect(this.margin, startY, colWidth, 240, 10, 10, 'F');

    this.doc.setTextColor(16, 185, 129);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ORGANIC TRAFFIC INCREASE', this.margin + colWidth / 2, startY + 30, { align: 'center' });

    // Expected value (main number)
    this.doc.setFontSize(56);
    this.doc.text(`+${data.projectedTrafficIncreaseRange.expected}%`, this.margin + colWidth / 2, startY + 90, { align: 'center' });

    // Range display
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(
      `Range: ${data.projectedTrafficIncreaseRange.min}% - ${data.projectedTrafficIncreaseRange.max}%`,
      this.margin + colWidth / 2,
      startY + 130,
      { align: 'center' }
    );

    // Confidence indicator
    const confidenceColor = data.projectedTrafficIncreaseRange.confidence === 'high' ? COLORS.success :
                           data.projectedTrafficIncreaseRange.confidence === 'medium' ? COLORS.warning : COLORS.muted;
    this.doc.setTextColor(confidenceColor);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      `${data.projectedTrafficIncreaseRange.confidence.toUpperCase()} CONFIDENCE`,
      this.margin + colWidth / 2,
      startY + 155,
      { align: 'center' }
    );

    // Timeline
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(
      `over ${data.timelineMonths}-month campaign period`,
      this.margin + colWidth / 2,
      startY + 180,
      { align: 'center' }
    );

    // Right: Keyword rankings with range
    const rightX = this.margin * 2 + colWidth;
    this.doc.setFillColor(79, 70, 229, 0.1);
    this.doc.roundedRect(rightX, startY, colWidth, 240, 10, 10, 'F');

    this.doc.setTextColor(79, 70, 229);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('NEW KEYWORD RANKINGS', rightX + colWidth / 2, startY + 30, { align: 'center' });

    // Expected value (main number)
    this.doc.setFontSize(56);
    this.doc.text(`${data.projectedKeywordRankingsRange.expected}+`, rightX + colWidth / 2, startY + 90, { align: 'center' });

    // Range display
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(
      `Range: ${data.projectedKeywordRankingsRange.min} - ${data.projectedKeywordRankingsRange.max}`,
      rightX + colWidth / 2,
      startY + 130,
      { align: 'center' }
    );

    // Confidence indicator
    const kwConfidenceColor = data.projectedKeywordRankingsRange.confidence === 'high' ? COLORS.success :
                              data.projectedKeywordRankingsRange.confidence === 'medium' ? COLORS.warning : COLORS.muted;
    this.doc.setTextColor(kwConfidenceColor);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      `${data.projectedKeywordRankingsRange.confidence.toUpperCase()} CONFIDENCE`,
      rightX + colWidth / 2,
      startY + 155,
      { align: 'center' }
    );

    // Context
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(
      'keywords ranking on page 1 of Google',
      rightX + colWidth / 2,
      startY + 180,
      { align: 'center' }
    );
    
    // Bottom benefits
    const benefitsY = startY + 230;
    const benefits = [
      { icon: '✓', text: 'Increased brand visibility in your target market' },
      { icon: '✓', text: 'Higher quality leads through intent-matched content' },
      { icon: '✓', text: 'Compounding returns as content ages and gains authority' },
      { icon: '✓', text: 'Reduced dependency on paid advertising' }
    ];
    
    this.doc.setFontSize(13);
    let benefitY = benefitsY;
    benefits.forEach((benefit) => {
      this.doc.setTextColor(16, 185, 129);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(benefit.icon, this.margin + 20, benefitY);
      
      this.doc.setTextColor(31, 41, 55);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(benefit.text, this.margin + 40, benefitY);
      
      benefitY += 25;
    });
  }

  private createNextStepsSlide(data: PitchDeckData) {
    this.drawSlideHeader('Next Steps');
    
    const startY = 140;
    
    // Steps
    const steps = [
      { num: '1', title: 'Review & Approve', desc: 'Review this proposal and let us know if you have any questions' },
      { num: '2', title: 'Finalize Topics', desc: 'We\'ll finalize the topic list and content calendar together' },
      { num: '3', title: 'Kickoff', desc: 'Content production begins with regular progress updates' },
      { num: '4', title: 'Review & Publish', desc: 'Review each piece in your client portal before we publish' }
    ];
    
    const stepWidth = (this.pageWidth - this.margin * 2 - 60) / 4;
    let stepX = this.margin;
    
    steps.forEach((step, i) => {
      // Step circle
      this.doc.setFillColor(79, 70, 229);
      this.doc.circle(stepX + stepWidth / 2, startY + 30, 25, 'F');
      
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(20);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(step.num, stepX + stepWidth / 2, startY + 37, { align: 'center' });
      
      // Connector line
      if (i < steps.length - 1) {
        this.doc.setDrawColor(79, 70, 229);
        this.doc.setLineWidth(2);
        this.doc.line(stepX + stepWidth / 2 + 25, startY + 30, stepX + stepWidth + 20 - 25, startY + 30);
      }
      
      // Title
      this.doc.setTextColor(31, 41, 55);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(step.title, stepX + stepWidth / 2, startY + 80, { align: 'center' });
      
      // Description
      this.doc.setTextColor(107, 114, 128);
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      const lines = this.doc.splitTextToSize(step.desc, stepWidth - 10);
      this.doc.text(lines, stepX + stepWidth / 2, startY + 100, { align: 'center' });
      
      stepX += stepWidth + 20;
    });
    
    // Contact card
    const contactY = startY + 180;
    this.doc.setFillColor(79, 70, 229);
    this.doc.roundedRect(this.margin, contactY, this.pageWidth - this.margin * 2, 120, 10, 10, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Ready to get started?', this.pageWidth / 2, contactY + 35, { align: 'center' });
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Contact ${data.csmName} at ${data.csmEmail}`, this.pageWidth / 2, contactY + 65, { align: 'center' });
    
    this.doc.setFontSize(12);
    this.doc.setTextColor(200, 200, 255);
    this.doc.text('Schedule a call to discuss this proposal and answer any questions', this.pageWidth / 2, contactY + 90, { align: 'center' });
  }

  private drawSlideHeader(title: string) {
    // White background
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    
    // Header bar
    this.doc.setFillColor(79, 70, 229);
    this.doc.rect(0, 0, this.pageWidth, 80, 'F');
    
    // Title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, 52);
  }
}

/**
 * Generate pitch deck from website audit data
 */
export function generatePitchDeckData(
  client: { name: string; website_url?: string },
  audit: { baseline_score?: number; pages_indexed?: number },
  topicClusters: any[],
  vendorInfo: { name: string; csmName: string; csmEmail: string },
  targetScore: number = 80,
  timelineMonths: number = 6
): PitchDeckData {
  const currentScore = audit.baseline_score || 50;
  const gaps = topicClusters.filter(t => !t.currently_covered).map(t => ({
    cluster: t.name || 'Unnamed Cluster',
    keyword: t.primary_keyword || t.name || '',
    difficulty: t.difficulty || 50,
    estimatedTraffic: t.estimated_traffic || 1000,
    priority: (t.difficulty <= 40 && t.estimated_traffic >= 1000 ? 'high' : 
               t.difficulty <= 60 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
  }));
  
  const recommendedPosts = Math.max(gaps.length, Math.ceil((targetScore - currentScore) * 1.5));
  const postsPerMonth = Math.ceil(recommendedPosts / timelineMonths);

  // Calculate pricing based on post count and timeline
  // Pricing tiers: Basic ($500/post), Standard ($400/post), Premium ($350/post for 20+)
  let pricePerPost = 500;
  let pricingTier = 'Basic Package';

  if (recommendedPosts >= 20) {
    pricePerPost = 350;
    pricingTier = 'Premium Package';
  } else if (recommendedPosts >= 10) {
    pricePerPost = 400;
    pricingTier = 'Standard Package';
  }

  const totalPrice = recommendedPosts * pricePerPost;
  const monthlyPrice = Math.round(totalPrice / timelineMonths);

  // Generate proposed topics list from gaps
  const proposedTopics = gaps.map(g => g.cluster);

  // Calculate expected outcome ranges with confidence intervals
  const scoreImprovement = targetScore - currentScore;

  // Traffic increase calculation with range
  // Base multiplier: 2.5% increase per SEO point improvement
  const baseTrafficMultiplier = 2.5;
  const expectedTrafficIncrease = Math.round(scoreImprovement * baseTrafficMultiplier);

  // Confidence based on number of posts and timeline
  // High confidence: 15+ posts over 6+ months
  // Medium confidence: 8-14 posts or 3-5 months
  // Low confidence: <8 posts or <3 months
  const isHighConfidence = recommendedPosts >= 15 && timelineMonths >= 6;
  const isMediumConfidence = (recommendedPosts >= 8 || timelineMonths >= 3) && !isHighConfidence;
  const trafficConfidence = isHighConfidence ? 'high' as const :
                           isMediumConfidence ? 'medium' as const :
                           'low' as const;

  // Range variance based on confidence
  const trafficVariance = trafficConfidence === 'high' ? 0.2 :    // ±20%
                         trafficConfidence === 'medium' ? 0.3 :   // ±30%
                         0.4;                                      // ±40%

  const trafficMin = Math.round(expectedTrafficIncrease * (1 - trafficVariance));
  const trafficMax = Math.round(expectedTrafficIncrease * (1 + trafficVariance));

  // Keyword rankings calculation with range
  // Base: 70% of posts achieve page 1 rankings
  const baseKeywordMultiplier = 0.7;
  const expectedKeywordRankings = Math.round(recommendedPosts * baseKeywordMultiplier);

  // Confidence based on gap difficulty distribution
  const avgDifficulty = gaps.reduce((sum, g) => sum + g.difficulty, 0) / Math.max(gaps.length, 1);
  const keywordConfidence = avgDifficulty <= 40 ? 'high' as const :
                           avgDifficulty <= 60 ? 'medium' as const :
                           'low' as const;

  // Range variance based on difficulty
  const keywordVariance = keywordConfidence === 'high' ? 0.15 :   // ±15%
                         keywordConfidence === 'medium' ? 0.25 :  // ±25%
                         0.35;                                     // ±35%

  const keywordMin = Math.round(expectedKeywordRankings * (1 - keywordVariance));
  const keywordMax = Math.round(expectedKeywordRankings * (1 + keywordVariance));

  return {
    clientName: client.name,
    clientWebsite: client.website_url || '',
    currentSeoScore: currentScore,
    targetSeoScore: targetScore,
    pagesIndexed: audit.pages_indexed || 0,
    currentTopicCoverage: Math.round((topicClusters.filter(t => t.currently_covered).length / Math.max(topicClusters.length, 1)) * 100),
    topicGaps: gaps,
    recommendedPosts,
    timelineMonths,
    postsPerMonth,
    proposedTopics,
    pricingTier,
    monthlyPrice,
    totalPrice,
    // Legacy single values (conservative estimates - use min values)
    projectedTrafficIncrease: trafficMin,
    projectedKeywordRankings: keywordMin,
    // New range values with confidence
    projectedTrafficIncreaseRange: {
      min: trafficMin,
      expected: expectedTrafficIncrease,
      max: trafficMax,
      confidence: trafficConfidence
    },
    projectedKeywordRankingsRange: {
      min: keywordMin,
      expected: expectedKeywordRankings,
      max: keywordMax,
      confidence: keywordConfidence
    },
    vendorName: vendorInfo.name,
    csmName: vendorInfo.csmName,
    csmEmail: vendorInfo.csmEmail,
    generatedDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };
}
