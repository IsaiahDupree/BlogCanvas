# BlogCanvas Client Guide

**Welcome to BlogCanvas!** This guide will help you review and approve blog content created by your content agency. You'll learn how to access your portal, review posts, provide feedback, and track your SEO progress.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Client Portal Overview](#client-portal-overview)
3. [Reviewing Blog Posts](#reviewing-blog-posts)
4. [Approving Content](#approving-content)
5. [Requesting Changes](#requesting-changes)
6. [Content Batches](#content-batches)
7. [Brand Guide](#brand-guide)
8. [Tracking Progress](#tracking-progress)
9. [Notifications](#notifications)
10. [FAQs](#faqs)

---

## Getting Started

### Receiving Your Invitation

Your content agency will send you an email invitation to BlogCanvas. The email contains:

- A secure login link
- Your unique invitation token
- Instructions for first-time setup

### First-Time Login

1. Click the link in your invitation email
2. You'll be taken to `https://blogcanvas.io/portal/login`
3. Enter your email address
4. Enter the invitation token from the email
5. Create a password (min 8 characters, include uppercase, lowercase, number)
6. Click **"Complete Setup"**

### Accessing Your Portal

After setup, log in anytime at:
- **Production:** `https://blogcanvas.io/portal/login`
- **Development:** `http://localhost:4848/portal/login`

**Bookmark this page for easy access!**

---

## Client Portal Overview

### Dashboard

Your dashboard (`/portal/dashboard`) shows:

- **SEO Progress** - Current vs. baseline SEO score
- **Content Summary** - Posts in review, approved, published
- **Recent Activity** - Latest updates from your agency
- **Quick Actions** - Jump to posts needing review

### Main Navigation

| Section | Purpose | URL |
|---------|---------|-----|
| **Dashboard** | Overview and stats | `/portal/dashboard` |
| **Posts** | Review blog posts | `/portal/posts` |
| **Batches** | Content batch progress | `/portal/batches` |
| **Brand** | Your brand guide | `/portal/brand` |
| **Work** | Project milestones | `/portal/work` |
| **Notifications** | Activity feed | `/portal/notifications` |

### What You Can Do

As a client, you can:

✅ **Review** - Read all blog posts created for you
✅ **Approve** - Give green light to publish content
✅ **Request Changes** - Ask for edits or rewrites
✅ **Comment** - Provide detailed feedback
✅ **Track Progress** - See SEO score improvements
✅ **Manage Brand** - Update voice and style guidelines

### What You Cannot Do

❌ **Edit Content** - Only your agency can edit (you request changes)
❌ **Publish** - Your agency handles publishing
❌ **Delete Posts** - Contact your agency to remove content
❌ **See Other Clients** - You only see your own data

---

## Reviewing Blog Posts

### Accessing Posts

1. Click **"Posts"** in navigation (`/portal/posts`)
2. See all posts in different stages:
   - **Ready for Review** - Needs your approval
   - **Changes Requested** - Agency working on your feedback
   - **Approved** - Waiting to publish
   - **Published** - Live on your website

### Filtering Posts

Use filters to find specific posts:

- **Status** - Show only posts needing review
- **Batch** - Posts from specific campaign
- **Date** - Recently created posts
- **Search** - Find by title or keyword

### Opening a Post

1. Click on any post card
2. You'll see the post detail page with:
   - Full content preview
   - SEO metadata (title, description, keywords)
   - Images and formatting
   - Action buttons (Approve, Request Changes)

### What to Look For

#### Content Quality

- ✅ **Accuracy** - Are all facts correct?
- ✅ **Relevance** - Does this help your audience?
- ✅ **Voice** - Does it sound like your brand?
- ✅ **Completeness** - Are all points covered?

#### SEO Elements

Your agency optimizes for search engines, but you should verify:

- ✅ **Target Keyword** - Is it used naturally (not stuffed)?
- ✅ **Headings** - Are they clear and descriptive?
- ✅ **Meta Description** - Does it compel clicks?

#### Brand Alignment

- ✅ **Tone** - Professional? Casual? Appropriate for your audience?
- ✅ **Terminology** - Uses your preferred product/service names?
- ✅ **Values** - Aligns with your company values?
- ✅ **CTA** - Calls-to-action match your goals?

### Reading Mode

The post preview shows:

- **Formatted View** - How it will look on your website
- **Headings** - H2 and H3 structure
- **Images** - Proposed images (or image placeholders)
- **Links** - Internal and external links

**Tip:** Read the post out loud to catch awkward phrasing.

---

## Approving Content

### Approving a Single Post

When a post meets your standards:

1. Review the entire post carefully
2. Click **"Approve"** button (usually green)
3. Optionally add a comment (e.g., "Great work!")
4. Confirm approval

**What happens next:**
- Post status changes to "Approved"
- Your agency receives notification
- Post enters publishing queue

### Bulk Approval

Approve multiple posts at once:

1. Go to **Posts** page (`/portal/posts`)
2. Select multiple posts (checkboxes)
3. Click **"Approve Selected"**
4. Confirm bulk approval

**Use bulk approval when:**
- You've reviewed all posts offline
- Posts are all high quality
- You want to speed up publishing

**Pro Tip:** It's okay to ask your agency to send 3-5 posts at once for batch review. This saves time on both sides.

---

## Requesting Changes

### When to Request Changes

Request changes if:

- ❌ Content is factually incorrect
- ❌ Tone doesn't match your brand
- ❌ Important point is missing
- ❌ Examples aren't relevant to your audience
- ❌ Call-to-action is wrong

**Important:** Be specific about what needs changing!

### Requesting Changes on a Post

1. Open the post detail page
2. Click **"Request Changes"** button (usually yellow/orange)
3. In the comment box, explain what needs to change:
   - **Be specific** - Don't say "fix this", say "change 'XYZ' to 'ABC'"
   - **Explain why** - Help agency understand your reasoning
   - **Provide examples** - Link to good examples if possible
4. Click **"Submit"**

**Example Good Feedback:**

> "In the 'Benefits' section, please change 'software' to 'platform' throughout. We always refer to our product as a platform, not software. Also, the example in paragraph 3 mentions Company X, but we prefer to use Company Y as they're a better fit for our target audience."

**Example Bad Feedback:**

> "This doesn't sound right. Please fix."

### Tracking Change Requests

After requesting changes:

- Post status changes to "Changes Requested"
- Your agency receives notification
- Post will return to you when updated

You'll see:
- 🟠 **Orange badge** on post card
- **"Changes Requested"** status
- Your original comment preserved

### Reviewing Updated Content

When agency completes your requested changes:

1. You'll receive notification
2. Post returns to "Ready for Review"
3. Review the changes
4. Either approve or request additional changes

**Note:** You can see all previous versions in the revision history if provided by your agency.

---

## Content Batches

### What is a Content Batch?

A **Content Batch** is a group of related blog posts, usually planned together (e.g., "Q1 2026 SEO Campaign").

**Batch benefits:**
- See related content together
- Understand overall content strategy
- Approve thematic campaigns faster

### Viewing Batches

1. Navigate to **Batches** (`/portal/batches`)
2. See all content batches:
   - Batch name and description
   - Progress bar (% complete)
   - Number of posts (total, approved, published)
   - Target SEO score improvement

### Batch Detail Page

Click on a batch to see:

- **Overview** - Batch goals and timeline
- **Posts** - All posts in this batch
- **Progress** - Completion status
- **Analytics** - Performance metrics (after publishing)

### Approving an Entire Batch

If all posts in a batch are ready:

1. Open batch detail page (`/portal/batches/[id]`)
2. Review post summaries
3. Click **"Approve All Posts"**
4. Confirm batch approval

**Use with caution:** Only approve entire batch if you've reviewed all posts individually first.

---

## Brand Guide

### Why Brand Guide Matters

Your **Brand Guide** tells your agency how to write content that sounds like you.

**The more detailed your brand guide, the better content you'll receive.**

### Accessing Your Brand Guide

1. Navigate to **Brand** (`/portal/brand`)
2. See sections:
   - Voice & Tone
   - Target Audience
   - Writing Style
   - Do's and Don'ts
   - Terminology
   - Competitor Positioning

### Updating Your Brand Guide

You can update your brand guide anytime:

1. Go to brand guide page
2. Click **"Edit"** on any section
3. Update the content:
   - Add specific examples
   - List preferred terms
   - Explain tone nuances
4. Click **"Save"**

### Brand Guide Best Practices

#### Voice & Tone

**Good:**
> "Our voice is professional but approachable. We use 'we' and 'our' to create partnership. Tone is optimistic and solution-focused. Think: trusted advisor, not salesperson."

**Bad:**
> "Be professional."

#### Do's and Don'ts

**Good:**
> **DO:**
> - Use "platform" instead of "software"
> - Start sentences with action verbs
> - Include real customer examples
>
> **DON'T:**
> - Use jargon like "synergy" or "leverage"
> - Write sentences longer than 25 words
> - Make claims without data

**Bad:**
> **DO:**
> - Write good content
>
> **DON'T:**
> - Write bad content

#### Target Audience

**Good:**
> "Our primary audience is marketing directors at B2B SaaS companies with 50-500 employees. They're overwhelmed with tools and looking to consolidate their stack. Pain points: too many logins, inconsistent data, wasted budget."

**Bad:**
> "Business people."

**Pro Tip:** Update your brand guide whenever you provide feedback that could apply to future posts.

---

## Tracking Progress

### SEO Score

Your **SEO Score** (0-100) measures your website's search engine optimization.

**What affects your score:**
- Content quality and quantity
- Keyword targeting
- Topic coverage
- Internal linking
- Technical SEO

**Typical Progress:**
- **Starting:** 30-50 (most websites)
- **After 3 months:** +10-15 points
- **After 6 months:** +20-30 points
- **After 12 months:** +30-50 points

### Dashboard Metrics

Your dashboard shows:

- **Baseline SEO Score** - Starting point
- **Current SEO Score** - Latest score
- **Improvement** - Point increase
- **Goal Score** - Target from your package
- **Posts Published** - Content live on your site
- **Posts in Review** - Waiting for your approval

### Analytics (After Publishing)

Once posts are published, you'll see:

- **Impressions** - How many times your posts appeared in search
- **Clicks** - Visits from search results
- **Average Position** - Where you rank on Google
- **Top Posts** - Best performing content

**Note:** SEO results take time. Expect to see meaningful traffic after 60-90 days.

### Reports

Your agency may send regular reports:

- **Monthly Reports** - Progress summary
- **Quarterly Reports** - Deep dive analysis
- **Custom Reports** - Specific campaigns

Reports include:
- SEO score changes
- Traffic metrics
- Keyword rankings
- Top performing posts
- Recommendations

---

## Notifications

### Notification Types

You'll receive notifications when:

- 📝 **New posts ready** - Content needs your review
- ✅ **Changes completed** - Agency addressed your feedback
- 📊 **Batch complete** - All posts in batch are done
- 🚀 **Content published** - Posts are live on your website
- 📈 **Reports available** - New analytics report generated

### Managing Notifications

#### Email Notifications

By default, you receive emails for important events.

**Configure email notifications:**
1. Go to **Settings** → **Notifications** (`/portal/settings/notifications`)
2. Toggle notification types:
   - Posts ready for review (recommended: ON)
   - Changes completed (recommended: ON)
   - Content published (optional)
   - Weekly digest (optional)
3. Click **"Save Preferences"**

#### In-App Notifications

Check your notification bell (🔔) in the header:

- See recent activity
- Click to jump to relevant post/batch
- Mark as read

**Tip:** Check notifications daily to stay on top of content review.

### Notification Settings

**Recommended settings:**

| Notification | Email | In-App |
|-------------|-------|--------|
| Posts ready for review | ✅ Yes | ✅ Yes |
| Changes completed | ✅ Yes | ✅ Yes |
| Content published | ❌ No | ✅ Yes |
| Weekly digest | ✅ Yes | ❌ No |
| Monthly report | ✅ Yes | ✅ Yes |

**Adjust based on your preference for staying informed.**

---

## FAQs

### Account & Access

**Q: I lost my invitation email. How do I log in?**

A: Contact your content agency. They can resend your invitation from their dashboard.

---

**Q: Can I add another team member to review content?**

A: Yes! Ask your agency to send an invitation to the additional team member's email. They'll create their own account.

---

**Q: How do I change my password?**

A: Go to Settings → Security → Change Password. You'll need your current password to set a new one.

---

### Content Review

**Q: How long do I have to review content?**

A: This depends on your agreement with your agency. Typical SLA is 3-5 business days. Check your contract or ask your agency.

---

**Q: Can I approve a post with minor typos and have agency fix them?**

A: It's better to request changes for typos before approving. Once approved, posts enter the publishing queue and may go live with errors.

---

**Q: What if I completely disagree with the content direction?**

A: Request changes and explain your concerns in detail. If the issue is bigger than one post, schedule a call with your agency to align on strategy.

---

**Q: Can I edit the content directly?**

A: No, clients cannot edit content in BlogCanvas. Request changes through the comments system, and your agency will make edits.

---

**Q: Do I need to review every single post?**

A: Yes, for quality control. However, if you trust your agency and have a strong brand guide, you can batch review posts faster.

---

### Technical Questions

**Q: Why do some posts have a "0" SEO quality score?**

A: The SEO score is calculated after the AI agents process the content. Posts in early stages (outline only) won't have a score yet.

---

**Q: What is a "revision"?**

A: Each time content is updated (by AI or humans), a new revision is created. This tracks all changes over time. Your agency can show you the full revision history.

---

**Q: What does "Ready for Client" mean?**

A: Your agency has completed internal review and QA. The post is ready for you to review and approve.

---

**Q: When will my approved content be published?**

A: This depends on your publishing schedule. Ask your agency about the publishing cadence (e.g., 2 posts per week).

---

**Q: Can I see content after it's published?**

A: Yes! Published posts show a "View Live" link that takes you to the post on your actual website.

---

### Results & Analytics

**Q: How long until I see SEO results?**

A: SEO takes time. Expect:
- **7 days** - Post indexed by Google
- **30 days** - Initial impressions and clicks
- **60 days** - Ranking improvements
- **90 days** - Measurable traffic increases

---

**Q: Why is my SEO score going down?**

A: SEO scores can fluctuate due to:
- Algorithm updates
- Competitor activity
- Technical issues on your site
- Seasonal trends

Your agency will investigate if there's a significant drop.

---

**Q: Can I see how individual posts are performing?**

A: Yes! Published posts show metrics like impressions, clicks, and average position. Check the post detail page or analytics dashboard.

---

### Working with Your Agency

**Q: How often should I communicate with my agency?**

A: Recommended cadence:
- **Daily** - Check notifications for posts to review
- **Weekly** - Review batch progress
- **Monthly** - Join report review call
- **Quarterly** - Strategic planning session

---

**Q: What if I don't like any of the content in a batch?**

A: Request changes on each post with specific feedback. If there's a pattern, schedule a call to realign on strategy and update your brand guide.

---

**Q: Can I pause content production?**

A: Yes, but you'll need to coordinate with your agency. They may need to adjust your subscription or timeline.

---

**Q: How do I know if my agency is meeting deadlines?**

A: Check the "Work" page (`/portal/work`) to see declared milestones and their status. Your contract should define SLAs.

---

## Getting Help

### In-App Help

- Look for **?** icons throughout the interface
- Hover over fields for tooltips
- Check notification panel for updates

### Contact Your Agency

Your content agency is your first point of contact for:

- Strategic questions
- Content direction
- Publishing schedules
- Custom requests

### BlogCanvas Support

For technical issues with the platform:

- **Email:** support@blogcanvas.io
- **Help Center:** https://help.blogcanvas.io

**Note:** BlogCanvas support handles platform issues only. Content questions should go to your agency.

---

## Best Practices for Clients

### Review Efficiently

1. **Set aside review time** - Block 30-60 min weekly for content review
2. **Batch review** - Review 3-5 posts in one sitting
3. **Be decisive** - Approve good content quickly, request changes on issues
4. **Use templates** - Create comment templates for common feedback

### Provide Better Feedback

1. **Be specific** - Point out exact sentences/paragraphs
2. **Explain why** - Help your agency understand your reasoning
3. **Give examples** - Link to content you love
4. **Update brand guide** - Capture feedback for future content

### Build a Strong Partnership

1. **Trust your agency** - They're SEO experts, let them guide strategy
2. **Respond promptly** - Delays in approval slow down SEO progress
3. **Communicate openly** - Share concerns early, don't let issues build up
4. **Track results** - Celebrate wins together!

---

## What's Next?

Now that you understand your client portal:

1. **Log in** - Access your portal and explore
2. **Update brand guide** - Add details to improve content quality
3. **Review posts** - Check if any content is waiting for you
4. **Set notifications** - Configure email preferences
5. **Schedule time** - Block weekly review time on your calendar

**Welcome to better content marketing! 🎉**
