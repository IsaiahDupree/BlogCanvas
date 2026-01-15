# BlogCanvas AI Configuration Guide

This guide explains how BlogCanvas uses AI, how to configure it, and how to optimize AI-generated content for your needs.

---

## Table of Contents

1. [AI Overview](#ai-overview)
2. [Setting Up AI](#setting-up-ai)
3. [The 5-Agent Pipeline](#the-5-agent-pipeline)
4. [AI Models & Providers](#ai-models--providers)
5. [Configuring AI Behavior](#configuring-ai-behavior)
6. [Optimizing AI Output](#optimizing-ai-output)
7. [AI Costs & Usage](#ai-costs--usage)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Configuration](#advanced-configuration)

---

## AI Overview

### What AI Does in BlogCanvas

BlogCanvas uses OpenAI's GPT models to automate blog content creation. AI handles:

- **Outline Generation** - Creates H2/H3 structure, FAQs, table ideas
- **Content Drafting** - Writes full blog posts with intro, body, conclusion
- **SEO Optimization** - Adds meta tags, keywords, internal links
- **Fact Checking** - Identifies claims needing sources, suggests citations
- **Content Enhancement** - Adds tables, bullets, image prompts

### What AI Cannot Do

AI is powerful but has limitations:

❌ **Cannot** access real-time data (uses training data up to cutoff date)
❌ **Cannot** verify facts independently (requires human fact-checking)
❌ **Cannot** perfectly capture brand voice (requires human refinement)
❌ **Cannot** create truly original insights (recombines existing knowledge)

**Bottom line:** AI accelerates content creation, but human review is essential for quality.

---

## Setting Up AI

### Prerequisites

- OpenAI account with API access
- Valid payment method on OpenAI account
- API key with sufficient credits

### Getting Your OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Name your key (e.g., "BlogCanvas Production")
6. Copy the key immediately (it's shown only once)
7. Store securely (treat like a password)

### Configuring BlogCanvas

#### For Self-Hosted Deployments

1. Open your `.env.local` file
2. Add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-proj-...your-key-here
   ```
3. Restart your BlogCanvas server:
   ```bash
   npm run dev  # Development
   npm run start  # Production
   ```

#### For Managed Deployments

If BlogCanvas is hosted for you, contact your administrator to provide the API key securely.

### Verifying Configuration

Test that AI is working:

1. Log into BlogCanvas vendor dashboard
2. Create a test blog post
3. Click **"Generate Draft"**
4. If outline generation starts, AI is configured correctly
5. If you see an error, check troubleshooting section below

---

## The 5-Agent Pipeline

BlogCanvas uses a **multi-agent pipeline** where each AI agent has a specialized role.

### Pipeline Workflow

```
[Input: Topic + Keyword]
        ↓
   Outline Agent
        ↓
   Drafting Agent
        ↓
     SEO Agent
        ↓
  Fact-Check Agent
        ↓
  Enhancement Agent
        ↓
[Output: Polished Blog Post]
```

### Agent 1: Outline Agent

**Purpose:** Creates a structured content outline

**Inputs:**
- Topic title
- Target keyword
- Word count goal (default: 1500-2000 words)
- Client profile (audience, products/services)
- Research data (optional)

**Outputs:**
```json
{
  "h1_title": "Main Title",
  "meta_description": "155-char description",
  "introduction_points": ["Point 1", "Point 2", "Point 3"],
  "main_sections": [
    {
      "h2": "Section Heading",
      "h3_subsections": ["Subheading 1", "Subheading 2"],
      "key_points": ["Point A", "Point B"]
    }
  ],
  "faqs": [
    {
      "question": "Common question?",
      "answer_outline": "Brief answer structure"
    }
  ],
  "table_ideas": [
    {
      "title": "Comparison Table",
      "columns": ["Feature", "Option A", "Option B"]
    }
  ]
}
```

**Model Used:** `gpt-4o-mini` (fast, cost-effective)

**Average Duration:** 10-20 seconds

### Agent 2: Drafting Agent

**Purpose:** Writes full blog post content

**Inputs:**
- Outline from Agent 1
- Target keyword
- Word count goal
- Client brand voice
- Tone guidelines

**Outputs:**
```json
{
  "title": "Final Title",
  "meta_description": "SEO-optimized description",
  "introduction": "Full intro paragraph...",
  "sections": [
    {
      "heading": "H2 Heading",
      "content": "Full paragraph content...",
      "subsections": [...]
    }
  ],
  "conclusion": "Concluding paragraph...",
  "cta": "Call-to-action text"
}
```

**Model Used:** `gpt-4o-mini` (default) or `gpt-4o` (premium)

**Average Duration:** 30-60 seconds

### Agent 3: SEO Agent

**Purpose:** Optimizes content for search engines

**Inputs:**
- Draft from Agent 2
- Target keyword
- Related keywords (optional)
- Existing website content (for internal linking)

**Outputs:**
```json
{
  "optimized_title": "SEO-optimized H1",
  "meta_description": "Keyword-rich description",
  "target_keyword_usage": {
    "count": 8,
    "density": "1.2%",
    "placement": ["H1", "H2", "intro", "conclusion"]
  },
  "heading_improvements": [
    {
      "original": "Old heading",
      "improved": "SEO-optimized heading"
    }
  ],
  "internal_link_suggestions": [
    {
      "anchor_text": "related topic",
      "suggested_url": "/blog/related-post"
    }
  ],
  "seo_score": 85
}
```

**Model Used:** `gpt-4o-mini`

**Average Duration:** 15-30 seconds

### Agent 4: Fact-Check Agent

**Purpose:** Identifies claims requiring verification

**Inputs:**
- Content from Agent 3
- Topic domain
- Sensitivity level (health, finance, etc.)

**Outputs:**
```json
{
  "flagged_claims": [
    {
      "claim": "Specific factual statement",
      "location": "Section 2, paragraph 3",
      "confidence": "low",
      "reason": "Requires recent data",
      "suggested_source": "Link to authoritative source"
    }
  ],
  "citation_suggestions": [
    {
      "statement": "Statistical claim",
      "suggested_citation": "Study name, year"
    }
  ],
  "overall_confidence": "medium"
}
```

**Model Used:** `gpt-4o-mini`

**Average Duration:** 15-25 seconds

### Agent 5: Enhancement Agent

**Purpose:** Improves readability and engagement

**Inputs:**
- Content from Agent 4
- Fact-check results
- Enhancement preferences (tables, lists, images)

**Outputs:**
```json
{
  "readability_improvements": [
    {
      "original_paragraph": "Long complex text...",
      "improved_paragraph": "Clearer, shorter text...",
      "improvement_type": "sentence_splitting"
    }
  ],
  "formatting_suggestions": [
    {
      "location": "Section 3",
      "suggestion": "Convert to bullet list",
      "content": ["Point 1", "Point 2", "Point 3"]
    }
  ],
  "table_data": [
    {
      "title": "Feature Comparison",
      "rows": [...]
    }
  ],
  "image_prompts": [
    {
      "location": "After H2: Getting Started",
      "prompt": "Professional workspace with laptop and coffee",
      "alt_text": "Modern workspace setup"
    }
  ]
}
```

**Model Used:** `gpt-4o-mini`

**Average Duration:** 20-30 seconds

### Total Pipeline Duration

**End-to-end:** 90-165 seconds (~1.5 - 2.75 minutes)

---

## AI Models & Providers

### Available Models

BlogCanvas uses OpenAI's GPT-4 family:

| Model | Speed | Cost | Quality | Use Case |
|-------|-------|------|---------|----------|
| `gpt-4o-mini` | ⚡ Fast | 💰 Low | ⭐⭐⭐ Good | Default for all agents |
| `gpt-4o` | 🐢 Slower | 💰💰💰 High | ⭐⭐⭐⭐⭐ Excellent | Premium content |

### Default Configuration

By default, BlogCanvas uses **gpt-4o-mini** for all agents. This provides:

- ✅ Fast generation (1-2 minutes per post)
- ✅ Low cost (10-20x cheaper than gpt-4o)
- ✅ Good quality (suitable for most content)

### When to Use Premium Model (gpt-4o)

Consider upgrading to `gpt-4o` for:

- 🎯 High-value content (pillar pages, landing pages)
- 🏆 Competitive keywords (need maximum quality)
- 🎨 Complex topics (technical, medical, financial)
- 🌟 Brand showcase pieces (thought leadership)

**Cost Difference:**
- `gpt-4o-mini`: ~$0.10 per blog post
- `gpt-4o`: ~$2.00 per blog post

### Changing Models

To use `gpt-4o` for specific agents:

1. Navigate to Settings → AI Configuration (coming soon)
2. Select model for each agent:
   - Outline: `gpt-4o-mini` (recommended)
   - Draft: `gpt-4o` (premium option)
   - SEO: `gpt-4o-mini` (recommended)
   - Fact-Check: `gpt-4o-mini` (recommended)
   - Enhancement: `gpt-4o-mini` (recommended)
3. Save configuration

**Note:** UI for model selection is planned. Currently requires code changes.

---

## Configuring AI Behavior

### Temperature Setting

**Temperature** controls AI creativity vs. consistency (0.0 - 1.0):

- **0.0 - 0.3:** Very consistent, factual, predictable
- **0.4 - 0.7:** Balanced (default: 0.7)
- **0.8 - 1.0:** Creative, varied, less predictable

**Default:** `0.7` (good balance for blog content)

**When to adjust:**

| Temperature | Use Case |
|-------------|----------|
| 0.3 | Technical documentation, data-heavy content |
| 0.5 | News, reporting, factual content |
| 0.7 | Blog posts, guides, educational content (default) |
| 0.9 | Creative writing, storytelling, brand narratives |

### Max Tokens

**Max Tokens** limits output length:

- **Default:** 4000 tokens (~3000 words)
- **Range:** 300 - 16000 tokens

**Current defaults:**
- Outline Agent: 4000 tokens
- Drafting Agent: 4000 tokens
- SEO Agent: 4000 tokens
- Fact-Check Agent: 4000 tokens
- Enhancement Agent: 4000 tokens

**When to adjust:**

- Increase for longer-form content (3000+ words)
- Decrease for short posts (<1000 words)

### Retry Logic

AI calls can fail due to rate limits or temporary issues. BlogCanvas automatically retries:

- **Default retries:** 3 attempts
- **Backoff strategy:** Exponential (1s, 2s, 4s)
- **Rate limit handling:** Automatic wait and retry

**Error handling:**

| Error | Behavior |
|-------|----------|
| 401/403 (Auth error) | Immediate failure, no retry |
| 429 (Rate limit) | Exponential backoff, retry |
| 500 (Server error) | Retry 3 times |
| Timeout | Retry 3 times |

---

## Optimizing AI Output

### Provide Rich Context

The more context you provide, the better AI output:

#### Client Profile

Complete these fields in client detail page:

- **Company Description** - What the business does
- **Products/Services** - Specific offerings
- **Target Audience** - Who you're writing for
- **Industry/Niche** - Market segment
- **Brand Voice** - Tone and style preferences
- **Unique Value Proposition** - What makes client different

#### Brand Guide

Populate brand guide with:

- **Voice & Tone** - "Professional but approachable", "Casual and friendly", etc.
- **Do's** - Preferred terms, phrasing, examples
- **Don'ts** - Jargon to avoid, tone mistakes
- **Writing Style** - Sentence length, paragraph structure
- **Sample Content** - Links to great existing posts

**Example Brand Guide:**

```markdown
## Voice & Tone
Professional yet approachable. Use "we" to create partnership. Optimistic and solution-focused.

## Do's
- Use "platform" instead of "software"
- Start paragraphs with action verbs
- Include real customer examples
- Keep sentences under 25 words

## Don'ts
- Avoid jargon like "synergy", "leverage", "paradigm"
- Don't make unsubstantiated claims
- Never use exclamation points!!!
- Don't mention competitors by name

## Target Audience
Marketing directors at B2B SaaS companies (50-500 employees). Pain points: too many tools, inconsistent data, budget waste. Goals: consolidation, efficiency, ROI.
```

#### Research Data

When available, provide research data to outline agent:

```json
{
  "competitor_content": [
    {
      "title": "Competitor post title",
      "url": "https://competitor.com/post",
      "key_points": ["Point 1", "Point 2"]
    }
  ],
  "keyword_data": {
    "primary_keyword": "target keyword",
    "search_volume": 2400,
    "difficulty": 42,
    "related_keywords": ["keyword 1", "keyword 2"]
  },
  "client_data": {
    "existing_content": ["URL 1", "URL 2"],
    "products": ["Product A", "Product B"]
  }
}
```

### Review and Refine Iteratively

Don't expect perfection on first generation:

1. **Generate initial draft** - Let AI create baseline
2. **Review output** - Identify issues (tone, accuracy, structure)
3. **Update brand guide** - Capture learnings for next time
4. **Regenerate section** - Or edit manually
5. **Repeat** - Each iteration improves quality

### Use Templates

Create post templates for common content types:

**Example Template: "How-To Guide"**

```markdown
Outline Structure:
- H1: How to [Achieve Goal] in [Timeframe]
- Introduction: Problem statement + solution preview
- H2: Prerequisites (what you need)
- H2: Step-by-Step Process
  - H3: Step 1
  - H3: Step 2
  - H3: Step 3
- H2: Common Mistakes to Avoid
- H2: Best Practices
- H2: Conclusion + CTA

Tone: Instructional, encouraging, clear
Word Count: 1500-2000
Keywords: [Timeframe] [tool/method], [achieve goal] quickly
```

Save templates and reuse for consistent AI output.

---

## AI Costs & Usage

### OpenAI Pricing (as of 2026)

| Model | Input | Output | Per 1M Tokens |
|-------|-------|--------|---------------|
| gpt-4o-mini | $0.15 | $0.60 | per 1M tokens |
| gpt-4o | $5.00 | $15.00 | per 1M tokens |

### Average Token Usage per Blog Post

**Using gpt-4o-mini (default):**

| Agent | Input Tokens | Output Tokens | Cost |
|-------|--------------|---------------|------|
| Outline | ~1,500 | ~1,000 | ~$0.002 |
| Draft | ~2,000 | ~2,500 | ~$0.002 |
| SEO | ~2,500 | ~1,500 | ~$0.002 |
| Fact-Check | ~2,500 | ~1,000 | ~$0.002 |
| Enhancement | ~2,500 | ~1,500 | ~$0.002 |
| **Total** | **~11,000** | **~7,500** | **~$0.01** |

**Per blog post:** ~$0.01 (1 cent)

**Using gpt-4o (premium):**

**Per blog post:** ~$0.30 (30 cents)

### Monthly Cost Estimates

| Posts per Month | Model | Estimated Cost |
|----------------|-------|----------------|
| 10 | gpt-4o-mini | $0.10 |
| 50 | gpt-4o-mini | $0.50 |
| 100 | gpt-4o-mini | $1.00 |
| 500 | gpt-4o-mini | $5.00 |
| 10 | gpt-4o | $3.00 |
| 50 | gpt-4o | $15.00 |
| 100 | gpt-4o | $30.00 |
| 500 | gpt-4o | $150.00 |

### Monitoring Usage

Track your OpenAI usage:

1. Go to [platform.openai.com/usage](https://platform.openai.com/usage)
2. View usage by day/week/month
3. Set spending limits under **Billing → Limits**

**Recommended limits:**

- **Soft limit:** $50/month (alert)
- **Hard limit:** $100/month (stop)

### Reducing Costs

**Strategies to minimize AI costs:**

1. **Use gpt-4o-mini** for most content (10-20x cheaper)
2. **Batch generation** - Generate multiple posts in one session
3. **Optimize prompts** - Shorter, clearer prompts = fewer tokens
4. **Reuse research** - Cache research data, use for multiple posts
5. **Selective regeneration** - Only regenerate failed sections, not entire posts

---

## Troubleshooting

### Common Issues

#### Issue: "OPENAI_API_KEY environment variable is not set"

**Cause:** API key not configured

**Solution:**
1. Check `.env.local` file exists
2. Verify `OPENAI_API_KEY=sk-proj-...` is present
3. Restart server: `npm run dev`
4. If still failing, check for typos in variable name

---

#### Issue: "OpenAI authentication error: Incorrect API key"

**Cause:** Invalid or expired API key

**Solution:**
1. Verify API key in OpenAI dashboard
2. Create new API key if needed
3. Update `.env.local` with new key
4. Restart server

---

#### Issue: "Rate limit exceeded (429)"

**Cause:** Too many requests in short time

**Solution:**
1. BlogCanvas automatically retries with backoff
2. Wait 1-2 minutes and try again
3. For persistent issues:
   - Check OpenAI dashboard for rate limit tier
   - Upgrade OpenAI account tier if needed
   - Reduce concurrent generations

---

#### Issue: "No content in OpenAI response"

**Cause:** API returned empty response

**Solution:**
1. Retry generation (automatic)
2. Check OpenAI status: [status.openai.com](https://status.openai.com)
3. If persistent, may be prompt issue - contact support

---

#### Issue: AI generates off-brand content

**Cause:** Insufficient brand context

**Solution:**
1. Complete client profile with detailed info
2. Populate brand guide thoroughly
3. Provide example posts AI should emulate
4. Use specific instructions in topic description
5. Review and refine brand guide based on output

---

#### Issue: AI content is too generic

**Cause:** Lack of specific context

**Solution:**
1. Add more detail to topic description
2. Provide research data (competitor analysis)
3. Include client-specific examples in brand guide
4. Use premium model (gpt-4o) for better quality
5. Edit manually to add unique insights

---

#### Issue: Slow AI generation (>5 minutes)

**Cause:** Server overload or API issues

**Solution:**
1. Check OpenAI status page
2. Refresh page and retry
3. Reduce max_tokens if consistently slow
4. Check server logs for errors
5. Verify sufficient API credits

---

### Getting Support

#### OpenAI API Issues

- **Status:** [status.openai.com](https://status.openai.com)
- **Support:** [help.openai.com](https://help.openai.com)
- **Community:** [community.openai.com](https://community.openai.com)

#### BlogCanvas Issues

- **Email:** support@blogcanvas.io
- **Documentation:** https://docs.blogcanvas.io
- **GitHub:** https://github.com/blogcanvas/blogcanvas/issues

---

## Advanced Configuration

### Custom System Prompts

Advanced users can customize AI behavior by editing agent system prompts.

**Location:** `src/lib/agents/[agent-name].ts`

**Example: Outline Agent**

```typescript
const systemPrompt = `
You are an expert content strategist creating SEO-optimized blog outlines.

Your outlines should:
- Have clear H2/H3 hierarchical structure
- Target specific keywords naturally
- Include 3-5 FAQs addressing common questions
- Suggest data tables where appropriate
- Consider search intent (informational, commercial, transactional)

Tone: ${clientProfile.brandVoice || 'professional yet approachable'}
Audience: ${clientProfile.targetAudience || 'general business audience'}
`;
```

**Customization tips:**

- Add industry-specific instructions
- Emphasize particular content elements
- Adjust tone/style directives
- Include formatting preferences

**Warning:** Modifying prompts requires code changes. Test thoroughly before production use.

### Model Fine-Tuning

OpenAI allows fine-tuning models on your own data.

**Use cases:**
- Capture unique brand voice consistently
- Specialize in niche industry content
- Improve accuracy for specific topics

**Process:**
1. Collect 50-100 example posts (your best content)
2. Format as OpenAI training data (JSONL)
3. Upload to OpenAI for fine-tuning
4. Update BlogCanvas to use fine-tuned model

**Cost:** $3-10 per fine-tune, plus usage costs

**ROI:** Worth it for agencies generating 500+ posts/month

### Alternative LLM Providers

BlogCanvas architecture supports multiple LLM providers.

**Planned support:**
- Anthropic Claude (for longer context)
- Google Gemini (for multimedia content)
- Local models (Llama, Mistral) via Ollama

**To implement alternative provider:**

1. Create provider in `src/lib/agents/[provider]-provider.ts`
2. Implement `LLMProvider` interface
3. Update agent routes to use new provider
4. Test thoroughly

### Webhook Integration

Receive notifications when AI generation completes:

1. Set up webhook endpoint
2. Configure in BlogCanvas: Settings → Webhooks
3. Subscribe to events:
   - `agent.outline.completed`
   - `agent.draft.completed`
   - `agent.seo.completed`
   - `agent.fact_check.completed`
   - `agent.enhancement.completed`

**Example webhook payload:**

```json
{
  "event": "agent.draft.completed",
  "timestamp": "2026-01-15T10:30:00Z",
  "data": {
    "blog_post_id": "123",
    "agent_name": "draft",
    "duration_ms": 45000,
    "model_used": "gpt-4o-mini",
    "status": "completed"
  }
}
```

---

## Best Practices

### For Content Quality

1. **Always provide rich context** - More context = better output
2. **Review every AI generation** - Never publish without human review
3. **Iterate on brand guide** - Update based on each batch
4. **Use templates** - Consistent structure = consistent quality
5. **Fact-check everything** - AI can hallucinate facts

### For Cost Optimization

1. **Start with gpt-4o-mini** - Upgrade only when needed
2. **Batch generations** - Generate multiple posts at once
3. **Monitor usage** - Set spending limits
4. **Reuse research** - Don't regenerate same research data
5. **Cache common responses** - For repeated tasks

### For Performance

1. **Run pipeline async** - Don't wait for each agent
2. **Use queues** - For bulk generation (10+ posts)
3. **Set reasonable timeouts** - 180s per agent max
4. **Monitor duration** - Identify slow agents
5. **Optimize prompts** - Shorter prompts = faster responses

---

## Conclusion

BlogCanvas AI is a powerful tool for scaling content production. With proper configuration and optimization, you can:

- ✅ Generate high-quality blog posts in minutes
- ✅ Maintain consistent brand voice
- ✅ Optimize for SEO automatically
- ✅ Reduce content costs by 80-90%
- ✅ Scale to 100+ posts per month

**Remember:** AI accelerates creation, humans ensure quality. Always review and refine AI output before publishing.

For questions or support, contact: support@blogcanvas.io
