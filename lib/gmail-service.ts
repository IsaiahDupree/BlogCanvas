import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GmailConnection {
  id: string;
  user_id: string;
  vendor_id: string;
  gmail_address: string;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  sync_enabled: boolean;
}

interface EmailThread {
  gmail_thread_id: string;
  subject: string | null;
  snippet: string | null;
  last_message_at: Date;
  message_count: number;
  labels: string[];
  participants: string[];
}

interface EmailMessage {
  gmail_message_id: string;
  from_address: string;
  to_addresses: string[];
  cc_addresses?: string[];
  bcc_addresses?: string[];
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  sent_at: Date;
  is_draft: boolean;
}

export class GmailService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4848/api/gmail/callback'
    );
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Pass userId in state to link back after OAuth
      prompt: 'consent', // Force consent screen to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Save Gmail connection to database
   */
  async saveConnection(
    userId: string,
    vendorId: string,
    gmailAddress: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date
  ) {
    // In production, you should encrypt these tokens
    const { data, error } = await supabase
      .from('gmail_connections')
      .upsert({
        user_id: userId,
        vendor_id: vendorId,
        gmail_address: gmailAddress,
        access_token_encrypted: accessToken, // TODO: Encrypt in production
        refresh_token_encrypted: refreshToken, // TODO: Encrypt in production
        token_expires_at: expiresAt.toISOString(),
        sync_enabled: true,
        last_sync_at: null,
      }, {
        onConflict: 'user_id,gmail_address'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save Gmail connection: ${error.message}`);
    }

    return data;
  }

  /**
   * Get Gmail connection for a user
   */
  async getConnection(userId: string): Promise<GmailConnection | null> {
    const { data, error } = await supabase
      .from('gmail_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('sync_enabled', true)
      .single();

    if (error) {
      return null;
    }

    return data as GmailConnection;
  }

  /**
   * Refresh access token if expired
   */
  async refreshAccessToken(connection: GmailConnection) {
    if (!connection.refresh_token_encrypted) {
      throw new Error('No refresh token available');
    }

    this.oauth2Client.setCredentials({
      refresh_token: connection.refresh_token_encrypted,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    // Update tokens in database
    await supabase
      .from('gmail_connections')
      .update({
        access_token_encrypted: credentials.access_token,
        token_expires_at: credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : null,
      })
      .eq('id', connection.id);

    return credentials.access_token!;
  }

  /**
   * Get Gmail API client for a user
   */
  async getGmailClient(userId: string) {
    const connection = await this.getConnection(userId);
    if (!connection) {
      throw new Error('No Gmail connection found');
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = connection.token_expires_at
      ? new Date(connection.token_expires_at)
      : null;

    let accessToken = connection.access_token_encrypted;

    if (expiresAt && now >= expiresAt) {
      // Token expired, refresh it
      accessToken = await this.refreshAccessToken(connection);
    }

    this.oauth2Client.setCredentials({
      access_token: accessToken!,
      refresh_token: connection.refresh_token_encrypted!,
    });

    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Sync email threads from Gmail
   */
  async syncThreads(userId: string, maxResults = 50): Promise<number> {
    const gmail = await this.getGmailClient(userId);
    const connection = await this.getConnection(userId);

    if (!connection) {
      throw new Error('No Gmail connection found');
    }

    // Get list of threads
    const response = await gmail.users.threads.list({
      userId: 'me',
      maxResults,
    });

    const threads = response.data.threads || [];
    let syncedCount = 0;

    for (const thread of threads) {
      if (!thread.id) continue;

      // Get full thread details
      const threadDetails = await gmail.users.threads.get({
        userId: 'me',
        id: thread.id,
        format: 'full',
      });

      const messages = threadDetails.data.messages || [];
      if (messages.length === 0) continue;

      // Parse thread data
      const firstMessage = messages[0];
      const lastMessage = messages[messages.length - 1];

      const subject = this.getHeader(firstMessage.payload?.headers, 'Subject');
      const snippet = threadDetails.data.snippet || null;

      const participants = new Set<string>();
      messages.forEach(msg => {
        const from = this.getHeader(msg.payload?.headers, 'From');
        const to = this.getHeader(msg.payload?.headers, 'To');
        if (from) participants.add(from);
        if (to) to.split(',').forEach(addr => participants.add(addr.trim()));
      });

      const lastMessageDate = lastMessage.internalDate
        ? new Date(parseInt(lastMessage.internalDate))
        : new Date();

      // Save thread to database
      const { data: savedThread, error: threadError } = await supabase
        .from('email_threads')
        .upsert({
          gmail_connection_id: connection.id,
          gmail_thread_id: thread.id,
          subject,
          snippet,
          last_message_at: lastMessageDate.toISOString(),
          message_count: messages.length,
          labels: threadDetails.data.labelIds || [],
          participants: Array.from(participants),
        }, {
          onConflict: 'gmail_connection_id,gmail_thread_id'
        })
        .select()
        .single();

      if (threadError) {
        console.error('Error saving thread:', threadError);
        continue;
      }

      // Save individual messages
      for (const message of messages) {
        if (!message.id || !savedThread) continue;

        const fromAddress = this.getHeader(message.payload?.headers, 'From') || '';
        const toHeader = this.getHeader(message.payload?.headers, 'To') || '';
        const ccHeader = this.getHeader(message.payload?.headers, 'Cc');
        const bccHeader = this.getHeader(message.payload?.headers, 'Bcc');
        const messageSubject = this.getHeader(message.payload?.headers, 'Subject');

        const bodyText = this.getMessageBody(message.payload, 'text/plain');
        const bodyHtml = this.getMessageBody(message.payload, 'text/html');

        const sentAt = message.internalDate
          ? new Date(parseInt(message.internalDate))
          : new Date();

        await supabase
          .from('email_messages')
          .upsert({
            email_thread_id: savedThread.id,
            gmail_message_id: message.id,
            from_address: fromAddress,
            to_addresses: toHeader.split(',').map(s => s.trim()),
            cc_addresses: ccHeader ? ccHeader.split(',').map(s => s.trim()) : [],
            bcc_addresses: bccHeader ? bccHeader.split(',').map(s => s.trim()) : [],
            subject: messageSubject,
            body_text: bodyText,
            body_html: bodyHtml,
            sent_at: sentAt.toISOString(),
            is_draft: false,
          }, {
            onConflict: 'email_thread_id,gmail_message_id'
          });
      }

      syncedCount++;
    }

    // Update last sync time
    await supabase
      .from('gmail_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection.id);

    return syncedCount;
  }

  /**
   * Send an email via Gmail
   */
  async sendEmail(
    userId: string,
    to: string[],
    subject: string,
    body: string,
    cc?: string[],
    bcc?: string[]
  ) {
    const gmail = await this.getGmailClient(userId);

    const message = [
      `To: ${to.join(', ')}`,
      cc ? `Cc: ${cc.join(', ')}` : '',
      bcc ? `Bcc: ${bcc.join(', ')}` : '',
      `Subject: ${subject}`,
      '',
      body,
    ].filter(line => line).join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return response.data;
  }

  /**
   * Link email thread to a client
   */
  async linkThreadToClient(threadId: string, clientId: string) {
    const { error } = await supabase
      .from('email_threads')
      .update({ client_id: clientId })
      .eq('id', threadId);

    if (error) {
      throw new Error(`Failed to link thread to client: ${error.message}`);
    }
  }

  /**
   * Link email thread to a project (content batch)
   */
  async linkThreadToProject(threadId: string, projectId: string) {
    const { error } = await supabase
      .from('email_threads')
      .update({ project_id: projectId })
      .eq('id', threadId);

    if (error) {
      throw new Error(`Failed to link thread to project: ${error.message}`);
    }
  }

  /**
   * Get email threads for a user
   */
  async getThreads(userId: string, limit = 50) {
    const connection = await this.getConnection(userId);
    if (!connection) {
      return [];
    }

    const { data, error } = await supabase
      .from('email_threads')
      .select(`
        *,
        client:clients(id, name),
        project:content_batches(id, name)
      `)
      .eq('gmail_connection_id', connection.id)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching threads:', error);
      return [];
    }

    return data;
  }

  /**
   * Get messages for a thread
   */
  async getThreadMessages(threadId: string) {
    const { data, error } = await supabase
      .from('email_messages')
      .select('*')
      .eq('email_thread_id', threadId)
      .order('sent_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data;
  }

  // Helper methods

  private getHeader(headers: any[] | undefined, name: string): string {
    if (!headers) return '';
    const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
    return header?.value || '';
  }

  private getMessageBody(payload: any, mimeType: string): string | null {
    if (!payload) return null;

    // Check if this part matches the mime type
    if (payload.mimeType === mimeType && payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    // Check nested parts
    if (payload.parts) {
      for (const part of payload.parts) {
        const body = this.getMessageBody(part, mimeType);
        if (body) return body;
      }
    }

    return null;
  }
}

export const gmailService = new GmailService();
