# Feature 091: Outline Agent with FAQs and Table Ideas

**Status**: ✅ Implemented
**Date**: 2026-01-15
**Epic**: Epic 3: AI Pipeline
**Priority**: High (91)

## Overview

Enhanced the Outline Agent to generate FAQs and table suggestions as part of the blog post outline generation process. This provides editors with comprehensive structural guidance including frequently asked questions and data visualization ideas.

## Implementation

### 1. Data Model Changes

**File**: `/src/lib/agents/types.ts`

Added new interfaces to support FAQs and table suggestions:

```typescript
export interface FAQItem {
  question: string;
  suggestedAnswer: string;
}

export interface TableSuggestion {
  title: string;
  description: string;
  suggestedColumns: string[];
  suggestedRows: string[];
  placement: string; // Which section key to place after
}

export interface OutlineResult {
  sections: OutlineSection[];
  totalEstimatedWords: number;
  faqs?: FAQItem[];           // NEW: 3-5 FAQs per outline
  tableSuggestions?: TableSuggestion[];  // NEW: 1-3 table ideas
}

export interface OutlineSection {
  key: string;
  title: string;
  type: 'intro' | 'body' | 'conclusion' | 'cta' | 'faq';  // NEW: Added 'faq' type
  keyPoints: string[];
  estimatedWords: number;
}
```

### 2. Outline Agent Enhancement

**File**: `/src/lib/agents/outline.ts`

Updated the AI prompt in both `runOutlineAgent()` and `runOutlineAgentWithOptions()` to include:

1. **FAQ Generation**:
   - Generates 3-5 relevant FAQs per outline
   - Questions address common concerns about the topic
   - Suggested answers are concise (50-100 words each)

2. **Table Suggestions**:
   - Suggests 1-3 helpful tables if applicable
   - Each table includes title, description, column names, and row suggestions
   - Specifies placement (which section to place after)
   - Tables help visualize comparisons, features, or data

**Prompt Enhancement Example**:
```
- faqs: array of 3-5 frequently asked questions with {question, suggestedAnswer}
  - Questions should be relevant to the topic and address common concerns
  - Answers should be concise (50-100 words each)
- tableSuggestions: array of 1-3 table ideas with {title, description, suggestedColumns, suggestedRows, placement}
  - Tables should help visualize comparisons, features, or data
  - placement: which section key to place the table after
```

### 3. Revision Storage

**File**: `/src/lib/agents/blog-pipeline.ts`

The outline revision is saved to `blog_post_revisions` table at lines 231-237:

```typescript
await saveRevision(
  input.supabaseClient,
  input.blogPostId,
  'outline',
  outline,  // Includes FAQs and tableSuggestions
  `Generated outline with ${outline.sections.length} sections`
);
```

FAQs and table suggestions are automatically included in the saved JSON since we're storing the entire outline object.

### 4. UI Display Enhancement

**Files**:
- `/src/components/outline/OutlineOptionsComparison.tsx`
- `/src/app/app/posts/[postId]/outlines/page.tsx`

Added visual display for FAQs and table suggestions in the outline comparison view:

#### FAQ Display:
- Cyan-themed card showing FAQ count
- Displays first 2 FAQs with question and answer preview
- Shows count of additional FAQs if more than 2
- Icon: 💡

#### Table Suggestions Display:
- Purple-themed card showing table count
- Lists all table suggestions with title and description
- Shows first 3 columns with ellipsis if more
- Icon: 📊

**Color Scheme**:
- FAQs: `bg-cyan-50 border-cyan-200` with cyan text variants
- Tables: `bg-purple-50 border-purple-200` with purple text variants
- FAQ section type: `bg-cyan-100 text-cyan-800`

## User Flow

1. **Outline Generation**:
   - User navigates to `/app/posts/[postId]/outlines`
   - Clicks "Generate 3 Outline Options"
   - AI generates 3 distinct outlines, each with:
     - Sections (intro, body, conclusion, CTA)
     - 3-5 relevant FAQs
     - 1-3 table suggestions (if applicable)

2. **Outline Review**:
   - User sees 3 side-by-side outline cards
   - Each card shows:
     - Section breakdown with key points
     - FAQ section with questions/answers
     - Table ideas with column suggestions
   - User can expand/collapse details

3. **Outline Selection**:
   - User selects preferred outline
   - Selected outline (with FAQs and tables) saved as revision
   - Used for subsequent drafting stages

## Acceptance Criteria Verification

✅ **FAQs Generated**: Outline agent now generates 3-5 FAQs per outline
✅ **Tables Suggested**: 1-3 table ideas included if applicable to topic
✅ **Stored in Outline Revision**: FAQs and tables saved to `blog_post_revisions` as part of outline JSON
✅ **Visible in UI**: New cyan FAQ card and purple table card display in outline comparison view

## Technical Details

### Database Schema
No database changes required. Outline revisions are stored as JSON in `blog_post_revisions.content`:

```sql
-- blog_post_revisions table (existing)
revision_type: 'outline'
content: {
  sections: [...],
  totalEstimatedWords: 1200,
  faqs: [
    { question: "...", suggestedAnswer: "..." }
  ],
  tableSuggestions: [
    {
      title: "...",
      description: "...",
      suggestedColumns: [...],
      suggestedRows: [...],
      placement: "body1"
    }
  ]
}
```

### AI Model Usage
- Uses same OpenAI provider as outline generation
- Temperature: 0.5 (single outline) or 0.8 (multiple options)
- Minimal additional token cost (~100-200 tokens per outline)

## Future Enhancements

1. **Interactive FAQ Editor**: Allow manual editing of FAQ questions/answers
2. **Table Preview**: Show mock table visualization in outline view
3. **FAQ Schema Markup**: Auto-generate FAQ schema.org markup for SEO
4. **Table Data Import**: Allow CSV import for table data
5. **FAQ Placement Control**: Specify where FAQ section should appear in post

## Testing

### Manual Test Steps:
1. Navigate to existing blog post: `/app/posts/[postId]`
2. Click "Generate Outlines" or navigate to `/app/posts/[postId]/outlines`
3. Click "Generate 3 Outline Options"
4. Verify each outline shows:
   - Sections (expand to see key points)
   - FAQ card with questions and answers
   - Table suggestions card (if applicable to topic)
5. Select an outline and verify it saves

### Test Cases:
- ✅ Outline with FAQs generates successfully
- ✅ Table suggestions appear when relevant
- ✅ FAQ section type renders with cyan color
- ✅ FAQ and table data persists in revision
- ✅ UI handles outlines without FAQs/tables gracefully (optional fields)

## Files Changed

1. `/src/lib/agents/types.ts` - Added FAQ and table interfaces
2. `/src/lib/agents/outline.ts` - Enhanced prompts for both functions
3. `/src/components/outline/OutlineOptionsComparison.tsx` - Added FAQ and table display
4. `/src/app/app/posts/[postId]/outlines/page.tsx` - Updated types
5. `/docs/feat-091-outline-faqs-tables.md` - This documentation

## Commits

```bash
git add -A
git commit -m "feat(blogcanvas): implement outline agent with FAQs and table ideas (feat-091)"
```

## Next Steps

Next feature to implement: **feat-092** - Draft Agent with intro/teaser/body/conclusion structure
