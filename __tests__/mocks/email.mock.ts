/**
 * Email Service Mock (Resend)
 *
 * Mocks email sending for testing
 */

export interface MockEmailData {
  id: string;
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  created_at: string;
}

export const mockEmailResponse: MockEmailData = {
  id: 'email_test123',
  from: 'noreply@blogcanvas.com',
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<p>Test email content</p>',
  created_at: new Date().toISOString()
};

export const createMockResend = () => ({
  emails: {
    send: jest.fn().mockResolvedValue({
      id: mockEmailResponse.id,
      from: mockEmailResponse.from,
      to: mockEmailResponse.to,
      created_at: mockEmailResponse.created_at
    }),
    get: jest.fn().mockResolvedValue(mockEmailResponse),
    list: jest.fn().mockResolvedValue({
      data: [mockEmailResponse],
      count: 1
    })
  }
});

export const mockResendError = (message: string) => ({
  emails: {
    send: jest.fn().mockRejectedValue(new Error(message))
  }
});

// Mock email templates
export const mockWelcomeEmail = {
  from: 'noreply@blogcanvas.com',
  to: 'user@example.com',
  subject: 'Welcome to BlogCanvas',
  html: '<h1>Welcome!</h1><p>Thanks for signing up.</p>'
};

export const mockPasswordResetEmail = {
  from: 'noreply@blogcanvas.com',
  to: 'user@example.com',
  subject: 'Reset Your Password',
  html: '<h1>Password Reset</h1><p>Click here to reset your password.</p>'
};

export const mockBlogPostApprovalEmail = {
  from: 'noreply@blogcanvas.com',
  to: 'client@example.com',
  subject: 'New Blog Post Ready for Review',
  html: '<h1>Review Required</h1><p>A new blog post is ready for your review.</p>'
};

// Track sent emails for testing
export class MockEmailTracker {
  private sentEmails: MockEmailData[] = [];

  send(emailData: Partial<MockEmailData>): MockEmailData {
    const email: MockEmailData = {
      id: `email_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      from: emailData.from || 'noreply@blogcanvas.com',
      to: emailData.to || 'test@example.com',
      subject: emailData.subject || 'Test Email',
      html: emailData.html,
      text: emailData.text,
      created_at: new Date().toISOString()
    };

    this.sentEmails.push(email);
    return email;
  }

  getSentEmails(): MockEmailData[] {
    return this.sentEmails;
  }

  getEmailsByRecipient(recipient: string): MockEmailData[] {
    return this.sentEmails.filter(email => {
      if (Array.isArray(email.to)) {
        return email.to.includes(recipient);
      }
      return email.to === recipient;
    });
  }

  getEmailsBySubject(subject: string): MockEmailData[] {
    return this.sentEmails.filter(email => email.subject.includes(subject));
  }

  clear(): void {
    this.sentEmails = [];
  }

  count(): number {
    return this.sentEmails.length;
  }
}
