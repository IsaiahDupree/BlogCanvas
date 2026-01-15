# PRD: AI Agents Pipeline Specification

**Version:** 1.0  
**Date:** January 15, 2026  
**Status:** Specification  
**Epic:** Epic 3 - Content Batch & AI Writing Pipeline

---

## Overview

The AI Agents Pipeline is a multi-stage content generation system where specialized AI agents collaborate to produce high-quality, SEO-optimized blog posts. Each agent has a distinct role and produces artifacts that flow to the next stage.

---

## Agent Architecture

### Pipeline Flow

```
Topic Input
    ↓
┌─────────────────┐
│  Outline Agent  │ → Produces: H2/H3 structure, FAQ suggestions, table ideas
└────────┬────────┘
         ↓
┌─────────────────┐
│ Drafting Agent  │ → Produces: Full blog post content
└────────┬────────┘
         ↓
┌─────────────────┐
│    SEO Agent    │ → Produces: Keyword optimization, meta tags, internal links
└────────┬────────┘
         ↓
┌─────────────────┐
│ Fact-Check Agent│ → Produces: Source citations, claim verification flags
└────────┬────────┘
         ↓
┌─────────────────┐
│Enhancement Agent│ → Produces: Tables, bullets, image prompts, formatting
└────────┬────────┘
         ↓
    Final Blog Post
```

---

## Agent Specifications

### 1. Outline Agent

**Purpose:** Create SEO-optimized content structure before writing begins.

**Inputs:**
| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `topic` | string | ✅ | Main topic/title |
| `targetKeyword` | string | ✅ | Primary SEO keyword |
| `wordCountGoal` | number | ✅ | Target word count |
| `clientProfile` | object | ❌ | Brand voice, audience, industry |
| `competitorOutlines` | array | ❌ | Competitor content structures |

**Outputs:**
```typescript
interface OutlineAgentOutput {
  outline: {
    h1: string;
    sections: {
      h2: string;
      h3s?: string[];
      keyPoints: string[];
      suggestedWordCount: number;
    }[];
  };
  faqSuggestions: {
    question: string;
    searchVolume?: number;
  }[];
  tableSuggestions: {
    title: string;
    columns: string[];
    purpose: string;
  }[];
  internalLinkOpportunities: string[];
  estimatedReadTime: number;
}
```

**Acceptance Criteria:**
- [ ] Generates 4-8 H2 sections based on word count goal
- [ ] Each H2 has 2-4 key points to cover
- [ ] Suggests 3-5 FAQ questions from "People Also Ask"
- [ ] Suggests at least 1 table opportunity
- [ ] Total section word counts sum to goal ±10%

**API Endpoint:**
```
POST /api/ai/agents/outline
```

---

### 2. Drafting Agent

**Purpose:** Write complete blog post content following the outline.

**Inputs:**
| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `outline` | OutlineAgentOutput | ✅ | Structured outline |
| `targetKeyword` | string | ✅ | Primary SEO keyword |
| `clientProfile` | object | ❌ | Brand voice, tone, audience |
| `existingContent` | string | ❌ | Content to expand/rewrite |

**Outputs:**
```typescript
interface DraftingAgentOutput {
  content: {
    introduction: string;      // Hook + thesis
    teaser: string;            // Value proposition
    body: {
      h2: string;
      content: string;
      h3Sections?: {
        h3: string;
        content: string;
      }[];
    }[];
    conclusion: string;        // Summary + CTA
  };
  wordCount: number;
  readabilityScore: number;    // Flesch-Kincaid
  keywordDensity: number;      // Target keyword %
}
```

**Acceptance Criteria:**
- [ ] Introduction hooks reader in first 2 sentences
- [ ] Each section follows outline key points
- [ ] Maintains consistent brand voice throughout
- [ ] Meets word count goal ±5%
- [ ] Readability score 60-70 (general audience)
- [ ] Keyword density 1-2%

**API Endpoint:**
```
POST /api/ai/agents/draft
```

---

### 3. SEO Agent

**Purpose:** Optimize content for search engines without compromising readability.

**Inputs:**
| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | DraftingAgentOutput | ✅ | Draft content |
| `targetKeyword` | string | ✅ | Primary keyword |
| `secondaryKeywords` | string[] | ❌ | LSI keywords |
| `existingPages` | string[] | ❌ | Site pages for internal linking |

**Outputs:**
```typescript
interface SEOAgentOutput {
  optimizedContent: string;    // Full HTML content
  metaTags: {
    title: string;             // 50-60 chars
    description: string;       // 150-160 chars
    ogTitle: string;
    ogDescription: string;
  };
  slug: string;                // URL-friendly slug
  headingOptimizations: {
    original: string;
    optimized: string;
    reason: string;
  }[];
  keywordPlacements: {
    location: string;          // intro, h2, conclusion, etc.
    keyword: string;
    natural: boolean;
  }[];
  internalLinks: {
    anchorText: string;
    suggestedUrl: string;
    context: string;
  }[];
  seoScore: number;            // 0-100
  seoIssues: {
    severity: 'high' | 'medium' | 'low';
    issue: string;
    suggestion: string;
  }[];
}
```

**Acceptance Criteria:**
- [ ] Target keyword in title, H1, first 100 words, conclusion
- [ ] Meta title 50-60 characters with keyword
- [ ] Meta description 150-160 characters with keyword + CTA
- [ ] 2-5 internal link suggestions
- [ ] SEO score ≥ 75
- [ ] No keyword stuffing (density ≤ 2.5%)

**API Endpoint:**
```
POST /api/ai/agents/seo
```

---

### 4. Fact-Check Agent

**Purpose:** Verify claims and add credible sources.

**Inputs:**
| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | ✅ | Blog content |
| `industry` | string | ❌ | Industry context |
| `strictMode` | boolean | ❌ | Require sources for all stats |

**Outputs:**
```typescript
interface FactCheckAgentOutput {
  verifiedContent: string;     // Content with citation markers
  claims: {
    claim: string;
    location: string;          // Paragraph/section reference
    status: 'verified' | 'unverified' | 'needs_source' | 'flagged';
    confidence: number;        // 0-100
    suggestedSources: {
      title: string;
      url: string;
      relevance: number;
    }[];
    citation?: string;         // Formatted citation
  }[];
  statistics: {
    stat: string;
    source?: string;
    isOutdated: boolean;
    suggestedUpdate?: string;
  }[];
  factCheckScore: number;      // 0-100
  flaggedIssues: {
    severity: 'critical' | 'warning' | 'info';
    issue: string;
    suggestion: string;
  }[];
}
```

**Acceptance Criteria:**
- [ ] Identifies all statistical claims
- [ ] Suggests sources for unverified claims
- [ ] Flags potentially outdated statistics (>2 years)
- [ ] Provides citation format options (APA, inline)
- [ ] Fact-check score ≥ 80 for publication

**API Endpoint:**
```
POST /api/ai/agents/fact-check
```

---

### 5. Enhancement Agent

**Purpose:** Add visual and structural elements to improve engagement.

**Inputs:**
| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | ✅ | SEO-optimized content |
| `tableSuggestions` | array | ❌ | From outline agent |
| `imageStyle` | string | ❌ | Brand image style guide |

**Outputs:**
```typescript
interface EnhancementAgentOutput {
  enhancedContent: string;     // Final HTML content
  tables: {
    location: string;          // After which section
    html: string;              // Table HTML
    caption: string;
  }[];
  bulletLists: {
    location: string;
    items: string[];
    converted_from: string;    // Original paragraph
  }[];
  imagePrompts: {
    location: string;
    prompt: string;            // DALL-E/Midjourney prompt
    altText: string;
    purpose: 'hero' | 'section' | 'infographic';
  }[];
  callouts: {
    type: 'tip' | 'warning' | 'note' | 'example';
    content: string;
    location: string;
  }[];
  toc: {
    items: { text: string; anchor: string; level: number }[];
  };
  enhancementScore: number;    // 0-100
}
```

**Acceptance Criteria:**
- [ ] Converts 2+ dense paragraphs to bullet lists
- [ ] Generates table from outline suggestions
- [ ] Creates 2-4 image prompts (hero + sections)
- [ ] Adds table of contents for posts >1500 words
- [ ] Adds 1-2 callout boxes (tips, examples)
- [ ] Enhancement score ≥ 70

**API Endpoint:**
```
POST /api/ai/agents/enhance
```

---

## Pipeline Orchestration

### Orchestrator Service

```typescript
interface PipelineConfig {
  topic: string;
  targetKeyword: string;
  wordCountGoal: number;
  clientId?: string;
  options: {
    generateMultipleOutlines: boolean;  // A/B test outlines
    skipFactCheck: boolean;             // For opinion pieces
    skipEnhancement: boolean;           // Text-only output
    usePremiumModel: boolean;           // GPT-4 vs GPT-3.5
  };
}

interface PipelineResult {
  success: boolean;
  blogPost: {
    title: string;
    slug: string;
    content: string;
    metaDescription: string;
    wordCount: number;
    seoScore: number;
    factCheckScore: number;
    enhancementScore: number;
  };
  steps: {
    agent: string;
    status: 'completed' | 'failed' | 'skipped';
    duration: number;
    output: any;
  }[];
  totalDuration: number;
  error?: string;
}
```

### API Endpoint

```
POST /api/blog-posts/generate-full
```

**Request:**
```json
{
  "topic": "How to Choose the Right CRM for Your Business",
  "targetKeyword": "choose CRM",
  "wordCountGoal": 1500,
  "clientId": "uuid",
  "options": {
    "generateMultipleOutlines": false,
    "skipFactCheck": false,
    "skipEnhancement": false,
    "usePremiumModel": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "blogPost": {
    "title": "How to Choose the Right CRM for Your Business in 2026",
    "slug": "how-to-choose-crm-business-2026",
    "content": "<article>...</article>",
    "metaDescription": "Learn how to choose the perfect CRM...",
    "wordCount": 1523,
    "seoScore": 87,
    "factCheckScore": 92,
    "enhancementScore": 78
  },
  "steps": [
    { "agent": "outline", "status": "completed", "duration": 4200 },
    { "agent": "draft", "status": "completed", "duration": 12500 },
    { "agent": "seo", "status": "completed", "duration": 3800 },
    { "agent": "fact-check", "status": "completed", "duration": 8200 },
    { "agent": "enhance", "status": "completed", "duration": 5100 }
  ],
  "totalDuration": 33800
}
```

---

## Database Schema

### Revision Types (Extended)

```sql
-- blog_post_revisions.revision_type enum values
'outline'           -- Outline agent output
'draft'             -- Drafting agent output
'seo_pass'          -- SEO agent output
'fact_check'        -- Fact-check agent output
'enhancement'       -- Enhancement agent output
'human_edit'        -- Manual human edits
'ai_regeneration'   -- Full pipeline re-run
```

### Agent Outputs Storage

```sql
-- Store each agent's output for debugging and replay
CREATE TABLE IF NOT EXISTS agent_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES blog_posts(id),
  agent_name TEXT NOT NULL,  -- outline, draft, seo, fact_check, enhance
  input JSONB,
  output JSONB,
  duration_ms INTEGER,
  model_used TEXT,
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementation Files

| Component | File Path |
|-----------|-----------|
| Outline Agent | `/src/lib/agents/outline-agent.ts` |
| Drafting Agent | `/src/lib/agents/drafting-agent.ts` |
| SEO Agent | `/src/lib/agents/seo-agent.ts` |
| Fact-Check Agent | `/src/lib/agents/fact-check-agent.ts` |
| Enhancement Agent | `/src/lib/agents/enhancement-agent.ts` |
| Pipeline Orchestrator | `/src/lib/agents/blog-pipeline.ts` |
| API Route | `/src/app/api/blog-posts/generate-full/route.ts` |

---

## User Stories

1. **As a vendor**, I can see each agent's output in a timeline view so I understand how the content was built.

2. **As an editor**, I can re-run a specific agent (e.g., SEO) without regenerating the entire post.

3. **As a CSM**, I can configure which agents to skip for specific content types (e.g., skip fact-check for opinion pieces).

4. **As a developer**, I can add new agents to the pipeline without modifying existing agents.

---

## Quality Gates

| Gate | Threshold | Action if Failed |
|------|-----------|------------------|
| Outline completeness | ≥4 H2 sections | Re-run outline agent |
| Word count accuracy | ±10% of goal | Expand/trim via drafting agent |
| SEO Score | ≥75 | Re-run SEO agent |
| Fact-Check Score | ≥80 | Flag for human review |
| Enhancement Score | ≥70 | Auto-pass (optional) |

---

## Metrics & Monitoring

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Pipeline success rate | ≥95% | <90% |
| Average pipeline duration | <60s | >120s |
| Agent failure rate | <5% | >10% |
| Human edit rate post-generation | <30% | >50% |

---

*This specification defines the complete AI agent pipeline for blog content generation.*
