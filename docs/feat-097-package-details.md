# feat-097: Pitch Deck with Proposed Blog Package Details

**Status:** ✅ IMPLEMENTED
**Date:** 2026-01-15
**Epic:** Epic 2: Plan Builder & Pitch Generator

## Overview
Extended pitch deck generator to include comprehensive blog package details with topic list and pricing information on a dedicated slide.

## Acceptance Criteria Verification

### 1. ✅ Post Count Shown
**Location:** Multiple slides

**Slide 4 - Our Proposal** (lines 307-375)
- Large card display showing recommended posts count
- Already existed in previous implementation

**NEW - Slide 5 - Blog Package Details** (line 433, 479)
- Header: "X SEO-optimized articles"
- Package summary: "Total Blog Posts: X articles"

### 2. ✅ Timeline Clear
**Location:** Multiple slides

**Slide 4 - Our Proposal** (lines 324-333)
- Card showing timeline in months
- Already existed in previous implementation

**NEW - Slide 5 - Blog Package Details** (lines 480-481)
- Timeline: X months
- Cadence: X posts/month
- Clear breakdown of delivery schedule

### 3. ✅ Topics Listed
**Location:** NEW - Slide 5 - Blog Package Details (lines 422-465)

**Implementation:**
```typescript
// Left column - Topic list
const topics = data.proposedTopics || data.topicGaps.map(g => g.cluster).slice(0, 12);
const displayTopics = topics.slice(0, 12);

displayTopics.forEach((topic, index) => {
  // Numbered badge (1-12)
  // Topic title (truncated to 50 chars if needed)
});

// Show remaining count if more than 12
if (data.recommendedPosts > displayTopics.length) {
  doc.text(`+ ${data.recommendedPosts - displayTopics.length} more topics`);
}
```

**Features:**
- Shows up to 12 topic titles with numbered badges (1-12)
- Topics displayed with indigo circle badges containing numbers
- Long topic names truncated to 50 characters with "..."
- Remaining topics count shown at bottom (e.g., "+ 8 more topics")
- Falls back to topic gap cluster names if proposedTopics not provided

### 4. ✅ Price Visible
**Location:** NEW - Slide 5 - Blog Package Details (lines 500-548)

**Pricing Tiers:**
- **Basic Package:** $500/post (< 10 posts)
- **Standard Package:** $400/post (10-19 posts)
- **Premium Package:** $350/post (20+ posts)

**Display Format:**
```
Investment
─────────────────────
Premium Package

Monthly: $1,750/mo
Total Investment: $10,500
```

**Implementation:**
```typescript
// Calculate pricing based on post count
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
```

**Features:**
- Automatic tier selection based on post count
- Monthly price calculated by dividing total by timeline
- Formatted with thousands separator ($10,500)
- Color-coded: Green for monthly, Indigo for total
- Only displays if pricing data provided (optional field)

## Implementation Details

### New Slide: Blog Package Details (Slide 5)

**Layout:** Two-column design

**Left Column: Proposed Blog Topics**
- Title: "Proposed Blog Topics"
- Subtitle: "X SEO-optimized articles"
- Numbered list of up to 12 topics
- Remaining count indicator
- Background: Light gray card

**Right Column: Package Summary & Pricing**
- Package details table:
  - Total Blog Posts
  - Timeline
  - Cadence
  - Target SEO Score
- Investment section:
  - Pricing tier badge
  - Monthly price
  - Total investment (large, bold)
- What's Included checklist:
  - AI-powered research & outlines
  - Expert writing & fact-checking
  - SEO optimization & scoring
  - Direct WordPress publishing

### Updated Data Structure

**File:** `/src/lib/pitch-deck/generator.ts:8-52`

Added to `PitchDeckData` interface:
```typescript
export interface PitchDeckData {
  // ... existing fields ...

  // NEW: Proposal details
  proposedTopics?: string[]; // List of topic titles for the package

  // NEW: Pricing
  pricingTier?: string;
  monthlyPrice?: number;
  totalPrice?: number;

  // ... existing fields ...
}
```

### Updated PDF Generation

**File:** `/src/lib/pitch-deck/generator.ts:89-118`

Changed from 6-slide to 7-slide deck:
```typescript
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
```

### Updated Data Generator

**File:** `/src/lib/pitch-deck/generator.ts:755-800`

Enhanced `generatePitchDeckData()` to include:
- Automatic pricing calculation based on post count
- Pricing tier assignment (Basic/Standard/Premium)
- Monthly and total price calculation
- Proposed topics list from topic gaps

## Design Details

### Colors Used
- **Indigo (#4F46E5):** Primary color for badges and headers
- **Green (#10B981):** Monthly price highlight
- **Light Gray (#F9FAFB):** Card backgrounds
- **Dark Gray (#1F2937):** Text

### Typography
- **Slide Header:** 28pt bold
- **Section Title:** 18pt bold
- **Topic Numbers:** 9pt bold (white on indigo)
- **Topic Text:** 10pt normal
- **Pricing Tier:** 12pt bold indigo
- **Total Price:** 14pt bold indigo

### Layout Measurements
- Slide dimensions: 792×612pt (landscape letter)
- Margin: 40pt
- Column width: ~336pt each (with 40pt gap)
- Card height: 340pt
- Topic spacing: 20pt between items

## Testing Verification

### Manual Test Steps
1. Navigate to `/app/pitch-deck`
2. Select a client with website and audit data
3. Ensure client has topic clusters
4. Set target score and timeline
5. Click "Download PDF"
6. Open generated PDF
7. Verify Slide 5 contains:
   - List of proposed topics (numbered 1-12)
   - Package summary with post count, timeline, cadence
   - Pricing tier and prices (monthly + total)
   - "What's Included" checklist

### Test Data Requirements
- Client with website
- SEO audit with baseline_score
- At least 3-5 topic clusters (uncovered gaps)
- Target score > current score
- Timeline: 3-12 months

### Expected Output Example
For a client with 15 uncovered topic gaps, target score 80, 6-month timeline:
- **Topics:** 15 listed (12 visible + "3 more")
- **Package:** 15 articles, 6 months, 3 posts/month
- **Pricing:** Standard Package, $1,000/mo, $6,000 total
- **Tier:** Standard (10-19 posts)

## PRD Compliance

✅ **"Show post count"**
- Implemented on Slide 4 (existing) and Slide 5 (new)

✅ **"Display timeline"**
- Implemented on Slide 4 (existing) and Slide 5 with cadence details

✅ **"List topic titles"**
- NEW: Implemented on Slide 5 with numbered list, up to 12 visible

✅ **"Include pricing tier"**
- NEW: Implemented on Slide 5 with automatic tier calculation, monthly and total prices

## Related Features

- **feat-002:** PDF pitch generator (foundation) ✅
- **feat-096:** Pitch deck with baseline SEO and topic gaps ✅
- **feat-097:** Pitch deck with proposed blog package details ✅ THIS FEATURE
- **feat-098:** Pitch deck expected outcome ranges (next priority)

## Files Modified

1. `/src/lib/pitch-deck/generator.ts`
   - Added `proposedTopics`, `pricingTier`, `monthlyPrice`, `totalPrice` to interface
   - Added `createPackageDetailsSlide()` method (165 lines)
   - Updated `generate()` to include new slide
   - Enhanced `generatePitchDeckData()` with pricing calculation

## Next Steps

Feature is complete and meets all acceptance criteria. Ready to mark as passing in `feature_list.json`.

Future enhancements could include:
- Custom pricing input from UI
- Different pricing models (per post, monthly retainer, etc.)
- Topic prioritization/ordering
- Client-specific topic selection before pitch generation
