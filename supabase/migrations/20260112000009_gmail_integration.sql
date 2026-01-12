-- Gmail Integration Tables
-- Part of Epic 8: Gmail Integration (feat-024)

-- Gmail connections table to store OAuth tokens
CREATE TABLE IF NOT EXISTS gmail_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  gmail_address TEXT NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, gmail_address)
);

-- Email threads synced from Gmail
CREATE TABLE IF NOT EXISTS email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_connection_id UUID REFERENCES gmail_connections(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES content_batches(id) ON DELETE SET NULL,
  gmail_thread_id TEXT NOT NULL,
  subject TEXT,
  snippet TEXT,
  last_message_at TIMESTAMPTZ,
  message_count INT DEFAULT 0,
  is_read BOOLEAN DEFAULT TRUE,
  labels TEXT[],
  participants TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gmail_connection_id, gmail_thread_id)
);

-- Individual email messages in threads
CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_thread_id UUID REFERENCES email_threads(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_addresses TEXT[],
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  sent_at TIMESTAMPTZ NOT NULL,
  is_draft BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email_thread_id, gmail_message_id)
);

-- Email attachments
CREATE TABLE IF NOT EXISTS email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,
  gmail_attachment_id TEXT,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INT,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gmail_connections_user_id ON gmail_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_connections_vendor_id ON gmail_connections(vendor_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_gmail_connection_id ON email_threads(gmail_connection_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_client_id ON email_threads(client_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_project_id ON email_threads(project_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_last_message_at ON email_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_messages_thread_id ON email_messages(email_thread_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_sent_at ON email_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_attachments_message_id ON email_attachments(email_message_id);

-- Enable RLS
ALTER TABLE gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gmail_connections
CREATE POLICY "Users can view their own Gmail connections"
  ON gmail_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Gmail connections"
  ON gmail_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Gmail connections"
  ON gmail_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Gmail connections"
  ON gmail_connections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for email_threads
CREATE POLICY "Users can view email threads from their connections"
  ON email_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gmail_connections
      WHERE gmail_connections.id = email_threads.gmail_connection_id
      AND gmail_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert email threads to their connections"
  ON email_threads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gmail_connections
      WHERE gmail_connections.id = email_threads.gmail_connection_id
      AND gmail_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update email threads from their connections"
  ON email_threads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM gmail_connections
      WHERE gmail_connections.id = email_threads.gmail_connection_id
      AND gmail_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete email threads from their connections"
  ON email_threads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM gmail_connections
      WHERE gmail_connections.id = email_threads.gmail_connection_id
      AND gmail_connections.user_id = auth.uid()
    )
  );

-- RLS Policies for email_messages
CREATE POLICY "Users can view messages from their email threads"
  ON email_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM email_threads
      JOIN gmail_connections ON gmail_connections.id = email_threads.gmail_connection_id
      WHERE email_threads.id = email_messages.email_thread_id
      AND gmail_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their email threads"
  ON email_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_threads
      JOIN gmail_connections ON gmail_connections.id = email_threads.gmail_connection_id
      WHERE email_threads.id = email_messages.email_thread_id
      AND gmail_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their email threads"
  ON email_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM email_threads
      JOIN gmail_connections ON gmail_connections.id = email_threads.gmail_connection_id
      WHERE email_threads.id = email_messages.email_thread_id
      AND gmail_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their email threads"
  ON email_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM email_threads
      JOIN gmail_connections ON gmail_connections.id = email_threads.gmail_connection_id
      WHERE email_threads.id = email_messages.email_thread_id
      AND gmail_connections.user_id = auth.uid()
    )
  );

-- RLS Policies for email_attachments
CREATE POLICY "Users can view attachments from their email messages"
  ON email_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM email_messages
      JOIN email_threads ON email_threads.id = email_messages.email_thread_id
      JOIN gmail_connections ON gmail_connections.id = email_threads.gmail_connection_id
      WHERE email_messages.id = email_attachments.email_message_id
      AND gmail_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments to their email messages"
  ON email_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_messages
      JOIN email_threads ON email_threads.id = email_messages.email_thread_id
      JOIN gmail_connections ON gmail_connections.id = email_threads.gmail_connection_id
      WHERE email_messages.id = email_attachments.email_message_id
      AND gmail_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments from their email messages"
  ON email_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM email_messages
      JOIN email_threads ON email_threads.id = email_messages.email_thread_id
      JOIN gmail_connections ON gmail_connections.id = email_threads.gmail_connection_id
      WHERE email_messages.id = email_attachments.email_message_id
      AND gmail_connections.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_gmail_connections_updated_at
  BEFORE UPDATE ON gmail_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_threads_updated_at
  BEFORE UPDATE ON email_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
