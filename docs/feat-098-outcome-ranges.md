# Feature Implementation: Expected Outcome Ranges (feat-098)

**Date:** 2026-01-15
**Status:** Complete
**Priority:** 98 (Medium)

## Overview

Implemented expected outcome ranges with confidence intervals for the pitch deck generator. Instead of showing single-point estimates for traffic increase and keyword rankings, the system now displays ranges with confidence levels based on campaign parameters.

## Implementation Details

### 1. Data Model Changes

**File:** `/src/lib/pitch-deck/generator.ts`

Updated `PitchDeckData` interface to include range data:

```typescript
// Before
projectedTrafficIncrease: number;
projectedKeywordRankings: number;

// After
projectedTrafficIncrease: number; // conservative estimate (min value)
projectedTrafficIncreaseRange: {
  min: number;
  expected: number;
  max: number;
  confidence: 'low' | 'medium' | 'high';
};
projectedKeywordRankings: number; // conservative estimate (min value)
projectedKeywordRankingsRange: {
  min: number;
  expected: number;
  max: number;
  confidence: 'low' | 'medium' | 'high';
};
```

### 2. Calculation Logic

**Traffic Increase Ranges:**
- Base calculation: `scoreImprovement * 2.5%` (expected value)
- Confidence levels based on campaign size and timeline:
  - **High confidence (±20% variance):** 15+ posts over 6+ months
  - **Medium confidence (±30% variance):** 8-14 posts OR 3-5 months
  - **Low confidence (±40% variance):** <8 posts OR <3 months
- Range: `[expected * (1 - variance), expected * (1 + variance)]`

**Keyword Rankings Ranges:**
- Base calculation: `recommendedPosts * 0.7` (70% of posts rank on page 1)
- Confidence levels based on keyword difficulty:
  - **High confidence (±15% variance):** Average difficulty ≤ 40
  - **Medium confidence (±25% variance):** Average difficulty ≤ 60
  - **Low confidence (±35% variance):** Average difficulty > 60
- Range: `[expected * (1 - variance), expected * (1 + variance)]`

### 3. PDF Slide Updates

**Slide 6: "Expected Results"**
- Now displays ranges instead of single values
- Shows expected value prominently (56pt font)
- Displays range below (e.g., "Range: 40% - 80%")
- Shows confidence level with color coding:
  - **High:** Green (COLORS.success)
  - **Medium:** Amber (COLORS.warning)
  - **Low:** Gray (COLORS.muted)
- Includes timeline context ("over 6-month campaign period")

### 4. Code Changes

**Lines Modified:**
- Interface update: Lines 40-54
- Slide rendering: Lines 593-694
- Calculation logic: Lines 848-923

**Key Functions:**
- `createResultsSlide()` - Updated to display ranges with confidence
- `generatePitchDeckData()` - Added range calculation logic

## Example Output

### Sample Scenario
- **Current SEO Score:** 62
- **Target SEO Score:** 82
- **Recommended Posts:** 24
- **Timeline:** 6 months
- **Average Gap Difficulty:** 52

### Calculated Ranges

**Traffic Increase:**
- Score improvement: 20 points
- Expected: 20 * 2.5 = 50%
- Confidence: High (24 posts over 6 months)
- Variance: ±20%
- **Range: 40% - 60%**

**Keyword Rankings:**
- Base: 24 * 0.7 = 17 keywords
- Confidence: Medium (difficulty = 52)
- Variance: ±25%
- **Range: 13 - 21 keywords**

## Benefits

1. **More Realistic Expectations:** Clients see potential ranges rather than false precision
2. **Risk Communication:** Confidence levels help set appropriate expectations
3. **Data-Driven:** Ranges calculated based on actual campaign parameters
4. **Professional Presentation:** Color-coded confidence indicators enhance credibility
5. **Backward Compatible:** Maintains legacy single-value fields for existing code

## Acceptance Criteria Verification

✅ **Score range shown:** Both traffic and keyword ranges displayed on Slide 6
✅ **Traffic estimate:** Expected value shown prominently with min-max range
✅ **Confidence displayed:** Color-coded confidence indicators for both metrics
✅ **Timeline included:** Timeline context shown below each metric

## Files Modified

1. `/src/lib/pitch-deck/generator.ts`
   - Added range fields to `PitchDeckData` interface (lines 40-54)
   - Updated `createResultsSlide()` method (lines 593-694)
   - Implemented range calculation in `generatePitchDeckData()` (lines 848-923)

## Testing

The implementation:
- ✅ TypeScript compiles without errors
- ✅ Backward compatible with existing API
- ✅ PDF generation works (API returns base64 PDF)
- ✅ Range calculations are mathematically sound
- ✅ Confidence levels based on objective criteria

## API Impact

**No breaking changes** - The API endpoint `/api/pitch-deck/generate` continues to work:
- Returns both legacy single values and new range objects
- Existing consumers can ignore new fields
- New consumers can use detailed range data

## Future Enhancements

Potential improvements for future features:
- Historical data analysis to refine confidence calculations
- Machine learning to predict outcomes based on past campaigns
- Industry-specific multipliers (e.g., B2B vs B2C)
- Competitive analysis to adjust confidence levels
- Visual confidence interval charts in PDF

## Related Features

- **feat-096:** Pitch deck with baseline SEO and topic gaps
- **feat-097:** Pitch deck with proposed blog package details
- **feat-099:** Content depth level selection (next priority)

---

**Implementation Time:** ~30 minutes
**Complexity:** Medium
**Risk:** Low (backward compatible)
