# BlogCanvas Quick Start Tutorials

Step-by-step walkthroughs for common tasks in BlogCanvas. Follow these scripts to learn the platform quickly.

---

## Table of Contents

### For Vendors
1. [Tutorial 1: Onboard Your First Client](#tutorial-1-onboard-your-first-client)
2. [Tutorial 2: Run an SEO Audit](#tutorial-2-run-an-seo-audit)
3. [Tutorial 3: Create Your First Content Batch](#tutorial-3-create-your-first-content-batch)
4. [Tutorial 4: Generate AI Content](#tutorial-4-generate-ai-content)
5. [Tutorial 5: Review and Send to Client](#tutorial-5-review-and-send-to-client)
6. [Tutorial 6: Publish to WordPress](#tutorial-6-publish-to-wordpress)

### For Clients
7. [Tutorial 7: Client First Login](#tutorial-7-client-first-login)
8. [Tutorial 8: Review and Approve Content](#tutorial-8-review-and-approve-content)
9. [Tutorial 9: Request Changes](#tutorial-9-request-changes)

---

## For Vendors

### Tutorial 1: Onboard Your First Client

**Goal:** Add a new client to BlogCanvas and invite them to the portal.

**Time:** 5 minutes

**Steps:**

1. **Log in to BlogCanvas**
   - Go to `/app` (vendor dashboard)
   - Enter your credentials

2. **Navigate to Clients**
   - Click **"Clients"** in main navigation
   - You'll see the clients list page

3. **Add New Client**
   - Click **"Add New Client"** button (top right)
   - Fill in the form:
     - **Company Name:** "Acme Corp"
     - **Contact Name:** "John Smith"
     - **Contact Email:** "john@acmecorp.com"
     - **Industry:** "B2B SaaS"
     - **Target Audience:** "Marketing directors at mid-size companies"
   - Click **"Create Client"**

4. **Complete Brand Guide**
   - You're now on the client detail page
   - Click **"Brand Guide"** tab
   - Fill in:
     - **Voice & Tone:** "Professional but approachable. We use 'we' to create partnership."
     - **Do's:**
       - Use "platform" instead of "software"
       - Keep sentences under 25 words
     - **Don'ts:**
       - Don't use jargon like "synergy"
       - Don't mention competitors by name
   - Click **"Save Brand Guide"**

5. **Invite Client to Portal**
   - Go to **"Overview"** tab
   - Click **"Invite to Portal"** button
   - Confirm email address: "john@acmecorp.com"
   - Optionally customize invitation message
   - Click **"Send Invitation"**

**✅ Success!** Client created and invitation sent. Client will receive an email with login instructions.

---

### Tutorial 2: Run an SEO Audit

**Goal:** Analyze a client's website to identify content opportunities.

**Time:** 5-7 minutes (includes 2-5 min audit processing)

**Steps:**

1. **Add Client Website**
   - Navigate to **"Websites"** in main navigation
   - Click **"Add Website"**
   - Fill in:
     - **Website URL:** "https://acmecorp.com"
     - **Client:** Select "Acme Corp" from dropdown
     - **CMS Platform:** Select "WordPress"
   - Click **"Add Website"**

2. **Run SEO Audit**
   - You're now on the website detail page
   - Click **"Run Audit"** button (big blue button)
   - You'll see "Audit in progress..." message
   - **Wait 2-5 minutes** for completion
   - Page will refresh automatically when done

3. **Review Audit Results**
   - **Baseline SEO Score:** Note the score (e.g., 42/100)
   - **Pages Indexed:** How many pages were crawled
   - **Audit Date:** When this audit was run

4. **Explore Topic Clusters**
   - Click **"Topic Clusters"** tab
   - Review discovered clusters:
     - **Estimated Traffic:** Monthly search volume potential
     - **Difficulty:** Easy/Medium/Hard
     - **Covered:** Green check = already covered, Empty = opportunity
   - Note which clusters are opportunities (not yet covered)

5. **Review Gap Analysis**
   - Click **"Gap Analysis"** tab
   - See:
     - **Content Gaps:** Topics competitors cover but client doesn't
     - **Keyword Opportunities:** High-value keywords to target
     - **Internal Linking Gaps:** Missing connections

**✅ Success!** You now have a complete SEO analysis and content roadmap.

**Pro Tip:** Take a screenshot of the audit results to include in your pitch deck.

---

### Tutorial 3: Create Your First Content Batch

**Goal:** Create a content batch and populate it with blog topics.

**Time:** 10 minutes

**Steps:**

1. **Navigate to Batches**
   - Click **"Batches"** in main navigation
   - Click **"Create Batch"** button

2. **Fill in Batch Details**
   - **Batch Name:** "Q1 2026 SEO Campaign"
   - **Client:** Select "Acme Corp"
   - **Website:** Select "acmecorp.com"
   - **Current SEO Score:** 42 (auto-filled from latest audit)
   - **Target SEO Score:** 65
   - **Start Date:** Today's date
   - **End Date:** 3 months from today
   - Click **"Create Batch"**

3. **Auto-Generate Posts from Topic Clusters**
   - You're now on batch detail page
   - Click **"Topic Clusters"** tab
   - You'll see opportunity clusters (uncovered topics)
   - Select 5-10 clusters (check checkboxes)
   - Click **"Generate Posts from Selected"**
   - System creates blog post records for each cluster

4. **Review Generated Posts**
   - Go back to **"Overview"** tab
   - Scroll to **"Posts in This Batch"** section
   - You'll see your newly created posts:
     - Title (from cluster name)
     - Target keyword
     - Status: "draft" (not AI-generated yet)
     - SEO Quality Score: 0 (not yet scored)

5. **Optional: Add Manual Posts**
   - If you have additional topics not in clusters:
   - Click **"Add Post"** button
   - Fill in:
     - **Title:** "10 Best Practices for [Topic]"
     - **Target Keyword:** "best practices [keyword]"
     - **Description:** Brief overview
   - Click **"Create Post"**

**✅ Success!** Your content batch is ready for AI generation.

**Next Step:** Generate AI drafts (Tutorial 4)

---

### Tutorial 4: Generate AI Content

**Goal:** Use AI to create complete blog posts from topics.

**Time:** 5-10 minutes (including AI processing)

**Steps:**

1. **Open Your Batch**
   - Navigate to **"Batches"**
   - Click on "Q1 2026 SEO Campaign"

2. **Generate All Drafts (Option A: Bulk)**
   - Click **"Generate All Drafts"** button
   - Confirm: "Generate drafts for 8 posts"
   - System queues all posts for AI processing
   - **This will take 15-25 minutes** for 8 posts (2-3 min each)
   - You can close the page; processing continues in background

3. **Generate Single Draft (Option B: Individual)**
   - Scroll to posts list
   - Find a specific post
   - Click **"Generate Draft"** button on that post
   - Watch real-time progress:
     - 🟡 Outline Agent working...
     - 🟠 Drafting Agent writing...
     - 🔵 SEO Agent optimizing...
     - 🟣 Fact-Check Agent reviewing...
     - 🟢 Enhancement Agent finalizing...
   - **Takes 2-3 minutes**

4. **Monitor Progress**
   - Refresh page to see updated statuses
   - Post cards show current pipeline stage
   - Once complete, status changes to "editor_review"

5. **View Generated Content**
   - Click on a completed post
   - You'll see the full AI-generated content:
     - Title and meta description
     - Introduction
     - Main sections with H2/H3 headings
     - Conclusion and CTA
     - FAQs (if generated)
     - Image prompts

6. **Review Revision History**
   - Click **"View History"** button
   - See all AI agent revisions:
     - Outline
     - Draft
     - SEO Pass
     - Fact-Check
     - Enhancement
   - Click any revision to see what that agent did

7. **Check SEO Quality Score**
   - Note the SEO Quality Score (0-100)
   - Scores 70+ are good
   - Scores below 60 may need manual optimization

**✅ Success!** You now have AI-generated blog posts ready for review.

**Next Step:** Review and send to client (Tutorial 5)

---

### Tutorial 5: Review and Send to Client

**Goal:** Perform internal QA and move posts to client review.

**Time:** 15-20 minutes per post

**Steps:**

1. **Navigate to Review Board**
   - Click **"Review"** in main navigation
   - You'll see the Kanban board with columns:
     - AI Drafting
     - Editor Review
     - Ready for Client
     - Client Review
     - Changes Requested
     - Approved

2. **Find Posts Needing Review**
   - Look in **"Editor Review"** column
   - These posts have completed AI generation

3. **Open a Post**
   - Click on a post card
   - You'll see the post detail page

4. **Review Content Quality**
   - **Read the entire post carefully**
   - Check for:
     - ✅ Factual accuracy
     - ✅ Brand voice alignment
     - ✅ Target keyword used naturally (not stuffed)
     - ✅ Clear H2/H3 structure
     - ✅ No grammar errors
     - ✅ Compelling meta description
     - ✅ Appropriate tone

5. **Make Edits (If Needed)**
   - Click **"Edit"** button
   - Make changes in the editor:
     - Fix typos
     - Adjust tone
     - Add client-specific examples
     - Improve weak sections
   - Click **"Save as Human Edit"**
   - Your changes are tracked in revision history

6. **Add Internal Notes (Optional)**
   - Scroll to comments section
   - Add note: "Verified facts. Added client example in section 3."
   - This helps track what was reviewed

7. **Move to Ready for Client**
   - **Option A: From post detail page**
     - Click **"Send to Client"** button
     - Confirm action
   - **Option B: From Kanban board**
     - Drag the post card to **"Ready for Client"** column

8. **Verify Client Notification**
   - System automatically sends email to client
   - Client receives notification: "New content ready for review"

9. **Repeat for Other Posts**
   - Return to Kanban board
   - Review next post in **"Editor Review"**

**✅ Success!** Posts are now in client's review queue.

**Pro Tip:** Review 3-5 posts at once, then send batch notification to client. This is more efficient than sending one at a time.

---

### Tutorial 6: Publish to WordPress

**Goal:** Connect WordPress and publish approved content.

**Time:** 10 minutes (5 min setup, 5 min per publish)

**Steps:**

#### Part A: Connect WordPress (One-Time Setup)

1. **Get WordPress Application Password**
   - Log into your client's WordPress admin
   - Go to **Users** → **Profile** (your user)
   - Scroll to **"Application Passwords"** section
   - Enter name: "BlogCanvas"
   - Click **"Add New Application Password"**
   - **Copy the password immediately** (shown once)
   - Save it somewhere temporarily

2. **Connect in BlogCanvas**
   - Go to **"Websites"** in BlogCanvas
   - Click on client's website (e.g., "acmecorp.com")
   - Click **"CMS Connection"** tab
   - Click **"Add Connection"** button
   - Fill in:
     - **CMS Type:** WordPress
     - **Website URL:** "https://acmecorp.com"
     - **Username:** Your WordPress username
     - **Application Password:** Paste the password from step 1
   - Click **"Test Connection"**
   - Wait for success message: ✅ "Connected successfully"
   - Click **"Save Connection"**

#### Part B: Publish Posts

3. **Navigate to Publishing Queue**
   - Click **"Publishing"** in main navigation
   - You'll see all approved posts

4. **Publish a Single Post**
   - Find an approved post
   - Click **"Publish"** button
   - You'll see options:
     - **Publish Now** - Goes live immediately
     - **Schedule for Later** - Set future date/time
   - For this tutorial, select **"Publish Now"**
   - Click **"Confirm Publish"**

5. **Monitor Publishing Status**
   - You'll see "Publishing..." indicator
   - Wait 10-30 seconds
   - Status changes to:
     - ✅ **"Published"** - Success!
     - Or ⚠️ **"Failed"** - Click to see error

6. **Verify on Website**
   - Click **"View Live"** link
   - Opens post on client's actual website
   - Verify:
     - Title correct
     - Content formatted properly
     - Images displaying (if any)
     - Meta description set

7. **Batch Publishing (Optional)**
   - Back in publishing queue
   - Select multiple approved posts (checkboxes)
   - Click **"Publish Selected"**
   - Optionally schedule posts on different dates
   - Click **"Publish All"**

**✅ Success!** Content is live on client's website!

**Troubleshooting:**
- **Failed to publish:** Check WordPress Application Password is still valid
- **Permission denied:** Ensure WordPress user has 'publish_posts' capability
- **Network timeout:** Try again; may be temporary server issue

---

## For Clients

### Tutorial 7: Client First Login

**Goal:** Set up your client account and access the portal.

**Time:** 3 minutes

**Steps:**

1. **Find Your Invitation Email**
   - Check inbox for email from your content agency
   - Subject: "You're invited to BlogCanvas"
   - **Can't find it?** Check spam folder or ask agency to resend

2. **Click Invitation Link**
   - Click the button in email: "Accept Invitation"
   - Opens BlogCanvas client portal login page

3. **Complete Setup**
   - **Email:** Pre-filled from invitation
   - **Invitation Token:** Copy from email and paste (or pre-filled)
   - **Create Password:**
     - Min 8 characters
     - Include uppercase letter
     - Include lowercase letter
     - Include number
     - Example: "MyBlog2026!"
   - **Confirm Password:** Type same password again
   - Click **"Complete Setup"**

4. **Explore Your Dashboard**
   - You're now logged in!
   - See:
     - **SEO Progress:** Current vs. baseline score
     - **Content Summary:** Posts in review, approved, published
     - **Recent Activity:** Latest updates
   - **Bookmark this page:** `https://blogcanvas.io/portal/dashboard`

5. **Update Notification Preferences (Optional)**
   - Click your name (top right) → **"Settings"**
   - Click **"Notifications"** tab
   - Toggle preferences:
     - ✅ Posts ready for review (recommended ON)
     - ✅ Changes completed (recommended ON)
     - ⚪ Content published (optional)
     - ✅ Weekly digest (recommended ON)
   - Click **"Save Preferences"**

**✅ Success!** You're ready to review content.

**Next Step:** Review your first post (Tutorial 8)

---

### Tutorial 8: Review and Approve Content

**Goal:** Review a blog post and approve it for publishing.

**Time:** 10-15 minutes per post

**Steps:**

1. **Check for Posts to Review**
   - Go to **"Posts"** in navigation
   - Look for posts with status: **"Ready for Review"**
   - You'll see a number badge if posts are waiting

2. **Open a Post**
   - Click on a post card
   - You'll see the full content preview

3. **Read the Content**
   - **Read carefully from start to finish**
   - Imagine your ideal customer reading this
   - Ask yourself:
     - Does this help my audience?
     - Does it sound like my brand?
     - Are the facts accurate?
     - Is it clear and well-written?

4. **Check Key Elements**
   - **Title:** Is it compelling and clear?
   - **Introduction:** Does it hook the reader?
   - **Main Content:** Is it comprehensive and useful?
   - **Examples:** Are they relevant to my business?
   - **Conclusion:** Does it drive the right action?
   - **CTA:** Is the call-to-action appropriate?

5. **Review SEO Elements (Optional)**
   - Scroll to **"SEO Metadata"** section
   - **Meta Description:** Will it attract clicks?
   - **Target Keyword:** Used naturally throughout?
   - **Headings:** Clear and descriptive?

6. **Approve the Post**
   - If everything looks good:
   - Click **"Approve"** button (green)
   - Optionally add comment: "Looks great, approved!"
   - Click **"Confirm Approval"**

7. **Post Status Updates**
   - Status changes to **"Approved"**
   - Your agency receives notification
   - Post moves to publishing queue

**✅ Success!** Post approved and ready for publishing.

**What happens next:** Your agency will publish the post to your website according to your schedule.

---

### Tutorial 9: Request Changes

**Goal:** Ask your agency to revise content that needs improvements.

**Time:** 5 minutes

**Steps:**

1. **Open the Post**
   - Go to **"Posts"**
   - Click on post needing changes

2. **Read and Identify Issues**
   - Read the content carefully
   - Note specific problems:
     - Factual errors
     - Tone doesn't match brand
     - Missing important points
     - Wrong examples or terminology

3. **Click "Request Changes"**
   - Click **"Request Changes"** button (yellow/orange)
   - Comment box appears

4. **Write Clear Feedback**
   - **Be specific!** Don't say "fix this", say exactly what needs changing.

   **❌ Bad Feedback:**
   > "This doesn't sound right. Please fix."

   **✅ Good Feedback:**
   > "In section 2, please change 'software' to 'platform' (we always use 'platform'). Also, the example in paragraph 4 mentions Company X, but please use Company Y instead—they're a better fit for our target audience. Finally, the CTA should link to our demo page, not the pricing page."

5. **Submit Your Feedback**
   - Review your comment
   - Make sure it's clear and specific
   - Click **"Submit"**

6. **Track the Request**
   - Post status changes to **"Changes Requested"**
   - Orange badge appears on post card
   - Your agency receives immediate notification

7. **Wait for Updated Version**
   - Your agency will make the changes
   - You'll receive email notification when done
   - Post returns to **"Ready for Review"**

8. **Review the Changes**
   - When notified, open the post again
   - Review the updated content
   - Check that your requested changes were made
   - Either:
     - **Approve** if changes look good
     - **Request additional changes** if needed

**✅ Success!** Your feedback has been sent to the agency.

**Pro Tip:** Be specific and constructive. The clearer your feedback, the faster you'll get content that matches your expectations.

---

## Tips for Success

### For Vendors

1. **Complete Brand Guides Early**
   - Spend 30 minutes filling out client brand guide thoroughly
   - This saves hours of revision later
   - Update brand guide based on client feedback

2. **Batch Your Work**
   - Review 3-5 posts in one sitting
   - Generate all drafts at once
   - Send multiple posts to client together

3. **Set Client Expectations**
   - Explain review process upfront
   - Define typical turnaround times
   - Show them Tutorial 8 and 9

4. **Use Templates**
   - Create reusable templates for common post types
   - Save successful outlines
   - Document what works

5. **Monitor AI Quality**
   - Track SEO quality scores over time
   - Identify patterns in AI output
   - Refine brand guides based on results

### For Clients

1. **Block Review Time**
   - Schedule 30-60 min weekly for content review
   - Don't let posts pile up
   - Faster review = faster results

2. **Be Specific with Feedback**
   - Point out exact sentences/paragraphs
   - Explain why something should change
   - Give examples of what you prefer

3. **Trust the SEO Expertise**
   - Your agency knows search optimization
   - Ask questions if you don't understand something
   - Focus on brand voice and accuracy

4. **Track Your Progress**
   - Watch SEO score improve over time
   - Celebrate wins (traffic increases, ranking improvements)
   - Share success with your team

5. **Communicate Openly**
   - Tell your agency what's working
   - Share concerns early
   - Build a collaborative partnership

---

## Getting Help

### Stuck on a Tutorial?

**For Vendors:**
- Check the [Vendor Guide](./VENDOR_GUIDE.md) for detailed feature documentation
- Review [AI Configuration Guide](./AI_CONFIGURATION_GUIDE.md) for AI-related questions
- Email: support@blogcanvas.io

**For Clients:**
- Check the [Client Guide](./CLIENT_GUIDE.md) for detailed instructions
- Contact your content agency first
- Email BlogCanvas support: support@blogcanvas.io (for technical issues only)

### Video Tutorials (Coming Soon)

We're working on screen-recorded versions of these tutorials. Subscribe to our YouTube channel or check back soon!

---

## What's Next?

**Completed all tutorials?** Great! Now you're ready to use BlogCanvas efficiently.

**Next steps:**
- Review the full user guides for advanced features
- Explore analytics and reporting
- Set up integrations (Gmail, GA4, webhooks)
- Optimize your workflow with keyboard shortcuts

**Happy content creating! 🚀**
