# PRD: Pitch & Report Generator Specification

**Version:** 1.0  
**Date:** January 15, 2026  
**Status:** Specification  
**Epic:** Epic 2 (Plan Builder) & Epic 6 (Analytics & Reporting)

---

## Overview

The Pitch & Report Generator enables CSMs to create professional client-facing documents for sales proposals and performance reporting. This includes PDF pitch decks, email templates, and monthly performance reports.

---

## User Stories

### Pitch Generation (Epic 2)
1. **As a CSM**, I can click "Generate Pitch" to get a downloadable PDF + email draft I can send to the client.

2. **As a CSM**, I can drag a "SEO score slider" from 62 → 78 and see a recommended number of posts and months required.

3. **As a CSM**, I can customize the pitch with client-specific messaging before downloading.

### Report Generation (Epic 6)
4. **As a CSM**, I can click "Generate Monthly Report" to get baseline vs. current SEO score, top gainers, and recommended next steps.

5. **As a CSM**, I can choose a reporting period and see traffic and keyword performance for all posts.

6. **As a CSM**, I can generate reports as PDF, slide deck, or email format.

---

## Part 1: Pitch Generator

### 1.1 Pitch Builder UI

**Location:** Website detail page → "Pitch Builder" tab

```
┌─────────────────────────────────────────────────────────────────────┐
│  Pitch Builder                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Current State                         Target State                 │
│  ┌─────────────────────┐               ┌─────────────────────┐     │
│  │ SEO Score: 62       │    ──────▶    │ SEO Score: 78       │     │
│  │ ████████░░░░░░░░░░  │               │ █████████████░░░░░  │     │
│  │                     │               │                     │     │
│  │ Topics Covered: 12  │               │ Topics Covered: 35  │     │
│  │ Monthly Traffic: 2k │               │ Monthly Traffic: 8k │     │
│  └─────────────────────┘               └─────────────────────┘     │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Target SEO Score                                             │   │
│  │ 62 ════════════════════●══════════════════════════════ 100   │   │
│  │                       78                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Recommended Plan:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📝 36 blog posts over 6 months                               │   │
│  │ 📅 6 posts per month cadence                                 │   │
│  │ 📈 Expected traffic increase: +300%                          │   │
│  │ 🎯 23 new topic clusters to cover                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [Generate Pitch PDF]  [Generate Email Draft]  [Create Batch]       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Pitch PDF Template

**Sections:**

1. **Cover Page**
   - Client logo/name
   - "SEO Content Strategy Proposal"
   - Date & prepared by

2. **Executive Summary**
   - Current SEO health snapshot
   - Opportunity overview
   - Recommended investment

3. **Current State Analysis**
   - SEO score breakdown
   - Topic coverage gaps (visual)
   - Competitor comparison

4. **Content Gaps Identified**
   - Topic clusters not covered
   - Keyword opportunities
   - Estimated traffic potential per cluster

5. **Proposed Content Plan**
   - Number of posts
   - Timeline (months)
   - Topics/keywords list
   - Expected outcomes

6. **ROI Projection**
   - Traffic growth forecast
   - SEO score improvement curve
   - Industry benchmarks

7. **Investment & Next Steps**
   - Package pricing (if applicable)
   - Timeline to start
   - Call-to-action

### 1.3 Email Template

**Subject:** SEO Content Plan to Grow [Client Name]'s Organic Reach

```
Hi [Contact Name],

We ran an SEO and content audit on [website]. Right now, your content sits 
around an overall SEO score of [current_score]/100, with strong coverage 
in [strengths], but untapped opportunities in:

– [Gap Cluster 1]
– [Gap Cluster 2]  
– [Gap Cluster 3]

Based on your goals, we recommend a [post_count]-post blog package over 
the next [months] months. This would:

– Fill critical topic gaps in [industry]
– Target keywords with a combined est. traffic potential of [traffic] 
  monthly searches
– Realistically move your SEO score from [current] → [target] over the 
  campaign window

Our system will:
– Generate high-quality, fact-checked, SEO-optimized blogs tailored to 
  your brand voice
– Route everything through human review before you ever see it
– Push approved posts directly to your WordPress
– Track performance and send you clear, non-fluffy reports each month

If you'd like, I can walk you through the proposed topics and forecast 
in a quick call this week.

Best,
[CSM Name]

---
[Attached: SEO_Content_Proposal_[ClientName].pdf]
```

### 1.4 Pitch API Endpoints

```typescript
// Generate pitch data
POST /api/websites/{websiteId}/pitch/generate
Body: {
  targetScore: number,        // Target SEO score
  timelineMonths: number,     // Desired timeline
  includeCompetitors: boolean
}
Response: {
  currentState: {
    seoScore: number,
    topicsCovered: number,
    monthlyTraffic: number
  },
  targetState: {
    seoScore: number,
    topicsCovered: number,
    projectedTraffic: number
  },
  recommendation: {
    postCount: number,
    monthlyCount: number,
    topicClusters: TopicCluster[],
    totalKeywords: number,
    trafficPotential: number
  },
  gaps: ContentGap[]
}

// Generate PDF
POST /api/websites/{websiteId}/pitch/pdf
Body: {
  pitchData: PitchData,
  customizations: {
    clientLogo?: string,
    contactName?: string,
    customIntro?: string,
    pricing?: PricingTier
  }
}
Response: { url: string }  // Signed URL to download PDF

// Generate email draft
POST /api/websites/{websiteId}/pitch/email
Body: {
  pitchData: PitchData,
  contactName: string,
  csmName: string
}
Response: {
  subject: string,
  body: string,
  attachments: string[]
}
```

---

## Part 2: Report Generator

### 2.1 Report Types

| Type | Use Case | Format |
|------|----------|--------|
| **Monthly Performance** | Regular client updates | PDF, Email |
| **Campaign Summary** | End of batch/campaign | PDF, Slides |
| **Executive Dashboard** | Quick overview | Email |
| **Detailed Analytics** | Deep dive | PDF |

### 2.2 Report Builder UI

**Location:** Client detail page → "Reports" tab

```
┌─────────────────────────────────────────────────────────────────────┐
│  Generate Report                                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Report Type:                                                       │
│  ○ Monthly Performance Report                                       │
│  ● Campaign Summary                                                 │
│  ○ Executive Dashboard                                              │
│                                                                     │
│  Period:                                                            │
│  ┌─────────────────┐  to  ┌─────────────────┐                      │
│  │ Dec 1, 2025     │      │ Dec 31, 2025    │                      │
│  └─────────────────┘      └─────────────────┘                      │
│                                                                     │
│  Include:                                                           │
│  ☑ SEO Score Comparison (Baseline vs Current)                       │
│  ☑ Traffic Metrics                                                  │
│  ☑ Top Performing Posts                                             │
│  ☑ Underperforming Posts + Recommendations                          │
│  ☐ Competitor Comparison                                            │
│  ☑ Next Month Recommendations                                       │
│                                                                     │
│  Output Format:                                                     │
│  ● PDF Report    ○ Slide Deck    ○ Email Summary                    │
│                                                                     │
│  [Preview]                              [Generate Report]           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Monthly Report Template

**PDF Sections:**

1. **Executive Summary**
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  December 2025 Performance Summary                          │
   ├─────────────────────────────────────────────────────────────┤
   │                                                             │
   │  SEO Score:  62 → 71  (+9 points) ▲                        │
   │  Posts Published: 8                                         │
   │  Total Impressions: 45,230 (+34%)                          │
   │  Total Clicks: 2,156 (+28%)                                │
   │  Avg. Position: 18.4 → 14.2 (improved)                     │
   │                                                             │
   └─────────────────────────────────────────────────────────────┘
   ```

2. **SEO Score Progression**
   - Line chart: Score over time
   - Breakdown by category
   - Comparison to goal

3. **Traffic Overview**
   - Impressions trend chart
   - Clicks trend chart
   - CTR by post type
   - Top traffic sources

4. **Top Performing Posts**
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  🏆 Top 5 Posts This Month                                  │
   ├─────────────────────────────────────────────────────────────┤
   │  1. How to Choose the Right CRM                             │
   │     Impressions: 12,450 | Clicks: 890 | Avg Pos: 8.2       │
   │                                                             │
   │  2. CRM vs Spreadsheets Comparison                          │
   │     Impressions: 8,230 | Clicks: 567 | Avg Pos: 11.4       │
   │  ...                                                        │
   └─────────────────────────────────────────────────────────────┘
   ```

5. **Underperformers & Recommendations**
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  📉 Posts Needing Attention                                 │
   ├─────────────────────────────────────────────────────────────┤
   │  1. CRM Integration Best Practices                          │
   │     Issue: Low impressions (234)                            │
   │     Recommendation: Update title for better CTR,            │
   │     add internal links from high-traffic posts              │
   └─────────────────────────────────────────────────────────────┘
   ```

6. **Topic Coverage Update**
   - New topics covered this month
   - Remaining gaps
   - Progress toward goal

7. **Next Month Plan**
   - Upcoming posts
   - Focus keywords
   - Optimization opportunities

8. **Appendix: Full Metrics Table**
   - All posts with full metrics

### 2.4 Email Report Template

**Subject:** [Client Name] December 2025 Content Performance

```
Hi [Contact Name],

Here's your monthly content performance summary for December 2025:

📊 KEY METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEO Score:      62 → 71 (+9 points ▲)
Posts Published: 8
Impressions:    45,230 (+34% vs last month)
Clicks:         2,156 (+28%)
Avg Position:   14.2 (improved from 18.4)

🏆 TOP PERFORMER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"How to Choose the Right CRM" 
→ 12,450 impressions, 890 clicks, position #8

📈 WHAT'S WORKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• "How-to" posts outperforming guides by 2x
• CRM-related keywords gaining traction
• Internal linking strategy paying off

🎯 NEXT MONTH FOCUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 6 new posts targeting sales automation cluster
• Optimize underperforming CRM integration post
• Build links to top performers

Full report attached.

Best,
[CSM Name]
```

### 2.5 Report API Endpoints

```typescript
// Generate report data
POST /api/reports/generate
Body: {
  clientId: string,
  websiteId?: string,
  batchId?: string,
  reportType: 'monthly' | 'campaign' | 'executive',
  periodStart: string,    // ISO date
  periodEnd: string,      // ISO date
  sections: string[]      // Which sections to include
}
Response: ReportData

// Generate PDF report
POST /api/reports/pdf
Body: {
  reportData: ReportData,
  template: 'standard' | 'executive' | 'detailed',
  branding?: {
    logo?: string,
    primaryColor?: string
  }
}
Response: { url: string }

// Generate slide deck
POST /api/reports/slides
Body: {
  reportData: ReportData,
  slideCount: number,     // Target number of slides
  template: 'modern' | 'corporate' | 'minimal'
}
Response: { url: string }

// Generate email report
POST /api/reports/email
Body: {
  reportData: ReportData,
  recipientName: string,
  senderName: string,
  includeAttachment: boolean
}
Response: {
  subject: string,
  body: string,
  attachmentUrl?: string
}

// List generated reports
GET /api/reports?clientId={id}&type={type}
Response: {
  reports: {
    id: string,
    type: string,
    periodStart: string,
    periodEnd: string,
    generatedAt: string,
    generatedBy: string,
    storageUrl: string
  }[]
}
```

---

## Part 3: Implementation

### 3.1 PDF Generation

**Library:** `@react-pdf/renderer` or `puppeteer`

```typescript
// Using React PDF
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const ReportPDF = ({ data }: { data: ReportData }) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Performance Report</Text>
        <Text style={styles.period}>{data.period}</Text>
      </View>
      
      <View style={styles.summary}>
        <MetricCard label="SEO Score" value={data.seoScore} change={data.seoChange} />
        <MetricCard label="Impressions" value={data.impressions} change={data.impressionChange} />
        {/* ... */}
      </View>
      
      {/* Additional sections */}
    </Page>
  </Document>
);
```

### 3.2 Slide Deck Generation

**Library:** `pptxgenjs`

```typescript
import PptxGenJS from 'pptxgenjs';

function generateSlides(data: ReportData): Promise<string> {
  const pptx = new PptxGenJS();
  
  // Title slide
  const slide1 = pptx.addSlide();
  slide1.addText('Monthly Performance Report', { x: 1, y: 2, fontSize: 36 });
  slide1.addText(data.clientName, { x: 1, y: 3, fontSize: 24 });
  
  // Metrics slide
  const slide2 = pptx.addSlide();
  slide2.addText('Key Metrics', { x: 0.5, y: 0.5, fontSize: 24 });
  slide2.addChart('bar', data.metricsChart);
  
  // ... more slides
  
  return pptx.writeFile({ fileName: `Report_${data.period}.pptx` });
}
```

### 3.3 File Storage

Reports are stored in Supabase Storage:

```typescript
// Upload generated report
const { data, error } = await supabase.storage
  .from('reports')
  .upload(`${clientId}/${reportId}.pdf`, pdfBuffer, {
    contentType: 'application/pdf'
  });

// Get signed URL (expires in 7 days)
const { data: urlData } = await supabase.storage
  .from('reports')
  .createSignedUrl(`${clientId}/${reportId}.pdf`, 604800);
```

---

## Part 4: Database Schema

### Reports Table

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  website_id UUID REFERENCES websites(id),
  batch_id UUID REFERENCES content_batches(id),
  
  report_type TEXT NOT NULL,  -- 'monthly', 'campaign', 'executive', 'pitch'
  period_start DATE,
  period_end DATE,
  
  -- Generated content
  report_data JSONB,          -- Full report data for regeneration
  storage_url TEXT,           -- URL to stored PDF/PPTX
  
  -- Metadata
  generated_by UUID REFERENCES profiles(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Tracking
  sent_to_client BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  viewed_by_client BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ
);

-- Pitch history
CREATE TABLE pitch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id),
  
  target_score INTEGER,
  recommended_posts INTEGER,
  timeline_months INTEGER,
  
  pitch_data JSONB,
  pdf_url TEXT,
  email_sent BOOLEAN DEFAULT FALSE,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Part 5: Implementation Files

| Component | Path |
|-----------|------|
| Pitch Builder UI | `/src/components/website/PitchBuilderTab.tsx` |
| Report Builder UI | `/src/components/reports/ReportBuilder.tsx` |
| PDF Generator | `/src/lib/reports/pdf-generator.ts` |
| Slide Generator | `/src/lib/reports/slide-generator.ts` |
| Email Templates | `/src/lib/reports/email-templates.ts` |
| Report Data Compiler | `/src/lib/reports/data-compiler.ts` |
| Pitch API | `/src/app/api/websites/[id]/pitch/route.ts` |
| Report API | `/src/app/api/reports/route.ts` |
| PDF API | `/src/app/api/reports/pdf/route.ts` |

### Dependencies

```json
{
  "@react-pdf/renderer": "^3.1.0",
  "pptxgenjs": "^3.12.0",
  "recharts": "^2.10.0"  // For chart images in PDFs
}
```

---

## Part 6: Acceptance Criteria

### Pitch Generator
- [ ] SEO score slider updates recommendations in real-time
- [ ] PDF generates with all sections populated
- [ ] Email template auto-fills with client/audit data
- [ ] Can customize pitch content before generating
- [ ] PDF downloads within 10 seconds
- [ ] Pitch history saved for future reference

### Report Generator
- [ ] Can select date range for report period
- [ ] Can choose which sections to include
- [ ] PDF, slides, and email formats all work
- [ ] Metrics pulled from actual database data
- [ ] Top/bottom performers calculated correctly
- [ ] Recommendations generated based on data
- [ ] Reports saved and accessible later
- [ ] Can mark report as "sent to client"

### Quality
- [ ] PDFs render correctly on all devices
- [ ] Slide decks open in PowerPoint/Keynote/Slides
- [ ] Email HTML renders in major email clients
- [ ] Charts/graphs are readable and accurate
- [ ] File sizes reasonable (<5MB for PDFs)

---

## Part 7: Metrics & Monitoring

| Metric | Target |
|--------|--------|
| PDF generation time | <10 seconds |
| Slide generation time | <15 seconds |
| Report accuracy | 100% (data matches DB) |
| Email deliverability | >95% |
| Client view rate | Track and report |

---

*This specification defines the complete Pitch & Report Generator functionality for client communication.*
