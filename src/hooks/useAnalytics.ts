'use client';

import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  trackEvent,
  trackPageView,
  trackUserAction,
  trackBlogPostAction,
  trackClientAction,
  trackOrderAction,
  trackPaymentAction,
  trackAIPipelineAction,
  EventCategory,
  EventAction,
  type AnalyticsEvent,
} from '@/lib/analytics/event-tracker';

/**
 * Hook for tracking analytics events
 */
export function useAnalytics() {
  const pathname = usePathname();

  // Track page views automatically
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  const track = useCallback((event: AnalyticsEvent) => {
    trackEvent(event);
  }, []);

  const trackUser = useCallback(
    (action: EventAction, label?: string, metadata?: Record<string, unknown>) => {
      trackUserAction(action, label, metadata);
    },
    []
  );

  const trackBlogPost = useCallback(
    (action: EventAction, postId: string, metadata?: Record<string, unknown>) => {
      trackBlogPostAction(action, postId, metadata);
    },
    []
  );

  const trackClient = useCallback(
    (action: EventAction, clientId: string, metadata?: Record<string, unknown>) => {
      trackClientAction(action, clientId, metadata);
    },
    []
  );

  const trackOrder = useCallback(
    (
      action: EventAction,
      orderId: string,
      value?: number,
      metadata?: Record<string, unknown>
    ) => {
      trackOrderAction(action, orderId, value, metadata);
    },
    []
  );

  const trackPayment = useCallback(
    (
      action: EventAction,
      paymentId: string,
      value: number,
      metadata?: Record<string, unknown>
    ) => {
      trackPaymentAction(action, paymentId, value, metadata);
    },
    []
  );

  const trackAIPipeline = useCallback(
    (action: EventAction, pipelineId: string, metadata?: Record<string, unknown>) => {
      trackAIPipelineAction(action, pipelineId, metadata);
    },
    []
  );

  return {
    track,
    trackUser,
    trackBlogPost,
    trackClient,
    trackOrder,
    trackPayment,
    trackAIPipeline,
    EventCategory,
    EventAction,
  };
}
