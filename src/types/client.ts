// Client and Workspace Types

export type ClientStatus = 'lead' | 'customer' | 'churned';
export type WorkspaceStatus = 'onboarding' | 'active' | 'completed' | 'paused' | 'cancelled';

export interface VendorClient {
  id: string;
  vendor_id: string;
  user_id?: string;

  // Client info
  email: string;
  full_name?: string;
  phone?: string;

  // Attribution
  first_page_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;

  // Status
  status: ClientStatus;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface VendorClientCreateInput {
  vendor_id: string;
  email: string;
  full_name?: string;
  phone?: string;
  first_page_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface VendorWorkspace {
  id: string;
  vendor_id: string;
  client_id: string;
  offer_id?: string;
  page_id?: string;

  // Workspace details
  name: string;

  // Status
  status: WorkspaceStatus;

  // Timeline
  started_at: string;
  completed_at?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface VendorWorkspaceCreateInput {
  vendor_id: string;
  client_id: string;
  offer_id?: string;
  page_id?: string;
  name: string;
  status?: WorkspaceStatus;
}

export interface VendorWorkspaceUpdateInput {
  name?: string;
  status?: WorkspaceStatus;
  completed_at?: string;
}
