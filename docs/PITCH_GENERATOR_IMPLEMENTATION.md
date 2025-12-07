# Pitch Generator Implementation

**Date:** December 2024  
**Epic:** Epic 2 - Plan Builder & Pitch Generator  
**Status:** ✅ Complete

## Overview

Implemented the Pitch Generator feature that allows CSMs to generate client-ready pitch documents in multiple formats (Email, PDF, Slide Deck).

## Features Implemented

### ✅ API Endpoint
- **Route:** `/api/websites/[id]/generate-pitch`
- **Method:** POST
- **Formats Supported:**
  - `email` - Email draft with subject line
  - `pdf` - HTML-based PDF (opens in new window for printing)
  - `slide` - Slide deck structure (JSON format)

### ✅ Pitch Content Generation

1. **Email Pitch**
   - Professional email template
   - Personalized greeting
   - Current SEO score and opportunities
   - Recommended plan summary
   - Call-to-action
   - Downloadable as .txt file

2. **PDF Pitch**
   - Professional HTML document
   - Styled for printing/PDF conversion
   - Includes:
     - Header with client name
     - Current SEO status
     - Score comparison visualization
     - Recommended plan metrics
     - Key opportunities list
     - Footer with branding

3. **Slide Deck Pitch**
   - JSON structure for 5 slides
   - Ready for presentation tools
   - Covers: Title, Status, Plan, Opportunities, Results

### ✅ UI Integration

- Added "Generate Client Pitch" card to `PitchBuilderTab`
- Three format buttons: Email, PDF, Slide Deck
- Email preview with download option
- PDF opens in new window for printing/saving

## Data Sources

The pitch generator pulls from:
- Website information
- Client details and profile
- Latest SEO audit (baseline score, pages indexed)
- Score projection data
- Topic clusters (uncovered opportunities)
- Content gaps

## Usage

1. Navigate to Website Detail page → Pitch tab
2. Calculate projection (if not already done)
3. Click "Generate Client Pitch"
4. Choose format:
   - **Email:** Get email draft with subject line
   - **PDF:** Opens printable HTML document
   - **Slide:** Returns JSON structure for slides

## Files Created/Modified

### New Files
- `src/app/api/websites/[id]/generate-pitch/route.ts` - Pitch generation API

### Modified Files
- `src/components/website/PitchBuilderTab.tsx` - Added pitch generation UI

## Next Steps (Future Enhancements)

- [ ] PDF generation using library (e.g., `react-pdf`, `puppeteer`)
- [ ] Email template customization
- [ ] Slide deck export to PowerPoint/Google Slides
- [ ] Pitch template system (customizable templates)
- [ ] Historical pitch tracking
- [ ] A/B testing for pitch effectiveness

## Example Output

### Email Format
```
Subject: SEO Content Plan to Grow [Client Name]'s Organic Reach

Hi [Client Name],

We ran an SEO and content audit on [website URL]. Right now, your content sits around an overall SEO score of 62/100...

[Full pitch content]
```

### PDF Format
- Opens in new browser window
- Styled HTML ready for printing
- Can be saved as PDF using browser print function

---

**Status:** ✅ Core functionality complete and ready for use

