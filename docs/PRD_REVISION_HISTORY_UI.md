# PRD: Revision History UI Specification

**Version:** 1.0  
**Date:** January 15, 2026  
**Status:** Specification  
**Epic:** Epic 3 - Content Batch & AI Writing Pipeline

---

## Overview

The Revision History UI enables editors and CSMs to view the progression of AI-generated content through each pipeline stage, compare versions, and understand how the final blog post was constructed.

---

## User Stories

1. **As an editor**, I can open a post and see the AI outline, first draft, SEO improvements, and fact-check notes in a timeline.

2. **As a CSM**, I can show clients how our AI pipeline improves content quality at each stage.

3. **As an editor**, I can compare any two revisions side-by-side to see what changed.

4. **As a vendor**, I can restore a previous revision if a later change made the content worse.

---

## UI Components

### 1. Revision Timeline

**Location:** Blog post detail page → "History" tab

```
┌─────────────────────────────────────────────────────────────────────┐
│  Revision History                                            [View] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ● Outline Agent                              Jan 15, 2026 2:34 PM  │
│    Generated 6 sections, 4 FAQ suggestions                          │
│    [View Output] [Compare]                                          │
│    │                                                                │
│  ● Drafting Agent                             Jan 15, 2026 2:35 PM  │
│    1,523 words • Readability: 68                                    │
│    [View Output] [Compare]                                          │
│    │                                                                │
│  ● SEO Agent                                  Jan 15, 2026 2:36 PM  │
│    SEO Score: 87 • 3 optimizations applied                          │
│    [View Output] [Compare]                                          │
│    │                                                                │
│  ● Fact-Check Agent                           Jan 15, 2026 2:37 PM  │
│    Fact Score: 92 • 2 sources added                                 │
│    [View Output] [Compare]                                          │
│    │                                                                │
│  ● Enhancement Agent                          Jan 15, 2026 2:38 PM  │
│    Added: 1 table, 2 bullet lists, 3 image prompts                  │
│    [View Output] [Compare]                                          │
│    │                                                                │
│  ◉ Human Edit (Sarah M.)                      Jan 15, 2026 3:15 PM  │
│    "Fixed intro paragraph, adjusted CTA"                            │
│    [View Output] [Compare] [Restore]                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Revision Detail Modal

**Triggered by:** "View Output" button

```
┌─────────────────────────────────────────────────────────────────────┐
│  SEO Agent Output                                              [×]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ SEO Score: 87/100                                           │   │
│  │ ████████████████████░░░                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Meta Tags Generated:                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Title: How to Choose the Right CRM for Your Business (58c)  │   │
│  │ Description: Learn how to select the perfect CRM system...  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Optimizations Applied:                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ✓ Added keyword to H1                                       │   │
│  │ ✓ Optimized meta description                                │   │
│  │ ✓ Added 3 internal link suggestions                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [View Full Content]                              [Close]           │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. Diff Comparison View

**Triggered by:** "Compare" button or selecting two revisions

```
┌─────────────────────────────────────────────────────────────────────┐
│  Compare Revisions                                             [×]  │
├─────────────────────────────────────────────────────────────────────┤
│  [Drafting Agent ▾]  vs  [SEO Agent ▾]           [Unified] [Split]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SPLIT VIEW:                                                        │
│  ┌────────────────────────┐  ┌────────────────────────┐            │
│  │ Drafting Agent         │  │ SEO Agent              │            │
│  ├────────────────────────┤  ├────────────────────────┤            │
│  │ # How to Choose a CRM  │  │ # How to Choose the    │            │
│  │                        │  │   Right CRM for Your   │            │
│  │                        │  │   Business             │            │
│  │                        │  │                        │            │
│  │ Choosing the right CRM │  │ Choosing the right CRM │            │
│  │ can be overwhelming... │  │ for your business can  │            │
│  │                        │  │ be overwhelming...     │            │
│  └────────────────────────┘  └────────────────────────┘            │
│                                                                     │
│  UNIFIED VIEW:                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ - # How to Choose a CRM                                     │   │
│  │ + # How to Choose the Right CRM for Your Business           │   │
│  │                                                              │   │
│  │ - Choosing the right CRM can be overwhelming...             │   │
│  │ + Choosing the right CRM for your business can be...        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Changes: +45 additions, -12 deletions                              │
│                                                                     │
│                                                        [Close]      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Agent Output Cards

**For Outline Agent:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  📋 Outline Structure                                               │
├─────────────────────────────────────────────────────────────────────┤
│  H1: How to Choose the Right CRM for Your Business                  │
│  ├─ H2: Why Your Business Needs a CRM (250 words)                   │
│  │   └─ Key points: efficiency, data centralization, ROI            │
│  ├─ H2: Types of CRM Systems (300 words)                            │
│  │   ├─ H3: Operational CRM                                         │
│  │   ├─ H3: Analytical CRM                                          │
│  │   └─ H3: Collaborative CRM                                       │
│  ├─ H2: Key Features to Look For (350 words)                        │
│  ...                                                                │
│                                                                     │
│  💡 FAQ Suggestions:                                                │
│  • What is the best CRM for small business?                         │
│  • How much does a CRM system cost?                                 │
│  • Can I integrate CRM with my existing tools?                      │
│                                                                     │
│  📊 Table Suggestion:                                               │
│  "CRM Comparison Table" - Columns: Feature, Basic, Pro, Enterprise  │
└─────────────────────────────────────────────────────────────────────┘
```

**For Fact-Check Agent:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  ✓ Fact-Check Results                              Score: 92/100    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Claims Verified: 8/9                                               │
│                                                                     │
│  ✅ "CRM adoption has increased 300% since 2020"                    │
│     Source: Salesforce State of Sales Report 2024                   │
│                                                                     │
│  ✅ "Companies using CRM see 29% increase in sales"                 │
│     Source: Nucleus Research ROI Study                              │
│                                                                     │
│  ⚠️ "Small businesses spend $12/user/month on average"             │
│     Status: Needs verification - suggest updating                   │
│     Suggested sources:                                              │
│     • G2 CRM Pricing Guide 2025                                     │
│     • Capterra CRM Cost Analysis                                    │
│                                                                     │
│  [Add Citations to Content]                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Revision Record Structure

```typescript
interface BlogPostRevision {
  id: string;
  blog_post_id: string;
  revision_type: 
    | 'outline' 
    | 'draft' 
    | 'seo_pass' 
    | 'fact_check' 
    | 'enhancement'
    | 'human_edit'
    | 'ai_regeneration';
  content: string;              // Full content at this stage
  created_by: string | 'system';
  created_at: string;
  metadata: {
    // Outline Agent
    sections_count?: number;
    faq_count?: number;
    table_suggestions?: number;
    
    // Drafting Agent
    word_count?: number;
    readability_score?: number;
    keyword_density?: number;
    
    // SEO Agent
    seo_score?: number;
    optimizations_applied?: number;
    meta_title?: string;
    meta_description?: string;
    
    // Fact-Check Agent
    fact_check_score?: number;
    claims_verified?: number;
    claims_flagged?: number;
    sources_added?: number;
    
    // Enhancement Agent
    tables_added?: number;
    bullet_lists_added?: number;
    image_prompts?: number;
    callouts_added?: number;
    
    // Human Edit
    editor_notes?: string;
    changes_summary?: string;
    
    // Common
    duration_ms?: number;
    model_used?: string;
    token_count?: number;
  };
}
```

### API Endpoints

```typescript
// Get all revisions for a post
GET /api/blog-posts/{postId}/revisions
Response: { revisions: BlogPostRevision[] }

// Get specific revision
GET /api/blog-posts/{postId}/revisions/{revisionId}
Response: BlogPostRevision

// Compare two revisions
GET /api/blog-posts/{postId}/revisions/compare?from={id1}&to={id2}
Response: {
  from: BlogPostRevision,
  to: BlogPostRevision,
  diff: {
    additions: number,
    deletions: number,
    changes: DiffChange[]
  }
}

// Restore a revision
POST /api/blog-posts/{postId}/revisions/{revisionId}/restore
Response: { success: boolean, newRevisionId: string }

// Create human edit revision
POST /api/blog-posts/{postId}/revisions
Body: { content: string, notes?: string }
Response: BlogPostRevision
```

---

## UI Implementation

### File Locations

| Component | Path |
|-----------|------|
| Timeline Component | `/src/components/revision/RevisionTimeline.tsx` |
| Diff Viewer | `/src/components/revision/DiffViewer.tsx` |
| Revision Modal | `/src/components/revision/RevisionDetailModal.tsx` |
| Agent Output Cards | `/src/components/revision/AgentOutputCard.tsx` |
| Compare View | `/src/components/revision/CompareView.tsx` |

### Dependencies

```json
{
  "diff": "^5.1.0",        // For generating diffs
  "react-diff-viewer": "^3.1.1"  // For rendering diffs
}
```

### Component Props

```typescript
interface RevisionTimelineProps {
  postId: string;
  revisions: BlogPostRevision[];
  onViewRevision: (revision: BlogPostRevision) => void;
  onCompareRevisions: (from: string, to: string) => void;
  onRestoreRevision: (revisionId: string) => void;
}

interface DiffViewerProps {
  fromContent: string;
  toContent: string;
  fromLabel: string;
  toLabel: string;
  viewMode: 'split' | 'unified';
}

interface AgentOutputCardProps {
  revision: BlogPostRevision;
  agentType: string;
  expanded?: boolean;
}
```

---

## Integration Points

### Post Detail Page Integration

```tsx
// /src/app/app/posts/[postId]/page.tsx
<Tabs defaultValue="content">
  <TabsList>
    <TabsTrigger value="content">Content</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>  {/* NEW */}
    <TabsTrigger value="seo">SEO</TabsTrigger>
    <TabsTrigger value="comments">Comments</TabsTrigger>
  </TabsList>
  
  <TabsContent value="history">
    <RevisionTimeline postId={postId} />
  </TabsContent>
</Tabs>
```

### Batch Generation Integration

When generating posts via batch, each agent output is automatically saved:

```typescript
// In blog-pipeline.ts
async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const revisions = [];
  
  // After each agent completes
  const outlineResult = await outlineAgent.run(input);
  revisions.push(await saveRevision(postId, 'outline', outlineResult));
  
  const draftResult = await draftingAgent.run(outlineResult);
  revisions.push(await saveRevision(postId, 'draft', draftResult));
  
  // ... continue for each agent
}
```

---

## Acceptance Criteria

### Timeline View
- [ ] Shows all revisions in chronological order
- [ ] Displays agent name, timestamp, and key metrics
- [ ] Clicking "View Output" opens revision detail modal
- [ ] Human edits show editor name and notes

### Diff Comparison
- [ ] Can compare any two revisions
- [ ] Supports both split and unified view modes
- [ ] Shows addition/deletion counts
- [ ] Highlights changed sections

### Agent Output Display
- [ ] Each agent type has customized output card
- [ ] Shows relevant metrics (scores, counts)
- [ ] Expandable for full details

### Restore Functionality
- [ ] Can restore any previous revision
- [ ] Creates new revision entry (doesn't delete history)
- [ ] Confirms action before restoring

---

## Mockups

### Mobile View (Timeline)
```
┌─────────────────────────┐
│ Revision History        │
├─────────────────────────┤
│ ● Outline Agent         │
│   Jan 15 • 6 sections   │
│   [View]                │
│   │                     │
│ ● Drafting Agent        │
│   Jan 15 • 1,523 words  │
│   [View]                │
│   │                     │
│ ...                     │
└─────────────────────────┘
```

---

*This specification defines the complete Revision History UI for tracking AI pipeline progression.*
