/**
 * Gap Report PDF Generator
 * Uses jsPDF to create professional gap analysis reports
 */

import jsPDF from 'jspdf';
import { GapReportData } from './gap-report-generator';

/**
 * Generate PDF from gap report data
 * Returns PDF as base64 string
 */
export function generateGapReportPDF(report: GapReportData): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper function to add wrapped text
  const addText = (text: string, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, contentWidth);

    for (const line of lines) {
      checkPageBreak(fontSize * 0.5);
      doc.text(line, margin, yPos);
      yPos += fontSize * 0.5;
    }
  };

  // Title
  doc.setFontSize(24);
  doc.setTextColor(37, 99, 235); // Blue
  doc.text('Content Gap Analysis Report', margin, yPos);
  yPos += 12;

  // Website name
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(report.websiteName, margin, yPos);
  yPos += 8;

  // Date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date(report.generatedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, margin, yPos);
  yPos += 10;

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Executive Summary Section
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Executive Summary', margin, yPos);
  yPos += 8;

  // Score box
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, yPos, 60, 30, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('Current SEO Score', margin + 5, yPos + 8);
  doc.setFontSize(24);
  doc.text(`${report.overallScore}/100`, margin + 15, yPos + 22);

  // Improvement box
  doc.setFillColor(16, 185, 129);
  doc.rect(margin + 65, yPos, 60, 30, 'F');
  doc.setFontSize(12);
  doc.text('Est. Improvement', margin + 70, yPos + 8);
  doc.setFontSize(24);
  doc.text(`+${report.summary.estimatedImprovement}`, margin + 80, yPos + 22);

  yPos += 35;

  // Gap Statistics
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  addText(`Total Gaps Identified: ${report.summary.totalGaps}`, 12);
  yPos += 2;
  doc.setFontSize(10);
  doc.setTextColor(220, 38, 38); // Red
  addText(`  • High Severity: ${report.summary.highSeverityGaps}`, 10, false, [220, 38, 38]);
  yPos += 2;
  doc.setTextColor(234, 179, 8); // Yellow/Orange
  addText(`  • Medium Severity: ${report.summary.mediumSeverityGaps}`, 10, false, [234, 179, 8]);
  yPos += 2;
  doc.setTextColor(100, 100, 100); // Gray
  addText(`  • Low Severity: ${report.summary.lowSeverityGaps}`, 10, false, [100, 100, 100]);
  yPos += 10;

  // Priority Actions Section
  checkPageBreak(20);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Priority Actions', margin, yPos);
  yPos += 8;

  // Immediate Actions
  doc.setFontSize(12);
  doc.setTextColor(220, 38, 38);
  doc.text('IMMEDIATE (This Week)', margin, yPos);
  yPos += 6;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  report.prioritizedActions.immediate.forEach((action, i) => {
    checkPageBreak(15);
    const lines = doc.splitTextToSize(`${i + 1}. ${action}`, contentWidth - 5);
    lines.forEach((line: string) => {
      doc.text(line, margin + 3, yPos);
      yPos += 5;
    });
  });
  yPos += 5;

  // Short Term Actions
  checkPageBreak(20);
  doc.setFontSize(12);
  doc.setTextColor(234, 179, 8);
  doc.text('SHORT TERM (This Month)', margin, yPos);
  yPos += 6;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  report.prioritizedActions.shortTerm.slice(0, 3).forEach((action, i) => {
    checkPageBreak(15);
    const lines = doc.splitTextToSize(`${i + 1}. ${action}`, contentWidth - 5);
    lines.forEach((line: string) => {
      doc.text(line, margin + 3, yPos);
      yPos += 5;
    });
  });
  yPos += 5;

  // Long Term Actions
  checkPageBreak(20);
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('LONG TERM (Next Quarter)', margin, yPos);
  yPos += 6;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  report.prioritizedActions.longTerm.slice(0, 2).forEach((action, i) => {
    checkPageBreak(15);
    const lines = doc.splitTextToSize(`${i + 1}. ${action}`, contentWidth - 5);
    lines.forEach((line: string) => {
      doc.text(line, margin + 3, yPos);
      yPos += 5;
    });
  });
  yPos += 10;

  // Recommendations Section
  checkPageBreak(20);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Detailed Recommendations', margin, yPos);
  yPos += 8;

  report.recommendations.forEach((rec, i) => {
    checkPageBreak(25);

    // Category and title
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text(`${i + 1}. ${rec.category}`, margin, yPos);
    yPos += 6;

    // Recommendation text
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(rec.recommendation, contentWidth - 5);
    lines.forEach((line: string) => {
      checkPageBreak(5);
      doc.text(line, margin + 3, yPos);
      yPos += 5;
    });

    // Impact and effort badges
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Impact: ${rec.impact.toUpperCase()} | Effort: ${rec.effort.toUpperCase()}`, margin + 3, yPos);
    yPos += 8;
  });

  // Detailed Gaps Section
  checkPageBreak(20);
  doc.addPage();
  yPos = margin;
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Detailed Gap Analysis', margin, yPos);
  yPos += 10;

  report.gaps.slice(0, 10).forEach((gap, i) => {
    checkPageBreak(30);

    // Gap title with severity badge
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`${i + 1}. ${gap.title}`, margin, yPos);

    // Severity badge
    const severityColor = gap.severity === 'high' ? [220, 38, 38] :
                         gap.severity === 'medium' ? [234, 179, 8] : [100, 100, 100];
    doc.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
    doc.rect(margin + 100, yPos - 3, 20, 5, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(gap.severity.toUpperCase(), margin + 105, yPos);
    yPos += 6;

    // Description
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const descLines = doc.splitTextToSize(gap.description, contentWidth - 5);
    descLines.forEach((line: string) => {
      checkPageBreak(5);
      doc.text(line, margin + 3, yPos);
      yPos += 4;
    });
    yPos += 2;

    // Suggested action
    doc.setFontSize(9);
    doc.setTextColor(37, 99, 235);
    doc.text('Action:', margin + 3, yPos);
    doc.setTextColor(0, 0, 0);
    const actionLines = doc.splitTextToSize(gap.suggested_action, contentWidth - 20);
    actionLines.forEach((line: string) => {
      checkPageBreak(5);
      doc.text(line, margin + 18, yPos);
      yPos += 4;
    });

    yPos += 6;
  });

  // Footer on last page
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'Generated by BlogCanvas',
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // Return as base64 string
  return doc.output('datauristring');
}

/**
 * Generate PDF and return as buffer for download
 */
export function generateGapReportPDFBuffer(report: GapReportData): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Use same generation logic as above
  const base64 = generateGapReportPDF(report);

  // Convert base64 to buffer
  const base64Data = base64.split(',')[1];
  return Buffer.from(base64Data, 'base64');
}
