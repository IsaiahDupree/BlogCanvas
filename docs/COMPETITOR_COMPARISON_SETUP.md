# Competitor Comparison Feature Setup Guide

## Overview

The Competitor Comparison feature (feat-030) enables vendors to track and compare their SEO performance against competitor websites. This includes side-by-side score comparisons, keyword gap analysis, and historical tracking.

## Features Implemented

### 1. Database Schema
- **competitors** table: Stores competitor websites linked to client websites
- **competitor_audits** table: SEO audit data for competitors over time
- **competitor_keywords** table: Keywords that competitors rank for with gap analysis
- Helper functions for keyword gap analysis and competitor comparison summaries

### 2. API Endpoints

#### Competitors Management
- `GET /api/websites/[id]/competitors` - List all competitors with comparison data
- `POST /api/websites/[id]/competitors` - Add a new competitor
- `GET /api/websites/[id]/competitors/[competitorId]` - Get competitor details with audits and keywords
- `PATCH /api/websites/[id]/competitors/[competitorId]` - Update competitor information
- `DELETE /api/websites/[id]/competitors/[competitorId]` - Remove competitor

#### Analysis
- `POST /api/websites/[id]/competitors/[competitorId]/analyze` - Run SEO analysis on competitor
- `GET /api/websites/[id]/keyword-gaps` - Get keyword gap analysis with filtering

### 3. UI Components

#### CompetitorComparisonTab
Location: `/src/components/website/CompetitorComparisonTab.tsx`

Features:
- Add competitors with URL, name, and notes
- Side-by-side SEO score comparison
- Visual score difference indicators (ahead/behind)
- Keywords tracked and gaps count
- Analyze/refresh competitor data
- Delete competitors

#### KeywordGapsTab
Location: `/src/components/website/KeywordGapsTab.tsx`

Features:
- Keyword gap statistics dashboard
- Search and filter keywords by:
  - Search query
  - Search intent (informational, commercial, transactional, navigational)
  - Minimum search volume
- Priority-based gap ranking
- Intent distribution visualization
- Direct Google search links for keywords

### 4. Integration

Added two new tabs to the website detail page (`/app/websites/[id]`):
- **Competitors** tab: Side-by-side comparison view
- **Keyword Gaps** tab: Detailed gap analysis

## Database Migration

Apply the migration to set up the competitor tracking schema:

```bash
npx supabase db push
```

Migration file: `supabase/migrations/20260112000009_competitors.sql`

## Usage

### Adding a Competitor

1. Navigate to a website detail page
2. Click the "Competitors" tab
3. Click "Add Competitor"
4. Enter:
   - **Website URL** (required): Competitor's website URL
   - **Display Name** (optional): Friendly name for the competitor
   - **Notes** (optional): Why you're tracking this competitor
5. Click "Add Competitor"

### Analyzing a Competitor

1. Click the refresh icon next to a competitor
2. The system will:
   - Run SEO analysis
   - Calculate SEO score
   - Identify keywords they rank for
   - Compare against your client's rankings
3. View updated comparison data immediately

### Viewing Keyword Gaps

1. Click the "Keyword Gaps" tab
2. Review high-priority keyword opportunities
3. Filter by:
   - Search intent
   - Minimum search volume
4. Click "Search" on any keyword to research it on Google

## Data Model

### Competitors Table
```sql
- id (UUID, PK)
- website_id (FK to websites)
- competitor_url (TEXT)
- competitor_domain (TEXT)
- name (TEXT, optional)
- notes (TEXT, optional)
- status (active/inactive)
- last_analyzed_at (TIMESTAMP)
```

### Competitor Audits Table
```sql
- id (UUID, PK)
- competitor_id (FK to competitors)
- seo_score (INT, 0-100)
- pages_indexed (INT)
- audit_date (TIMESTAMP)
- raw_metrics (JSONB)
```

### Competitor Keywords Table
```sql
- id (UUID, PK)
- competitor_id (FK to competitors)
- keyword (TEXT)
- search_volume (INT)
- difficulty (INT, 0-100)
- ranking_position (INT, 1-100)
- ranking_url (TEXT)
- search_intent (TEXT)
- we_rank (BOOLEAN)
- our_position (INT, nullable)
- gap_priority (INT, 1-10)
```

## Helper Functions

### get_keyword_gaps(website_id, min_volume, limit)
Returns keyword gap analysis for a website:
- Keywords competitors rank for that you don't
- Number of competitors ranking for each keyword
- Average competitor position
- Search volume and intent
- Priority scoring

### get_competitor_comparison(website_id)
Returns comparison summary for all competitors:
- Latest SEO scores (theirs vs yours)
- Score difference
- Total keywords tracked
- Keyword gaps count
- Last analysis date

## Security

- Row Level Security (RLS) enabled on all tables
- Vendors can only manage competitors for their clients' websites
- Clients can view competitor data for their own websites
- All queries use service role for background operations

## Monitoring Queries

### Active Competitors Count
```sql
SELECT COUNT(*) as active_competitors
FROM competitors
WHERE status = 'active';
```

### Total Keyword Gaps
```sql
SELECT COUNT(*) as total_gaps
FROM competitor_keywords
WHERE we_rank = false;
```

### High Priority Gaps
```sql
SELECT keyword, gap_priority, search_volume
FROM competitor_keywords
WHERE we_rank = false
  AND gap_priority <= 3
ORDER BY gap_priority ASC, search_volume DESC
LIMIT 20;
```

### Competitor Analysis Coverage
```sql
SELECT
  c.name,
  c.competitor_domain,
  COUNT(DISTINCT ca.id) as audit_count,
  COUNT(DISTINCT ck.id) as keyword_count,
  MAX(ca.audit_date) as last_audit
FROM competitors c
LEFT JOIN competitor_audits ca ON ca.competitor_id = c.id
LEFT JOIN competitor_keywords ck ON ck.competitor_id = c.id
WHERE c.status = 'active'
GROUP BY c.id, c.name, c.competitor_domain
ORDER BY last_audit DESC;
```

## Future Enhancements

1. **Automated Competitor Discovery**: Suggest potential competitors based on keyword overlap
2. **Real Competitor Crawling**: Replace mock data with actual website analysis
3. **Backlink Analysis**: Track competitor backlink profiles
4. **Content Gap Analysis**: Identify topics competitors cover that you don't
5. **Ranking History**: Track ranking changes over time for shared keywords
6. **Email Alerts**: Notify when competitors gain significant rankings
7. **Bulk Keyword Import**: Import keyword lists from SEO tools

## Troubleshooting

### Competitor Not Analyzing
- Check that the URL is accessible
- Verify the domain format is correct
- Ensure you have active internet connection
- Note: Current implementation uses mock data; real crawling requires additional setup

### No Keyword Gaps Showing
- Ensure competitors have been analyzed at least once
- Check filter settings (min volume, intent)
- Verify competitors have keyword data in the database

### Score Comparison Not Showing
- Ensure your website has an SEO audit
- Verify competitor has been analyzed
- Both audits should be relatively recent

## Testing

To test the competitor comparison feature:

1. Add a website to track
2. Run an SEO audit on the website
3. Add 2-3 competitor URLs
4. Analyze each competitor
5. Review the comparison dashboard
6. Check keyword gaps tab for opportunities

## Production Considerations

- **Rate Limiting**: Implement rate limits on competitor analysis to prevent abuse
- **Caching**: Cache competitor audit results (e.g., 24 hours)
- **Queue System**: Process competitor analysis in background jobs
- **Cost Management**: Real website crawling can be expensive; consider limits per tier
- **Data Retention**: Set policies for how long to keep historical competitor data

## Support

For issues or questions about the competitor comparison feature:
- Check this documentation
- Review API endpoint responses for error messages
- Check database RLS policies if access issues occur
- Verify migration was applied successfully
