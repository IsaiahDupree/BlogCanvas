-- Team Tasks Management System
-- Supports task assignment, tracking, and collaboration

-- Task priority levels enum
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Task status enum
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'completed', 'blocked', 'cancelled');

-- Tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Task details
  title text NOT NULL,
  description text,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',

  -- Assignment
  assigned_to uuid,  -- Can be vendor team member or client
  assigned_by uuid,  -- Who created/assigned the task

  -- Relationships
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,

  -- Scheduling
  due_date timestamptz,
  started_at timestamptz,
  completed_at timestamptz,

  -- Tags for categorization
  tags text[],

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Task comments for discussions
CREATE TABLE task_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_type text NOT NULL, -- 'vendor' or 'client'
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Task attachments
CREATE TABLE task_attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_tasks_vendor_id ON tasks(vendor_id);
CREATE INDEX idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tasks table
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to task_comments table
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
-- Vendors can see all tasks for their vendor_id
CREATE POLICY "Vendors can view their tasks"
  ON tasks FOR SELECT
  USING (vendor_id = auth.uid() OR assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Vendors can insert their tasks"
  ON tasks FOR INSERT
  WITH CHECK (vendor_id = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Vendors can update their tasks"
  ON tasks FOR UPDATE
  USING (vendor_id = auth.uid() OR assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Vendors can delete their tasks"
  ON tasks FOR DELETE
  USING (vendor_id = auth.uid());

-- RLS Policies for task_comments
CREATE POLICY "Users can view comments on their tasks"
  ON task_comments FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE vendor_id = auth.uid() OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users can insert comments on their tasks"
  ON task_comments FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks
      WHERE vendor_id = auth.uid() OR assigned_to = auth.uid()
    )
  );

-- RLS Policies for task_attachments
CREATE POLICY "Users can view attachments on their tasks"
  ON task_attachments FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE vendor_id = auth.uid() OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users can upload attachments to their tasks"
  ON task_attachments FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks
      WHERE vendor_id = auth.uid() OR assigned_to = auth.uid()
    )
  );
