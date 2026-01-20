// Scheduling Types (Meetings, Availability, Calendar Integrations)

export type MeetingLocationType = 'google_meet' | 'zoom' | 'phone' | 'in_person' | 'custom';
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type CalendarProvider = 'google' | 'microsoft' | 'apple';

// ============================================================================
// MEETING TYPES
// ============================================================================

export interface VendorMeetingType {
  id: string;
  vendor_id: string;

  // Meeting details
  name: string;
  description?: string;
  duration_minutes: number;

  // Availability
  buffer_before_minutes: number;
  buffer_after_minutes: number;

  // Location
  location_type: MeetingLocationType;
  location_details?: string;

  // Pricing (for paid calls)
  is_paid: boolean;
  price: number;
  currency: string;

  // Settings
  is_active: boolean;
  color?: string;

  created_at: string;
  updated_at: string;
}

export interface VendorMeetingTypeCreateInput {
  vendor_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  buffer_before_minutes?: number;
  buffer_after_minutes?: number;
  location_type: MeetingLocationType;
  location_details?: string;
  is_paid?: boolean;
  price?: number;
  currency?: string;
  color?: string;
}

// ============================================================================
// MEETINGS
// ============================================================================

export interface VendorMeeting {
  id: string;
  vendor_id: string;
  client_id?: string;
  workspace_id?: string;
  meeting_type_id: string;

  // Meeting details
  title: string;
  description?: string;

  // Time
  start_time: string;
  end_time: string;
  timezone: string;

  // Location
  location_type: MeetingLocationType;
  location_details?: string;
  meeting_link?: string;

  // Attendees
  vendor_user_id?: string;
  client_user_id?: string;
  client_email: string;
  client_name?: string;

  // Status
  status: MeetingStatus;

  // Google Calendar integration
  google_calendar_event_id?: string;

  // Metadata
  notes?: string;
  cancelled_at?: string;
  cancellation_reason?: string;

  created_at: string;
  updated_at: string;
}

export interface VendorMeetingCreateInput {
  vendor_id: string;
  meeting_type_id: string;
  client_id?: string;
  workspace_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  timezone: string;
  location_type: MeetingLocationType;
  location_details?: string;
  client_email: string;
  client_name?: string;
}

// ============================================================================
// AVAILABILITY
// ============================================================================

export interface VendorAvailability {
  id: string;
  vendor_id: string;

  // Day of week (0 = Sunday, 6 = Saturday)
  day_of_week: number;

  // Time slots
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format

  // Status
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface VendorAvailabilityCreateInput {
  vendor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active?: boolean;
}

export interface TimeSlot {
  start: string; // ISO timestamp
  end: string; // ISO timestamp
  available: boolean;
}

export interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
}

// ============================================================================
// CALENDAR INTEGRATIONS
// ============================================================================

export interface VendorCalendarIntegration {
  id: string;
  vendor_id: string;

  // Provider
  provider: CalendarProvider;

  // OAuth tokens (encrypted)
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;

  // Calendar details
  calendar_id?: string;
  calendar_name?: string;

  // Status
  is_active: boolean;
  last_sync_at?: string;
  sync_error?: string;

  created_at: string;
  updated_at: string;
}

export interface CalendarIntegrationCreateInput {
  vendor_id: string;
  provider: CalendarProvider;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  calendar_id?: string;
  calendar_name?: string;
}
