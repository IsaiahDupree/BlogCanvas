-- Vendor Offer Platform - Portal Features
-- This migration creates tables for onboarding, messaging, deliverables, revisions, and scheduling

-- ============================================================================
-- ONBOARDING STEPS
-- ============================================================================

-- Onboarding steps: Checklist tasks for client onboarding
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES vendor_workspaces(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Step details
  title TEXT NOT NULL,
  description TEXT,
  step_order INTEGER NOT NULL DEFAULT 0,

  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Requirements
  requires_file_upload BOOLEAN DEFAULT false,
  requires_form_submission BOOLEAN DEFAULT false,
  linked_form_id UUID, -- Future: link to forms table

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_onboarding_steps_workspace ON onboarding_steps(workspace_id);
CREATE INDEX idx_onboarding_steps_vendor ON onboarding_steps(vendor_id);
CREATE INDEX idx_onboarding_steps_order ON onboarding_steps(workspace_id, step_order);

-- ============================================================================
-- FORMS & FORM SUBMISSIONS
-- ============================================================================

-- Forms: Intake forms created by vendors
CREATE TABLE IF NOT EXISTS vendor_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Form details
  name TEXT NOT NULL,
  description TEXT,

  -- Form structure (JSON schema)
  fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of field definitions

  -- Settings
  is_template BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_forms_vendor ON vendor_forms(vendor_id);

-- Form submissions: Client responses to forms
CREATE TABLE IF NOT EXISTS vendor_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES vendor_forms(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES vendor_workspaces(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES vendor_clients(id) ON DELETE CASCADE,

  -- Submission data
  responses JSONB NOT NULL DEFAULT '{}'::jsonb, -- Key-value pairs of field_id: value

  -- Status
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_form_submissions_form ON vendor_form_submissions(form_id);
CREATE INDEX idx_vendor_form_submissions_workspace ON vendor_form_submissions(workspace_id);
CREATE INDEX idx_vendor_form_submissions_vendor ON vendor_form_submissions(vendor_id);

-- ============================================================================
-- MESSAGES
-- ============================================================================

-- Messages: Communication between vendor and client
CREATE TABLE IF NOT EXISTS vendor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES vendor_workspaces(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Message details
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('vendor', 'client')),

  content TEXT NOT NULL,

  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of {name, url, size, type}

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_messages_workspace ON vendor_messages(workspace_id);
CREATE INDEX idx_vendor_messages_vendor ON vendor_messages(vendor_id);
CREATE INDEX idx_vendor_messages_sender ON vendor_messages(sender_id);
CREATE INDEX idx_vendor_messages_created ON vendor_messages(created_at DESC);

-- ============================================================================
-- DELIVERABLES
-- ============================================================================

-- Deliverables: Files and links delivered to clients
CREATE TABLE IF NOT EXISTS vendor_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES vendor_workspaces(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Deliverable details
  name TEXT NOT NULL,
  description TEXT,
  deliverable_type TEXT NOT NULL CHECK (deliverable_type IN ('file', 'link', 'document')),

  -- File/Link
  file_url TEXT,
  file_size BIGINT, -- Bytes
  file_type TEXT, -- MIME type or file extension

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'delivered', 'approved', 'revision_requested')),

  -- Timestamps
  delivered_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_deliverables_workspace ON vendor_deliverables(workspace_id);
CREATE INDEX idx_vendor_deliverables_vendor ON vendor_deliverables(vendor_id);
CREATE INDEX idx_vendor_deliverables_status ON vendor_deliverables(status);

-- ============================================================================
-- REVISIONS
-- ============================================================================

-- Revisions: Client revision requests for deliverables
CREATE TABLE IF NOT EXISTS vendor_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES vendor_workspaces(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES vendor_deliverables(id) ON DELETE SET NULL,

  -- Revision details
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Requested by
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),

  -- Resolution
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_revisions_workspace ON vendor_revisions(workspace_id);
CREATE INDEX idx_vendor_revisions_vendor ON vendor_revisions(vendor_id);
CREATE INDEX idx_vendor_revisions_deliverable ON vendor_revisions(deliverable_id);
CREATE INDEX idx_vendor_revisions_status ON vendor_revisions(status);

-- ============================================================================
-- MEETING TYPES
-- ============================================================================

-- Meeting types: Vendor-defined meeting configurations
CREATE TABLE IF NOT EXISTS vendor_meeting_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Meeting details
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,

  -- Availability
  buffer_before_minutes INTEGER DEFAULT 0,
  buffer_after_minutes INTEGER DEFAULT 0,

  -- Location
  location_type TEXT NOT NULL CHECK (location_type IN ('google_meet', 'zoom', 'phone', 'in_person', 'custom')),
  location_details TEXT, -- URL or instructions

  -- Pricing (for paid calls)
  is_paid BOOLEAN DEFAULT false,
  price DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',

  -- Settings
  is_active BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#3B82F6',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_meeting_types_vendor ON vendor_meeting_types(vendor_id);
CREATE INDEX idx_vendor_meeting_types_active ON vendor_meeting_types(is_active);

-- ============================================================================
-- MEETINGS
-- ============================================================================

-- Meetings: Booked meetings between vendor and client
CREATE TABLE IF NOT EXISTS vendor_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  client_id UUID REFERENCES vendor_clients(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES vendor_workspaces(id) ON DELETE SET NULL,
  meeting_type_id UUID NOT NULL REFERENCES vendor_meeting_types(id) ON DELETE RESTRICT,

  -- Meeting details
  title TEXT NOT NULL,
  description TEXT,

  -- Time
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL,

  -- Location
  location_type TEXT NOT NULL CHECK (location_type IN ('google_meet', 'zoom', 'phone', 'in_person', 'custom')),
  location_details TEXT,
  meeting_link TEXT,

  -- Attendees
  vendor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_email TEXT NOT NULL,
  client_name TEXT,

  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),

  -- Google Calendar integration
  google_calendar_event_id TEXT,

  -- Metadata
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_meetings_vendor ON vendor_meetings(vendor_id);
CREATE INDEX idx_vendor_meetings_client ON vendor_meetings(client_id);
CREATE INDEX idx_vendor_meetings_workspace ON vendor_meetings(workspace_id);
CREATE INDEX idx_vendor_meetings_meeting_type ON vendor_meetings(meeting_type_id);
CREATE INDEX idx_vendor_meetings_start ON vendor_meetings(start_time);
CREATE INDEX idx_vendor_meetings_status ON vendor_meetings(status);
CREATE INDEX idx_vendor_meetings_google_event ON vendor_meetings(google_calendar_event_id);

-- ============================================================================
-- VENDOR AVAILABILITY
-- ============================================================================

-- Vendor availability: Recurring availability rules
CREATE TABLE IF NOT EXISTS vendor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Day of week (0 = Sunday, 6 = Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),

  -- Time slots (multiple per day)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_availability_vendor ON vendor_availability(vendor_id);
CREATE INDEX idx_vendor_availability_day ON vendor_availability(day_of_week);

-- ============================================================================
-- VENDOR CALENDAR INTEGRATIONS
-- ============================================================================

-- Vendor calendar integrations: OAuth tokens for calendar access
CREATE TABLE IF NOT EXISTS vendor_calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Provider
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'apple')),

  -- OAuth tokens (encrypted)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Calendar details
  calendar_id TEXT,
  calendar_name TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, provider)
);

CREATE INDEX idx_vendor_calendar_integrations_vendor ON vendor_calendar_integrations(vendor_id);
CREATE INDEX idx_vendor_calendar_integrations_provider ON vendor_calendar_integrations(provider);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Onboarding steps: Vendor and workspace client can access
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_steps_vendor_all ON onboarding_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = onboarding_steps.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY onboarding_steps_client_select ON onboarding_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vendor_workspaces
      JOIN vendor_clients ON vendor_clients.id = vendor_workspaces.client_id
      WHERE vendor_workspaces.id = onboarding_steps.workspace_id
      AND vendor_clients.user_id = auth.uid()
    )
  );

CREATE POLICY onboarding_steps_client_update ON onboarding_steps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM vendor_workspaces
      JOIN vendor_clients ON vendor_clients.id = vendor_workspaces.client_id
      WHERE vendor_workspaces.id = onboarding_steps.workspace_id
      AND vendor_clients.user_id = auth.uid()
    )
  );

-- Vendor forms: Vendors can manage their forms
ALTER TABLE vendor_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_forms_vendor_all ON vendor_forms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_forms.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Form submissions: Vendor and client can access
ALTER TABLE vendor_form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_form_submissions_vendor_all ON vendor_form_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_form_submissions.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY vendor_form_submissions_client_all ON vendor_form_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendor_clients
      WHERE vendor_clients.id = vendor_form_submissions.client_id
      AND vendor_clients.user_id = auth.uid()
    )
  );

-- Messages: Vendor and workspace client can access
ALTER TABLE vendor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_messages_vendor_all ON vendor_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_messages.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY vendor_messages_client_all ON vendor_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendor_workspaces
      JOIN vendor_clients ON vendor_clients.id = vendor_workspaces.client_id
      WHERE vendor_workspaces.id = vendor_messages.workspace_id
      AND vendor_clients.user_id = auth.uid()
    )
  );

-- Deliverables: Vendor and workspace client can access
ALTER TABLE vendor_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_deliverables_vendor_all ON vendor_deliverables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_deliverables.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY vendor_deliverables_client_select ON vendor_deliverables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vendor_workspaces
      JOIN vendor_clients ON vendor_clients.id = vendor_workspaces.client_id
      WHERE vendor_workspaces.id = vendor_deliverables.workspace_id
      AND vendor_clients.user_id = auth.uid()
    )
    AND status IN ('delivered', 'approved', 'revision_requested')
  );

-- Revisions: Vendor and workspace client can access
ALTER TABLE vendor_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_revisions_vendor_all ON vendor_revisions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_revisions.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY vendor_revisions_client_all ON vendor_revisions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendor_workspaces
      JOIN vendor_clients ON vendor_clients.id = vendor_workspaces.client_id
      WHERE vendor_workspaces.id = vendor_revisions.workspace_id
      AND vendor_clients.user_id = auth.uid()
    )
  );

-- Meeting types: Vendors can manage, public can view active ones
ALTER TABLE vendor_meeting_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_meeting_types_vendor_all ON vendor_meeting_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_meeting_types.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY vendor_meeting_types_public_select ON vendor_meeting_types
  FOR SELECT USING (is_active = true);

-- Meetings: Vendor and attendees can access
ALTER TABLE vendor_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_meetings_vendor_all ON vendor_meetings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_meetings.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY vendor_meetings_client_select ON vendor_meetings
  FOR SELECT USING (
    client_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM vendor_clients
      WHERE vendor_clients.id = vendor_meetings.client_id
      AND vendor_clients.user_id = auth.uid()
    )
  );

-- Vendor availability: Vendors can manage, public can view
ALTER TABLE vendor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_availability_vendor_all ON vendor_availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_availability.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY vendor_availability_public_select ON vendor_availability
  FOR SELECT USING (is_active = true);

-- Calendar integrations: Vendors can manage their own
ALTER TABLE vendor_calendar_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_calendar_integrations_vendor_all ON vendor_calendar_integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_calendar_integrations.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER onboarding_steps_updated_at BEFORE UPDATE ON onboarding_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_forms_updated_at BEFORE UPDATE ON vendor_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_form_submissions_updated_at BEFORE UPDATE ON vendor_form_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_messages_updated_at BEFORE UPDATE ON vendor_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_deliverables_updated_at BEFORE UPDATE ON vendor_deliverables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_revisions_updated_at BEFORE UPDATE ON vendor_revisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_meeting_types_updated_at BEFORE UPDATE ON vendor_meeting_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_meetings_updated_at BEFORE UPDATE ON vendor_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_availability_updated_at BEFORE UPDATE ON vendor_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendor_calendar_integrations_updated_at BEFORE UPDATE ON vendor_calendar_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
