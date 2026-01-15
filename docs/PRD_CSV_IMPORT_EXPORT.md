# PRD: CSV Import/Export Specification

**Version:** 1.0  
**Date:** January 15, 2026  
**Status:** Specification  
**Epic:** Epic 3 - Content Batch & AI Writing Pipeline

---

## Overview

CSV Import/Export enables CSMs to bulk manage content topics and blog posts using spreadsheet workflows. This bridges the gap between internal planning (Excel/Sheets) and the BlogCanvas platform.

---

## User Stories

1. **As a CSM**, I can import a CSV of topics and turn it into a production batch in one step.

2. **As a CSM**, I can export a content batch to CSV for client review or internal planning.

3. **As a CSM**, I can update blog post metadata in bulk by modifying and re-importing a CSV.

4. **As a CSM**, I can download a template CSV with all required columns pre-defined.

---

## CSV Formats

### 1. Topic Import CSV

**Purpose:** Import topics to create blog posts in a batch.

**Required Columns:**
| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `topic` | string | Blog topic/title | "How to Choose the Right CRM" |
| `target_keyword` | string | Primary SEO keyword | "choose CRM" |

**Optional Columns:**
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `secondary_keywords` | string | null | Comma-separated LSI keywords |
| `word_count_goal` | number | 1500 | Target word count |
| `target_audience` | string | from client | Who the post is for |
| `content_type` | string | "blog" | blog, guide, listicle, how-to |
| `priority` | string | "medium" | high, medium, low |
| `due_date` | date | null | YYYY-MM-DD format |
| `notes` | string | null | Additional instructions |
| `cluster` | string | null | Topic cluster name |

**Example CSV:**
```csv
topic,target_keyword,secondary_keywords,word_count_goal,content_type,priority,due_date
"How to Choose the Right CRM","choose CRM","CRM selection,best CRM",1500,how-to,high,2026-02-01
"CRM vs Spreadsheets: Complete Comparison","CRM vs spreadsheets","CRM benefits,spreadsheet limitations",2000,guide,medium,2026-02-05
"Top 10 CRM Features Every Business Needs","CRM features","essential CRM,CRM must-haves",1800,listicle,high,2026-02-03
```

---

### 2. Blog Post Export CSV

**Purpose:** Export existing blog posts for review or backup.

**Columns Exported:**
| Column | Description |
|--------|-------------|
| `id` | Unique post identifier |
| `topic` | Original topic |
| `title` | Generated title |
| `target_keyword` | Primary keyword |
| `status` | Current status |
| `word_count` | Actual word count |
| `seo_score` | SEO quality score |
| `approval_status` | Client approval status |
| `created_at` | Creation date |
| `published_at` | Publish date (if published) |
| `wordpress_url` | Live URL (if published) |

**Example Export:**
```csv
id,topic,title,target_keyword,status,word_count,seo_score,approval_status,created_at,published_at,wordpress_url
abc123,"How to Choose the Right CRM","How to Choose the Right CRM for Your Business in 2026","choose CRM",published,1523,87,approved,2026-01-15,2026-01-20,https://example.com/blog/choose-crm
def456,"CRM vs Spreadsheets","CRM vs Spreadsheets: Why Your Business Needs to Upgrade","CRM vs spreadsheets",approved,2034,82,approved,2026-01-16,,
```

---

### 3. Batch Metadata Export

**Purpose:** Export batch summary for reporting.

**Columns:**
```csv
batch_id,batch_name,client_name,total_posts,draft_count,approved_count,published_count,avg_seo_score,created_at,goal_score_from,goal_score_to
```

---

## UI Components

### 1. Import Modal

**Location:** Batch detail page → "Import Topics" button

```
┌─────────────────────────────────────────────────────────────────────┐
│  Import Topics from CSV                                        [×]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │     📄 Drag & drop CSV file here                            │   │
│  │        or click to browse                                    │   │
│  │                                                              │   │
│  │     [Download Template]                                      │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Import Options:                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ☑ Auto-generate blogs after import                          │   │
│  │ ☐ Skip duplicates (matching topic + keyword)                │   │
│  │ ☐ Update existing posts (match by topic)                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                                    [Cancel]  [Import]               │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Import Preview

**After file upload:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Import Preview                                                [×]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  File: content_topics.csv                                           │
│  Rows detected: 25                                                  │
│  Valid rows: 23                                                     │
│  Errors: 2                                                          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ # │ Topic                        │ Keyword      │ Status    │   │
│  ├───┼──────────────────────────────┼──────────────┼───────────┤   │
│  │ 1 │ How to Choose the Right CRM  │ choose CRM   │ ✅ Valid   │   │
│  │ 2 │ CRM vs Spreadsheets          │ CRM vs sp... │ ✅ Valid   │   │
│  │ 3 │ Top 10 CRM Features          │ CRM features │ ✅ Valid   │   │
│  │ 4 │                              │ orphan key   │ ❌ Missing │   │
│  │   │                              │              │    topic   │   │
│  │ 5 │ Best CRM Software 2026       │              │ ⚠️ No     │   │
│  │   │                              │              │    keyword │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ⚠️ 2 rows have issues. Fix CSV or import valid rows only.         │
│                                                                     │
│  [Download Error Report]  [Cancel]  [Import 23 Valid Rows]          │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. Export Options Modal

**Location:** Batch detail page → "Export" button

```
┌─────────────────────────────────────────────────────────────────────┐
│  Export Batch Data                                             [×]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Export Format:                                                     │
│  ○ Topics Only (for re-import)                                      │
│  ● Full Post Data (with metrics)                                    │
│  ○ Content Export (includes body text)                              │
│                                                                     │
│  Filter by Status:                                                  │
│  ☑ Draft    ☑ In Review    ☑ Approved    ☑ Published               │
│                                                                     │
│  Include Columns:                                                   │
│  ☑ Basic Info    ☑ SEO Scores    ☐ Full Content    ☑ URLs          │
│                                                                     │
│                                    [Cancel]  [Export CSV]           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Import Endpoints

```typescript
// Upload and validate CSV
POST /api/content-batches/{batchId}/import/validate
Content-Type: multipart/form-data
Body: { file: CSV file }
Response: {
  valid: boolean,
  totalRows: number,
  validRows: number,
  errors: {
    row: number,
    column: string,
    message: string
  }[],
  preview: TopicRow[]
}

// Execute import
POST /api/content-batches/{batchId}/import
Content-Type: application/json
Body: {
  topics: TopicRow[],
  options: {
    autoGenerate: boolean,
    skipDuplicates: boolean,
    updateExisting: boolean
  }
}
Response: {
  success: boolean,
  imported: number,
  skipped: number,
  errors: ImportError[],
  postIds: string[]
}
```

### Export Endpoints

```typescript
// Export batch to CSV
GET /api/content-batches/{batchId}/export
Query: {
  format: 'topics' | 'full' | 'content',
  statuses: string[],  // comma-separated
  includeContent: boolean
}
Response: CSV file download

// Download template
GET /api/content-batches/template
Response: CSV template file
```

---

## Validation Rules

### Required Field Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| `topic` | Not empty, max 200 chars | "Topic is required" |
| `target_keyword` | Not empty, max 100 chars | "Target keyword is required" |

### Optional Field Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| `word_count_goal` | Integer, 500-5000 | "Word count must be 500-5000" |
| `due_date` | Valid date, not in past | "Due date must be future date" |
| `priority` | One of: high, medium, low | "Invalid priority value" |
| `content_type` | One of: blog, guide, listicle, how-to | "Invalid content type" |

### Duplicate Detection

```typescript
// Check for duplicates within batch
const isDuplicate = existingPosts.some(post => 
  post.topic.toLowerCase() === newTopic.toLowerCase() ||
  post.target_keyword.toLowerCase() === newKeyword.toLowerCase()
);
```

---

## Data Flow

### Import Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Upload     │────▶│  Validate   │────▶│  Preview    │
│  CSV File   │     │  Parse      │     │  Show       │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐     ┌──────▼──────┐
                    │  Generate   │◀────│  Create     │
                    │  Blogs      │     │  Posts      │
                    │  (optional) │     │  in Batch   │
                    └─────────────┘     └─────────────┘
```

### Export Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Select     │────▶│  Query      │────▶│  Format     │
│  Options    │     │  Posts      │     │  CSV        │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │  Download   │
                                        │  File       │
                                        └─────────────┘
```

---

## Implementation Files

| Component | Path |
|-----------|------|
| Import Modal | `/src/components/batch/CSVImportModal.tsx` |
| Export Modal | `/src/components/batch/CSVExportModal.tsx` |
| CSV Parser | `/src/lib/csv/parser.ts` |
| CSV Generator | `/src/lib/csv/generator.ts` |
| Validation | `/src/lib/csv/validation.ts` |
| Import API | `/src/app/api/content-batches/[id]/import/route.ts` |
| Export API | `/src/app/api/content-batches/[id]/export/route.ts` |
| Template API | `/src/app/api/content-batches/template/route.ts` |

### Dependencies

```json
{
  "papaparse": "^5.4.1",    // CSV parsing
  "file-saver": "^2.0.5"    // Client-side file download
}
```

---

## Template CSV

**Downloadable template content:**

```csv
topic,target_keyword,secondary_keywords,word_count_goal,content_type,priority,due_date,notes
"Example: Your Blog Topic Here","main keyword","related keyword 1, related keyword 2",1500,blog,medium,2026-02-15,"Any special instructions"
```

---

## Error Handling

### Import Errors

| Error Code | Message | Resolution |
|------------|---------|------------|
| `MISSING_REQUIRED` | "Row {n}: Missing required field '{field}'" | Add missing data |
| `INVALID_FORMAT` | "Row {n}: Invalid {field} format" | Fix format |
| `DUPLICATE_TOPIC` | "Row {n}: Topic already exists in batch" | Remove or enable update |
| `FILE_TOO_LARGE` | "File exceeds maximum size (5MB)" | Split into smaller files |
| `INVALID_FILE_TYPE` | "Only CSV files are supported" | Convert to CSV |

### Error Report CSV

```csv
row,column,value,error
4,topic,,Missing required field 'topic'
5,target_keyword,,Missing required field 'target_keyword'
8,word_count_goal,10000,Word count must be between 500-5000
```

---

## Acceptance Criteria

### Import
- [ ] Can upload CSV file via drag-drop or file picker
- [ ] Validates all rows before import
- [ ] Shows preview with valid/invalid row counts
- [ ] Can download error report for invalid rows
- [ ] Can import valid rows while skipping invalid
- [ ] Option to auto-generate blogs after import
- [ ] Option to skip or update duplicates

### Export
- [ ] Can export topics only (for re-import elsewhere)
- [ ] Can export full post data with metrics
- [ ] Can filter by status before export
- [ ] Can select which columns to include
- [ ] Downloads as properly formatted CSV

### Template
- [ ] Template download available from import modal
- [ ] Template includes all columns with examples
- [ ] Template opens correctly in Excel/Sheets

---

## Security Considerations

- [ ] Validate file type server-side (not just extension)
- [ ] Limit file size to 5MB
- [ ] Sanitize all imported text (prevent XSS)
- [ ] Rate limit import API (max 5 imports/minute)
- [ ] Log all import/export actions for audit

---

*This specification defines the complete CSV Import/Export functionality for content batch management.*
