# Feature 094: Fact-Check Agent with Source Citations

**Status:** ✅ Implemented
**Epic:** Epic 3: AI Pipeline
**Priority:** 94 (High)
**Implemented:** 2026-01-15

## Overview

Enhanced the existing Fact-Check Agent to generate properly formatted citations with URLs for claims that need sources. This helps editors quickly add authoritative references to blog posts.

## What Was Implemented

### 1. Citation Interface (New)
**File:** `/src/lib/agents/fact-check.ts` + `/src/lib/agents/types.ts`

```typescript
export interface Citation {
    title: string;              // Source article/page title
    url: string;                // Full URL to the source
    author?: string;            // Author name (optional)
    publicationDate?: string;   // Publication date (optional)
    publisher?: string;         // Publisher name
    format: 'APA' | 'MLA' | 'Chicago' | 'IEEE';
    formattedText: string;      // Pre-formatted citation text
}
```

### 2. Enhanced FactCheckClaim
**File:** `/src/lib/agents/fact-check.ts` (lines 18-27) + `/src/lib/agents/types.ts` (lines 114-123)

Added `citations?: Citation[]` field to `FactCheckClaim` interface, allowing each claim to have multiple formatted citations.

### 3. Enhanced AI Prompt
**File:** `/src/lib/agents/fact-check.ts` (lines 63-129)

Updated the fact-check agent prompt to:
- Request 1-3 authoritative citations for claims needing sources
- Specify citation format requirements (title, URL, author, date, publisher, format)
- Require citations for all claims with status "needs_source" or "questionable"
- Emphasize using real, authoritative sources (.gov, .edu, peer-reviewed journals)
- Generate properly formatted citation text in APA, MLA, Chicago, or IEEE format

### 4. Helper Functions (New)
**File:** `/src/lib/agents/fact-check.ts`

#### `getFactCheckSummary()` - Enhanced
- Added `totalCitations` count to summary statistics

#### `getAllCitations()` - Lines 222-230
- Extracts all citations from a fact-check result
- Flattens citations from all claims into a single array

#### `generateBibliography()` - Lines 235-260
- Generates a formatted "References" section
- Accepts format parameter (APA, MLA, Chicago, IEEE)
- Removes duplicate citations by URL
- Returns empty string if no citations

#### `getClaimsWithCitations()` - Lines 265-277
- Returns claims that have citations
- Includes inline reference numbers (e.g., "[1]", "[2]")
- Ready for content insertion

## Example Usage

```typescript
import { runFactCheckAgent } from '@/lib/agents/fact-check';
import { createOpenAIProvider } from '@/lib/agents/openai-provider';

const provider = createOpenAIProvider();
const result = await runFactCheckAgent(provider, {
  fullDraftContent: "According to recent studies, 80% of businesses fail within the first year...",
  topic: "Business Success Strategies",
  targetKeyword: "business success"
});

if (result.success && result.data) {
  const claims = result.data.claims;

  // Find claims with citations
  claims.forEach(claim => {
    if (claim.citations && claim.citations.length > 0) {
      console.log(`Claim: ${claim.claim}`);
      claim.citations.forEach(citation => {
        console.log(`  - ${citation.formattedText}`);
        console.log(`    URL: ${citation.url}`);
      });
    }
  });

  // Generate bibliography
  const bibliography = generateBibliography(result.data, 'APA');
  console.log(bibliography);
}
```

## Example Output

```json
{
  "claims": [
    {
      "claim": "80% of businesses fail within the first year",
      "verifiable": true,
      "status": "needs_source",
      "reasoning": "This is a commonly cited statistic that requires verification",
      "citations": [
        {
          "title": "Small Business Failure Rates: Statistics and Trends",
          "url": "https://www.sba.gov/business-guide/manage-your-business/stay-legally-compliant",
          "author": "U.S. Small Business Administration",
          "publicationDate": "2024-03",
          "publisher": "SBA.gov",
          "format": "APA",
          "formattedText": "U.S. Small Business Administration. (2024, March). Small Business Failure Rates: Statistics and Trends. SBA.gov. https://www.sba.gov/business-guide/manage-your-business/stay-legally-compliant"
        }
      ],
      "severity": "high"
    }
  ],
  "factCheckScore": 85,
  "overallFeedback": "Content contains verifiable claims that require authoritative sources",
  "passed": true,
  "totalClaims": 5,
  "verifiedClaims": 4,
  "unverifiedClaims": 1
}
```

## Integration with Blog Pipeline

The fact-check agent with citations is already integrated into the blog generation pipeline:

**File:** `/src/lib/agents/blog-pipeline.ts` (lines 346-371)

```typescript
// Step 5: Fact Check
const factCheckResult = await runFactCheckAgent(provider, factCheckInput);
if (factCheckResult.success) {
  factCheck = factCheckResult.data!;

  // Save fact-check revision (now includes citations)
  await saveRevision(
    input.supabaseClient,
    input.blogPostId,
    'fact_check',
    factCheck,
    `Fact-check completed with score ${factCheck.factCheckScore}`
  );
}
```

Citations are automatically:
1. Generated during fact-checking
2. Stored in `blog_post_revisions` table (revision_type: 'fact_check')
3. Available for editors to review and insert into content

## Database Storage

Citations are stored as JSON in the `blog_post_revisions` table:

```sql
-- Example content column value
{
  "claims": [...],
  "factCheckScore": 85,
  "overallFeedback": "...",
  "passed": true,
  "totalClaims": 5,
  "verifiedClaims": 4,
  "unverifiedClaims": 1
}
```

No database migration needed - uses existing JSON storage.

## Acceptance Criteria ✅

| Criterion | Status | Notes |
|-----------|--------|-------|
| Claims extracted | ✅ | Already implemented, enhanced with citations |
| Verification attempted | ✅ | Status field tracks verification |
| Sources linked | ✅ | Citations include URLs to authoritative sources |
| Citations formatted | ✅ | Pre-formatted text in APA/MLA/Chicago/IEEE |

## Benefits

1. **Time Savings** - Editors don't need to manually find sources
2. **Quality** - AI suggests authoritative sources (.gov, .edu, journals)
3. **Consistency** - Citations follow standard formats
4. **SEO** - Properly sourced content builds authority
5. **Compliance** - Reduces risk of uncited claims
6. **Transparency** - Clear tracking of what needs verification

## Future Enhancements (Optional)

1. **Auto-Insert Citations** - Automatically insert inline references into content
2. **Source Verification** - Check if URLs are still active
3. **Citation Export** - Export bibliography to BibTeX, EndNote, etc.
4. **Custom Formats** - Support for custom citation formats
5. **Web Search Integration** - Automatically search for sources using web search API

## Testing

To test the feature:

1. Run the blog generation pipeline with a blog post containing factual claims
2. Check the fact-check revision in `blog_post_revisions`
3. Verify claims with `needs_source` status have citations
4. Verify citations have proper format (title, URL, formattedText)
5. Use `generateBibliography()` to generate a references section

## Files Modified

1. `/src/lib/agents/fact-check.ts` - Enhanced with Citation interface and helper functions
2. `/src/lib/agents/types.ts` - Added Citation interface to shared types
3. `/docs/feat-094-fact-check-citations.md` - This documentation file

## Backward Compatibility

✅ **Fully backward compatible**

- `citations` field is optional on FactCheckClaim
- Existing code continues to work without modifications
- Old revisions without citations still display correctly
- Helper functions handle missing citations gracefully
