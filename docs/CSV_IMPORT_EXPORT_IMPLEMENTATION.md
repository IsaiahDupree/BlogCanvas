# CSV Import/Export Implementation

**Date:** December 2024  
**Epic:** Epic 3 - Content Batch & AI Writing Pipeline  
**Status:** ✅ Complete

## Overview

Implemented CSV import and export functionality for content batches, allowing CSMs to bulk import topics and export batch data for external editing.

## Features Implemented

### ✅ CSV Import

**API Endpoint:** `POST /api/content-batches/[id]/import-csv`

**Features:**
- Accepts CSV file upload
- Parses CSV with flexible column names
- Creates blog posts from CSV rows
- Matches topic clusters by name
- Handles errors gracefully
- Updates batch total_posts count

**CSV Format:**
```csv
Topic,Target Keyword,Target Wordcount,Topic Cluster,Priority,Notes
"How to Use AI","AI tools",1500,"AI Technology",1,"Focus on practical examples"
"SEO Best Practices","SEO optimization",2000,"SEO",2,"Include case studies"
```

**Supported Column Names:**
- Topic: `topic`, `title`, `Topic`, `Title`
- Target Keyword: `target_keyword`, `keyword`, `Target Keyword`, `Keyword`
- Target Wordcount: `target_wordcount`, `wordcount`, `Target Wordcount`, `Wordcount`
- Topic Cluster: `topic_cluster`, `cluster`, `Topic Cluster`, `Cluster`
- Priority: `priority`, `Priority`
- Notes: `notes`, `description`, `Notes`, `Description`

**Response:**
```json
{
  "success": true,
  "imported": 10,
  "total": 12,
  "errors": ["Row 5: Missing topic/title"],
  "posts": [...]
}
```

### ✅ CSV Export

**API Endpoint:** `GET /api/content-batches/[id]/export-csv`

**Features:**
- Exports all posts in batch as CSV
- Includes all relevant fields
- Proper CSV formatting with headers
- Downloadable file with timestamp

**Exported Columns:**
- Topic
- Target Keyword
- Target Wordcount
- Topic Cluster
- Priority
- Notes
- Status

**File Naming:**
- Format: `{batch_name}_export_{date}.csv`
- Example: `Q1_2024_Content_Strategy_export_2024-12-05.csv`

### ✅ UI Integration

**Batch Detail Page (`src/app/app/batches/[id]/page.tsx`):**
- Added "Import CSV" button with file picker
- Added "Export CSV" button
- Import progress feedback
- Error handling and user notifications

**User Flow:**
1. Navigate to batch detail page
2. Click "Import CSV" → Select file → Auto-imports
3. Click "Export CSV" → Downloads CSV file
4. Edit CSV externally → Re-import if needed

## Technical Details

### Dependencies
- `csv-parse` - For parsing uploaded CSV files
- `csv-stringify` - For generating CSV export files

### Error Handling
- Validates file presence
- Validates batch existence
- Handles missing required fields (topic)
- Continues processing on row errors
- Returns detailed error messages

### Data Mapping
- Automatically matches topic clusters by name (case-insensitive)
- Sets default wordcount to 1500 if not provided
- Stores additional metadata in `draft` JSONB field
- Links posts to batch and client

## Files Created/Modified

### New Files
- `src/app/api/content-batches/[id]/import-csv/route.ts` - CSV import API
- `src/app/api/content-batches/[id]/export-csv/route.ts` - CSV export API
- `docs/CSV_IMPORT_EXPORT_IMPLEMENTATION.md` - This documentation

### Modified Files
- `src/app/app/batches/[id]/page.tsx` - Added import/export UI
- `package.json` - Added csv-parse and csv-stringify dependencies

## Usage Examples

### Import CSV
1. Prepare CSV file with topics:
```csv
Topic,Target Keyword,Target Wordcount
"How to Start a Blog","blogging tips",1500
"SEO for Beginners","SEO basics",2000
```

2. Click "Import CSV" on batch detail page
3. Select CSV file
4. Posts are automatically created

### Export CSV
1. Click "Export CSV" on batch detail page
2. CSV file downloads automatically
3. Edit in Excel/Google Sheets
4. Re-import if needed

## Next Steps (Future Enhancements)

- [ ] CSV template download
- [ ] Bulk edit via CSV (update existing posts)
- [ ] Import validation preview before import
- [ ] Support for additional fields (due dates, assignees)
- [ ] Import from Google Sheets URL
- [ ] Export with analytics data

---

**Status:** ✅ Core functionality complete and ready for use

