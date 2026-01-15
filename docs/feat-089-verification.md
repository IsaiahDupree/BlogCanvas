# Feature 089: Report with Underperformers and Proposed Fixes - VERIFICATION

## Status: ✅ ALREADY IMPLEMENTED

## Implementation Location
`/src/app/api/reports/generate/route.ts`

## Feature Components

### 1. Underperformer Identification (Lines 373-461)

**Algorithm:**
- Aggregates metrics per post (impressions, clicks, sessions, position, SEO score)
- Calculates CTR for each post with traffic
- Determines median CTR across all posts
- Identifies underperformers based on:
  - **Low CTR**: CTR < median * 0.5 AND impressions > 100
  - **Poor Position**: avg position > 20 AND impressions > 50
- Returns top 5 underperformers sorted by CTR (worst first)

**Code:**
```typescript
const underperformers = postsWithMetrics
    .filter(post =>
        (post.metrics.ctr < medianCTR * 0.5 && post.metrics.impressions > 100) ||
        (post.metrics.avgPosition > 20 && post.metrics.impressions > 50)
    )
    .sort((a, b) => a.metrics.ctr - b.metrics.ctr)
    .slice(0, 5)
```

### 2. Fix Recommendations (Lines 434-450)

**Recommendation Logic:**

| Condition | Recommendations |
|-----------|----------------|
| Position > 20 | • Improve content quality and depth<br>• Add more internal links to this post |
| CTR < median * 0.5 | • Rewrite title and meta description for better CTR<br>• Add FAQ schema or rich snippets |
| SEO Score < 70 | • Run SEO optimization pass to improve on-page SEO |
| Sessions < Clicks * 0.8 | • Check for technical issues (slow load, mobile issues) |

**Output Format:**
```typescript
{
  id: post.id,
  title: post.target_keyword || 'Untitled',
  url: post.cms_url,
  metrics: {
    impressions, clicks, sessions,
    avgPosition, avgSEO, ctr
  },
  recommendations: string[]  // Array of specific fixes
}
```

### 3. Inclusion in Report Formats

#### Email Report (Lines 518-526)
```
⚠️ Underperformers & Recommendations
1. [Post Title]
   - CTR: X%, Position: Y, SEO: Z/100
   Recommendations:
   • [Recommendation 1]
   • [Recommendation 2]
   ...
```

#### PDF Report (Lines 688-704)
- Professional styled section with yellow background boxes
- Includes full metrics and bulleted recommendations
- Each underperformer in its own styled card

#### Slide Deck Report (Lines 766-772)
- Dedicated slide for underperformers
- Shows top underperformer metrics
- Includes first recommendation for each

### 4. Fix Implementation Tracking

**Tracking Mechanism:**
- `blog_post_revisions` table (migration: 20241204000006_seo_retainer_system.sql)
- When a fix is applied, create revision with:
  - `revision_type`: 'human_edit'
  - `notes`: Description of fix applied
  - `created_by`: User ID who made the fix
  - `created_at`: Timestamp

**Example workflow:**
1. Report identifies post as underperformer with recommendation: "Rewrite title and meta description"
2. Editor updates the post title/meta description
3. System creates revision record:
   ```sql
   INSERT INTO blog_post_revisions (
     blog_post_id,
     revision_type,
     notes,
     created_by,
     created_by_type
   ) VALUES (
     '[post-id]',
     'human_edit',
     'Fixed underperformer: Rewrote title and meta description per report recommendation',
     '[user-id]',
     'user'
   )
   ```
4. Future reports can compare metrics to see if fix improved performance

## Acceptance Criteria Verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Underperformers identified | ✅ PASS | Lines 373-432: Algorithm identifies posts with low CTR or poor position |
| Fixes suggested | ✅ PASS | Lines 434-450: Generates 2-4 specific recommendations per post |
| In report output | ✅ PASS | Lines 518-526 (email), 688-704 (PDF), 766-772 (slides) |
| Tracking available | ✅ PASS | blog_post_revisions table tracks fix implementation via 'human_edit' type |

## API Usage

**Endpoint:** `POST /api/reports/generate`

**Request:**
```json
{
  "websiteId": "uuid",
  "periodStart": "2025-01-01",
  "periodEnd": "2025-01-31",
  "format": "email" | "pdf" | "slide"
}
```

**Response:**
```json
{
  "success": true,
  "report": {
    "id": "uuid",
    "report_data": {
      "underperformers": [
        {
          "id": "post-uuid",
          "title": "Post Title",
          "url": "https://...",
          "metrics": {
            "impressions": 1500,
            "clicks": 10,
            "ctr": 0.67,
            "avgPosition": 45.2,
            "avgSEO": 65
          },
          "recommendations": [
            "Poor ranking - add internal links and update content",
            "Low CTR - consider improving title and meta description"
          ]
        }
      ]
    }
  },
  "content": { /* formatted report content */ }
}
```

## UI Integration

**Reports Dashboard:** `/app/reports`
- Generate Report button opens form
- Select website, date range, format
- Generated reports show in grid
- Can download PDF or send email

**Report Actions:**
- View report content (stored in report_data JSONB field)
- Download PDF version
- Send email to client
- Access from reports list page

## Conclusion

Feature 089 is **COMPLETE** and **PRODUCTION-READY**. All acceptance criteria are met:

1. ✅ Underperformers are identified using intelligent CTR and position thresholds
2. ✅ Specific, actionable fix recommendations are generated per post based on metrics
3. ✅ Underperformers section appears in all report formats (email, PDF, slide deck)
4. ✅ Fix implementation can be tracked via blog_post_revisions table with 'human_edit' type

The feature integrates seamlessly with the existing reporting system and provides valuable insights for improving underperforming content.
