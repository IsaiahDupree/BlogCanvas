# BlogCanvas Integration Test Plan

**Created:** January 14, 2026  
**Purpose:** Map all feature integration points and ensure cross-feature testing coverage

---

## Integration Matrix

This document maps how features integrate with each other across the application, identifying test scenarios that validate these connections.

---

## 1. Feature Integration Map

### Core Feature Modules

| Module | Integrates With | Integration Type |
|--------|-----------------|------------------|
| **Client Onboarding** | SEO Audit, Brand Guide, Content Batches | Data Flow |
| **SEO Audit** | Topic Clusters, Score Projection, Gap Analysis | Computation |
| **Topic Clusters** | Content Batches, Blog Posts, SEO Score | Data Mapping |
| **Content Batches** | Blog Posts, AI Pipeline, Approval Workflow | Orchestration |
| **AI Pipeline** | Brand Context, Blog Posts, Revisions | Content Generation |
| **Review Board** | Blog Posts, Comments, Notifications | Workflow |
| **Client Portal** | Approvals, Notifications, Content Requests | User Journey |
| **WordPress Publishing** | Blog Posts, Scheduling, Tracking | External API |
| **Analytics** | Check-backs, Reports, Metrics | Data Aggregation |
| **Notifications** | All workflows | Event-driven |

---

## 2. Cross-Feature Integration Scenarios

### Scenario A: Client Onboarding → Content Production Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│  SEO Audit  │───▶│   Topic     │───▶│   Content   │
│  Creation   │    │  + Scoring  │    │  Clusters   │    │   Batch     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
  Brand Guide       Baseline Score     Gap Analysis      Blog Posts
```

**Test Points:**
1. Client brand info flows to AI agents
2. SEO audit score feeds into batch goal settings
3. Topic clusters map to blog post assignments
4. Batch status reflects child post statuses

---

### Scenario B: AI Pipeline → Approval → Publishing Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  AI Draft   │───▶│   Human     │───▶│   Client    │───▶│  WordPress  │
│  Pipeline   │    │   Review    │    │  Approval   │    │   Publish   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
  7 Agents Run       Kanban Board      Portal View       Post Tracking
  Revisions Saved    Comments Added    Notifications     URL Stored
```

**Test Points:**
1. Each agent output feeds next agent
2. Revision history preserves all stages
3. Status transitions trigger notifications
4. Approval unlocks publishing action
5. Published URL tracked back to post

---

### Scenario C: Content Request → Fulfillment Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│   Vendor    │───▶│   Content   │───▶│   Client    │
│  Requests   │    │  Dashboard  │    │  Creation   │    │  Delivery   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
  Notification       Status Update      AI Pipeline       Approval Flow
```

**Test Points:**
1. Request creates notification for vendor
2. Vendor status updates notify client
3. Completed request links to blog post
4. Full audit trail maintained

---

### Scenario D: Brand Context → Content Quality Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Brand     │───▶│  Research   │───▶│   Draft     │───▶│ Voice/Tone  │
│   Guide     │    │   Agent     │    │   Agent     │    │   Agent     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
  Voice, Tone,       Context for       Brand-aligned      Consistency
  Keywords, etc      Positioning       Messaging          Score
```

**Test Points:**
1. Brand fields pass to all agents
2. Voice/tone affects draft style
3. Keywords appear in content
4. Final content matches brand profile

---

### Scenario E: Check-backs → Reporting Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Published  │───▶│  Check-back │───▶│  Metrics    │───▶│   Report    │
│    Post     │    │  Scheduled  │    │  Collected  │    │  Generated  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
  Day 7,30,60,90     Auto-trigger      Aggregated        PDF/Email/Slides
                     API calls         Dashboard
```

**Test Points:**
1. Publishing triggers check-back scheduling
2. Each interval collects new metrics
3. Metrics aggregate to batch/client level
4. Reports pull from metric snapshots

---

## 3. Test Categories

### A. Data Flow Tests
Verify data passes correctly between modules.

| Test | From | To | Data |
|------|------|-----|------|
| `client-to-batch` | Clients | Content Batches | `client_id`, brand info |
| `batch-to-posts` | Content Batches | Blog Posts | `batch_id`, goals |
| `post-to-metrics` | Blog Posts | Metrics | `blog_post_id` |
| `cluster-to-posts` | Topic Clusters | Blog Posts | `topic_cluster_id` |

### B. Event Chain Tests
Verify events trigger downstream actions.

| Test | Trigger | Expected Actions |
|------|---------|------------------|
| `post-approval` | Client approves post | Notification to vendor, status update |
| `post-publish` | Vendor publishes | WordPress API call, URL tracking, check-back scheduling |
| `content-request` | Client submits request | Notification to vendor, request in dashboard |
| `revision-request` | Client requests changes | Notification to editor, task created |

### C. State Machine Tests
Verify valid state transitions.

| Entity | Valid Transitions |
|--------|-------------------|
| Blog Post | `draft → drafting → ready_for_review → approved → published` |
| Content Batch | `draft → in_progress → ready_for_review → approved → completed` |
| Content Request | `pending → in_progress → completed/declined` |
| Approval | `pending_review → approved/revision_requested/rejected` |

### D. Cross-Portal Tests
Verify same data appears correctly in different portals.

| Data | Vendor View | Client View |
|------|-------------|-------------|
| Blog Post | Full edit access | Read-only preview |
| Approval Status | "Showcased" action | "Approve/Reject" actions |
| Comments | All threads | Own threads only |
| Notifications | Vendor-specific | Client-specific |

---

## 4. Critical Integration Test Cases

### Priority 1: Core Workflow

| ID | Test Case | Features Involved |
|----|-----------|-------------------|
| INT-001 | Full post lifecycle: create → draft → review → approve → publish | Batches, Pipeline, Review, Portal, WordPress |
| INT-002 | Brand context flows through AI pipeline | Brand Guide, All 7 Agents |
| INT-003 | Client approval triggers correct notifications | Portal, Notifications, Dashboard |
| INT-004 | Published post schedules check-backs | Publishing, Check-backs, Metrics |

### Priority 2: Cross-Feature

| ID | Test Case | Features Involved |
|----|-----------|-------------------|
| INT-005 | Content request → post creation → delivery | Requests, Batches, Posts, Notifications |
| INT-006 | SEO audit → batch goals → post targeting | Audit, Batches, Posts, Clusters |
| INT-007 | Revision request → edit → re-approval | Comments, Revisions, Workflow, Notifications |
| INT-008 | Batch status reflects child post statuses | Batches, Posts, Status Machine |

### Priority 3: Edge Cases

| ID | Test Case | Features Involved |
|----|-----------|-------------------|
| INT-009 | Concurrent approvals on same batch | Portal, Database, Locking |
| INT-010 | WordPress publish failure → retry logic | Publishing, Error Handling |
| INT-011 | Check-back on deleted post | Check-backs, Soft Delete |
| INT-012 | Notification deduplication | Events, Notifications |

---

## 5. Test Implementation Status

| Test File | Coverage | Status |
|-----------|----------|--------|
| `complete-workflow.test.ts` | Core 10-phase PRD flow | ✅ Exists (partial) |
| `e2e-workflows.test.ts` | Create → Review → Approve | ✅ Exists |
| `prd-requirements.test.ts` | All 6 Epics acceptance | ✅ Exists |
| `cross-feature-integration.test.ts` | Feature interactions | ⏳ **NEW** |
| `notification-chains.test.ts` | Event → Notification flow | ⏳ **NEW** |
| `brand-context-flow.test.ts` | Brand → AI → Content | ⏳ **NEW** |
| `approval-publishing-flow.test.ts` | Approve → Publish → Track | ⏳ **NEW** |

---

## 6. Running Integration Tests

```bash
# Run all integration tests
npm test -- --testPathPattern=integration

# Run specific integration test
npm test -- __tests__/integration/cross-feature-integration.test.ts

# Run with coverage
npm test -- --coverage --testPathPattern=integration
```

---

*Last updated: January 14, 2026*
