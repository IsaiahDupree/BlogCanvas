# feat-096: Pitch Deck with Baseline SEO and Topic Gaps

**Status:** ✅ VERIFIED - Fully Implemented
**Date:** 2026-01-15
**Epic:** Epic 2: Plan Builder

## Overview
PRD requirement to include baseline SEO score, topic gaps, and coverage visualization in pitch deck generator.

## Acceptance Criteria Verification

### 1. ✅ Score Prominently Displayed
**Location:** `/src/lib/pitch-deck/generator.ts:143-216`

The pitch deck displays the current SEO score prominently:
- **Slide 2: "Current SEO Performance"** - Dedicated slide for baseline metrics
- **Large 72pt font** (line 159) showing current score
- **Color-coded** based on performance:
  - Green (≥70): Good score
  - Amber (50-69): Moderate score
  - Red (<50): Needs improvement
- **Target score shown** with arrow indicator (line 172)
- **Improvement needed** calculation displayed (line 178)

**UI Display:** `/src/app/app/pitch-deck/page.tsx:369`
```tsx
<div className="text-2xl font-bold">
  {preview.currentSeoScore} → {preview.targetSeoScore}
</div>
```

### 2. ✅ Gaps Listed
**Location:** `/src/lib/pitch-deck/generator.ts:218-305`

**Slide 3: "Content Gap Analysis"** includes comprehensive table:
- **Table columns:**
  - Topic Cluster (30% width)
  - Target Keyword (30% width)
  - Difficulty (15% width) - color-coded by difficulty level
  - Estimated Traffic (15% width)
  - Priority Badge (10% width) - HIGH/MEDIUM/LOW

- **Top 6 gaps displayed** in PDF with indication of additional gaps
- **Total traffic potential** calculated and displayed at bottom (line 295-304)
- **Priority color coding:**
  - High priority: Red
  - Medium priority: Amber
  - Low priority: Gray

**UI Display:** `/src/app/app/pitch-deck/page.tsx:397-431`
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <BarChart3 className="w-5 h-5 text-indigo-600" />
      Content Gaps to Address
    </CardTitle>
  </CardHeader>
  <CardContent>
    {preview.topicGaps.map((gap, i) => (
      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span className="font-medium">{gap.cluster}</span>
        <Badge variant={...}>{gap.priority}</Badge>
      </div>
    ))}
  </CardContent>
</Card>
```

### 3. ✅ Coverage Visual
**Location:** `/src/lib/pitch-deck/generator.ts:586`

Topic coverage calculated as percentage:
```typescript
currentTopicCoverage: Math.round(
  (topicClusters.filter(t => t.currently_covered).length /
   Math.max(topicClusters.length, 1)) * 100
)
```

Displayed in "Key Metrics" card on Slide 2:
- Topic Coverage: `{coverage}%`
- Content Gaps: Total count of uncovered clusters
- High Priority Gaps: Count of high-priority opportunities

**Data Structure:** `/src/lib/pitch-deck/generator.ts:8-46`
```typescript
export interface PitchDeckData {
  currentTopicCoverage: number; // percentage
  topicGaps: {
    cluster: string;
    keyword: string;
    difficulty: number;
    estimatedTraffic: number;
    priority: 'high' | 'medium' | 'low';
  }[];
  // ... other fields
}
```

### 4. ✅ Charts Render
**Location:** Multiple slides with visual elements

**Slide 1: Title Slide** (lines 110-141)
- Gradient background (indigo to purple)
- Professional layout with client name and date

**Slide 2: Current State** (lines 143-216)
- **Score Gauge Card:**
  - Large score display (72pt font)
  - Color-coded performance indicator
  - Target score with improvement needed
- **Key Metrics Card:**
  - Pages Indexed
  - Topic Coverage %
  - Content Gaps count
  - High Priority Gaps count

**Slide 3: Gap Analysis** (lines 218-305)
- **Data Table:**
  - Professional table with headers
  - Color-coded difficulty levels
  - Priority badges
  - Alternating row colors for readability
- **Summary Footer:**
  - Total traffic potential
  - Additional gaps indicator

**Slide 4: Proposal** (lines 307-375)
- **Three Proposal Cards:**
  1. Blog Posts count (indigo)
  2. Timeline in months (purple)
  3. Target SEO Score (green)
- **Process Description Box:**
  - 5-step workflow visualization

**Slide 5: Expected Results** (lines 406-469)
- **Traffic Projection Card:** +X% increase (green background)
- **Keyword Rankings Card:** X+ keywords (indigo background)
- **Benefits Checklist:** 4 key benefits with checkmarks

**Slide 6: Next Steps** (lines 471-537)
- **4-Step Process:** Numbered circles with connector lines
- **Contact Card:** Purple gradient with CTA

All charts use consistent color scheme and professional design.

## Implementation Details

### File Structure
```
src/
├── app/
│   ├── app/pitch-deck/page.tsx          # UI page with preview
│   └── api/pitch-deck/generate/route.ts # API endpoint
├── lib/
│   └── pitch-deck/
│       └── generator.ts                  # PDF generation logic
```

### Data Flow
1. **UI:** User selects client, target score, timeline on `/app/pitch-deck`
2. **API:** POST to `/api/pitch-deck/generate` with parameters
3. **Data Fetch:**
   - Client info from `clients` table
   - Latest audit from `seo_audits` table (via `websites`)
   - Topic clusters from `topic_clusters` table
4. **Generate:** `generatePitchDeckData()` calculates metrics
5. **PDF:** `PitchDeckGenerator.generate()` creates 6-slide deck
6. **Return:** Base64-encoded PDF for download

### Key Functions

**generatePitchDeckData()** - `/src/lib/pitch-deck/generator.ts:559-602`
- Calculates recommended posts based on score gap
- Filters uncovered topic clusters as gaps
- Assigns priority based on difficulty and traffic
- Computes topic coverage percentage
- Generates traffic and keyword projections

**PitchDeckGenerator.generate()** - Lines 83-108
- Creates 6 professional slides
- Uses jsPDF for PDF generation
- Landscape orientation, letter format
- Returns Blob for download

### Design System
**Colors:** Lines 54-65
- Primary: Indigo (#4F46E5)
- Secondary: Purple (#7C3AED)
- Success: Green (#10B981)
- Warning: Amber (#F59E0B)
- Danger: Red (#EF4444)

## Testing Verification

### Manual Test Steps
1. Navigate to `/app/pitch-deck`
2. Select a client from dropdown
3. Adjust target score slider (60-95)
4. Select timeline (3/6/9/12 months)
5. Click "Preview" to see data
6. Verify:
   - Current SEO score → Target score displayed
   - Topic gaps listed with priorities
   - Coverage metrics shown
   - Download PDF renders correctly

### Test Data Requirements
- Client with website
- SEO audit with baseline_score
- Topic clusters with currently_covered flag
- At least one uncovered cluster for gap display

## PRD Compliance

✅ **"CSM can drag SEO score slider 62→78"**
- Implemented with range input (lines 252-268 in page.tsx)
- Shows current → target score prominently

✅ **"See recommended posts/months"**
- Calculated in generatePitchDeckData (line 577)
- Displayed in preview and PDF

✅ **"Generate Pitch for downloadable PDF"**
- PDF generation fully implemented
- 6 professional slides
- Base64 encoded for download

## Next Steps
Feature is complete. No additional work needed for feat-096.

## Related Features
- **feat-002:** PDF pitch generator (already marked as passing)
- **feat-097:** Pitch deck with proposed blog package details
- **feat-098:** Pitch deck expected outcome ranges
