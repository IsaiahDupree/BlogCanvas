/**
 * PDF Report Generation
 * Generates PDF reports for various entities (pitches, analytics, invoices)
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface PDFReportOptions {
  title: string
  subtitle?: string
  author?: string
  metadata?: Record<string, any>
}

export interface PDFSection {
  heading: string
  content: string | string[]
}

export interface PDFTableData {
  headers: string[]
  rows: (string | number)[][]
}

/**
 * Create a basic PDF document
 */
export function createPDF(options: PDFReportOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Set document properties
  doc.setProperties({
    title: options.title,
    author: options.author || 'BlogCanvas',
    creator: 'BlogCanvas Platform'
  })

  return doc
}

/**
 * Add header to PDF
 */
export function addHeader(doc: jsPDF, title: string, subtitle?: string): void {
  // Add logo or company name
  doc.setFontSize(20)
  doc.setTextColor(30, 30, 30)
  doc.text('BlogCanvas', 20, 20)

  // Add title
  doc.setFontSize(16)
  doc.text(title, 20, 35)

  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(subtitle, 20, 42)
  }

  // Add horizontal line
  doc.setDrawColor(200, 200, 200)
  doc.line(20, 48, 190, 48)
}

/**
 * Add section to PDF
 */
export function addSection(
  doc: jsPDF,
  section: PDFSection,
  yPosition: number
): number {
  // Section heading
  doc.setFontSize(14)
  doc.setTextColor(30, 30, 30)
  doc.text(section.heading, 20, yPosition)

  // Section content
  doc.setFontSize(11)
  doc.setTextColor(60, 60, 60)

  const content = Array.isArray(section.content)
    ? section.content
    : [section.content]

  let currentY = yPosition + 7

  content.forEach((line) => {
    const lines = doc.splitTextToSize(line, 170)
    doc.text(lines, 20, currentY)
    currentY += lines.length * 5
  })

  return currentY + 5
}

/**
 * Add table to PDF
 */
export function addTable(
  doc: jsPDF,
  data: PDFTableData,
  yPosition: number
): number {
  autoTable(doc, {
    startY: yPosition,
    head: [data.headers],
    body: data.rows,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    }
  })

  return (doc as any).lastAutoTable.finalY + 10
}

/**
 * Add footer with page numbers
 */
export function addFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }
}

/**
 * Generate a pitch report PDF
 */
export async function generatePitchReportPDF(
  pitchData: any
): Promise<Blob> {
  const doc = createPDF({
    title: `Pitch Report - ${pitchData.title}`,
    author: 'BlogCanvas'
  })

  addHeader(doc, 'Pitch Report', `Generated: ${new Date().toLocaleDateString()}`)

  let yPos = 60

  // Pitch Details
  yPos = addSection(doc, {
    heading: 'Pitch Details',
    content: [
      `Title: ${pitchData.title}`,
      `Website: ${pitchData.website}`,
      `Target Audience: ${pitchData.targetAudience}`,
      `Estimated Cost: $${pitchData.estimatedCost}`
    ]
  }, yPos)

  // Topics Table
  if (pitchData.topics && pitchData.topics.length > 0) {
    yPos = addTable(doc, {
      headers: ['Topic', 'Keyword', 'Word Count'],
      rows: pitchData.topics.map((t: any) => [
        t.topic,
        t.keyword,
        t.wordCount
      ])
    }, yPos)
  }

  // Add footer
  addFooter(doc)

  // Return as blob
  return doc.output('blob')
}

/**
 * Generate analytics report PDF
 */
export async function generateAnalyticsReportPDF(
  analyticsData: any
): Promise<Blob> {
  const doc = createPDF({
    title: `Analytics Report - ${analyticsData.period}`,
    author: 'BlogCanvas'
  })

  addHeader(doc, 'Analytics Report', `Period: ${analyticsData.period}`)

  let yPos = 60

  // Summary metrics
  yPos = addSection(doc, {
    heading: 'Performance Summary',
    content: [
      `Total Pageviews: ${analyticsData.totalPageviews.toLocaleString()}`,
      `Unique Visitors: ${analyticsData.uniqueVisitors.toLocaleString()}`,
      `Average Time on Page: ${analyticsData.avgTimeOnPage}s`,
      `Bounce Rate: ${analyticsData.bounceRate}%`
    ]
  }, yPos)

  // Top performing posts
  if (analyticsData.topPosts && analyticsData.topPosts.length > 0) {
    yPos = addTable(doc, {
      headers: ['Post Title', 'Views', 'Clicks'],
      rows: analyticsData.topPosts.map((p: any) => [
        p.title,
        p.views,
        p.clicks
      ])
    }, yPos)
  }

  addFooter(doc)
  return doc.output('blob')
}

/**
 * Download PDF file
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
