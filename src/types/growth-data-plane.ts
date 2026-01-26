/**
 * Growth Data Plane Types
 * Unified tracking, identity resolution, and segmentation
 */

export interface Person {
  id: string;
  created_at: string;
  updated_at: string;

  // Core identity
  email: string | null;
  phone: string | null;
  name: string | null;

  // Profile
  company: string | null;
  role: string | null;
  avatar_url: string | null;

  // Behavioral features
  first_seen_at: string | null;
  last_seen_at: string | null;
  active_days: number;
  total_sessions: number;

  // Engagement
  engagement_score: number;
  lifecycle_stage: 'visitor' | 'lead' | 'signup' | 'activated' | 'paying' | 'churned';

  // Attribution
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer: string | null;

  // RLS
  tenant_id: string | null;
}

export interface IdentityLink {
  id: string;
  person_id: string;
  created_at: string;

  source: 'posthog' | 'stripe' | 'meta' | 'google' | 'email' | 'supabase';
  external_id: string;

  metadata: Record<string, any>;
}

export interface Event {
  id: string;
  person_id: string | null;
  created_at: string;

  // Event identity
  event_name: string;
  event_source: 'web' | 'app' | 'email' | 'stripe' | 'booking' | 'meta';
  event_id: string | null;

  // Context
  session_id: string | null;
  page_url: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip_address: string | null;

  // Properties
  properties: Record<string, any>;

  // Attribution
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;

  // RLS
  tenant_id: string | null;
}

export interface EmailMessage {
  id: string;
  person_id: string | null;
  created_at: string;

  // Email identity
  message_id: string;
  email_to: string;
  email_from: string;
  subject: string | null;

  // Campaign
  template_name: string | null;
  campaign_name: string | null;
  tags: string[];

  // Status
  status: 'sent' | 'delivered' | 'bounced' | 'complained';
  delivered_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;

  // Metadata
  metadata: Record<string, any>;

  // RLS
  tenant_id: string | null;
}

export interface EmailEvent {
  id: string;
  message_id: string;
  person_id: string | null;
  created_at: string;

  // Event type
  event_type: 'opened' | 'clicked' | 'bounced' | 'complained' | 'delivered';

  // Click details
  link_url: string | null;
  link_text: string | null;

  // Metadata
  user_agent: string | null;
  ip_address: string | null;
  metadata: Record<string, any>;

  // RLS
  tenant_id: string | null;
}

export interface Subscription {
  id: string;
  person_id: string;
  created_at: string;
  updated_at: string;

  // Stripe
  stripe_subscription_id: string;
  stripe_customer_id: string;

  // Details
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' | 'incomplete';
  plan_id: string | null;
  plan_name: string | null;
  billing_interval: 'month' | 'year' | null;

  // Pricing
  amount: number | null;
  currency: string;
  mrr: number | null;

  // Dates
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  canceled_at: string | null;
  ended_at: string | null;

  // Metadata
  metadata: Record<string, any>;

  // RLS
  tenant_id: string | null;
}

export interface Deal {
  id: string;
  person_id: string;
  created_at: string;
  updated_at: string;

  // Details
  title: string;
  stage: 'lead' | 'demo_scheduled' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  value: number | null;
  currency: string;

  // Dates
  expected_close_date: string | null;
  closed_at: string | null;

  // Owner
  owner_id: string | null;

  // Metadata
  metadata: Record<string, any>;

  // RLS
  tenant_id: string | null;
}

export interface PersonFeatures {
  person_id: string;
  updated_at: string;

  // Engagement metrics
  total_page_views: number;
  total_sessions: number;
  active_days: number;
  avg_session_duration_seconds: number | null;

  // BlogCanvas-specific actions
  demo_requested: boolean;
  signup_completed: boolean;
  first_client_added: boolean;
  blog_created: boolean;
  blog_approved: boolean;
  blog_published: boolean;
  checkout_started: boolean;
  purchase_completed: boolean;

  // Counts
  clients_added_count: number;
  blogs_created_count: number;
  blogs_published_count: number;

  // Email engagement
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  email_open_rate: number | null;
  email_click_rate: number | null;

  // Last activity
  last_page_view_at: string | null;
  last_email_opened_at: string | null;
  last_email_clicked_at: string | null;

  // Scores
  engagement_score: number;
  conversion_probability: number | null;

  // RLS
  tenant_id: string | null;
}

export interface Segment {
  id: string;
  created_at: string;
  updated_at: string;

  // Identity
  name: string;
  slug: string;
  description: string | null;

  // Criteria
  criteria: Record<string, any>;

  // Automation
  trigger_email_campaign: string | null;
  trigger_webhook_url: string | null;

  // Stats
  member_count: number;

  // Ownership
  created_by: string | null;
  is_system: boolean;

  // RLS
  tenant_id: string | null;
}

export interface SegmentMembership {
  id: string;
  segment_id: string;
  person_id: string;
  entered_at: string;
  exited_at: string | null;

  // RLS
  tenant_id: string | null;
}

// =============================================
// Input types for creating/updating records
// =============================================

export interface CreatePersonInput {
  email?: string;
  phone?: string;
  name?: string;
  company?: string;
  role?: string;
  avatar_url?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  tenant_id?: string;
}

export interface CreateEventInput {
  person_id?: string;
  event_name: string;
  event_source: 'web' | 'app' | 'email' | 'stripe' | 'booking' | 'meta';
  event_id?: string;
  session_id?: string;
  page_url?: string;
  referrer?: string;
  user_agent?: string;
  ip_address?: string;
  properties?: Record<string, any>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  tenant_id?: string;
}

export interface CreateEmailMessageInput {
  person_id?: string;
  message_id: string;
  email_to: string;
  email_from: string;
  subject?: string;
  template_name?: string;
  campaign_name?: string;
  tags?: string[];
  tenant_id?: string;
}

export interface CreateEmailEventInput {
  message_id: string;
  person_id?: string;
  event_type: 'opened' | 'clicked' | 'bounced' | 'complained' | 'delivered';
  link_url?: string;
  link_text?: string;
  user_agent?: string;
  ip_address?: string;
  metadata?: Record<string, any>;
  tenant_id?: string;
}
