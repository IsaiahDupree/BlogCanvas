# FEAT-002: Pitch Generator UI Summary

## UI Component Breakdown

### Page Navigation

```
Home → /app/websites → Select Website → "Build Pitch" Tab
```

### Layout Structure

The Pitch Builder interface is organized into 4 main sections:

---

## Section 1: Score Projection Calculator

**Visual Design:** Purple/Indigo gradient background with border

### Input Fields

1. **Target SEO Score**
   ```
   [Input: Number field, range 0-100]
   Label: "Target SEO Score"
   Hint: "Recommended: 75-85 for most businesses"
   Default: 78
   ```

2. **Custom Timeline (optional)**
   ```
   [Input: Number field]
   Label: "Custom Timeline (optional)"
   Hint: "Leave blank for automatic calculation"
   Placeholder: "Auto-calculated"
   ```

3. **Calculate Button**
   ```
   [Button: Full width, gradient purple-indigo]
   Text: "Calculate Projection"
   Loading State: "Calculating..."
   ```

---

## Section 2: Projection Results

**Shows after calculation - Green gradient background**

### Main Score Display

```
┌─────────────────────────────────────────┐
│  Projected Growth        [High Confidence]
│
│  Current        →        Target
│    62                      78
│  (red text)           (green text)
│
│      +16 Point Improvement
│         (large green text)
└─────────────────────────────────────────┘
```

### Three Metric Cards (Side by Side)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Recommended  │  │   Timeline   │  │  Publishing  │
│    Posts     │  │              │  │     Pace     │
│              │  │              │  │              │
│     24       │  │   3 months   │  │      8       │
│ (purple)     │  │   (blue)     │  │   (indigo)   │
│              │  │              │  │              │
│ High-quality │  │ 2 posts per  │  │ posts per    │
│  blog posts  │  │    week      │  │    month     │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Impact Breakdown

```
┌─────────────────────────────────────────┐
│  Impact Breakdown                       │
│                                         │
│  Content Gap Fixes         +6 points   │
│  ████████░░░░░░░░░░░░  (red bar)       │
│                                         │
│  Topic Coverage            +7 points   │
│  ██████████░░░░░░░░░░  (blue bar)      │
│                                         │
│  Quality Improvement       +3 points   │
│  █████░░░░░░░░░░░░░░░  (green bar)     │
└─────────────────────────────────────────┘
```

---

## Section 3: Generate Client Pitch

**Visual Design:** Pink/Purple gradient background with border

### Header
```
┌─────────────────────────────────────────┐
│  [Send Icon] Generate Client Pitch      │
│                                         │
│  Generate a professional pitch document │
│  to send to your client                 │
└─────────────────────────────────────────┘
```

### Three Format Buttons (Grid Layout)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ [Mail Icon]  │  │ [PDF Icon]   │  │ [Present.]   │
│ Email Draft  │  │  PDF Report  │  │  Slide Deck  │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Email Preview (Shows After Generation)

```
┌─────────────────────────────────────────┐
│  Email Draft                  [Download]│
│                                         │
│  Subject: SEO Content Plan to Grow      │
│          Acme Corp's Organic Reach      │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ Hi Acme Corp,                      │ │
│  │                                    │ │
│  │ We ran an SEO and content audit on│ │
│  │ acmecorp.com. Right now, your     │ │
│  │ content sits around an overall    │ │
│  │ SEO score of 62/100, with strong  │ │
│  │ coverage in your current content, │ │
│  │ but untapped opportunities in:    │ │
│  │                                    │ │
│  │ - Cloud Computing                 │ │
│  │ - DevOps Best Practices           │ │
│  │ - Container Orchestration         │ │
│  │                                    │ │
│  │ Based on your goals, we recommend │ │
│  │ a 24-post blog package over the   │ │
│  │ next 3 months. This would:        │ │
│  │ ...                               │ │
│  └────────────────────────────────────┘ │
│         (scrollable preview area)       │
└─────────────────────────────────────────┘
```

---

## Section 4: Create Content Batch

**Visual Design:** Indigo border, white background

```
┌─────────────────────────────────────────┐
│  [File Icon] Create Content Batch       │
│                                         │
│  Batch Name:                            │
│  [Input: "Q1 2024 Content Strategy"]   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ This will create:                │   │
│  │ ✓ 24 auto-generated blog topics  │   │
│  │ ✓ Topics based on gaps/clusters  │   │
│  │ ✓ 3-month timeline               │   │
│  │ ✓ Ready for AI content generation│   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Button: Create Batch & Generate Topics]│
└─────────────────────────────────────────┘
```

---

## Generated Output Examples

### 1. Email Output

```
Subject: SEO Content Plan to Grow Acme Corp's Organic Reach

Hi Acme Corp,

We ran an SEO and content audit on acmecorp.com. Right now, your
content sits around an overall SEO score of 62/100, with strong
coverage in your current content, but untapped opportunities in:

- Cloud Computing
- DevOps Best Practices
- Container Orchestration

Based on your goals, we recommend a 24-post blog package over the
next 3 months. This would:

- Fill critical topic gaps in your niche
- Target keywords with combined estimated traffic potential
- Realistically move your SEO score from 62 → 78 over the
  campaign window

Our system will:
- Generate high-quality, fact-checked, SEO-optimized blogs tailored
  to your brand voice
- Route everything through human review before you ever see it
- Push approved posts directly to your WordPress
- Track performance and send you clear, non-fluffy reports each month

If you'd like, I can walk you through the proposed topics and
forecast in a quick call this week.

Best regards,
Your CSM Team
```

### 2. PDF Output (HTML Document)

```html
<!DOCTYPE html>
<html>
<head>
    <title>SEO Content Plan - Acme Corp</title>
    <style>
        /* Professional styling with company colors */
        body { font-family: Arial; padding: 40px; }
        .header { border-bottom: 3px solid #6366f1; }
        .score-box { text-align: center; padding: 20px; }
        .current-score { background: #fee2e2; }
        .target-score { background: #d1fae5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SEO Content Plan</h1>
        <p>Acme Corp - acmecorp.com</p>
        <p>Generated: January 10, 2026</p>
    </div>

    <div class="section">
        <h2>Current SEO Status</h2>
        <p>Baseline SEO Score: <strong>62/100</strong></p>
        <p>Pages Indexed: 45</p>
    </div>

    <div class="section">
        <h2>Projected Growth</h2>
        <div class="score-comparison">
            <div class="score-box current-score">
                <div class="score-value">62</div>
                <div>Current Score</div>
            </div>
            →
            <div class="score-box target-score">
                <div class="score-value">78</div>
                <div>Target Score</div>
            </div>
        </div>
        <p style="text-align: center;">+16 Point Improvement</p>
    </div>

    <div class="section">
        <h2>Recommended Plan</h2>
        [3-column grid with metrics]
        - 24 Blog Posts
        - 3 Months
        - 8 Posts/Month
    </div>

    <div class="section">
        <h2>Key Opportunities</h2>
        <ul>
            <li><strong>Cloud Computing</strong> - 2,400 monthly searches</li>
            <li><strong>DevOps Best Practices</strong> - 1,900 monthly searches</li>
            <li><strong>Container Orchestration</strong> - 1,600 monthly searches</li>
            <li><strong>CI/CD Pipeline</strong> - 1,200 monthly searches</li>
            <li><strong>Microservices Architecture</strong> - 1,000 monthly searches</li>
        </ul>
    </div>

    <div class="footer">
        <p>Generated by BlogCanvas SEO Content Platform</p>
    </div>
</body>
</html>
```

### 3. Slide Deck Output (JSON)

```json
[
  {
    "title": "SEO Content Plan",
    "subtitle": "Acme Corp",
    "content": "Current Score: 62 → Target: 78"
  },
  {
    "title": "Current Status",
    "content": "SEO Score: 62/100\nPages Indexed: 45"
  },
  {
    "title": "Recommended Plan",
    "content": "24 blog posts over 3 months"
  },
  {
    "title": "Key Opportunities",
    "content": "• Cloud Computing\n• DevOps Best Practices\n• Container Orchestration\n• CI/CD Pipeline\n• Microservices Architecture"
  },
  {
    "title": "Expected Results",
    "content": "SEO Score: 62 → 78\n+16 point improvement"
  }
]
```

---

## Color Scheme

### Primary Colors
- **Indigo:** #6366f1 (Primary brand color)
- **Purple:** #a855f7 (Secondary brand color)
- **Blue:** #3b82f6 (Info/metrics)
- **Green:** #059669 (Success/targets)
- **Red:** #dc2626 (Current/warnings)
- **Yellow:** #eab308 (Medium confidence)

### Gradients Used
- **Score Calculator:** from-indigo-50 to-purple-50
- **Results Card:** from-green-50 to-emerald-50
- **Pitch Generator:** from-purple-50 to-pink-50
- **Buttons:** from-indigo-600 to-purple-600

### Background Colors by Confidence
- **High:** bg-green-100 text-green-700
- **Medium:** bg-yellow-100 text-yellow-700
- **Low:** bg-orange-100 text-orange-700

---

## Responsive Design

### Desktop (lg breakpoint)
- 3-column grid for metric cards
- 3-column grid for pitch format buttons
- Full-width cards with padding

### Mobile
- Single column layout
- Stacked metric cards
- Stacked pitch buttons
- Full-width inputs

---

## Interactive States

### Buttons
- **Default:** Outlined, with icon
- **Hover:** Background color change
- **Disabled:** Opacity 50%, pointer-events-none
- **Loading:** Spinner + "Generating..." text

### Input Fields
- **Focus:** Ring color (indigo-600)
- **Invalid:** Ring color (red-600)
- **Valid:** Standard appearance

---

## Icons Used (Lucide React)

- TrendingUp (Score Projection header)
- ArrowRight (Score transition)
- FileText (Recommended Posts)
- Calendar (Timeline)
- Zap (Publishing Pace)
- Send (Generate Pitch header)
- Mail (Email Draft button)
- FileDown (PDF Report button)
- Presentation (Slide Deck button)
- Download (Download Email button)

---

## Accessibility Features

- Proper heading hierarchy (h2, h3)
- ARIA labels on icons
- Focus visible states
- Color contrast ratios met
- Screen reader friendly text
- Keyboard navigation support

---

## Performance Optimizations

- Client-side rendering with useState
- Conditional rendering (results only show after calculation)
- Loading states prevent multiple clicks
- Efficient re-renders with React hooks
- Minimal API calls (user-triggered)

---

## Error Handling UX

### No Projection Calculated
- Pitch buttons disabled
- Generate section hidden/disabled

### API Errors
- Alert message shown
- "Failed to generate pitch. Please try again."
- Button re-enabled for retry

### Invalid Input
- Input validation (min/max)
- Clear error messaging
- Prevented submission of invalid data

---

**Summary:** The UI is professionally designed, user-friendly, and follows modern web design best practices with clear visual hierarchy, responsive layout, and comprehensive error handling.
