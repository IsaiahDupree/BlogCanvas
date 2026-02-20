/**
 * Event Tracking System
 * Provides a unified interface for tracking user events and analytics
 */

import { createClient } from '@/lib/supabase/client';
import { captureMessage } from '@/lib/monitoring/sentry';

// Event categories
export enum EventCategory {
  USER = 'user',
  BLOG_POST = 'blog_post',
  CLIENT = 'client',
  ORDER = 'order',
  PAYMENT = 'payment',
  WORKFLOW = 'workflow',
  AI_PIPELINE = 'ai_pipeline',
  NAVIGATION = 'navigation',
  ENGAGEMENT = 'engagement',
  ERROR = 'error',
}

// Event actions
export enum EventAction {
  // User actions
  LOGIN = 'login',
  LOGOUT = 'logout',
  SIGNUP = 'signup',
  PROFILE_UPDATE = 'profile_update',

  // Blog post actions
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  PUBLISH = 'publish',
  DRAFT = 'draft',
  VIEW = 'view',

  // Client actions
  INVITE = 'invite',
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_CHANGES = 'request_changes',

  // Order actions
  ORDER_CREATED = 'order_created',
  ORDER_COMPLETED = 'order_completed',
  ORDER_CANCELLED = 'order_cancelled',

  // Payment actions
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',

  // Workflow actions
  WORKFLOW_STARTED = 'workflow_started',
  WORKFLOW_COMPLETED = 'workflow_completed',
  WORKFLOW_FAILED = 'workflow_failed',

  // AI Pipeline actions
  AI_GENERATION_STARTED = 'ai_generation_started',
  AI_GENERATION_COMPLETED = 'ai_generation_completed',
  AI_GENERATION_FAILED = 'ai_generation_failed',

  // Navigation actions
  PAGE_VIEW = 'page_view',
  CLICK = 'click',

  // Engagement actions
  SEARCH = 'search',
  FILTER = 'filter',
  EXPORT = 'export',
  SHARE = 'share',
}

export interface AnalyticsEvent {
  category: EventCategory;
  action: EventAction;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
}

export interface StoredEvent extends AnalyticsEvent {
  id: string;
  timestamp: string;
}

/**
 * Track an analytics event
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const supabase = createClient();

    // Get the current user if not provided
    let userId = event.userId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    // Store the event in the database
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        category: event.category,
        action: event.action,
        label: event.label,
        value: event.value,
        metadata: event.metadata || {},
        user_id: userId,
        session_id: event.sessionId || getSessionId(),
        timestamp: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to track event:', error);
      captureMessage('Analytics event tracking failed', 'warning', {
        extra: { event, error },
      });
    }

    // Also send to external analytics services if configured
    if (typeof window !== 'undefined') {
      // Send to Google Analytics if available
      if ((window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag) {
        (window as typeof window & { gtag: (...args: unknown[]) => void }).gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          ...event.metadata,
        });
      }

      // Send to other analytics platforms here (e.g., Mixpanel, Amplitude)
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

/**
 * Track a page view
 */
export async function trackPageView(
  path: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await trackEvent({
    category: EventCategory.NAVIGATION,
    action: EventAction.PAGE_VIEW,
    label: path,
    metadata: {
      ...metadata,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
    },
  });
}

/**
 * Track a user action
 */
export async function trackUserAction(
  action: EventAction,
  label?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await trackEvent({
    category: EventCategory.USER,
    action,
    label,
    metadata,
  });
}

/**
 * Track a blog post action
 */
export async function trackBlogPostAction(
  action: EventAction,
  postId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await trackEvent({
    category: EventCategory.BLOG_POST,
    action,
    label: postId,
    metadata,
  });
}

/**
 * Track a client action
 */
export async function trackClientAction(
  action: EventAction,
  clientId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await trackEvent({
    category: EventCategory.CLIENT,
    action,
    label: clientId,
    metadata,
  });
}

/**
 * Track an order action
 */
export async function trackOrderAction(
  action: EventAction,
  orderId: string,
  value?: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  await trackEvent({
    category: EventCategory.ORDER,
    action,
    label: orderId,
    value,
    metadata,
  });
}

/**
 * Track a payment action
 */
export async function trackPaymentAction(
  action: EventAction,
  paymentId: string,
  value: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  await trackEvent({
    category: EventCategory.PAYMENT,
    action,
    label: paymentId,
    value,
    metadata,
  });
}

/**
 * Track an AI pipeline action
 */
export async function trackAIPipelineAction(
  action: EventAction,
  pipelineId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await trackEvent({
    category: EventCategory.AI_PIPELINE,
    action,
    label: pipelineId,
    metadata,
  });
}

/**
 * Get or create a session ID for the current session
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  const storageKey = 'analytics_session_id';
  let sessionId = sessionStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

/**
 * Get analytics metrics for a specific category and time range
 */
export async function getAnalyticsMetrics(
  category: EventCategory,
  startDate: Date,
  endDate: Date,
  userId?: string
): Promise<StoredEvent[]> {
  const supabase = createClient();

  let query = supabase
    .from('analytics_events')
    .select('*')
    .eq('category', category)
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())
    .order('timestamp', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to get analytics metrics:', error);
    return [];
  }

  return data as StoredEvent[];
}

/**
 * Get event counts by action for a specific category
 */
export async function getEventCounts(
  category: EventCategory,
  startDate: Date,
  endDate: Date
): Promise<Record<string, number>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('analytics_events')
    .select('action')
    .eq('category', category)
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  if (error) {
    console.error('Failed to get event counts:', error);
    return {};
  }

  // Count events by action
  const counts: Record<string, number> = {};
  data.forEach((event) => {
    counts[event.action] = (counts[event.action] || 0) + 1;
  });

  return counts;
}
