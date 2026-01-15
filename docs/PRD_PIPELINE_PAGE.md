# PRD: Pipeline Page - Full Specification

**Version:** 1.0  
**Date:** January 15, 2026  
**Status:** Audit & Specification  
**Location:** `/src/app/app/pipeline/page.tsx`

---

## Overview

The Pipeline Page is the **core entry point** for BlogCanvas's content generation workflow. It enables vendors to analyze any website URL and generate AI-powered topic recommendations and blog posts in a single flow.

### Core Principle: Shared Client Context

**All content generation (topics, blogs, titles, images) MUST pull from the same shared client context.**

When a client is selected, the Pipeline Page loads the complete brand context including:
- **Styles to Avoid** - Words, phrases, and patterns that hurt SEO/engagement (with data backing)
- **Styles to Keep** - On-brand patterns proven to work (with performance data)
- **Image Guidelines** - Featured image specs, AI generation rules, brand colors
- **Title Guidelines** - Preferred formats, power words, SEO rules

See: `@/Users/isaiahdupree/Documents/Software/BlogCanvas/docs/PRD_BRAND_CONTEXT_INTEGRATION.md` for full specification.

---

## Current Implementation Status

### ✅ IMPLEMENTED (Working)

| Feature | Status | Notes |
|---------|--------|-------|
| URL input form | ✅ | Full form with validation |
| Client selection dropdown | ✅ | Loads from `/api/clients` |
| Target market input | ✅ | Free text |
| Business goals textarea | ✅ | Free text |
| ICP (Ideal Customer Profile) | ✅ | Free text |
| 4-step pipeline visualization | ✅ | Crawl → Analyze → Gaps → Topics |
| Real-time step status updates | ✅ | pending/running/completed/error |
| Pipeline job persistence | ✅ | Saves to `pipeline_jobs` table |
| Job history tab | ✅ | Lists recent jobs with status |
| Results dashboard | ✅ | SEO score, pages, gaps, topics |
| Topic list with priority | ✅ | High/medium/low based on difficulty |
| "Generate All Blogs" button | ✅ | Bulk generation |
| Individual topic generation | ✅ | Per-topic generate button |
| Progress tracking during generation | ✅ | Count of generated blogs |
| New Analysis reset | ✅ | Clear and start over |

### ⚠️ PARTIAL / NEEDS IMPROVEMENT

| Feature | Current State | Gap |
|---------|---------------|-----|
| Job deletion | Button exists | No API call implemented |
| Job detail view | Button exists | No detail page/modal |
| Re-run failed job | Not implemented | Should allow retry |
| Cancel running job | Not implemented | No cancel functionality |
| Export topics to CSV | Not implemented | Should export topic list |
| Save topics to batch | Not implemented | Should create content batch |
| Topic selection | Not implemented | Can't select specific topics |
| Individual blog preview | Not implemented | No preview before bulk generate |

### ❌ MISSING (Not Implemented)

| Feature | PRD Requirement | Priority |
|---------|-----------------|----------|
| SEO Score slider/forecast | "Drag slider 62→78" | High |
| Pitch generation from results | Generate PDF/email | High |
| Competitor analysis | Compare vs competitors | Medium |
| Topic coverage visualization | Visual gap map | Medium |
| Scheduled analysis | Re-run on schedule | Low |
| Analysis depth options | Quick/Standard/Deep | Low |

---

## Architecture

### Data Flow

```
┌─────────────────┐
│  Pipeline Page  │
│  (React Client) │
└────────┬────────┘
         │
         ├─── POST /api/pipeline-jobs (create job record)
         │
         ├─── POST /api/ai/website-audit (Step 1: Crawl)
         │         └─► Returns: pages[], seo_score, audit data
         │
         ├─── (Step 2: Analyze - computed from crawl data)
         │
         ├─── POST /api/ai/content-analysis (Step 3: Gap Analysis)
         │         └─► Returns: gaps[], keywords, opportunities
         │
         ├─── POST /api/ai/topic-clusters (Step 4: Topics)
         │         └─► Returns: clusters[] with priority
         │
         ├─── PATCH /api/pipeline-jobs/{id} (update progress)
         │
         └─── POST /api/blog-posts/generate-full (Generate blogs)
                   └─► Creates blog_posts records
```

### State Management

```typescript
// Form State
websiteUrl: string           // Required URL input
selectedClient: string       // Optional client ID
clientGoals: string         // Business objectives
targetMarket: string        // Target audience/market
icp: string                 // Ideal customer profile

// Pipeline State
isRunning: boolean          // Pipeline execution status
currentStep: number         // 0-3 for 4 steps
steps: PipelineStep[]       // Step status/results
currentJobId: string        // Active job ID

// Results State
result: AnalysisResult      // Final analysis output
generatingBlogs: boolean    // Blog generation status
generatedCount: number      // Blogs generated count
```

---

## API Endpoints

### Pipeline Jobs API

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/pipeline-jobs` | GET | List jobs for vendor | ✅ |
| `/api/pipeline-jobs` | POST | Create new job | ✅ |
| `/api/pipeline-jobs/[id]` | GET | Get job details | ✅ |
| `/api/pipeline-jobs/[id]` | PATCH | Update job progress | ✅ |
| `/api/pipeline-jobs/[id]` | DELETE | Delete job | ❌ Missing |
| `/api/pipeline-jobs/[id]/cancel` | POST | Cancel running job | ❌ Missing |
| `/api/pipeline-jobs/[id]/retry` | POST | Retry failed job | ❌ Missing |

### AI Analysis APIs (Used by Pipeline)

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/ai/website-audit` | POST | Crawl & audit website | ✅ |
| `/api/ai/content-analysis` | POST | Analyze content gaps | ✅ |
| `/api/ai/topic-clusters` | POST | Generate topic clusters | ✅ |
| `/api/blog-posts/generate-full` | POST | Generate full blog | ✅ |

---

## Database Schema

### pipeline_jobs Table

```sql
CREATE TABLE pipeline_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  client_id UUID REFERENCES clients(id),
  
  -- Input
  website_url TEXT NOT NULL,
  target_market TEXT,
  client_goals TEXT,
  ideal_customer_profile TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending',  -- pending, running, completed, failed, cancelled
  current_step TEXT,              -- crawl, analyze, gaps, topics
  progress INTEGER DEFAULT 0,     -- 0-100
  
  -- Results
  seo_score INTEGER,
  pages_indexed INTEGER,
  content_gaps INTEGER,
  topics_generated INTEGER,
  blogs_created INTEGER,
  
  -- Detailed Results (JSONB)
  crawl_result JSONB,
  analyze_result JSONB,
  gaps_result JSONB,
  topics_result JSONB,
  
  -- Error Handling
  error_message TEXT,
  error_step TEXT,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## UI Components

### 1. New Analysis Tab

```
┌─────────────────────────────────────────────────────────────────────┐
│  🌐 Website Analysis                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Website URL *                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🌐 https://example.com                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │ Client               │  │ Target Market        │                │
│  │ [Select client ▼]    │  │ [Small businesses US]│                │
│  └──────────────────────┘  └──────────────────────┘                │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │ Business Goals       │  │ Ideal Customer       │                │
│  │ [Increase traffic...]│  │ [Marketing managers] │                │
│  └──────────────────────┘  └──────────────────────┘                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │         ⚡ Start Analysis Pipeline                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Pipeline Steps Sidebar

```
┌─────────────────────────┐
│  Pipeline Steps         │
├─────────────────────────┤
│                         │
│  ✓ Crawl & Index        │
│    Scanning pages       │
│                         │
│  ● SEO Analysis         │  ← Running (animated)
│    Analyzing health     │
│                         │
│  ○ Gap Analysis         │  ← Pending
│    Finding gaps         │
│                         │
│  ○ Topic Generation     │  ← Pending
│    Creating topics      │
│                         │
└─────────────────────────┘
```

### 3. Results Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✓ Analysis Complete!                                               │
│  example.com • 15 topics discovered                    [New Analysis]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐                    │
│  │   72   │  │   45   │  │   12   │  │   15   │                    │
│  │SEO Scor│  │ Pages  │  │  Gaps  │  │ Topics │                    │
│  └────────┘  └────────┘  └────────┘  └────────┘                    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ✨ Recommended Topics                      [▶ Generate All Blogs]  │
├─────────────────────────────────────────────────────────────────────┤
│  1. How to Choose the Right CRM   [HIGH]    choose CRM    [Generate]│
│  2. CRM vs Spreadsheets          [MEDIUM]   CRM compare   [Generate]│
│  3. Top 10 CRM Features          [HIGH]     CRM features  [Generate]│
│  ...                                                                │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. History Tab

```
┌─────────────────────────────────────────────────────────────────────┐
│  🕐 Recent Pipeline Jobs                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ✓ https://example.com     [Completed]   Jan 15 • 15 topics        │
│    Client: Acme Corp       SEO: 72       5 blogs                   │
│                                                                     │
│  ● https://another.com     [Running]     Jan 15 • 45%              │
│    ████████░░░░░░ Analyzing gaps...                                │
│                                                                     │
│  ✗ https://failed.com      [Failed]      Jan 14                    │
│    Error: Could not crawl website                    [Retry]       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Missing Features - Detailed Specs

### 1. Job Deletion

**Endpoint:** `DELETE /api/pipeline-jobs/[id]`

```typescript
// Request
DELETE /api/pipeline-jobs/abc123

// Response
{ success: true, deleted: true }

// Validation
- Only delete if status is not 'running'
- Must belong to vendor's organization
```

**UI Change:** Wire up trash icon button in history tab.

---

### 2. Retry Failed Job

**Endpoint:** `POST /api/pipeline-jobs/[id]/retry`

```typescript
// Request
POST /api/pipeline-jobs/abc123/retry

// Response
{ success: true, newJobId: 'xyz789' }

// Behavior
- Creates new job with same inputs
- Original job remains for history
```

**UI Change:** Add "Retry" button on failed jobs.

---

### 3. Cancel Running Job

**Endpoint:** `POST /api/pipeline-jobs/[id]/cancel`

```typescript
// Request
POST /api/pipeline-jobs/abc123/cancel

// Response
{ success: true, status: 'cancelled' }

// Behavior
- Sets status to 'cancelled'
- Frontend should stop polling/calls
```

**UI Change:** Add "Cancel" button on running jobs.

---

### 4. Export Topics to CSV

**Location:** Results dashboard → "Export" button

```typescript
// CSV Format
topic,primary_keyword,difficulty,estimated_traffic,priority
"How to Choose CRM","choose CRM",35,2500,high
"CRM vs Spreadsheets","CRM compare",45,1800,medium
```

**Implementation:**
```typescript
const exportTopicsCSV = () => {
  const csv = [
    'topic,primary_keyword,difficulty,estimated_traffic,priority',
    ...result.topics.map(t => 
      `"${t.name}","${t.primary_keyword}",${t.difficulty},${t.estimated_traffic},${t.priority}`
    )
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  // Download...
};
```

---

### 5. Save Topics to Content Batch

**Location:** Results dashboard → "Create Batch" button

```typescript
// API Call
POST /api/content-batches
{
  name: "Topics from example.com - Jan 15",
  client_id: selectedClient,
  website_id: websiteId,
  goal_score_from: result.seoScore,
  goal_score_to: result.seoScore + 15,
  topics: result.topics.map(t => ({
    topic: t.name,
    target_keyword: t.primary_keyword,
    priority: t.priority
  }))
}
```

---

### 6. Topic Selection (Checkboxes)

**Current:** All topics are generated together  
**Needed:** Select specific topics to generate

```tsx
// Add selection state
const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());

// Toggle selection
<Checkbox 
  checked={selectedTopics.has(topic.id)}
  onCheckedChange={() => toggleTopic(topic.id)}
/>

// Generate selected only
const generateSelectedBlogs = async () => {
  const toGenerate = result.topics.filter(t => selectedTopics.has(t.id));
  // ...
};
```

---

### 7. SEO Score Slider/Forecast

**PRD Requirement:** "Drag slider from 62→78 to see recommendations"

**Implementation:**

```tsx
// Add to results dashboard
<div className="mt-6">
  <label>Target SEO Score</label>
  <Slider
    value={[targetScore]}
    min={result.seoScore}
    max={100}
    onValueChange={([val]) => setTargetScore(val)}
  />
  <p>
    Current: {result.seoScore} → Target: {targetScore}
  </p>
  <p>
    Recommended: {calculateRecommendedPosts(result.seoScore, targetScore)} posts
    over {calculateMonths(result.seoScore, targetScore)} months
  </p>
</div>
```

---

### 8. Generate Pitch from Results

**Location:** Results dashboard → "Generate Pitch" button

```typescript
// Link to pitch generator with pre-filled data
<Button onClick={() => {
  router.push(`/app/clients/${selectedClient}/pitch?` + 
    `seoScore=${result.seoScore}&` +
    `topics=${result.topics.length}&` +
    `gaps=${result.contentGaps}`
  );
}}>
  Generate Pitch
</Button>
```

---

## Acceptance Criteria

### Core Pipeline (Current)
- [x] Can enter URL and run 4-step analysis
- [x] Pipeline steps show real-time status
- [x] Results display SEO score, pages, gaps, topics
- [x] Can generate all blogs from topics
- [x] Job history shows past runs
- [x] Progress persists to database

### Enhanced Features (To Implement)
- [ ] Can delete jobs from history
- [ ] Can retry failed jobs
- [ ] Can cancel running jobs
- [ ] Can export topics to CSV
- [ ] Can save topics to new batch
- [ ] Can select specific topics for generation
- [ ] Can adjust target SEO score and see forecast
- [ ] Can generate pitch PDF from results
- [ ] Can view job details/results in modal

---

## Testing Scenarios

### Happy Path
1. Enter URL → Run pipeline → View results → Generate blogs → View in posts

### Error Handling
1. Invalid URL → Show validation error
2. Crawl fails → Show error, allow retry
3. API timeout → Show error, save partial progress

### Edge Cases
1. URL with no content → Show "no pages found"
2. Already analyzed URL → Show warning, allow re-run
3. Very large site → Show progress, handle pagination

---

## Files

| File | Purpose |
|------|---------|
| `/src/app/app/pipeline/page.tsx` | Main page component (1015 lines) |
| `/src/app/api/pipeline-jobs/route.ts` | Job CRUD API |
| `/src/app/api/pipeline-jobs/[jobId]/route.ts` | Job detail/update API |
| `/src/app/api/ai/website-audit/route.ts` | Website crawl API |
| `/src/app/api/ai/content-analysis/route.ts` | Gap analysis API |
| `/src/app/api/ai/topic-clusters/route.ts` | Topic generation API |

---

## Shared Client Context Integration

### Required Enhancement

When a client is selected in the Pipeline Page, the system must:

1. **Load Full Brand Context** via `/api/clients/{id}/context`
2. **Display Context Summary** showing what brand rules will apply
3. **Pass Context to All Agents** during topic/blog generation

### Context Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SHARED CLIENT CONTEXT                        │
├─────────────────────────────────────────────────────────────────────┤
│  Client Selected → Load getSharedClientContext(clientId)            │
│                                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │
│  │ Brand Guide │   │ Style Rules │   │ Analytics   │               │
│  │ • Voice     │   │ • Avoid     │   │ • Top Posts │               │
│  │ • Tone      │   │ • Keep      │   │ • Patterns  │               │
│  │ • Messages  │   │ • Images    │   │ • Metrics   │               │
│  │ • Keywords  │   │ • Titles    │   │             │               │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘               │
│         │                 │                 │                       │
│         └─────────────────┼─────────────────┘                       │
│                           ▼                                         │
│                 ┌─────────────────┐                                 │
│                 │ Unified Context │                                 │
│                 └────────┬────────┘                                 │
│                          │                                          │
│         ┌────────────────┼────────────────┐                        │
│         ▼                ▼                ▼                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Topic     │  │    Blog     │  │   Image     │                 │
│  │  Generator  │  │  Generator  │  │  Generator  │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

### UI Enhancement: Brand Context Preview

When client is selected, show context badge:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Client: [Acme Corp ▼]                                              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🎨 Brand Context Applied                        [View Full] │   │
│  │                                                              │   │
│  │ Voice: Professional, Helpful                                 │   │
│  │ Avoid: "revolutionary", passive voice >20%                   │   │
│  │ Keep: Question-based intros (+28% engagement)                │   │
│  │ Titles: "How to [X]" format preferred                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation Checklist

- [ ] Add `clientContext` state to Pipeline page
- [ ] Fetch context when client selected
- [ ] Display brand context preview card
- [ ] Pass context to `/api/ai/topic-clusters`
- [ ] Pass context to `/api/blog-posts/generate-full`
- [ ] Show which brand rules were applied in results

### Related Documentation

- **Full Context Spec:** `PRD_BRAND_CONTEXT_INTEGRATION.md`
- **AI Agents Spec:** `PRD_AI_AGENTS_PIPELINE.md`
- **Title Guidelines:** Section 15 of Brand Context doc
- **Image Guidelines:** Section 14 of Brand Context doc

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-15 | Created comprehensive PRD from code audit |
| 2026-01-13 | Initial pipeline page implemented |

---

*This PRD documents the current state and gaps in the Pipeline Page implementation.*
