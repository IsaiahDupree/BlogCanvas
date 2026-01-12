-- Migration: Work Declaration System for Client Visibility
-- Feature: feat-016
-- Description: Allows vendors to declare work items and provide transparency to clients

-- ============================================================================
-- TABLE: work_declarations
-- ============================================================================
-- Stores work items declared by vendors for clients with status tracking and progress
CREATE TABLE IF NOT EXISTS work_declarations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content_batch_id UUID REFERENCES content_batches(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Work Item Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('content_batch', 'seo_audit', 'publishing', 'analytics', 'reporting', 'custom')),

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Timeline
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,

  -- Progress Tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  milestones JSONB DEFAULT '[]'::jsonb, -- Array of {title, completed, completed_at}

  -- Deliverables
  deliverables JSONB DEFAULT '[]'::jsonb, -- Array of {name, description, status, url}

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional custom fields
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_work_declarations_vendor ON work_declarations(vendor_id);
CREATE INDEX idx_work_declarations_client ON work_declarations(client_id);
CREATE INDEX idx_work_declarations_batch ON work_declarations(content_batch_id);
CREATE INDEX idx_work_declarations_status ON work_declarations(status);
CREATE INDEX idx_work_declarations_type ON work_declarations(type);
CREATE INDEX idx_work_declarations_due_date ON work_declarations(due_date);
CREATE INDEX idx_work_declarations_created_by ON work_declarations(created_by);

-- GIN indexes for JSONB fields
CREATE INDEX idx_work_declarations_milestones ON work_declarations USING GIN (milestones);
CREATE INDEX idx_work_declarations_deliverables ON work_declarations USING GIN (deliverables);

-- ============================================================================
-- TABLE: work_declaration_updates
-- ============================================================================
-- Tracks status updates and activity on work declarations
CREATE TABLE IF NOT EXISTS work_declaration_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  work_declaration_id UUID NOT NULL REFERENCES work_declarations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Update Details
  update_type TEXT NOT NULL CHECK (update_type IN ('status_change', 'progress_update', 'milestone_complete', 'deliverable_added', 'comment', 'due_date_change')),
  old_value TEXT,
  new_value TEXT,
  comment TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_work_declaration_updates_declaration ON work_declaration_updates(work_declaration_id);
CREATE INDEX idx_work_declaration_updates_created_by ON work_declaration_updates(created_by);
CREATE INDEX idx_work_declaration_updates_type ON work_declaration_updates(update_type);
CREATE INDEX idx_work_declaration_updates_created_at ON work_declaration_updates(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_work_declarations_updated_at
  BEFORE UPDATE ON work_declarations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE work_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_declaration_updates ENABLE ROW LEVEL SECURITY;

-- work_declarations policies

-- Vendors can view their own work declarations
CREATE POLICY "Vendors can view their work declarations"
  ON work_declarations
  FOR SELECT
  USING (
    vendor_id IN (
      SELECT vendor_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Clients can view work declarations for their account
CREATE POLICY "Clients can view their work declarations"
  ON work_declarations
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE id IN (
        SELECT client_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Vendors can create work declarations for their clients
CREATE POLICY "Vendors can create work declarations"
  ON work_declarations
  FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT vendor_id FROM profiles WHERE id = auth.uid()
    )
    AND
    client_id IN (
      SELECT id FROM clients WHERE vendor_id IN (
        SELECT vendor_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Vendors can update their own work declarations
CREATE POLICY "Vendors can update their work declarations"
  ON work_declarations
  FOR UPDATE
  USING (
    vendor_id IN (
      SELECT vendor_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Vendors can delete their own work declarations
CREATE POLICY "Vendors can delete their work declarations"
  ON work_declarations
  FOR DELETE
  USING (
    vendor_id IN (
      SELECT vendor_id FROM profiles WHERE id = auth.uid()
    )
  );

-- work_declaration_updates policies

-- Users can view updates for work declarations they have access to
CREATE POLICY "Users can view work declaration updates"
  ON work_declaration_updates
  FOR SELECT
  USING (
    work_declaration_id IN (
      SELECT id FROM work_declarations
      WHERE vendor_id IN (SELECT vendor_id FROM profiles WHERE id = auth.uid())
      OR client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Authenticated users can create updates
CREATE POLICY "Authenticated users can create updates"
  ON work_declaration_updates
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    work_declaration_id IN (
      SELECT id FROM work_declarations
      WHERE vendor_id IN (SELECT vendor_id FROM profiles WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate overall progress across all work declarations for a client
CREATE OR REPLACE FUNCTION get_client_work_progress(p_client_id UUID)
RETURNS TABLE (
  total_declarations INTEGER,
  planned_count INTEGER,
  in_progress_count INTEGER,
  completed_count INTEGER,
  on_hold_count INTEGER,
  cancelled_count INTEGER,
  avg_progress NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_declarations,
    COUNT(*) FILTER (WHERE status = 'planned')::INTEGER AS planned_count,
    COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER AS in_progress_count,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER AS completed_count,
    COUNT(*) FILTER (WHERE status = 'on_hold')::INTEGER AS on_hold_count,
    COUNT(*) FILTER (WHERE status = 'cancelled')::INTEGER AS cancelled_count,
    COALESCE(AVG(progress_percentage), 0)::NUMERIC AS avg_progress
  FROM work_declarations
  WHERE client_id = p_client_id
    AND status NOT IN ('cancelled');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_client_work_progress(UUID) TO authenticated;

-- Function to auto-update completed_at when status changes to completed
CREATE OR REPLACE FUNCTION auto_set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to completed, set completed_at
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
    NEW.progress_percentage = 100;
  END IF;

  -- If status changed from completed to something else, clear completed_at
  IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    NEW.completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_set_completed_at
  BEFORE UPDATE ON work_declarations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION auto_set_completed_at();

-- Function to create update records on status/progress changes
CREATE OR REPLACE FUNCTION track_work_declaration_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO work_declaration_updates (
      work_declaration_id,
      created_by,
      update_type,
      old_value,
      new_value
    ) VALUES (
      NEW.id,
      auth.uid(),
      'status_change',
      OLD.status,
      NEW.status
    );
  END IF;

  -- Track progress updates (only if changed by more than 5%)
  IF ABS(OLD.progress_percentage - NEW.progress_percentage) >= 5 THEN
    INSERT INTO work_declaration_updates (
      work_declaration_id,
      created_by,
      update_type,
      old_value,
      new_value
    ) VALUES (
      NEW.id,
      auth.uid(),
      'progress_update',
      OLD.progress_percentage::TEXT,
      NEW.progress_percentage::TEXT
    );
  END IF;

  -- Track due date changes
  IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
    INSERT INTO work_declaration_updates (
      work_declaration_id,
      created_by,
      update_type,
      old_value,
      new_value
    ) VALUES (
      NEW.id,
      auth.uid(),
      'due_date_change',
      OLD.due_date::TEXT,
      NEW.due_date::TEXT
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_track_work_declaration_changes
  AFTER UPDATE ON work_declarations
  FOR EACH ROW
  EXECUTE FUNCTION track_work_declaration_changes();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE work_declarations IS 'Stores work items declared by vendors for client visibility and transparency';
COMMENT ON TABLE work_declaration_updates IS 'Tracks activity and updates on work declarations';
COMMENT ON COLUMN work_declarations.type IS 'Type of work: content_batch, seo_audit, publishing, analytics, reporting, custom';
COMMENT ON COLUMN work_declarations.status IS 'Current status: planned, in_progress, review, completed, on_hold, cancelled';
COMMENT ON COLUMN work_declarations.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN work_declarations.milestones IS 'JSON array of milestone objects with title, completed, completed_at';
COMMENT ON COLUMN work_declarations.deliverables IS 'JSON array of deliverable objects with name, description, status, url';
