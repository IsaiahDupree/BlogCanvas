-- Activity Feed System
-- Tracks all important activities across the platform

-- Activity types enum
CREATE TYPE activity_type AS ENUM (
  'task_created',
  'task_updated',
  'task_completed',
  'task_assigned',
  'comment_added',
  'file_uploaded',
  'blog_post_created',
  'blog_post_published',
  'client_added',
  'workspace_created',
  'meeting_booked',
  'order_received',
  'message_sent'
);

-- Activities table
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Activity details
  type activity_type NOT NULL,
  title text NOT NULL,
  description text,

  -- Actor (who performed the action)
  actor_id uuid,
  actor_name text,
  actor_type text, -- 'vendor', 'client', 'system'

  -- Subject (what was affected)
  subject_id uuid,
  subject_type text, -- 'task', 'blog_post', 'client', etc.

  -- Relationships
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,

  -- Metadata
  metadata jsonb, -- Additional context-specific data
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_activities_vendor_id ON activities(vendor_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_is_read ON activities(is_read);
CREATE INDEX idx_activities_workspace_id ON activities(workspace_id);
CREATE INDEX idx_activities_actor_id ON activities(actor_id);

-- Enable Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Vendors can view their activities"
  ON activities FOR SELECT
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can insert their activities"
  ON activities FOR INSERT
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update their activities"
  ON activities FOR UPDATE
  USING (vendor_id = auth.uid());

-- Function to create activity
CREATE OR REPLACE FUNCTION create_activity(
  p_vendor_id uuid,
  p_type activity_type,
  p_title text,
  p_description text DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL,
  p_actor_name text DEFAULT NULL,
  p_actor_type text DEFAULT 'system',
  p_subject_id uuid DEFAULT NULL,
  p_subject_type text DEFAULT NULL,
  p_workspace_id uuid DEFAULT NULL,
  p_task_id uuid DEFAULT NULL,
  p_blog_post_id uuid DEFAULT NULL,
  p_client_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  activity_id uuid;
BEGIN
  INSERT INTO activities (
    vendor_id,
    type,
    title,
    description,
    actor_id,
    actor_name,
    actor_type,
    subject_id,
    subject_type,
    workspace_id,
    task_id,
    blog_post_id,
    client_id,
    metadata
  ) VALUES (
    p_vendor_id,
    p_type,
    p_title,
    p_description,
    p_actor_id,
    p_actor_name,
    p_actor_type,
    p_subject_id,
    p_subject_type,
    p_workspace_id,
    p_task_id,
    p_blog_post_id,
    p_client_id,
    p_metadata
  )
  RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$;

-- Trigger to auto-create activities for tasks
CREATE OR REPLACE FUNCTION task_activity_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM create_activity(
      NEW.vendor_id,
      'task_created',
      'New task created: ' || NEW.title,
      NEW.description,
      NEW.assigned_by,
      NULL,
      'vendor',
      NEW.id,
      'task',
      NEW.workspace_id,
      NEW.id,
      NEW.blog_post_id,
      NEW.client_id,
      jsonb_build_object('priority', NEW.priority, 'status', NEW.status)
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Task status changed
    IF (OLD.status != NEW.status) THEN
      IF (NEW.status = 'completed') THEN
        PERFORM create_activity(
          NEW.vendor_id,
          'task_completed',
          'Task completed: ' || NEW.title,
          NULL,
          NULL,
          NULL,
          'system',
          NEW.id,
          'task',
          NEW.workspace_id,
          NEW.id,
          NEW.blog_post_id,
          NEW.client_id,
          jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        );
      ELSE
        PERFORM create_activity(
          NEW.vendor_id,
          'task_updated',
          'Task status changed: ' || NEW.title,
          'Status changed from ' || OLD.status || ' to ' || NEW.status,
          NULL,
          NULL,
          'system',
          NEW.id,
          'task',
          NEW.workspace_id,
          NEW.id,
          NEW.blog_post_id,
          NEW.client_id,
          jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        );
      END IF;
    END IF;

    -- Task assignment changed
    IF (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
      PERFORM create_activity(
        NEW.vendor_id,
        'task_assigned',
        'Task assigned: ' || NEW.title,
        NULL,
        NEW.assigned_by,
        NULL,
        'vendor',
        NEW.id,
        'task',
        NEW.workspace_id,
        NEW.id,
        NEW.blog_post_id,
        NEW.client_id,
        jsonb_build_object('assigned_to', NEW.assigned_to)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER task_activity_trigger
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION task_activity_trigger();
