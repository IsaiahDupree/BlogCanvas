/**
 * User Behavior Funnels
 * Track conversion funnels for onboarding, purchase, and adoption
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Funnel event types
 */
export enum FunnelEvent {
  // Onboarding funnel
  SIGNUP_STARTED = 'signup_started',
  SIGNUP_COMPLETED = 'signup_completed',
  PROFILE_CREATED = 'profile_created',
  FIRST_PAGE_CREATED = 'first_page_created',
  ONBOARDING_COMPLETED = 'onboarding_completed',

  // Purchase funnel
  OFFER_VIEWED = 'offer_viewed',
  ADD_TO_CART = 'add_to_cart',
  CHECKOUT_STARTED = 'checkout_started',
  PAYMENT_INFO_ADDED = 'payment_info_added',
  PURCHASE_COMPLETED = 'purchase_completed',

  // Adoption funnel
  FIRST_LOGIN = 'first_login',
  DASHBOARD_VIEWED = 'dashboard_viewed',
  FEATURE_USED = 'feature_used',
  CLIENT_INVITED = 'client_invited',
  WORKSPACE_CREATED = 'workspace_created',
  RECURRING_USER = 'recurring_user',
}

/**
 * Funnel categories
 */
export enum FunnelType {
  ONBOARDING = 'onboarding',
  PURCHASE = 'purchase',
  ADOPTION = 'adoption',
}

/**
 * Funnel event data interface
 */
export interface FunnelEventData {
  event_type: FunnelEvent;
  funnel_type: FunnelType;
  user_id?: string;
  session_id: string;
  timestamp: string;
  metadata?: Record<string, any>;
  page_url?: string;
  referrer?: string;
}

/**
 * Track a funnel event
 */
export async function trackFunnelEvent(
  event: FunnelEvent,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const sessionId = getOrCreateSessionId();
  const funnelType = getFunnelTypeForEvent(event);

  const eventData: FunnelEventData = {
    event_type: event,
    funnel_type: funnelType,
    user_id: userId,
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    metadata,
    page_url: typeof window !== 'undefined' ? window.location.href : undefined,
    referrer: typeof window !== 'undefined' ? document.referrer : undefined,
  };

  try {
    await supabase.from('funnel_events').insert(eventData);

    // Also track in analytics events table
    await supabase.from('analytics_events').insert({
      event_name: event,
      event_category: funnelType,
      user_id: userId,
      session_id: sessionId,
      event_data: metadata,
      created_at: eventData.timestamp,
    });
  } catch (error) {
    console.error('Error tracking funnel event:', error);
  }
}

/**
 * Get funnel type for an event
 */
function getFunnelTypeForEvent(event: FunnelEvent): FunnelType {
  const onboardingEvents = [
    FunnelEvent.SIGNUP_STARTED,
    FunnelEvent.SIGNUP_COMPLETED,
    FunnelEvent.PROFILE_CREATED,
    FunnelEvent.FIRST_PAGE_CREATED,
    FunnelEvent.ONBOARDING_COMPLETED,
  ];

  const purchaseEvents = [
    FunnelEvent.OFFER_VIEWED,
    FunnelEvent.ADD_TO_CART,
    FunnelEvent.CHECKOUT_STARTED,
    FunnelEvent.PAYMENT_INFO_ADDED,
    FunnelEvent.PURCHASE_COMPLETED,
  ];

  if (onboardingEvents.includes(event)) {
    return FunnelType.ONBOARDING;
  } else if (purchaseEvents.includes(event)) {
    return FunnelType.PURCHASE;
  } else {
    return FunnelType.ADOPTION;
  }
}

/**
 * Get or create session ID
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return 'ssr-session';
  }

  let sessionId = sessionStorage.getItem('funnel_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('funnel_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Get funnel analytics for a specific funnel type
 */
export async function getFunnelAnalytics(
  funnelType: FunnelType,
  startDate: string,
  endDate: string
): Promise<{
  totalSessions: number;
  conversionRate: number;
  dropoffPoints: Array<{ step: string; dropoffRate: number }>;
  avgTimeToConvert: number;
}> {
  try {
    const { data: events } = await supabase
      .from('funnel_events')
      .select('*')
      .eq('funnel_type', funnelType)
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: true });

    if (!events || events.length === 0) {
      return {
        totalSessions: 0,
        conversionRate: 0,
        dropoffPoints: [],
        avgTimeToConvert: 0,
      };
    }

    // Group by session
    const sessions = new Map<string, FunnelEventData[]>();
    events.forEach((event) => {
      if (!sessions.has(event.session_id)) {
        sessions.set(event.session_id, []);
      }
      sessions.get(event.session_id)!.push(event);
    });

    // Calculate metrics
    const totalSessions = sessions.size;
    const completedSessions = Array.from(sessions.values()).filter((events) =>
      isSessionCompleted(events, funnelType)
    ).length;

    const conversionRate = (completedSessions / totalSessions) * 100;

    // Calculate dropoff points
    const dropoffPoints = calculateDropoffPoints(sessions, funnelType);

    // Calculate average time to convert
    const avgTimeToConvert = calculateAvgTimeToConvert(sessions, funnelType);

    return {
      totalSessions,
      conversionRate,
      dropoffPoints,
      avgTimeToConvert,
    };
  } catch (error) {
    console.error('Error getting funnel analytics:', error);
    throw error;
  }
}

/**
 * Check if a session completed the funnel
 */
function isSessionCompleted(events: FunnelEventData[], funnelType: FunnelType): boolean {
  const eventTypes = events.map((e) => e.event_type);

  switch (funnelType) {
    case FunnelType.ONBOARDING:
      return eventTypes.includes(FunnelEvent.ONBOARDING_COMPLETED);
    case FunnelType.PURCHASE:
      return eventTypes.includes(FunnelEvent.PURCHASE_COMPLETED);
    case FunnelType.ADOPTION:
      return eventTypes.includes(FunnelEvent.RECURRING_USER);
    default:
      return false;
  }
}

/**
 * Calculate dropoff points in the funnel
 */
function calculateDropoffPoints(
  sessions: Map<string, FunnelEventData[]>,
  funnelType: FunnelType
): Array<{ step: string; dropoffRate: number }> {
  const steps = getFunnelSteps(funnelType);
  const dropoffPoints: Array<{ step: string; dropoffRate: number }> = [];

  for (let i = 0; i < steps.length - 1; i++) {
    const currentStep = steps[i];
    const nextStep = steps[i + 1];

    const reachedCurrent = Array.from(sessions.values()).filter((events) =>
      events.some((e) => e.event_type === currentStep)
    ).length;

    const reachedNext = Array.from(sessions.values()).filter((events) =>
      events.some((e) => e.event_type === nextStep)
    ).length;

    const dropoffRate = reachedCurrent > 0 ? ((reachedCurrent - reachedNext) / reachedCurrent) * 100 : 0;

    dropoffPoints.push({
      step: currentStep,
      dropoffRate,
    });
  }

  return dropoffPoints;
}

/**
 * Calculate average time to convert
 */
function calculateAvgTimeToConvert(
  sessions: Map<string, FunnelEventData[]>,
  funnelType: FunnelType
): number {
  const completedSessions = Array.from(sessions.values()).filter((events) =>
    isSessionCompleted(events, funnelType)
  );

  if (completedSessions.length === 0) return 0;

  const totalTime = completedSessions.reduce((sum, events) => {
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const timeToConvert =
      new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime();
    return sum + timeToConvert;
  }, 0);

  return totalTime / completedSessions.length / 1000; // Return in seconds
}

/**
 * Get funnel steps for a funnel type
 */
function getFunnelSteps(funnelType: FunnelType): FunnelEvent[] {
  switch (funnelType) {
    case FunnelType.ONBOARDING:
      return [
        FunnelEvent.SIGNUP_STARTED,
        FunnelEvent.SIGNUP_COMPLETED,
        FunnelEvent.PROFILE_CREATED,
        FunnelEvent.FIRST_PAGE_CREATED,
        FunnelEvent.ONBOARDING_COMPLETED,
      ];
    case FunnelType.PURCHASE:
      return [
        FunnelEvent.OFFER_VIEWED,
        FunnelEvent.ADD_TO_CART,
        FunnelEvent.CHECKOUT_STARTED,
        FunnelEvent.PAYMENT_INFO_ADDED,
        FunnelEvent.PURCHASE_COMPLETED,
      ];
    case FunnelType.ADOPTION:
      return [
        FunnelEvent.FIRST_LOGIN,
        FunnelEvent.DASHBOARD_VIEWED,
        FunnelEvent.FEATURE_USED,
        FunnelEvent.CLIENT_INVITED,
        FunnelEvent.WORKSPACE_CREATED,
        FunnelEvent.RECURRING_USER,
      ];
    default:
      return [];
  }
}

/**
 * Get user's current funnel progress
 */
export async function getUserFunnelProgress(
  userId: string,
  funnelType: FunnelType
): Promise<{
  currentStep: FunnelEvent | null;
  completedSteps: FunnelEvent[];
  percentComplete: number;
}> {
  try {
    const { data: events } = await supabase
      .from('funnel_events')
      .select('event_type')
      .eq('user_id', userId)
      .eq('funnel_type', funnelType)
      .order('timestamp', { ascending: true });

    if (!events || events.length === 0) {
      return {
        currentStep: null,
        completedSteps: [],
        percentComplete: 0,
      };
    }

    const steps = getFunnelSteps(funnelType);
    const completedSteps = events.map((e) => e.event_type as FunnelEvent);
    const currentStep = completedSteps[completedSteps.length - 1];
    const percentComplete = (completedSteps.length / steps.length) * 100;

    return {
      currentStep,
      completedSteps,
      percentComplete,
    };
  } catch (error) {
    console.error('Error getting user funnel progress:', error);
    throw error;
  }
}
