# BlogCanvas PRD & Site Screenshots

**Generated:** ${new Date().toLocaleString()}

---

## 📋 Product Requirements Document (PRD)

The full PRD is available in `PRD.txt` at the root of the project. This document outlines the end-to-end operating system for SEO retainers.

### Core Epics

1. **Epic 1 – SEO Audit & Topic Forecast**
   - Add client + website
   - Run crawl / SEO audit job
   - Generate topic clusters + target coverage map
   - Compute "SEO score now" + projected "SEO score after plan"

2. **Epic 2 – Plan Builder & Pitch Generator**
   - Choose goals and time horizon
   - System suggests required blog count & cadence
   - Pitch generator for CSM + client-ready email/report

3. **Epic 3 – Content Batch & AI Writing Pipeline**
   - Topic list → Content Batch
   - Multi-stage AI pipeline for each post
   - Revision history + per-post SEO quality score

4. **Epic 4 – Human Review & Client Approval Workflow**
   - Internal review Kanban
   - Client portal to approve/comment
   - Status transitions reflected on both sides

5. **Epic 5 – CMS Publishing & Scheduling**
   - WordPress integration
   - One-click publish or schedule
   - Tracking live URLs and publish status

6. **Epic 6 – Analytics, Check-Backs & Reporting**
   - Scheduled metric collection per post
   - Aggregated dashboards per client & per batch
   - Report/slide-deck/email generator

### Implementation Status

See `docs/PRD_AUDIT.md` for detailed implementation status:
- ✅ Database Schema: 100% Complete
- ✅ Epic 1 (SEO Audit): ~80% Complete
- ⚠️ Epic 2 (Plan Builder & Pitch): ~50% Complete
- ✅ Epic 3 (Content Batch & AI Pipeline): ~70% Complete
- ⚠️ Epic 4 (Client Portal): ~40% Complete
- ❌ Epic 5 (CMS Publishing): ~30% Complete
- ❌ Epic 6 (Analytics & Reporting): ~10% Complete

---

## 📸 Site Screenshots

All screenshots have been captured and are available in the `screenshots/` directory.

### Screenshot Index

Open `screenshots/index.html` in your browser to view all screenshots in an interactive gallery.

### Routes Captured

**Public/Home Pages:**
- `/` - Home page
- `/blog` - Public blog listing
- `/brand-guide` - Brand guide page
- `/posts` - Posts directory
- `/settings` - Settings page
- `/analyze` - Analysis page

**Staff/Admin Portal (`/app/*`):**
- `/app` - Main dashboard
- `/app/websites` - Websites management
- `/app/batches` - Content batches
- `/app/review` - Review board (Kanban)
- `/app/publishing` - Publishing dashboard
- `/app/clients` - Clients management
- `/app/analytics` - Analytics dashboard
- `/app/settings` - Settings

**Client Portal (`/portal/*`):**
- `/portal/login` - Client login
- `/portal/dashboard` - Client dashboard
- `/portal/posts` - Client posts view
- `/portal/batches` - Client batches view
- `/portal/brand` - Brand guide
- `/portal/settings/notifications` - Notification settings

**Authentication:**
- `/auth/reset-password` - Password reset page

### Screenshot Details

- **Total Routes:** 21
- **Successful:** 21
- **Failed:** 0
- **Format:** PNG (full page)
- **Resolution:** 1920x1080 viewport (full page capture)
- **Location:** `screenshots/` directory

### Viewing Screenshots

1. **Interactive Gallery:** Open `screenshots/index.html` in your browser
2. **Individual Files:** Navigate to `screenshots/` and open any `.png` file
3. **File Naming:** Routes are converted to filenames (e.g., `/app/websites` → `app_websites.png`)

### Regenerating Screenshots

To regenerate screenshots, run:

```bash
npx tsx scripts/screenshot-site.ts
```

The script will:
- Capture all routes listed in the script
- Save screenshots to `screenshots/` directory
- Generate an interactive HTML index
- Use the production URL by default (or localhost if production is unavailable)

---

## 📁 Related Documents

- **PRD:** `PRD.txt` - Full product requirements document
- **PRD Audit:** `docs/PRD_AUDIT.md` - Implementation status audit
- **PRD Status:** `docs/PRD_STATUS.md` - Feature completion tracking
- **Implementation Plan:** `docs/PRD_IMPLEMENTATION_PLAN.md` - Development roadmap

---

## 🚀 Quick Links

- **Production Site:** https://blog-canvas-24bcpegvs-isaiahduprees-projects.vercel.app
- **Screenshot Gallery:** `screenshots/index.html`
- **PRD Source:** `PRD.txt`

