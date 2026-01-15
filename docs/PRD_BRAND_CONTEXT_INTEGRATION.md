# PRD: Full Brand Context Integration for Content Generation

**Feature ID:** FEAT-051  
**Version:** 1.0  
**Date:** January 14, 2026  
**Status:** In Development

---

## 1. Executive Summary

This feature ensures that ALL brand snapshot data (Product/Service, Target Audience, Positioning, Tone of Voice, Brand Messaging, Key Differentiators) is pulled and utilized when generating blog content for a selected client. Currently, only some fields are being used - this enhancement will integrate the complete brand profile into every stage of the AI content generation pipeline.

---

## 2. Problem Statement

The Brand Snapshot contains valuable brand context that should inform content generation:
- **Positioning** - Not currently passed to AI agents
- **Brand Messaging** - Not integrated
- **Key Differentiators** - Not integrated
- **Content Guidelines** - Not fully utilized
- **Competitor Information** - Not passed to research agent

This results in content that may not fully align with the client's brand positioning and unique value propositions.

---

## 3. Current State Analysis

### What's Working ✓
| Field | Used In |
|-------|---------|
| Product/Service Summary | Research, Outline, Draft agents |
| Target Audience | Research, Outline, Draft, Voice agents |
| Tone of Voice (voice/tone) | Research, Draft, Voice/Tone agents |

### What's Missing ✗
| Field | Should Be Used In |
|-------|-------------------|
| **Positioning** | All agents - differentiates from competitors |
| **Brand Messaging** | Draft, Voice/Tone agents |
| **Key Differentiators** | Research, Outline, Draft agents |
| **Competitor Names** | Research agent for differentiation |
| **Content Don'ts** | Draft, Voice/Tone agents |
| **Keywords to Include** | SEO, Draft agents |
| **Keywords to Avoid** | All agents |

---

## 4. Goals & Objectives

### Primary Goals
1. **Complete Data Flow** - Pull ALL brand guide fields when client is selected
2. **Agent Enhancement** - Pass complete brand context to every AI agent
3. **Positioning Integration** - Use positioning in research, outline, and draft stages
4. **Differentiation** - Ensure content highlights client's unique value props
5. **Brand Alignment** - Higher voice/tone alignment scores

### Success Metrics
- Voice/tone alignment scores increase by 15%+
- Content includes brand positioning statements
- Generated content mentions key differentiators
- Zero brand guideline violations in output

---

## 5. Brand Guide Data Model

### Current Schema (brand_guides table)
```sql
- product_service_summary TEXT
- target_audience TEXT
- positioning TEXT                -- NOT USED
- tone_profile JSONB {
    voice: string[],              -- USED
    tone: string,                 -- USED
    formality: number,            -- NOT USED
    playfulness: number           -- NOT USED
  }
- brand_messaging JSONB {
    tagline: string,              -- NOT USED
    key_messages: string[],       -- NOT USED
    value_props: string[]         -- NOT USED
  }
- competitors JSONB[]             -- NOT USED
- content_guidelines JSONB {
    keywords_include: string[],   -- NOT USED
    keywords_avoid: string[],     -- NOT USED
    topics_avoid: string[],       -- NOT USED
    style_notes: string           -- NOT USED
  }
```

---

## 6. Enhanced Client Profile Interface

```typescript
interface EnhancedClientProfile {
  // Basic Info
  clientName: string;
  industry?: string;
  websiteUrl?: string;
  
  // Brand Snapshot - Core
  productServiceSummary: string;
  targetAudience: string;
  positioning: string;              // NEW
  
  // Tone & Voice
  brandVoice: string[];
  brandTone: string;
  formalityLevel: number;           // NEW (1-10 scale)
  playfulnessLevel: number;         // NEW (1-10 scale)
  
  // Brand Messaging
  tagline?: string;                 // NEW
  keyMessages: string[];            // NEW
  valuePropositions: string[];      // NEW
  
  // Competitive Context
  competitors: string[];            // NEW
  keyDifferentiators: string[];     // NEW
  
  // Content Guidelines
  keywordsToInclude: string[];      // NEW
  keywordsToAvoid: string[];        // NEW
  topicsToAvoid: string[];          // NEW
  styleNotes?: string;              // NEW
}
```

---

## 7. Implementation Plan

### 7.1 Update Data Fetching

**File:** `/src/app/api/blog-posts/generate-full/route.ts`

```typescript
// Enhanced client profile fetching
if (clientId) {
  const { data: client } = await supabase
    .from('clients')
    .select('*, brand_guides(*)')
    .eq('id', clientId)
    .single();

  if (client) {
    const brandGuide = client.brand_guides?.[0];
    clientProfile = {
      // Core
      clientName: client.name,
      productServiceSummary: brandGuide?.product_service_summary || client.industry,
      targetAudience: brandGuide?.target_audience || 'Business professionals',
      positioning: brandGuide?.positioning || '',  // NEW
      
      // Voice & Tone
      brandVoice: brandGuide?.tone_profile?.voice || ['Professional'],
      brandTone: brandGuide?.tone_profile?.tone || 'Professional',
      formalityLevel: brandGuide?.tone_profile?.formality || 5,  // NEW
      playfulnessLevel: brandGuide?.tone_profile?.playfulness || 3,  // NEW
      
      // Messaging
      tagline: brandGuide?.brand_messaging?.tagline,  // NEW
      keyMessages: brandGuide?.brand_messaging?.key_messages || [],  // NEW
      valuePropositions: brandGuide?.brand_messaging?.value_props || [],  // NEW
      
      // Competition
      competitors: brandGuide?.competitors?.map(c => c.name) || [],  // NEW
      keyDifferentiators: brandGuide?.key_differentiators || [],  // NEW
      
      // Guidelines
      keywordsToInclude: brandGuide?.content_guidelines?.keywords_include || [],  // NEW
      keywordsToAvoid: brandGuide?.content_guidelines?.keywords_avoid || [],  // NEW
      topicsToAvoid: brandGuide?.content_guidelines?.topics_avoid || [],  // NEW
      styleNotes: brandGuide?.content_guidelines?.style_notes  // NEW
    };
  }
}
```

### 7.2 Update Research Agent

**File:** `/src/lib/agents/research.ts`

Add to prompt:
```
POSITIONING: ${input.clientProfile.positioning}
KEY DIFFERENTIATORS: ${input.clientProfile.keyDifferentiators?.join(', ')}
COMPETITORS TO DIFFERENTIATE FROM: ${input.clientProfile.competitors?.join(', ')}
VALUE PROPOSITIONS: ${input.clientProfile.valuePropositions?.join(', ')}
```

### 7.3 Update Outline Agent

**File:** `/src/lib/agents/outline.ts`

Add to prompt:
```
BRAND POSITIONING: ${input.clientProfile.positioning}
KEY MESSAGES TO INCORPORATE: ${input.clientProfile.keyMessages?.join(', ')}
TOPICS TO AVOID: ${input.clientProfile.topicsToAvoid?.join(', ')}
```

### 7.4 Update Draft Agent

**File:** `/src/lib/agents/draft.ts`

Add to prompt:
```
BRAND POSITIONING: ${input.marketingContext?.positioning}
KEY MESSAGES: ${input.marketingContext?.keyMessages?.join(', ')}
VALUE PROPOSITIONS: ${input.marketingContext?.valuePropositions?.join(', ')}
KEYWORDS TO INCLUDE: ${input.marketingContext?.keywordsToInclude?.join(', ')}
KEYWORDS TO AVOID: ${input.marketingContext?.keywordsToAvoid?.join(', ')}
FORMALITY LEVEL: ${input.marketingContext?.formalityLevel}/10
PLAYFULNESS LEVEL: ${input.marketingContext?.playfulnessLevel}/10
```

### 7.5 Update Voice/Tone Agent

**File:** `/src/lib/agents/voice-tone.ts`

Add validation for:
- Positioning alignment check
- Key message inclusion check
- Avoided keywords check
- Formality/playfulness scoring

---

## 8. UI Enhancements

### 8.1 Content Generation Form
- Show "Brand Context Applied" badge when client selected
- Display mini brand snapshot preview
- Warning if brand guide incomplete

### 8.2 Generated Content View
- Show which brand elements were used
- Highlight key messages that were included
- Flag any potential brand guideline violations

---

## 9. API Changes

### Updated Endpoints
| Endpoint | Changes |
|----------|---------|
| `POST /api/blog-posts/generate-full` | Accept full clientProfile |
| `POST /api/ai/generate-batch` | Use enhanced brand context |
| `POST /api/ai/topic-clusters` | Include positioning in topic generation |

---

## 10. Testing Checklist

- [ ] Positioning appears in generated content introduction
- [ ] Key differentiators are mentioned in body sections
- [ ] Avoided keywords do not appear in output
- [ ] Included keywords appear naturally
- [ ] Voice/tone matches formality/playfulness levels
- [ ] Competitor differentiation is evident
- [ ] Key messages are woven into content

---

## 11. Success Criteria

1. **All brand guide fields** are fetched when client is selected
2. **Positioning** is referenced in research and draft stages
3. **Key differentiators** appear in generated content
4. **Voice/tone scores** improve with full context
5. **Content guidelines** are respected (no avoided topics/keywords)

---

## Appendix: Agent Prompt Templates

### Research Agent Enhanced Prompt
```
TOPIC: {topic}
TARGET KEYWORD: {keyword}

--- BRAND CONTEXT ---
CLIENT: {clientName}
PRODUCT/SERVICE: {productServiceSummary}
TARGET AUDIENCE: {targetAudience}
POSITIONING: {positioning}

VALUE PROPOSITIONS:
{valuePropositions.map(vp => `- ${vp}`).join('\n')}

KEY DIFFERENTIATORS:
{keyDifferentiators.map(d => `- ${d}`).join('\n')}

COMPETITORS TO DIFFERENTIATE FROM:
{competitors.join(', ')}

--- END BRAND CONTEXT ---
```

### Draft Agent Enhanced Prompt
```
--- BRAND VOICE GUIDELINES ---
VOICE: {brandVoice.join(', ')}
TONE: {brandTone}
FORMALITY: {formalityLevel}/10 (1=casual, 10=very formal)
PLAYFULNESS: {playfulnessLevel}/10 (1=serious, 10=playful)

KEY MESSAGES TO WEAVE IN:
{keyMessages.map(m => `- ${m}`).join('\n')}

KEYWORDS TO INCLUDE: {keywordsToInclude.join(', ')}
KEYWORDS TO AVOID: {keywordsToAvoid.join(', ')}
STYLE NOTES: {styleNotes}
--- END VOICE GUIDELINES ---
```

---

## 12. Styles to Avoid (Data-Backed)

### 12.1 Schema Extension

Add to `brand_guides` table:
```sql
ALTER TABLE brand_guides ADD COLUMN IF NOT EXISTS styles_to_avoid JSONB;
-- Structure:
-- {
--   "patterns": [
--     {
--       "type": "word" | "phrase" | "pattern",
--       "value": "revolutionary",
--       "reason": "overused buzzword",
--       "severity": "high" | "medium" | "low",
--       "data_backing": {
--         "source": "SEO analysis",
--         "metric": "CTR dropped 15% when used",
--         "sample_size": 42
--       }
--     }
--   ],
--   "structural": [
--     {
--       "type": "passive_voice" | "long_sentences" | "jargon_heavy",
--       "threshold": 0.2,
--       "reason": "reduces readability",
--       "data_backing": {...}
--     }
--   ]
-- }
```

### 12.2 Common Styles to Avoid

| Category | Pattern | Reason | Data Backing |
|----------|---------|--------|--------------|
| **Buzzwords** | "revolutionary", "game-changing", "cutting-edge" | Low trust, overused | 23% lower engagement |
| **Passive Voice** | >20% passive sentences | Reduces clarity | 18% lower time-on-page |
| **Jargon** | Industry-specific terms without explanation | Alienates readers | 35% higher bounce rate |
| **Clickbait** | "You won't believe...", "This one trick..." | Damages credibility | 40% lower return visits |
| **Superlatives** | "best", "greatest", "ultimate" (unsubstantiated) | FTC compliance risk | N/A |
| **Wall of Text** | Paragraphs >150 words | Poor readability | 25% lower scroll depth |
| **Generic Intros** | "In today's fast-paced world..." | Low engagement | 12% higher exit rate |

### 12.3 UI for Styles to Avoid

**Brand Guide Editor:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️ Styles to Avoid                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Words/Phrases to Avoid:                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ × revolutionary    [HIGH]  Reason: overused buzzword        │   │
│  │ × game-changing    [HIGH]  Reason: lacks credibility        │   │
│  │ × synergy          [MED]   Reason: corporate jargon         │   │
│  │ + Add word/phrase                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Structural Rules:                                                  │
│  ☑ Flag passive voice >20%                                         │
│  ☑ Flag sentences >30 words                                        │
│  ☑ Flag paragraphs >150 words                                      │
│  ☐ Flag rhetorical questions (client preference)                   │
│                                                                     │
│  📊 Data Backing: These rules are based on analysis of 500+        │
│     posts showing measurable engagement impact.                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 13. Styles to Keep (On-Brand, SEO-Proven)

### 13.1 Schema Extension

Add to `brand_guides` table:
```sql
ALTER TABLE brand_guides ADD COLUMN IF NOT EXISTS styles_to_keep JSONB;
-- Structure:
-- {
--   "patterns": [
--     {
--       "type": "intro_style" | "cta_style" | "formatting",
--       "value": "Start with a question",
--       "reason": "increases engagement",
--       "examples": ["Have you ever wondered...", "What if you could..."],
--       "data_backing": {
--         "source": "A/B test",
--         "metric": "28% higher engagement",
--         "sample_size": 150,
--         "date_range": "2025-06-01 to 2025-12-01"
--       }
--     }
--   ],
--   "voice_examples": [
--     {
--       "context": "explaining technical concepts",
--       "good_example": "Think of it like...",
--       "bad_example": "The paradigmatic framework...",
--       "source_post_id": "uuid"
--     }
--   ],
--   "successful_posts": ["uuid1", "uuid2"]  -- Reference high-performing posts
-- }
```

### 13.2 Style Analysis & Learning

**Automatic Learning from High Performers:**
```typescript
interface StyleLearning {
  // Posts that performed well
  topPerformingPosts: {
    postId: string;
    metrics: {
      avgTimeOnPage: number;
      bounceRate: number;
      organicTraffic: number;
      socialShares: number;
      conversionRate: number;
    };
    extractedPatterns: {
      introStyle: string;
      avgSentenceLength: number;
      paragraphStructure: string;
      ctaPlacement: string;
      headingStyle: string;
    };
  }[];
  
  // Derived recommendations
  recommendations: {
    pattern: string;
    confidence: number;  // Based on sample size
    impact: string;      // "28% higher engagement"
    source: string;      // "Analysis of top 10 posts"
  }[];
}
```

### 13.3 UI for Styles to Keep

**Brand Guide Editor:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  ✓ Styles to Keep (On-Brand & SEO-Proven)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📈 Learned from Your Top Performers:                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ✓ Question-based intros        +28% engagement (150 posts)   │   │
│  │ ✓ Bullet lists in how-to       +22% scroll depth (89 posts)  │   │
│  │ ✓ Statistics in first para     +18% time on page (67 posts)  │   │
│  │ ✓ CTA after value section      +35% conversion (45 posts)    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Voice Examples (from successful content):                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Context: Explaining complex features                         │   │
│  │ ✓ DO: "Think of it like having a personal assistant..."     │   │
│  │ ✗ DON'T: "The integrated solution leverages..."             │   │
│  │ Source: "Top 5 CRM Features" (2.3k visits)                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [+ Add Manual Style Rule]  [🔄 Re-analyze Top Posts]               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 14. Image Guidelines

### 14.1 Schema Extension

Add to `brand_guides` table:
```sql
ALTER TABLE brand_guides ADD COLUMN IF NOT EXISTS image_guidelines JSONB;
-- Structure:
-- {
--   "style": {
--     "preferred_types": ["photography", "illustration", "infographic"],
--     "color_palette": ["#1e40af", "#3b82f6", "#60a5fa"],
--     "mood": ["professional", "approachable", "modern"],
--     "avoid": ["stock photos with obvious staging", "clip art"]
--   },
--   "featured_image": {
--     "aspect_ratio": "16:9",
--     "min_width": 1200,
--     "text_overlay": false,
--     "brand_elements": true,
--     "examples": ["url1", "url2"]
--   },
--   "in_content": {
--     "max_per_1000_words": 2,
--     "prefer_infographics": true,
--     "screenshot_style": {
--       "border": true,
--       "shadow": true,
--       "annotation_color": "#3b82f6"
--     }
--   },
--   "alt_text_guidelines": {
--     "include_keyword": true,
--     "max_length": 125,
--     "descriptive": true
--   },
--   "ai_generation": {
--     "enabled": true,
--     "provider": "dall-e" | "midjourney" | "stable-diffusion",
--     "default_prompt_prefix": "Professional, modern, clean design",
--     "banned_elements": ["text in images", "human faces"]
--   }
-- }
```

### 14.2 Image Guidelines Interface

```typescript
interface ImageGuidelines {
  // Overall style
  style: {
    preferredTypes: ('photography' | 'illustration' | 'infographic' | 'screenshot')[];
    colorPalette: string[];
    mood: string[];
    avoid: string[];
  };
  
  // Featured image rules
  featuredImage: {
    aspectRatio: string;
    minWidth: number;
    textOverlay: boolean;
    brandElements: boolean;
    exampleUrls: string[];
  };
  
  // In-content images
  inContent: {
    maxPer1000Words: number;
    preferInfographics: boolean;
    screenshotStyle: {
      border: boolean;
      shadow: boolean;
      annotationColor: string;
    };
  };
  
  // Alt text
  altTextGuidelines: {
    includeKeyword: boolean;
    maxLength: number;
    descriptive: boolean;
  };
  
  // AI generation settings
  aiGeneration: {
    enabled: boolean;
    provider: string;
    defaultPromptPrefix: string;
    bannedElements: string[];
  };
}
```

### 14.3 UI for Image Guidelines

**Brand Guide Editor:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  🖼️ Image Guidelines                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Preferred Image Types:                                             │
│  ☑ Photography   ☑ Infographics   ☐ Illustrations   ☑ Screenshots  │
│                                                                     │
│  Brand Colors for Graphics:                                         │
│  [■ #1e40af] [■ #3b82f6] [■ #60a5fa] [+ Add]                       │
│                                                                     │
│  Featured Image:                                                    │
│  Aspect Ratio: [16:9 ▼]    Min Width: [1200px]                     │
│  ☐ Allow text overlay      ☑ Include brand elements                │
│                                                                     │
│  In-Content Images:                                                 │
│  Max images per 1000 words: [2]                                    │
│  ☑ Prefer infographics for data                                    │
│                                                                     │
│  AI Image Generation:                                               │
│  ☑ Enabled     Provider: [DALL-E 3 ▼]                              │
│  Default prompt prefix:                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Professional, modern, clean design, minimal, tech aesthetic │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ⚠️ Avoid in Images:                                                │
│  × Stock photos with obvious staging                               │
│  × Clip art or cartoon style                                       │
│  × Text embedded in images                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 15. Title Guidelines

### 15.1 Schema Extension

Add to `brand_guides` table:
```sql
ALTER TABLE brand_guides ADD COLUMN IF NOT EXISTS title_guidelines JSONB;
-- Structure:
-- {
--   "structure": {
--     "max_length": 60,
--     "preferred_formats": [
--       "How to [Action] [Benefit]",
--       "[Number] Ways to [Achieve Goal]",
--       "[Topic]: [Subtitle with Benefit]"
--     ],
--     "power_words": ["proven", "essential", "complete", "expert"],
--     "words_to_avoid": ["ultimate", "best", "amazing"],
--     "include_keyword": true,
--     "keyword_position": "front" | "natural"
--   },
--   "brand_elements": {
--     "include_brand_name": false,
--     "separator": " | " | " - " | " : ",
--     "suffix": null
--   },
--   "seo_rules": {
--     "target_ctr": 0.05,
--     "high_performing_patterns": [
--       {
--         "pattern": "How to [X] in [Year]",
--         "avg_ctr": 0.068,
--         "sample_size": 23
--       }
--     ]
--   },
--   "examples": {
--     "good": ["How to Choose the Right CRM for Your Business"],
--     "bad": ["The Ultimate Best Amazing CRM Guide Ever!!!"]
--   }
-- }
```

### 15.2 Title Guidelines Interface

```typescript
interface TitleGuidelines {
  structure: {
    maxLength: number;
    preferredFormats: string[];
    powerWords: string[];
    wordsToAvoid: string[];
    includeKeyword: boolean;
    keywordPosition: 'front' | 'natural';
  };
  
  brandElements: {
    includeBrandName: boolean;
    separator: string;
    suffix: string | null;
  };
  
  seoRules: {
    targetCtr: number;
    highPerformingPatterns: {
      pattern: string;
      avgCtr: number;
      sampleSize: number;
    }[];
  };
  
  examples: {
    good: string[];
    bad: string[];
  };
}
```

### 15.3 UI for Title Guidelines

**Brand Guide Editor:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  📝 Title Guidelines                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Structure Rules:                                                   │
│  Max Length: [60 characters]                                        │
│  ☑ Include target keyword    Position: [Front of title ▼]          │
│                                                                     │
│  Preferred Title Formats:                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. How to [Action] [Benefit]                                │   │
│  │ 2. [Number] Ways to [Achieve Goal]                          │   │
│  │ 3. [Topic]: A Complete Guide for [Audience]                 │   │
│  │ + Add format                                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Power Words (proven to increase CTR):                              │
│  [proven] [essential] [complete] [expert] [guide] [+ Add]          │
│                                                                     │
│  Words to Avoid:                                                    │
│  [ultimate ×] [best ×] [amazing ×] [+ Add]                         │
│                                                                     │
│  📊 High-Performing Patterns (from your data):                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ "How to [X] in [Year]"       6.8% CTR (23 posts)            │   │
│  │ "[Number] [Topic] Tips"      5.9% CTR (18 posts)            │   │
│  │ "[Topic]: Complete Guide"    5.4% CTR (31 posts)            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Examples:                                                          │
│  ✓ Good: "How to Choose the Right CRM for Your Business"          │
│  ✗ Bad: "The Ultimate Best Amazing CRM Guide Ever!!!"              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 16. Shared Context Architecture

### 16.1 Unified Client Context Service

All content generation touchpoints MUST pull from the same shared context:

```typescript
// /src/lib/context/client-context.ts

interface SharedClientContext {
  // Client basics
  client: {
    id: string;
    name: string;
    industry: string;
    websiteUrl: string;
  };
  
  // Brand guide (full)
  brandGuide: {
    // Core
    productServiceSummary: string;
    targetAudience: string;
    positioning: string;
    
    // Voice & Tone
    brandVoice: string[];
    brandTone: string;
    formalityLevel: number;
    playfulnessLevel: number;
    
    // Messaging
    tagline: string;
    keyMessages: string[];
    valuePropositions: string[];
    
    // Competition
    competitors: string[];
    keyDifferentiators: string[];
    
    // Content Guidelines
    keywordsToInclude: string[];
    keywordsToAvoid: string[];
    topicsToAvoid: string[];
    styleNotes: string;
    
    // NEW: Enhanced Guidelines
    stylesToAvoid: StylePattern[];
    stylesToKeep: StylePattern[];
    imageGuidelines: ImageGuidelines;
    titleGuidelines: TitleGuidelines;
  };
  
  // Historical data
  analytics: {
    topPerformingPosts: PostAnalytics[];
    avgEngagement: EngagementMetrics;
    seoPerformance: SEOMetrics;
  };
  
  // Derived insights
  learnings: {
    effectivePatterns: Pattern[];
    ineffectivePatterns: Pattern[];
    audiencePreferences: Preference[];
  };
}

/**
 * Get complete client context for content generation
 * Used by: Pipeline, Topic Generator, Blog Generator, Title Generator
 */
export async function getSharedClientContext(
  clientId: string
): Promise<SharedClientContext> {
  const supabase = await createClient();
  
  // Fetch all data in parallel
  const [clientData, brandGuide, analytics, topPosts] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    supabase.from('brand_guides').select('*').eq('client_id', clientId).single(),
    supabase.from('client_analytics').select('*').eq('client_id', clientId).single(),
    supabase.from('blog_posts')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'published')
      .order('analytics_data->page_views', { ascending: false })
      .limit(10)
  ]);
  
  return buildSharedContext(clientData.data, brandGuide.data, analytics.data, topPosts.data);
}
```

### 16.2 Integration Points

**All these features MUST use `getSharedClientContext()`:**

| Feature | File | Current State |
|---------|------|---------------|
| Pipeline Page | `/src/app/app/pipeline/page.tsx` | ⚠️ Partial |
| Topic Generator | `/src/lib/agents/topic-cluster.ts` | ⚠️ Partial |
| Blog Generator | `/src/lib/agents/blog-pipeline.ts` | ✅ Uses clientProfile |
| Title Generator | `/src/lib/agents/outline.ts` | ⚠️ Partial |
| Image Generator | `/src/app/api/blog-posts/[id]/generate-images/route.ts` | ❌ Missing |
| Batch Generator | `/src/app/api/ai/generate-batch/route.ts` | ⚠️ Partial |

### 16.3 Pipeline Page Integration

**Update `/src/app/app/pipeline/page.tsx`:**

```typescript
// When client is selected, load full context
useEffect(() => {
  if (selectedClient) {
    loadClientContext(selectedClient);
  }
}, [selectedClient]);

const loadClientContext = async (clientId: string) => {
  const res = await fetch(`/api/clients/${clientId}/context`);
  const context = await res.json();
  setClientContext(context);
  
  // Pre-fill form with context
  setTargetMarket(context.brandGuide?.targetAudience || '');
  setClientGoals(context.brandGuide?.positioning || '');
  setIcp(context.brandGuide?.targetAudience || '');
};

// Pass context to topic generation
const runPipeline = async () => {
  // ... existing code ...
  
  const topicsRes = await fetch('/api/ai/topic-clusters', {
    method: 'POST',
    body: JSON.stringify({
      websiteUrl,
      clientId: selectedClient,
      clientContext: clientContext,  // Pass full context
      // ... other params
    })
  });
};
```

### 16.4 API Endpoint for Shared Context

**Create `/src/app/api/clients/[id]/context/route.ts`:**

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await getSharedClientContext(params.id);
  return NextResponse.json(context);
}
```

---

## 17. Database Migrations Required

```sql
-- Migration: Add enhanced brand guidelines columns
ALTER TABLE brand_guides 
ADD COLUMN IF NOT EXISTS styles_to_avoid JSONB DEFAULT '{"patterns": [], "structural": []}',
ADD COLUMN IF NOT EXISTS styles_to_keep JSONB DEFAULT '{"patterns": [], "voice_examples": [], "successful_posts": []}',
ADD COLUMN IF NOT EXISTS image_guidelines JSONB DEFAULT '{"style": {}, "featuredImage": {}, "inContent": {}, "aiGeneration": {}}',
ADD COLUMN IF NOT EXISTS title_guidelines JSONB DEFAULT '{"structure": {}, "seoRules": {}, "examples": {}}';

-- Index for faster context lookups
CREATE INDEX IF NOT EXISTS idx_brand_guides_client ON brand_guides(client_id);
```

---

## 18. Acceptance Criteria

### Styles to Avoid
- [ ] Can add words/phrases to avoid with severity levels
- [ ] Can specify structural rules (passive voice %, sentence length)
- [ ] Data backing shown for each rule
- [ ] AI agents check against avoid list during generation
- [ ] Voice/Tone agent flags violations

### Styles to Keep
- [ ] Can add manual style rules with examples
- [ ] System auto-learns from top performing posts
- [ ] Shows data backing (CTR, engagement metrics)
- [ ] AI agents reference preferred patterns
- [ ] Good/bad examples stored and used in prompts

### Image Guidelines
- [ ] Can set preferred image types
- [ ] Can configure featured image requirements
- [ ] Can set AI generation preferences
- [ ] Image generator uses guidelines
- [ ] Alt text follows configured rules

### Title Guidelines
- [ ] Can set preferred title formats
- [ ] Can configure power words and avoid words
- [ ] Shows high-performing patterns from data
- [ ] Title generator follows guidelines
- [ ] SEO rules enforced (length, keyword position)

### Shared Context
- [ ] Single `getSharedClientContext()` function used everywhere
- [ ] Pipeline page loads full context when client selected
- [ ] Topic generator uses complete brand context
- [ ] Blog generator uses complete brand context
- [ ] All agents receive same client data

---

*This enhanced specification ensures comprehensive brand context integration across all content generation touchpoints.*
