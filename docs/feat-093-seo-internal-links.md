# feat-093: SEO Agent with Internal Link Hints

## Implementation Summary

Enhanced the SEO agent to analyze content and suggest internal link opportunities to existing content on the same website. This improves SEO through strategic internal linking and better site structure.

## Changes Made

### 1. Enhanced Type Definitions

**File**: `/src/lib/agents/types.ts`

Added new `InternalLinkHint` interface to `SEOMetadata`:

```typescript
export interface InternalLinkHint {
    anchorText: string;              // Exact phrase to turn into a link
    suggestedTargetKeyword: string;  // Keyword of existing post to link to
    placement: string;               // Section/paragraph for link placement
    reasoning: string;               // Why this link makes sense
}

export interface SEOMetadata {
    // ... existing fields
    internalLinkHints?: InternalLinkHint[];  // NEW: 3-5 internal link opportunities
}
```

### 2. Enhanced SEO Agent

**File**: `/src/lib/agents/seo.ts`

#### Added Input Parameter
- `existingContent?`: Optional array of existing published posts with title and target keyword

#### Enhanced Prompt
The SEO agent now:
1. Receives a list of existing content from the same website
2. Analyzes the new draft content for natural linking opportunities
3. Suggests 3-5 internal links with optimized anchor text
4. Provides reasoning for each link suggestion
5. Considers SEO best practices:
   - Descriptive anchor text (not "click here")
   - Contextually relevant content
   - Value-add placement for readers
   - Keyword-optimized anchors
   - Natural distribution

#### Example Output
```json
{
  "title": "How to Use AI in Content Marketing",
  "metaDescription": "...",
  "slug": "ai-content-marketing",
  "suggestions": ["..."],
  "keywordDensity": 2.1,
  "readabilityScore": "Good",
  "internalLinkHints": [
    {
      "anchorText": "content strategy framework",
      "suggestedTargetKeyword": "content strategy",
      "placement": "Introduction, second paragraph",
      "reasoning": "Natural segue to foundational content strategy article"
    },
    {
      "anchorText": "SEO optimization techniques",
      "suggestedTargetKeyword": "SEO optimization",
      "placement": "Body section on optimization",
      "reasoning": "Provides detailed breakdown of optimization methods"
    }
  ]
}
```

### 3. Enhanced Blog Pipeline

**File**: `/src/lib/agents/blog-pipeline.ts` (lines 286-344)

The pipeline now:
1. **Fetches Existing Content** (lines 289-321):
   - Queries the database for published posts from the same website
   - Limits to 20 most recent posts to keep context manageable
   - Gracefully handles errors (continues without link hints if fetch fails)

2. **Passes to SEO Agent** (lines 323-329):
   - Includes `existingContent` in SEO agent input when available
   - Only passes if there are actually existing posts

3. **Saves Link Hints** (lines 335-342):
   - Stores internal link hints in `blog_post_revisions` table as part of SEO pass
   - Revision note includes count of link hints

## How It Works

### 1. Content Generation Flow

```
Blog Pipeline Start
      ↓
Research Agent
      ↓
Outline Agent
      ↓
Draft Agent
      ↓
SEO Agent ← [FETCH existing published posts]
      ↓
    [Analyze draft for linking opportunities]
      ↓
    [Generate 3-5 internal link hints]
      ↓
    [Return SEO metadata + link hints]
      ↓
Save to blog_post_revisions (seo_pass)
```

### 2. Database Query

When a blog post has a `website_id`, the pipeline queries:

```sql
SELECT title, target_keyword, cms_url
FROM blog_posts
WHERE website_id = ?
  AND status = 'published'
LIMIT 20;
```

### 3. AI Analysis

The AI receives:
- The full draft content
- List of existing posts with titles and keywords
- Instructions for SEO-optimized internal linking

The AI returns:
- Exact anchor text from the content
- Which existing post to link to (by keyword)
- Where to place the link (section/paragraph)
- Why the link makes sense

## Acceptance Criteria Verification

### ✅ 1. Links Suggested
- SEO agent analyzes content and suggests 3-5 internal link opportunities
- Each suggestion includes specific anchor text and target keyword
- Implementation: lines 37-41 in seo.ts

### ✅ 2. Anchor Text Optimized
- Prompt explicitly requires "descriptive, natural anchor text"
- Instructs to avoid generic text like "click here"
- Anchor text optimized for target keywords
- Implementation: lines 62-67 in seo.ts

### ✅ 3. Placement Logical
- Each hint includes `placement` field describing section/paragraph
- AI considers where links add value for readers
- Natural distribution throughout content
- Implementation: InternalLinkHint interface in types.ts

### ✅ 4. Stored in SEO Pass
- Link hints saved as part of SEO metadata
- Stored in `blog_post_revisions` table with type `seo_pass`
- Accessible for later application to content
- Implementation: lines 335-342 in blog-pipeline.ts

## Usage

### Automatic Integration

No code changes needed! The feature works automatically when:
1. A blog post is generated through the pipeline
2. The blog post has a `website_id`
3. There are existing published posts on the same website

### Manual Usage

```typescript
import { runSEOAgent } from '@/lib/agents/seo';
import { createOpenAIProvider } from '@/lib/agents/openai-provider';

const result = await runSEOAgent(createOpenAIProvider(), {
  fullDraftContent: draftContent,
  topic: 'AI Content Marketing',
  targetKeyword: 'AI content marketing',
  wordCount: 1500,
  existingContent: [
    { title: 'Content Strategy Guide', targetKeyword: 'content strategy' },
    { title: 'SEO Best Practices', targetKeyword: 'SEO optimization' }
  ]
});

// result.data.internalLinkHints contains link suggestions
```

## Benefits

1. **Improved SEO**: Strategic internal linking improves site structure and PageRank distribution
2. **Better User Experience**: Readers can discover related content naturally
3. **Automated Optimization**: No manual internal linking analysis needed
4. **Contextual Relevance**: AI understands content relationships
5. **Keyword Optimization**: Anchor text optimized for target keywords

## Future Enhancements

Potential improvements for future iterations:
- Auto-apply internal links to content (using `applyInternalLinks` from internal-linking.ts)
- UI to review and approve link hints before publishing
- Track which link hints were actually applied
- Analyze link performance (click-through rates)
- Suggest bidirectional links (both directions)

## Related Features

- feat-092: Draft agent with intro/teaser/body/conclusion structure
- Existing internal-linking.ts agent (more advanced analysis)
- Epic 3: AI Content Factory pipeline

## Notes

- Link hints are suggestions, not automatically applied
- Editors can review hints in the SEO pass revision
- Works best with 5+ existing published posts
- Gracefully handles cases with no existing content (no link hints)
- Does not break if database query fails (continues without hints)
