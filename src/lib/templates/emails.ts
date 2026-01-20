/**
 * Email Templates Library
 * Pre-built email templates for common vendor communications
 */

export interface EmailTemplateVariable {
  name: string
  description: string
  example: string
}

export interface EmailTemplate {
  id: string
  name: string
  description: string
  category: string
  subject: string
  body: string
  variables: EmailTemplateVariable[]
}

// ============================================================================
// WELCOME & ONBOARDING EMAILS
// ============================================================================

export const welcomeClientEmail: EmailTemplate = {
  id: 'welcome-client',
  name: 'Welcome New Client',
  description: 'First email sent after a client makes a purchase',
  category: 'onboarding',
  subject: 'Welcome to {{vendorName}}! Here\'s what happens next',
  body: `Hi {{clientName}},

Welcome aboard! I'm so excited to work with you on {{projectType}}.

Here's what happens next:

1. **Check Your Email** - You should have received login credentials to access your client portal. If you don't see it, check your spam folder.

2. **Complete Onboarding** - Log into the portal and fill out the onboarding checklist. This helps me understand your business and goals so I can deliver exactly what you need.

3. **Schedule Your Kickoff Call** - Once onboarding is complete, we'll schedule a quick call to align on everything before I get started.

**Timeline:**
- Onboarding: Complete by {{onboardingDeadline}}
- Kickoff call: {{kickoffDate}}
- Delivery: {{deliveryDate}}

If you have any questions, just hit reply!

Looking forward to working together,
{{vendorName}}`,
  variables: [
    { name: 'clientName', description: 'Client\'s first name', example: 'Sarah' },
    { name: 'vendorName', description: 'Your name or business name', example: 'John Smith' },
    { name: 'projectType', description: 'What they purchased', example: 'your SEO audit' },
    { name: 'onboardingDeadline', description: 'When onboarding should be done', example: 'Friday' },
    { name: 'kickoffDate', description: 'Scheduled kickoff call date', example: 'next Monday' },
    { name: 'deliveryDate', description: 'Expected delivery date', example: 'two weeks from today' }
  ]
};

export const onboardingReminderEmail: EmailTemplate = {
  id: 'onboarding-reminder',
  name: 'Onboarding Reminder',
  description: 'Gentle reminder to complete onboarding steps',
  category: 'onboarding',
  subject: 'Quick reminder: Complete your onboarding to get started',
  body: `Hi {{clientName}},

Just a friendly reminder that we're ready to kick off your project, but I'm still waiting on a few pieces from you.

**What's pending:**
{{pendingItems}}

This should only take about {{estimatedMinutes}} minutes to complete.

Once these are done, we can move forward with {{nextStep}}.

Need help with anything? Just reply to this email.

Thanks!
{{vendorName}}`,
  variables: [
    { name: 'clientName', description: 'Client\'s first name', example: 'Sarah' },
    { name: 'vendorName', description: 'Your name', example: 'John' },
    { name: 'pendingItems', description: 'List of incomplete items', example: '- Brand questionnaire\n- Google Analytics access' },
    { name: 'estimatedMinutes', description: 'Time to complete', example: '15' },
    { name: 'nextStep', description: 'What happens after completion', example: 'scheduling your kickoff call' }
  ]
};

// ============================================================================
// PROJECT STATUS EMAILS
// ============================================================================

export const projectStartedEmail: EmailTemplate = {
  id: 'project-started',
  name: 'Project Started',
  description: 'Notify client that work has begun',
  category: 'project-updates',
  subject: 'Good news - I\'ve started working on {{projectName}}',
  body: `Hi {{clientName}},

Great news! I've started working on {{projectName}}.

**What I'm working on this week:**
{{currentTasks}}

**Expected delivery:**
{{deliveryDate}}

You can track progress anytime in your client portal. I'll send you updates along the way, but feel free to reach out if you have questions.

Talk soon,
{{vendorName}}`,
  variables: [
    { name: 'clientName', description: 'Client\'s first name', example: 'Sarah' },
    { name: 'vendorName', description: 'Your name', example: 'John' },
    { name: 'projectName', description: 'Project name', example: 'your SEO audit' },
    { name: 'currentTasks', description: 'What you\'re working on', example: '- Technical SEO analysis\n- Keyword research\n- Competitor comparison' },
    { name: 'deliveryDate', description: 'When they\'ll get it', example: 'Friday, Jan 27' }
  ]
};

export const deliveryEmail: EmailTemplate = {
  id: 'delivery-ready',
  name: 'Delivery Ready',
  description: 'Notify client that their deliverable is ready',
  category: 'project-updates',
  subject: '✅ {{projectName}} is ready for your review',
  body: `Hi {{clientName}},

Your {{projectName}} is complete and ready for review!

**What's included:**
{{deliverablesList}}

**Next steps:**
1. Log into your portal: {{portalLink}}
2. Review the deliverable
3. Leave feedback or request changes if needed

You have {{revisionCount}} rounds of revisions included, so don't hesitate to ask for adjustments.

Let me know what you think!

{{vendorName}}`,
  variables: [
    { name: 'clientName', description: 'Client\'s first name', example: 'Sarah' },
    { name: 'vendorName', description: 'Your name', example: 'John' },
    { name: 'projectName', description: 'Project name', example: 'SEO audit' },
    { name: 'deliverablesList', description: 'What they received', example: '- Full audit report (PDF)\n- Video walkthrough\n- Action plan checklist' },
    { name: 'portalLink', description: 'Link to portal', example: 'https://yoursite.com/portal/abc123' },
    { name: 'revisionCount', description: 'Number of revisions', example: '2' }
  ]
};

// ============================================================================
// FEEDBACK & APPROVAL EMAILS
// ============================================================================

export const revisionRequestEmail: EmailTemplate = {
  id: 'revision-request',
  name: 'Revision Request Received',
  description: 'Confirm receipt of revision request',
  category: 'feedback',
  subject: 'Got your feedback on {{projectName}}',
  body: `Hi {{clientName}},

Thanks for the feedback on {{projectName}}!

I've noted your requests:
{{revisionSummary}}

**Timeline:**
I'll have the revised version ready by {{revisionDeadline}}.

If anything else comes to mind in the meantime, just let me know.

Thanks!
{{vendorName}}`,
  variables: [
    { name: 'clientName', description: 'Client\'s first name', example: 'Sarah' },
    { name: 'vendorName', description: 'Your name', example: 'John' },
    { name: 'projectName', description: 'Project name', example: 'blog post' },
    { name: 'revisionSummary', description: 'Summary of requested changes', example: '- Expand section on pricing\n- Add more examples\n- Update CTA wording' },
    { name: 'revisionDeadline', description: 'When revisions will be done', example: 'Wednesday' }
  ]
};

export const approvalReceivedEmail: EmailTemplate = {
  id: 'approval-received',
  name: 'Approval Received',
  description: 'Thank client for approval and outline next steps',
  category: 'feedback',
  subject: '🎉 Thanks for approving {{projectName}}!',
  body: `Hi {{clientName}},

Awesome! Glad you're happy with {{projectName}}.

**What's next:**
{{nextSteps}}

If you need anything else, you know where to find me.

Appreciate working with you!
{{vendorName}}

P.S. If you have a minute, I'd love a testimonial about your experience. It helps more than you know!`,
  variables: [
    { name: 'clientName', description: 'Client\'s first name', example: 'Sarah' },
    { name: 'vendorName', description: 'Your name', example: 'John' },
    { name: 'projectName', description: 'What was approved', example: 'the blog post' },
    { name: 'nextSteps', description: 'What happens now', example: 'I\'ll publish this to your website within 24 hours.' }
  ]
};

// ============================================================================
// PAYMENT & BILLING EMAILS
// ============================================================================

export const invoiceDueEmail: EmailTemplate = {
  id: 'invoice-due',
  name: 'Invoice Due Reminder',
  description: 'Reminder about upcoming invoice',
  category: 'billing',
  subject: 'Invoice #{{invoiceNumber}} is due {{dueDate}}',
  body: `Hi {{clientName}},

Just a friendly reminder that invoice #{{invoiceNumber}} for ${{amount}} is due on {{dueDate}}.

**Invoice details:**
- Amount: ${{amount}}
- Due date: {{dueDate}}
- Payment link: {{paymentLink}}

If you've already paid, please disregard this message.

Questions about the invoice? Just reply to this email.

Thanks!
{{vendorName}}`,
  variables: [
    { name: 'clientName', description: 'Client\'s first name', example: 'Sarah' },
    { name: 'vendorName', description: 'Your name', example: 'John' },
    { name: 'invoiceNumber', description: 'Invoice number', example: '1234' },
    { name: 'amount', description: 'Invoice amount', example: '500' },
    { name: 'dueDate', description: 'Due date', example: 'January 31, 2026' },
    { name: 'paymentLink', description: 'Payment URL', example: 'https://pay.stripe.com/...' }
  ]
};

export const paymentReceivedEmail: EmailTemplate = {
  id: 'payment-received',
  name: 'Payment Received',
  description: 'Confirm payment receipt',
  category: 'billing',
  subject: 'Payment received - Thank you!',
  body: `Hi {{clientName}},

Thanks for your payment of ${{amount}}!

**Receipt:**
- Amount: ${{amount}}
- Date: {{paymentDate}}
- Invoice: #{{invoiceNumber}}

Your receipt is attached, and you can also view it in your portal: {{portalLink}}

Appreciate your business!
{{vendorName}}`,
  variables: [
    { name: 'clientName', description: 'Client\'s first name', example: 'Sarah' },
    { name: 'vendorName', description: 'Your name', example: 'John' },
    { name: 'amount', description: 'Payment amount', example: '500' },
    { name: 'paymentDate', description: 'Date of payment', example: 'January 25, 2026' },
    { name: 'invoiceNumber', description: 'Invoice number', example: '1234' },
    { name: 'portalLink', description: 'Link to portal', example: 'https://yoursite.com/portal/abc123' }
  ]
};

// ============================================================================
// RELATIONSHIP & RETENTION EMAILS
// ============================================================================

export const checkInEmail: EmailTemplate = {
  id: 'client-check-in',
  name: 'Client Check-In',
  description: 'Proactive check-in to see how things are going',
  category: 'relationship',
  subject: 'Quick check-in - How\'s everything going?',
  body: `Hi {{clientName}},

Just wanted to check in and see how things are going with {{serviceType}}.

**Quick questions:**
- Are you seeing the results you expected?
- Is there anything I can improve or do differently?
- Any new projects or needs coming up?

I want to make sure you're getting the most value from our work together.

If you have a few minutes for a quick call, let me know!

Talk soon,
{{vendorName}}`,
  variables: [
    { name: 'clientName', description: 'Client\'s first name', example: 'Sarah' },
    { name: 'vendorName', description: 'Your name', example: 'John' },
    { name: 'serviceType', description: 'What service they have', example: 'your SEO retainer' }
  ]
};

export const renewalReminderEmail: EmailTemplate = {
  id: 'renewal-reminder',
  name: 'Renewal Reminder',
  description: 'Reminder about upcoming subscription renewal',
  category: 'retention',
  subject: 'Your {{serviceType}} renews on {{renewalDate}}',
  body: `Hi {{clientName}},

Just a heads up that your {{serviceType}} subscription will renew on {{renewalDate}} for ${{amount}}.

**What we've accomplished together:**
{{accomplishments}}

If you want to continue (which I hope you do!), no action needed. Your card will be charged automatically.

Want to make changes or have questions? Just reply to this email.

Thanks for being an awesome client!
{{vendorName}}`,
  variables: [
    { name: 'clientName', description: 'Client\'s first name', example: 'Sarah' },
    { name: 'vendorName', description: 'Your name', example: 'John' },
    { name: 'serviceType', description: 'Type of service', example: 'SEO retainer' },
    { name: 'renewalDate', description: 'Renewal date', example: 'February 1, 2026' },
    { name: 'amount', description: 'Renewal amount', example: '1500' },
    { name: 'accomplishments', description: 'What you achieved', example: '- 45% increase in organic traffic\n- 12 keywords ranking on page 1\n- 20 high-quality blog posts published' }
  ]
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  'welcome-client': welcomeClientEmail,
  'onboarding-reminder': onboardingReminderEmail,
  'project-started': projectStartedEmail,
  'delivery-ready': deliveryEmail,
  'revision-request': revisionRequestEmail,
  'approval-received': approvalReceivedEmail,
  'invoice-due': invoiceDueEmail,
  'payment-received': paymentReceivedEmail,
  'client-check-in': checkInEmail,
  'renewal-reminder': renewalReminderEmail
};

export const EMAIL_TEMPLATE_LIST: EmailTemplate[] = [
  welcomeClientEmail,
  onboardingReminderEmail,
  projectStartedEmail,
  deliveryEmail,
  revisionRequestEmail,
  approvalReceivedEmail,
  invoiceDueEmail,
  paymentReceivedEmail,
  checkInEmail,
  renewalReminderEmail
];

/**
 * Get an email template by ID
 */
export function getEmailTemplateById(templateId: string): EmailTemplate | null {
  return EMAIL_TEMPLATES[templateId] || null;
}

/**
 * Get all email templates
 */
export function getAllEmailTemplates(): EmailTemplate[] {
  return EMAIL_TEMPLATE_LIST;
}

/**
 * Get email templates by category
 */
export function getEmailTemplatesByCategory(category: string): EmailTemplate[] {
  return EMAIL_TEMPLATE_LIST.filter(template => template.category === category);
}

/**
 * Replace variables in email template
 *
 * @param template - Email template
 * @param variables - Key-value pairs of variable replacements
 * @returns Email with variables replaced
 */
export function renderEmailTemplate(
  template: EmailTemplate,
  variables: Record<string, string>
): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;

  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  return { subject, body };
}

/**
 * Get all categories
 */
export function getEmailCategories(): string[] {
  const categories = new Set(EMAIL_TEMPLATE_LIST.map(t => t.category));
  return Array.from(categories);
}
