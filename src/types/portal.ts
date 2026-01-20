// Portal Features Types (Onboarding, Messages, Deliverables, Revisions)

// ============================================================================
// ONBOARDING
// ============================================================================

export interface OnboardingStep {
  id: string;
  workspace_id: string;
  vendor_id: string;

  // Step details
  title: string;
  description?: string;
  step_order: number;

  // Status
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;

  // Requirements
  requires_file_upload: boolean;
  requires_form_submission: boolean;
  linked_form_id?: string;

  created_at: string;
  updated_at: string;
}

export interface OnboardingStepCreateInput {
  workspace_id: string;
  vendor_id: string;
  title: string;
  description?: string;
  step_order: number;
  requires_file_upload?: boolean;
  requires_form_submission?: boolean;
  linked_form_id?: string;
}

// ============================================================================
// FORMS
// ============================================================================

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'email' | 'phone' | 'select' | 'radio' | 'checkbox' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface VendorForm {
  id: string;
  vendor_id: string;

  // Form details
  name: string;
  description?: string;

  // Form structure
  fields: FormField[];

  // Settings
  is_template: boolean;

  created_at: string;
  updated_at: string;
}

export interface VendorFormSubmission {
  id: string;
  form_id: string;
  workspace_id: string;
  vendor_id: string;
  client_id: string;

  // Submission data
  responses: Record<string, any>;

  // Status
  is_reviewed: boolean;
  reviewed_at?: string;
  reviewed_by?: string;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// MESSAGES
// ============================================================================

export type MessageSenderType = 'vendor' | 'client';

export interface MessageAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface VendorMessage {
  id: string;
  workspace_id: string;
  vendor_id: string;

  // Message details
  sender_id: string;
  sender_type: MessageSenderType;

  content: string;

  // Attachments
  attachments: MessageAttachment[];

  // Status
  is_read: boolean;
  read_at?: string;

  created_at: string;
  updated_at: string;
}

export interface VendorMessageCreateInput {
  workspace_id: string;
  vendor_id: string;
  sender_id: string;
  sender_type: MessageSenderType;
  content: string;
  attachments?: MessageAttachment[];
}

// ============================================================================
// DELIVERABLES
// ============================================================================

export type DeliverableType = 'file' | 'link' | 'document';
export type DeliverableStatus = 'draft' | 'delivered' | 'approved' | 'revision_requested';

export interface VendorDeliverable {
  id: string;
  workspace_id: string;
  vendor_id: string;

  // Deliverable details
  name: string;
  description?: string;
  deliverable_type: DeliverableType;

  // File/Link
  file_url?: string;
  file_size?: number;
  file_type?: string;

  // Status
  status: DeliverableStatus;

  // Timestamps
  delivered_at?: string;
  approved_at?: string;

  created_at: string;
  updated_at: string;
}

export interface VendorDeliverableCreateInput {
  workspace_id: string;
  vendor_id: string;
  name: string;
  description?: string;
  deliverable_type: DeliverableType;
  file_url?: string;
  file_size?: number;
  file_type?: string;
  status?: DeliverableStatus;
}

// ============================================================================
// REVISIONS
// ============================================================================

export type RevisionStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export interface VendorRevision {
  id: string;
  workspace_id: string;
  vendor_id: string;
  deliverable_id?: string;

  // Revision details
  title: string;
  description: string;

  // Requested by
  requested_by: string;

  // Status
  status: RevisionStatus;

  // Resolution
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;

  created_at: string;
  updated_at: string;
}

export interface VendorRevisionCreateInput {
  workspace_id: string;
  vendor_id: string;
  deliverable_id?: string;
  title: string;
  description: string;
  requested_by: string;
}
