/**
 * Centralized help content for tooltips throughout the application
 * This file contains all contextual help text used in HelpTooltip components
 */

import React from "react"

export const helpContent = {
  // Client Management
  clients: {
    companyName: "The official name of your client's company. This appears on all reports and communications.",
    brandVoice: "Describe how content should sound. Examples: 'Professional but approachable', 'Casual and friendly', 'Technical and authoritative'.",
    targetAudience: "Who is this content for? Be specific: 'Marketing directors at B2B SaaS companies with 50-500 employees'.",
    industry: "The client's primary industry or niche. This helps AI understand context and terminology.",
    inviteClient: "Send an email invitation allowing the client to access their portal to review and approve content.",
  },

  // Website & SEO
  websites: {
    url: "The full website URL (e.g., https://example.com). Include https:// for proper crawling.",
    runAudit: (
      <div>
        Crawls the website and analyzes:
        <ul className="list-disc ml-4 mt-1 space-y-0.5">
          <li>Current SEO score (0-100)</li>
          <li>Pages indexed</li>
          <li>Topic coverage gaps</li>
          <li>Keyword opportunities</li>
        </ul>
        <p className="mt-1 text-xs">Takes 2-5 minutes to complete.</p>
      </div>
    ),
    seoScore: (
      <div>
        <p className="font-semibold mb-1">SEO Score (0-100):</p>
        <ul className="space-y-1 text-xs">
          <li>0-40: Needs significant improvement</li>
          <li>41-60: Fair, with room for growth</li>
          <li>61-80: Good, competitive</li>
          <li>81-100: Excellent, industry-leading</li>
        </ul>
      </div>
    ),
    topicCluster: "A group of related keywords and topics. Creating content for entire clusters improves SEO more than targeting individual keywords.",
    estimatedTraffic: "Potential monthly visitors if you rank well for this topic cluster. Based on search volume data.",
    difficulty: (
      <div>
        <p className="mb-1">How hard it is to rank for this topic:</p>
        <ul className="space-y-1 text-xs">
          <li><strong>Easy:</strong> Low competition, achievable with quality content</li>
          <li><strong>Medium:</strong> Moderate competition, requires solid SEO</li>
          <li><strong>Hard:</strong> High competition, needs exceptional content + links</li>
        </ul>
      </div>
    ),
    covered: "Whether your client already has content covering this topic cluster or if it's a new opportunity.",
  },

  // Content Batches
  batches: {
    batchName: "A descriptive name for this content campaign (e.g., 'Q1 2026 SEO Push', 'Product Launch Content').",
    goalScore: (
      <div>
        <p className="mb-1">Target SEO score improvement for this batch:</p>
        <p className="text-xs">Example: If current score is 42 and target is 65, this batch aims to increase by 23 points.</p>
      </div>
    ),
    dateRange: "The timeframe for creating and publishing this batch. Helps with planning and scheduling.",
    autoGenerate: "Automatically create blog post records for all uncovered topic clusters. Each cluster becomes a post.",
    importCSV: (
      <div>
        <p className="mb-1">Import multiple blog topics from a CSV file.</p>
        <p className="text-xs">Required columns:</p>
        <ul className="list-disc ml-4 mt-1 space-y-0.5 text-xs">
          <li><strong>topic</strong> or <strong>title</strong> (required)</li>
          <li><strong>keywords</strong> (optional)</li>
          <li><strong>target_audience</strong> (optional)</li>
          <li><strong>template</strong> (optional)</li>
        </ul>
      </div>
    ),
    generateAll: "Queue all posts in this batch for AI generation. The 5-agent pipeline will process each post sequentially.",
  },

  // AI Pipeline
  ai: {
    pipeline: (
      <div>
        <p className="mb-1 font-semibold">5-Agent AI Pipeline:</p>
        <ol className="list-decimal ml-4 space-y-1 text-xs">
          <li><strong>Outline Agent:</strong> Structure (H2/H3, FAQs)</li>
          <li><strong>Drafting Agent:</strong> Full content</li>
          <li><strong>SEO Agent:</strong> Optimization</li>
          <li><strong>Fact-Check Agent:</strong> Accuracy review</li>
          <li><strong>Enhancement Agent:</strong> Readability improvements</li>
        </ol>
        <p className="mt-1 text-xs">Takes ~2-3 minutes per post.</p>
      </div>
    ),
    generateDraft: "Runs the AI pipeline to create a complete blog post. Starts with outline and progresses through all 5 agents.",
    wordCount: "Target word count for this post. Longer posts (1500-2500 words) typically rank better but take more time to create.",
    targetKeyword: "The primary keyword you want this post to rank for. Use keyword research tools to find high-value keywords.",
    seoQualityScore: (
      <div>
        <p className="mb-1">AI-calculated SEO quality (0-100):</p>
        <ul className="space-y-1 text-xs">
          <li>Keyword usage and density</li>
          <li>Heading structure (H2/H3)</li>
          <li>Meta description quality</li>
          <li>Content comprehensiveness</li>
          <li>Readability score</li>
        </ul>
      </div>
    ),
    revisionHistory: "View all changes made to this post by AI agents and human editors. Compare any two versions side-by-side.",
    restoreVersion: "Roll back to a previous version of this post. The current version will be saved as a backup before restoring.",
  },

  // Review Workflow
  review: {
    kanban: "Drag and drop posts between workflow stages. Status updates automatically and triggers notifications.",
    editorReview: "Post needs internal QA before sending to client. Check accuracy, brand voice, and SEO optimization.",
    readyForClient: "Post has passed internal review and is ready for client approval. Moving here triggers client notification.",
    clientReview: "Client is actively reviewing this post. They can approve or request changes.",
    changesRequested: "Client asked for revisions. Review their feedback and make necessary edits.",
    approved: "Client approved this post. It's ready for publishing.",
    qualityChecklist: (
      <div>
        <p className="mb-1 font-semibold">Review Checklist:</p>
        <ul className="list-disc ml-4 space-y-0.5 text-xs">
          <li>Brand voice matches client guidelines</li>
          <li>Target keyword used naturally (not stuffed)</li>
          <li>All facts are accurate and sourced</li>
          <li>Headings are descriptive and SEO-friendly</li>
          <li>Meta description is compelling (155 chars)</li>
          <li>Internal links are relevant</li>
          <li>No grammar or spelling errors</li>
        </ul>
      </div>
    ),
  },

  // Publishing
  publishing: {
    cmsConnection: "Connect to WordPress, Webflow, or other CMS to enable one-click publishing.",
    applicationPassword: (
      <div>
        <p className="mb-1">WordPress Application Password setup:</p>
        <ol className="list-decimal ml-4 space-y-1 text-xs">
          <li>In WordPress admin, go to Users → Profile</li>
          <li>Scroll to "Application Passwords"</li>
          <li>Enter name: "BlogCanvas"</li>
          <li>Click "Add New Application Password"</li>
          <li>Copy the generated password (shown once)</li>
          <li>Paste here and save</li>
        </ol>
      </div>
    ),
    publishNow: "Immediately publish this post to the client's website. Content will be live within seconds.",
    schedulePublish: "Set a future date and time for this post to go live. Useful for maintaining a consistent publishing cadence.",
    publishStatus: (
      <div>
        <p className="mb-1">Publishing statuses:</p>
        <ul className="space-y-1 text-xs">
          <li><strong>Published:</strong> Live on website</li>
          <li><strong>Scheduled:</strong> Will publish on future date</li>
          <li><strong>Failed:</strong> Publishing error (click for details)</li>
          <li><strong>Publishing:</strong> In progress</li>
        </ul>
      </div>
    ),
  },

  // Analytics & Reporting
  analytics: {
    impressions: "How many times your content appeared in search results. Higher is better, but clicks matter more.",
    clicks: "Number of visitors from search results. This is real traffic to your site.",
    ctr: "Click-Through Rate = (Clicks / Impressions) × 100. Shows how compelling your titles and descriptions are. Good CTR is 2-5%.",
    position: "Average ranking position in search results (1 = top). Lower numbers are better. Positions 1-10 are first page.",
    checkBacks: (
      <div>
        <p className="mb-1">Automatic metric collection schedule:</p>
        <ul className="list-disc ml-4 space-y-0.5 text-xs">
          <li><strong>Day 7:</strong> Initial performance</li>
          <li><strong>Day 30:</strong> Early growth</li>
          <li><strong>Day 60:</strong> Momentum check</li>
          <li><strong>Day 90:</strong> Quarterly review</li>
        </ul>
        <p className="mt-1 text-xs">Customize intervals in website settings.</p>
      </div>
    ),
    seoProgress: "Track SEO score improvement over time. Steady upward trend indicates successful content strategy.",
    topPosts: "Your best performing content by traffic. Analyze what's working and replicate success.",
  },

  // Reports
  reports: {
    generateReport: "Create a professional client report with SEO progress, traffic metrics, and recommendations.",
    reportFormat: (
      <div>
        <p className="mb-1">Available formats:</p>
        <ul className="list-disc ml-4 space-y-0.5 text-xs">
          <li><strong>PDF:</strong> Downloadable file for sharing</li>
          <li><strong>Email:</strong> Send directly to client inbox</li>
          <li><strong>Slide Deck:</strong> JSON export for presentations</li>
        </ul>
      </div>
    ),
    reportPeriod: "Date range to include in report. Common periods: weekly, monthly, quarterly, annual.",
    scheduledReports: "Automate recurring reports. System generates and sends automatically on schedule.",
  },

  // Brand Guide
  brand: {
    voice: "How your brand speaks. Examples: 'Professional yet approachable', 'Bold and direct', 'Warm and empathetic'.",
    tone: "Emotional quality of your content. Examples: 'Optimistic', 'Serious', 'Playful', 'Authoritative'.",
    dos: "Specific examples of what to do. Example: 'Use "platform" instead of "software"', 'Start with action verbs'.",
    donts: "What to avoid. Example: 'Never use jargon like "synergy"', 'Don't make claims without data'.",
    terminology: "Preferred terms and phrases unique to your brand. Helps AI use correct vocabulary.",
    sampleContent: "Links to your best existing content. AI learns from these examples to match your style.",
  },

  // Settings
  settings: {
    apiKey: "OpenAI API key for AI content generation. Get from platform.openai.com. Treat like a password.",
    twoFactor: "Add an extra security layer requiring a code from your phone when logging in.",
    webhook: "Receive real-time notifications at your endpoint URL when events occur (post published, client approved, etc.).",
    team: "Invite editors and account managers to help manage clients and content. Assign roles and permissions.",
  },

  // Client Portal
  clientPortal: {
    approve: "Give final approval for this post. It will move to publishing queue and may go live soon.",
    requestChanges: "Ask your agency to make specific edits. Be clear about what needs to change and why.",
    comment: "Add feedback or questions. Your agency will see this immediately.",
    bulkApprove: "Approve multiple posts at once. Use only if you've reviewed all posts carefully.",
    notification: "Configure email notifications for posts ready for review, changes completed, and publishing events.",
  },
}

// Helper function to get help content safely
export function getHelpContent(path: string): React.ReactNode {
  const keys = path.split(".")
  let content: any = helpContent

  for (const key of keys) {
    if (content && typeof content === "object" && key in content) {
      content = content[key]
    } else {
      return "Help information not available."
    }
  }

  return content
}
