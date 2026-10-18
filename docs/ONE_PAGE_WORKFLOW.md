# One-Page SEO Workflow

## Overview

The One-Page Workflow is a comprehensive, end-to-end SEO content generation system that allows users to input either a website URL or a PRD (Product Requirements Document) and automatically:

1. Scrape and analyze the website (or parse PRD)
2. Run SEO gap analysis
3. Generate topic coverage suggestions
4. Create blog titles and angles
5. Generate full blog content with images
6. Export to Google Docs or download in various formats

## Features

### Input Methods

1. **Website URL**: Scrapes the entire website with progress tracking
2. **PRD Text**: Paste a Product Requirements Document for analysis

### Workflow Steps

#### Step 1: Input Source
- Choose between URL or PRD input
- Enter website URL or paste PRD text
- Click "Start Analysis" to begin

#### Step 2: Analysis & Scraping
- **Website Scraping**: 
  - Progress bar shows scraping status
  - Tracks pages scraped (current/total)
  - Creates SEO audit with baseline score
- **PRD Parsing**:
  - Extracts key information from PRD
  - Identifies requirements and goals

#### Step 3: SEO Gap Analysis
- Calculates current SEO score
- Identifies topic gaps (high/medium/low priority)
- Generates topic clusters
- Suggests number of blogs needed

#### Step 4: Blog Suggestions
- Generates blog titles and angles
- Estimates traffic potential
- Calculates difficulty scores
- Prioritizes by traffic/difficulty ratio

#### Step 5: Content Generation
- **Generate All Content** button:
  - Creates full blog posts with human tone
  - Generates images for each blog
  - Calculates SEO scores
  - Tracks word counts

#### Step 6: Presentation & Export
- **Carousel View**: Browse generated blogs
- **Export Options**:
  - Export to Google Docs (creates folder)
  - Download as PDF
  - Download as DOCX
  - Download as Markdown

## API Endpoints

### `/api/workflow/gap-analysis`
- **Method**: POST
- **Body**: 
  ```json
  {
    "input": "https://example.com" or "PRD text...",
    "inputType": "url" | "prd"
  }
  ```
- **Response**: SEO score, topic gaps, clusters, total blogs needed

### `/api/workflow/generate-suggestions`
- **Method**: POST
- **Body**: 
  ```json
  {
    "analysis": { /* gap analysis result */ }
  }
  ```
- **Response**: Array of blog suggestions with titles, angles, keywords

### `/api/workflow/generate-blogs`
- **Method**: POST
- **Body**: 
  ```json
  {
    "blogs": [ /* array of blog suggestions */ ],
    "includeImages": true,
    "humanTone": true
  }
  ```
- **Response**: Generated blogs with full content, images, SEO scores

### `/api/workflow/export-google-docs`
- **Method**: POST
- **Body**: 
  ```json
  {
    "blogs": [ /* array of generated blogs */ ]
  }
  ```
- **Response**: Google Docs folder URL (requires API setup)

### `/api/workflow/export?format=pdf|docx|markdown`
- **Method**: POST
- **Query**: `format` (pdf, docx, or markdown)
- **Body**: 
  ```json
  {
    "blogs": [ /* array of generated blogs */ ]
  }
  ```
- **Response**: File download in requested format

## UI Components

### Progress Tracking
- Real-time progress bar
- Stage indicators (scraping, analyzing, generating, complete)
- Page count tracking for website scraping

### Carousel
- Navigate between generated blogs
- Shows blog metadata (SEO score, word count, traffic estimates)
- Displays images and full content
- Dot indicators for blog navigation

### Export Options
- Google Docs export (opens folder in new tab)
- PDF download
- DOCX download
- Markdown download

## Technical Details

### Website Scraping
- Uses existing `scrapeWebsite` function
- Saves pages to `scraped_pages` table
- Creates SEO audit record
- Calculates baseline SEO score

### Gap Analysis
- Uses `analyzeContentGaps` function
- Generates topic clusters via `generateTopicClusters`
- Prioritizes clusters by traffic/difficulty
- Identifies high-priority gaps

### Blog Generation
- Uses `generateBlogPost` from content generator
- Supports human tone (conversational) or professional
- Generates images via placeholder (Unsplash) or image generation API
- Calculates SEO quality scores

### Image Generation
- Currently uses Unsplash placeholder images
- Can be extended to use:
  - OpenAI DALL-E
  - Midjourney API
  - Stable Diffusion
  - Custom image generation service

## Future Enhancements

1. **Real Image Generation**: Integrate DALL-E or similar for custom images
2. **Google Docs API**: Full integration with Google Docs API for export
3. **Batch Processing**: Process multiple websites/PRDs in parallel
4. **Template Selection**: Choose from different blog templates/styles
5. **Brand Voice Customization**: Fine-tune tone and style per client
6. **Real-time Collaboration**: Multiple users working on same workflow
7. **Version History**: Track changes and iterations
8. **A/B Testing**: Generate multiple versions for testing

## Usage

1. Navigate to `/one-page-workflow`
2. Choose input method (URL or PRD)
3. Enter URL or paste PRD text
4. Click "Start Analysis"
5. Wait for analysis to complete
6. Review suggested blogs
7. Click "Generate All Content" to create full blogs
8. Browse blogs in carousel
9. Export or download as needed

## Notes

- Website scraping may take several minutes for large sites
- Blog generation time depends on number of blogs (approximately 30-60 seconds per blog)
- Google Docs export requires OAuth setup (currently returns mock response)
- Image generation uses placeholder images by default

