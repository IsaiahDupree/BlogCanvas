# Multiple Outline Options Feature - Setup Guide

## Overview

This feature enables the AI pipeline to generate 3 distinct outline options for each blog post, allowing users to compare approaches and select or customize their preferred outline structure.

## Database Migration

**File:** `supabase/migrations/20260113000001_outline_options.sql`

### Manual Application

If Supabase is not linked locally, apply the migration manually:

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20260113000001_outline_options.sql`
3. Execute the SQL

### What's Created

**New Table: `outline_options`**
- Stores 3 outline variants per blog post
- Fields:
  - `id` (UUID, PK)
  - `blog_post_id` (UUID, FK to blog_posts)
  - `option_number` (1, 2, or 3)
  - `outline_data` (JSONB - full outline structure)
  - `total_estimated_words` (INTEGER)
  - `is_selected` (BOOLEAN)
  - Timestamps and indexes

**Blog Posts Table Updates:**
- `custom_outline` (JSONB) - User-customized merged outline
- `selected_outline_option_id` (UUID, FK) - Reference to selected option

**RLS Policies:**
- All policies restrict access to blog posts owned by the authenticated user's clients

## API Endpoints

### 1. Generate Outline Options

```
POST /api/posts/[postId]/outline-options
```

**Functionality:**
- Calls `runOutlineAgentWithOptions()` to generate 3 distinct outlines
- Each outline follows a different approach:
  - Option 1: Problem-Solution (pain point focused)
  - Option 2: How-To Guide (step-by-step structure)
  - Option 3: Comprehensive Guide (broad with deep dives)
- Stores all 3 options in `outline_options` table
- Creates agent run record

**Response:**
```json
{
  "success": true,
  "options": [
    {
      "id": "uuid",
      "option_number": 1,
      "outline_data": {
        "sections": [...],
        "totalEstimatedWords": 1500
      },
      "is_selected": false
    }
  ],
  "totalGenerated": 3
}
```

### 2. Fetch Outline Options

```
GET /api/posts/[postId]/outline-options
```

**Response:**
```json
{
  "options": [...]
}
```

### 3. Select an Outline Option

```
POST /api/posts/[postId]/outline-options/[optionId]/select
```

**Functionality:**
- Marks the option as selected
- Unselects all other options
- Copies outline to `blog_posts.outline`
- Sets `selected_outline_option_id`

### 4. Save Custom Outline

```
POST /api/posts/[postId]/outline-options/custom
```

**Body:**
```json
{
  "customOutline": {
    "sections": [...],
    "totalEstimatedWords": 1500
  }
}
```

**Functionality:**
- Saves user-customized outline (merged or edited)
- Unselects all options
- Sets both `custom_outline` and `outline` fields
- Clears `selected_outline_option_id`

## Frontend Components

### 1. OutlineOptionsComparison

**Location:** `src/components/outline/OutlineOptionsComparison.tsx`

**Features:**
- Generate 3 outline options button
- Side-by-side comparison grid (3 columns)
- Expandable section details with key points
- Word count display
- Select button for each option
- Regenerate options
- "Customize Outline" button

**Visual Design:**
- Selected outline highlighted with blue ring
- Section type badges (intro, body, conclusion, CTA) with colors
- Expandable sections with toggle
- Responsive grid (stacks on mobile)

### 2. OutlineCustomizer

**Location:** `src/components/outline/OutlineCustomizer.tsx`

**Features:**
- Drag-and-drop section reordering (HTML5 native)
- Add sections from any of the 3 options
- Remove sections
- Edit section titles inline
- Real-time word count calculation
- Sidebar with available sections
- Save custom outline

**Drag-Drop Implementation:**
- Native HTML5 drag events (`onDragStart`, `onDragOver`, `onDragEnd`)
- Visual feedback during drag (opacity change)
- Smooth reordering without external libraries

### 3. Outlines Page

**Location:** `src/app/app/posts/[postId]/outlines/page.tsx`

**Flow:**
1. Shows OutlineOptionsComparison by default
2. User generates or views 3 options
3. User can:
   - Select an option directly → Navigate to post
   - Click "Customize" → Show OutlineCustomizer
4. In customizer, user can:
   - Drag to reorder
   - Add sections from options
   - Remove sections
   - Save → Navigate to post

## Agent Updates

### New Function: `runOutlineAgentWithOptions()`

**Location:** `src/lib/agents/outline.ts`

**Enhancements:**
- Temperature increased to 0.8 (from 0.5) for more variation
- Explicit variation strategy in prompt:
  - Option 1: Problem-Solution approach
  - Option 2: Educational/How-To approach
  - Option 3: Comprehensive Guide approach
- Returns 3 outlines in single call
- Validates all 3 options meet quality requirements

**Legacy Support:**
- Original `runOutlineAgent()` still available for backward compatibility

## Integration Points

### Current Flow
1. Research Agent runs
2. **→ NEW: Navigate to `/app/posts/[postId]/outlines`**
3. Generate 3 outline options
4. Compare and select OR customize
5. Draft Agent uses selected outline
6. Continue pipeline...

### Adding to Existing Pages

**In Blog Post Detail Page:**

```tsx
import { useRouter } from 'next/navigation';

function BlogPostDetailPage({ postId }) {
  const router = useRouter();

  const handleGenerateOutlines = () => {
    router.push(`/app/posts/${postId}/outlines`);
  };

  return (
    <Button onClick={handleGenerateOutlines}>
      Generate Outline Options
    </Button>
  );
}
```

## Testing Checklist

### API Testing

```bash
# 1. Generate options
curl -X POST http://localhost:4848/api/posts/[POST_ID]/outline-options

# 2. Fetch options
curl http://localhost:4848/api/posts/[POST_ID]/outline-options

# 3. Select option
curl -X POST http://localhost:4848/api/posts/[POST_ID]/outline-options/[OPTION_ID]/select

# 4. Save custom
curl -X POST http://localhost:4848/api/posts/[POST_ID]/outline-options/custom \
  -H "Content-Type: application/json" \
  -d '{"customOutline": {...}}'
```

### UI Testing

1. **Generation:**
   - [ ] Navigate to `/app/posts/[postId]/outlines`
   - [ ] Click "Generate 3 Outline Options"
   - [ ] Verify 3 distinct options appear
   - [ ] Verify different approaches (Problem-Solution, How-To, Comprehensive)

2. **Comparison:**
   - [ ] Expand/collapse sections
   - [ ] Verify word counts
   - [ ] Check section types display correctly
   - [ ] Select an option → Verify database update

3. **Customization:**
   - [ ] Click "Customize Outline"
   - [ ] Drag sections to reorder
   - [ ] Add sections from sidebar
   - [ ] Remove sections
   - [ ] Edit section titles
   - [ ] Verify real-time word count
   - [ ] Save custom outline → Verify database update

4. **Navigation:**
   - [ ] Selecting outline returns to post page
   - [ ] Saving custom outline returns to post page
   - [ ] Cancel button works in customizer

## Database Queries for Monitoring

### View all outline options for a post
```sql
SELECT
  option_number,
  total_estimated_words,
  is_selected,
  generated_at
FROM outline_options
WHERE blog_post_id = '[POST_ID]'
ORDER BY option_number;
```

### Find posts with custom outlines
```sql
SELECT
  bp.id,
  bp.topic,
  bp.custom_outline IS NOT NULL as has_custom,
  bp.selected_outline_option_id IS NOT NULL as has_selected
FROM blog_posts bp
WHERE bp.custom_outline IS NOT NULL;
```

### Outline option usage statistics
```sql
SELECT
  option_number,
  COUNT(*) as times_selected
FROM outline_options
WHERE is_selected = true
GROUP BY option_number
ORDER BY times_selected DESC;
```

## Future Enhancements

1. **A/B Testing**: Track performance of different outline approaches
2. **Option Saving**: Allow users to save favorite outline structures as templates
3. **More Options**: Generate 5 or more variations
4. **AI Recommendations**: Score each option based on SEO potential
5. **Collaborative Selection**: Allow clients to vote on outline options

## Troubleshooting

### Issue: Options not generating

**Check:**
1. OpenAI API key is set: `OPENAI_API_KEY`
2. Research data exists: `blog_posts.research_context`
3. Agent runs table for errors: `SELECT * FROM agent_runs WHERE agent_name = 'outline_options'`

### Issue: Drag-drop not working

**Check:**
1. Browser supports HTML5 drag API
2. Console for JavaScript errors
3. Sections have unique keys

### Issue: Custom outline not saving

**Check:**
1. Outline structure has required fields: `sections` array, `totalEstimatedWords`
2. RLS policies allow update on blog_posts table
3. Network tab for API errors

## Security Considerations

- All API routes use Supabase client for authentication
- RLS policies ensure users can only access their own blog posts
- Custom outlines are validated for structure before saving
- No direct SQL injection vectors (all parameterized queries)

## Performance Notes

- Generating 3 options takes ~5-10 seconds (single LLM call)
- Outline options stored as JSONB for fast querying
- Indexes on `blog_post_id` for quick lookups
- Drag-drop uses native browser APIs (no library overhead)
