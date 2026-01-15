# BlogCanvas Autonomous Coding Agent Guide

**Last Updated:** January 14, 2026

## Overview

The BlogCanvas repository includes an autonomous coding agent harness that can implement features from the PRD automatically using Claude CLI.

---

## All Ways to Spin Up the Autonomous Agent

### 1. NPM Scripts (Recommended)

```bash
cd /Users/isaiahdupree/Documents/Software/BlogCanvas

# Single session (runs once, then exits)
npm run harness

# Continuous mode (runs until complete or max sessions)
npm run harness:continuous

# 20-hour session (up to 200 sessions)
npm run harness:20hr
```

### 2. Direct Node Execution

```bash
cd /Users/isaiahdupree/Documents/Software/BlogCanvas

# Single session
node harness/run-harness-v2.js

# Continuous mode
node harness/run-harness-v2.js --continuous

# Custom max sessions
node harness/run-harness-v2.js --continuous --max=100

# Help
node harness/run-harness-v2.js --help
```

### 3. Background Execution with Logging

```bash
cd /Users/isaiahdupree/Documents/Software/BlogCanvas

# Run in background with timestamped log
nohup npm run harness:20hr > harness-$(date +%Y%m%d-%H%M).log 2>&1 &
echo $! > harness.pid

# Monitor
tail -f harness-*.log
```

### 4. Screen/Tmux Session (For Long Runs)

```bash
# Create screen session
screen -S blogcanvas-harness
npm run harness:20hr
# Detach: Ctrl+A, D
# Reattach: screen -r blogcanvas-harness

# Or with tmux
tmux new -s blogcanvas
npm run harness:20hr
# Detach: Ctrl+B, D
# Reattach: tmux attach -t blogcanvas
```

---

## Prerequisites Checklist

Before running the harness:

- [ ] **Claude CLI installed**: `which claude` → should show path
- [ ] **API Key set**: `echo $ANTHROPIC_API_KEY` → should show key
- [ ] **Dev server running**: `npm run dev` on port 4848
- [ ] **Dependencies installed**: `npm install`

### Quick Prerequisite Check

```bash
# Check all prerequisites
echo "Claude CLI: $(which claude 2>/dev/null || echo 'NOT FOUND')"
echo "API Key: $([ -n \"$ANTHROPIC_API_KEY\" ] && echo 'SET' || echo 'NOT SET')"
echo "Port 4848: $(lsof -i :4848 2>/dev/null | head -1 || echo 'AVAILABLE')"
```

---

## Harness Files

| File | Purpose |
|------|---------|
| `harness/run-harness-v2.js` | Main harness runner with error handling, backoff, metrics |
| `harness/prompts/coding.md` | System prompt for coding sessions |
| `harness/prompts/initializer.md` | System prompt for first-run initialization |
| `harness-status.json` | Current session status |
| `harness-metrics.json` | Cumulative session metrics |
| `feature_list.json` | Feature tracking (passes: true/false) |
| `claude-progress.txt` | Session-by-session progress log |

---

## Monitoring Progress

### Real-time Status

```bash
# Current status
cat harness-status.json | python3 -m json.tool

# Feature progress
cat feature_list.json | python3 -c "
import json,sys
d=json.load(sys.stdin)
total=len(d['features'])
passing=len([f for f in d['features'] if f.get('passes')])
print(f'Progress: {passing}/{total} ({100*passing/total:.1f}%)')
"

# Watch progress file
tail -f claude-progress.txt
```

### Session Metrics

```bash
cat harness-metrics.json | python3 -m json.tool
```

---

## PRD Coverage Analysis

### Current Feature List Status

- **Total Features**: 55
- **Implemented (passes: true)**: 42
- **Pending (passes: false)**: 13

### PRD Epic Mapping

| PRD Epic | Feature Coverage |
|----------|-----------------|
| **Epic 1: SEO Audit & Topic Forecast** | feat-001 to feat-009 ✅ |
| **Epic 2: Plan Builder & Pitch Generator** | feat-002, feat-009 ✅ |
| **Epic 3: Content Batch & AI Pipeline** | feat-004, feat-007, feat-025-039 ✅ |
| **Epic 4: Human Review & Client Approval** | feat-005, feat-021-024 ✅ |
| **Epic 5: CMS Publishing & Scheduling** | feat-003, feat-046 (pending verification) |
| **Epic 6: Analytics, Check-Backs & Reporting** | feat-006, feat-008, feat-048 (pending) |

### Pending Features (13)

| ID | Description | Category |
|----|-------------|----------|
| feat-043 | Mobile responsiveness testing | Testing |
| feat-044 | Stripe integration verification | Integration |
| feat-045 | Resend email verification | Integration |
| feat-046 | WordPress publishing verification | Integration |
| feat-047 | Gmail integration verification | Integration |
| feat-048 | GA4 integration verification | Integration |
| feat-049 | OpenAI pipeline verification | Integration |
| feat-050 | Apply pending migrations | Database |
| feat-051 | Environment config audit | Production |
| feat-052 | Error handling audit | Production |
| feat-053 | Performance optimization | Production |
| feat-054 | User documentation | Documentation |
| feat-055 | Developer documentation | Documentation |

---

## AI Pipeline Agents (Implemented)

All 5 PRD AI agents are implemented in `/src/lib/agents/`:

| Agent | File | Status |
|-------|------|--------|
| Outline Agent | `outline.ts` | ✅ Implemented |
| Drafting Agent | `draft.ts` | ✅ Implemented |
| SEO Agent | `seo.ts`, `seo-audit.ts` | ✅ Implemented |
| Fact-Check Agent | `fact-check.ts` | ✅ Implemented |
| Enhancement Agent | `enhancement.ts` | ✅ Implemented |

### Additional Agents (Beyond PRD)

- `research.ts` - Research agent
- `voice-tone.ts` - Voice/tone consistency
- `headline.ts` - Headline generation
- `image-generator.ts` - AI image prompts
- `content-rewriter.ts` - Content rewriting
- `topic-cluster.ts` - Topic clustering
- `keyword-analyzer.ts` - Keyword analysis
- `readability.ts` - Readability optimization
- `internal-linking.ts` - Internal link suggestions
- `pitch-generator.ts` - Pitch deck generation
- `website-crawler.ts` - Site crawling
- `content-gap-analysis.ts` - Gap analysis

---

## Data Model Coverage (PRD 8 Tables)

| PRD Table | Implemented | Location |
|-----------|-------------|----------|
| `websites` | ✅ | `20241204000000_initial_schema.sql` |
| `seo_audits` | ✅ | `20241204000006_seo_retainer_system.sql` |
| `topic_clusters` | ✅ | `20241204000006_seo_retainer_system.sql` |
| `content_batches` | ✅ | `20241204000006_seo_retainer_system.sql` |
| `blog_posts` | ✅ | `20241204000000_initial_schema.sql` |
| `blog_post_revisions` | ✅ | `20241204000006_seo_retainer_system.sql` |
| `blog_post_metrics` | ✅ | `20241204000006_seo_retainer_system.sql` |
| `reports` | ✅ | `20241204000006_seo_retainer_system.sql` |

### Additional Tables (40+)

See `supabase/migrations/` for complete schema including:
- Multi-tenancy (`vendors`, `profiles`)
- Authentication (`client_invitations`, `two_factor_auth`)
- File management (`files`, `folders`, `file_versions`)
- Integrations (`gmail_connections`, `cms_connections`, `stripe_accounts`)
- And more...

---

## Running the Harness for PRD Implementation

### Recommended Approach for 20-Hour Session

1. **Start dev server** (if not running):
   ```bash
   npm run dev &
   ```

2. **Verify prerequisites**:
   ```bash
   npm run harness -- --help
   ```

3. **Start 20-hour session**:
   ```bash
   screen -S blogcanvas
   npm run harness:20hr
   ```

4. **Monitor in another terminal**:
   ```bash
   watch -n 5 'cat harness-status.json | python3 -m json.tool'
   ```

---

## Troubleshooting

### Rate Limiting
The harness has built-in exponential backoff. If you see rate limits:
- Initial wait: 5 minutes
- Subsequent waits increase exponentially
- Max consecutive errors before stop: 5

### Authentication Errors
If you see auth errors:
```bash
export ANTHROPIC_API_KEY=your-key-here
```

### Dev Server Not Running
```bash
lsof -i :4848 || npm run dev &
```

### Reset Harness State
```bash
# Reset metrics (optional)
rm harness-metrics.json harness-status.json

# Don't delete feature_list.json - that tracks implementation progress!
```

---

## Summary

The BlogCanvas autonomous harness is fully configured to implement the PRD. All core PRD items are covered:

- ✅ 4 System Roles (CSM, Client, Editor, System)
- ✅ 10 Lifecycle Stages implemented
- ✅ 6 Epics with features
- ✅ 5 AI Pipeline Agents + 12 bonus agents
- ✅ 8 Core Data Tables + 40+ additional

**Ready to run**: `npm run harness:20hr`
