# Make.com v0 Automation Setup Guide

This guide walks you through setting up the **bare-bones Make.com automation** that gets you 80% of the value before building the full PRD system.

## Overview

**What this v0 does:**
- ✅ Turn topic CSV/Sheet into Google Doc drafts
- ✅ Route to review
- ✅ Publish approved posts to WordPress
- ✅ Log everything in one Google Sheet

**What it doesn't do:**
- ❌ Full site crawl
- ❌ SEO scoring
- ❌ Forecasting
- ❌ Revision UI
- ❌ Multi-agent pipelines
- ❌ Deep analytics

---

## Prerequisites

1. **Make.com account** (free tier works for testing)
2. **Google Workspace account** (for Sheets, Docs, Drive, Forms)
3. **OpenAI API key**
4. **WordPress site** with REST API enabled
5. **Slack workspace** (optional, for notifications)

---

## Step 1: Create the Google Sheet

Create a Google Sheet named `Content_Batch` with these columns:

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `batch_id` | Text | Unique identifier | `BATCH-2024-001` |
| `client_name` | Text | Client name | `Acme Corp` |
| `site_url` | URL | WordPress site URL | `https://acme.com` |
| `topic` | Text | Blog topic | `How to optimize WordPress performance` |
| `primary_keyword` | Text | Main SEO keyword | `wordpress optimization` |
| `intent` | Text | Search intent | `informational` |
| `target_word_count` | Number | Target length | `2000` |
| `status` | Text | Current status | `READY_TO_DRAFT` |
| `draft_doc_url` | URL | Google Doc link | `https://docs.google.com/...` |
| `editor_notes` | Text | Review notes | `Needs more examples` |
| `client_approval` | Text | YES/NO | `YES` |
| `wp_post_id` | Number | WordPress post ID | `12345` |
| `wp_post_url` | URL | Published post URL | `https://acme.com/post/...` |
| `publish_mode` | Text | DRAFT/SCHEDULE/PUBLISH | `PUBLISH` |
| `publish_datetime` | DateTime | When to publish | `2024-01-15 10:00:00` |
| `last_updated` | DateTime | Last update timestamp | `2024-01-10 14:30:00` |

### Status Values

Use these exact status values:
- `READY_TO_DRAFT` - Ready for AI to generate draft
- `NEEDS_REVIEW` - Draft created, waiting for editor
- `CHANGES_REQUESTED` - Editor requested changes
- `APPROVED_FOR_PUBLISH` - Approved and ready to publish
- `PUBLISHED` - Successfully published to WordPress
- `ERROR` - Something went wrong

---

## Step 2: Set Up Google Drive Folders

Create this folder structure in Google Drive:

```
/Clients/
  /{client_name}/
    /Drafts/
```

Example:
```
/Clients/
  /Acme Corp/
    /Drafts/
```

---

## Step 3: Scenario 1 - Topic → Draft Doc → Notify Editor

### Trigger: Watch Google Sheet

1. **Add Module:** `Google Sheets > Watch Rows`
2. **Configure:**
   - Spreadsheet: `Content_Batch`
   - Watch column: `status`
   - Filter: `status` equals `READY_TO_DRAFT`

### Module 2: Set Variables

1. **Add Module:** `Tools > Set Variables`
2. **Variables to set:**
   - `topic` = `{{1.topic}}`
   - `primary_keyword` = `{{1.primary_keyword}}`
   - `intent` = `{{1.intent}}`
   - `target_word_count` = `{{1.target_word_count}}`
   - `client_name` = `{{1.client_name}}`
   - `site_url` = `{{1.site_url}}`
   - `batch_id` = `{{1.batch_id}}`

### Module 3: Build Prompt

1. **Add Module:** `Tools > Text Aggregator`
2. **Template:**

```
You are an expert SEO content writer. Write a comprehensive blog post with the following requirements:

**Topic:** {{2.topic}}
**Primary Keyword:** {{2.primary_keyword}}
**Search Intent:** {{2.intent}}
**Target Word Count:** {{2.target_word_count}}
**Client Website:** {{2.site_url}}

**Requirements:**
1. Write in HTML format ready for WordPress
2. Include proper H1, H2, H3 headings
3. Add a meta description (150-160 characters)
4. Suggest a URL slug
5. Include internal linking opportunities
6. Write engaging, informative content that matches the search intent
7. Ensure content is factually accurate and well-researched
8. Include a compelling introduction and conclusion

**Output Format (JSON):**
{
  "title": "SEO-optimized title",
  "meta_description": "150-160 char description",
  "slug": "url-friendly-slug",
  "content": "Full HTML content here",
  "excerpt": "Short excerpt for WordPress"
}

Begin writing:
```

### Module 4: Call OpenAI API

1. **Add Module:** `HTTP > Make a Request`
2. **Configure:**
   - **URL:** `https://api.openai.com/v1/chat/completions`
   - **Method:** `POST`
   - **Headers:**
     - `Authorization`: `Bearer {{$env.OPENAI_API_KEY}}`
     - `Content-Type`: `application/json`
   - **Body (JSON):**
   ```json
   {
     "model": "gpt-4",
     "messages": [
       {
         "role": "system",
         "content": "You are an expert SEO content writer specializing in WordPress-ready blog posts. Always return valid JSON."
       },
       {
         "role": "user",
         "content": "{{3.text}}"
       }
     ],
     "temperature": 0.7,
     "max_tokens": 4000
   }
   ```

3. **Error Handling:**
   - Add error route: If error occurs → go to error handler module

### Module 5: Parse JSON Response

1. **Add Module:** `Tools > JSON Parser`
2. **Data:** `{{4.choices[0].message.content}}`

### Module 6: Create Google Doc

1. **Add Module:** `Google Docs > Create a Document`
2. **Configure:**
   - **Title:** `{{2.topic}} - {{2.primary_keyword}}`
   - **Body:**
   ```
   **Batch ID:** {{2.batch_id}}
   **Client:** {{2.client_name}}
   **Primary Keyword:** {{2.primary_keyword}}
   **Intent:** {{2.intent}}
   **Target Word Count:** {{2.target_word_count}}
   **Generated:** {{$now}}
   
   ---
   
   **SEO Title:** {{5.title}}
   **Meta Description:** {{5.meta_description}}
   **Slug:** {{5.slug}}
   
   ---
   
   {{5.content}}
   ```

### Module 7: Move to Client Folder

1. **Add Module:** `Google Drive > Move File`
2. **Configure:**
   - **File ID:** `{{6.id}}`
   - **Folder:** `/Clients/{{2.client_name}}/Drafts`

### Module 8: Update Sheet

1. **Add Module:** `Google Sheets > Update a Row`
2. **Configure:**
   - **Spreadsheet:** `Content_Batch`
   - **Row ID:** `{{1.id}}`
   - **Values:**
     - `draft_doc_url` = `{{6.url}}`
     - `status` = `NEEDS_REVIEW`
     - `last_updated` = `{{$now}}`

### Module 9: Notify Editor

**Option A: Slack**
1. **Add Module:** `Slack > Send a Message`
2. **Configure:**
   - **Channel:** `#content-review`
   - **Message:**
   ```
   📝 *New Draft Ready for Review*
   
   *Topic:* {{2.topic}}
   *Client:* {{2.client_name}}
   *Keyword:* {{2.primary_keyword}}
   *Word Count Target:* {{2.target_word_count}}
   
   *Draft Document:* {{6.url}}
   
   *Batch ID:* {{2.batch_id}}
   
   Please review and update status in the Content_Batch sheet.
   ```

**Option B: Gmail**
1. **Add Module:** `Gmail > Send an Email`
2. Configure with similar message content

### Error Handler Modules

**Module 10: Update Sheet on Error**
1. **Add Module:** `Google Sheets > Update a Row`
2. **Configure:**
   - **Spreadsheet:** `Content_Batch`
   - **Row ID:** `{{1.id}}`
   - **Values:**
     - `status` = `ERROR`
     - `editor_notes` = `OpenAI API Error: {{4.error}}`
     - `last_updated` = `{{$now}}`

**Module 11: Notify Admin on Error**
1. **Add Module:** `Slack > Send a Message`
2. **Channel:** `#content-errors`
3. **Message:** Error details

---

## Step 4: Scenario 2 - Approval → WordPress Publish

### Trigger: Watch for Approved Posts

1. **Add Module:** `Google Sheets > Watch Rows`
2. **Configure:**
   - Spreadsheet: `Content_Batch`
   - Watch column: `status`
   - Filter: `status` equals `APPROVED_FOR_PUBLISH`

### Module 2: Get Full Row

1. **Add Module:** `Google Sheets > Get a Row`
2. **Row ID:** `{{1.id}}`

### Module 3: Get Draft Content

1. **Add Module:** `Google Docs > Get a Document`
2. **Document ID:** Extract from `{{2.draft_doc_url}}`

### Module 4: Extract HTML Content

1. **Add Module:** `Tools > Text Parser` or `Tools > Regex`
2. Extract the HTML content from the document body (everything after the `---` separator)

### Module 5: Prepare WordPress Data

1. **Add Module:** `Tools > Set Variables`
2. **Variables:**
   - `wp_status` = `{{2.publish_mode}}` (convert to lowercase: `draft`, `publish`, or `future`)
   - `wp_date` = `{{2.publish_datetime}}` (format as ISO 8601)

### Module 6: Publish to WordPress

1. **Add Module:** `HTTP > Make a Request`
2. **Configure:**
   - **URL:** `{{2.site_url}}/wp-json/wp/v2/posts`
   - **Method:** `POST`
   - **Headers:**
     - `Authorization`: `Basic {{$env.WORDPRESS_AUTH}}` (Base64 encoded `username:password`)
     - `Content-Type`: `application/json`
   - **Body (JSON):**
   ```json
   {
     "title": "{{2.topic}}",
     "content": "{{4.content}}",
     "status": "{{5.wp_status}}",
     "date": "{{5.wp_date}}",
     "slug": "{{2.primary_keyword}}",
     "excerpt": "{{2.topic}} - {{2.primary_keyword}}"
   }
   ```

### Module 7: Update Sheet

1. **Add Module:** `Google Sheets > Update a Row`
2. **Configure:**
   - **Spreadsheet:** `Content_Batch`
   - **Row ID:** `{{1.id}}`
   - **Values:**
     - `wp_post_id` = `{{6.id}}`
     - `wp_post_url` = `{{6.link}}`
     - `status` = `PUBLISHED`
     - `last_updated` = `{{$now}}`

### Module 8: Notify Success

1. **Add Module:** `Slack > Send a Message`
2. Notify team of successful publication

### Error Handler

Similar to Scenario 1, add error handling modules.

---

## Step 5: Scenario 2B (Optional) - Client Approval via Google Form

### Create Google Form

Create a form with fields:
- `batch_id` (Short answer)
- `topic` (Short answer, pre-filled if possible)
- `approve` (Multiple choice: YES / NO)
- `notes` (Paragraph)

### Trigger: Watch Form Responses

1. **Add Module:** `Google Forms > Watch Responses`

### Filter: Only Approved

1. **Add Module:** `Tools > Filter`
2. **Condition:** `{{1.approve}}` equals `YES`

### Find Row by Batch ID

1. **Add Module:** `Google Sheets > Search Rows`
2. **Search:** `batch_id` equals `{{1.batch_id}}`

### Update Approval Status

1. **Add Module:** `Google Sheets > Update a Row`
2. **Values:**
   - `client_approval` = `YES`
   - `status` = `APPROVED_FOR_PUBLISH`
   - `editor_notes` = `{{1.notes}}`
   - `last_updated` = `{{$now}}`

---

## Step 6: Scenario 3 - Monthly Report Email

### Trigger: Monthly Scheduler

1. **Add Module:** `Scheduler > Schedule`
2. **Schedule:** `0 9 1 * *` (9 AM on the 1st of every month)
3. **Timezone:** Your timezone

### Get Published Posts

1. **Add Module:** `Google Sheets > Search Rows`
2. **Search Criteria:**
   - `status` equals `PUBLISHED`
   - `last_updated` is within last 30 days

### Group by Client

1. **Add Module:** `Tools > Aggregator`
2. **Group by:** `client_name`
3. **Aggregate:** List of `wp_post_url` and `topic`

### Build Report Data

1. **Add Module:** `Tools > Text Aggregator`
2. Build a summary of published posts per client

### Generate Email with OpenAI

1. **Add Module:** `HTTP > Make a Request` (OpenAI API)
2. **Prompt:** Generate a client-friendly email summarizing published content and suggesting next batch

### Send Email

1. **Add Module:** `Gmail > Send an Email`
2. **To:** Client email (you may need to maintain a client email mapping)
3. **Subject:** `Monthly Content Report - [Month Year]`
4. **Body:** Generated email content

---

## Environment Variables

Set these in Make.com Settings:

1. **OPENAI_API_KEY** - Your OpenAI API key
2. **WORDPRESS_AUTH** - Base64 encoded `username:password` or WordPress application password
3. **APPROVAL_FORM_ID** (optional) - Google Form ID for Scenario 2B

### How to Get WordPress Auth

**Option 1: Application Password (Recommended)**
1. WordPress Admin → Users → Your Profile
2. Scroll to "Application Passwords"
3. Create new application password
4. Use format: `username:application_password`
5. Base64 encode it

**Option 2: Basic Auth**
1. Use your WordPress username and password
2. Format: `username:password`
3. Base64 encode it

**Base64 Encoding:**
- Use Make.com's `Tools > Encode/Decode` module
- Or use online tool: `https://www.base64encode.org/`

---

## Testing Checklist

### Scenario 1 Test
- [ ] Add row to sheet with `status = READY_TO_DRAFT`
- [ ] Verify OpenAI API call succeeds
- [ ] Verify Google Doc is created
- [ ] Verify doc is moved to correct folder
- [ ] Verify sheet is updated with draft URL
- [ ] Verify notification is sent
- [ ] Test error handling (use invalid API key)

### Scenario 2 Test
- [ ] Manually set `status = APPROVED_FOR_PUBLISH` in sheet
- [ ] Verify WordPress API call succeeds
- [ ] Verify post is created in WordPress
- [ ] Verify sheet is updated with post ID and URL
- [ ] Verify success notification
- [ ] Test error handling (use invalid WordPress credentials)

### Scenario 3 Test
- [ ] Trigger scheduler manually
- [ ] Verify published posts are retrieved
- [ ] Verify email is generated
- [ ] Verify email is sent

---

## Troubleshooting

### OpenAI API Errors
- Check API key is correct
- Verify you have credits/quota
- Check rate limits
- Review error message in `editor_notes` column

### WordPress API Errors
- Verify REST API is enabled
- Check authentication credentials
- Verify user has publish_posts capability
- Check WordPress site URL is correct

### Google Sheets Not Updating
- Verify webhook/watch is active
- Check sheet permissions
- Verify column names match exactly
- Check for typos in status values

### Google Docs Not Created
- Verify Google Drive API is connected
- Check folder permissions
- Verify folder path exists

---

## Next Steps

Once this v0 is working:

1. **Add SEO scoring** - Integrate with SEO tools API
2. **Add site crawling** - Use Make.com's webhook or HTTP modules
3. **Build the full dashboard** - Replace Make.com with your PRD system
4. **Add analytics** - Connect Google Analytics/Search Console
5. **Add revision workflow** - Multiple review rounds
6. **Add forecasting** - Predict SEO impact

---

## Support

For issues:
1. Check Make.com execution logs
2. Review error messages in Google Sheet `editor_notes` column
3. Check Slack error notifications
4. Verify all API credentials are correct

---

## The v0 Promise

With just **Scenario 1 + Scenario 2**, you have:
- ✅ A production-ready "content factory"
- ✅ Human QA checkpoint
- ✅ Client approval gate
- ✅ WordPress publishing
- ✅ Full traceability in one sheet

This gets you **80% of the value** before building the full system!

