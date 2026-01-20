'use client';

import { useEffect } from 'react';
import { trackPageView, trackScrollDepth, trackTimeOnPage } from '@/lib/tracking/page-events';

interface PageTrackerProps {
  vendorId: string;
  pageId: string;
}

/**
 * PageTracker component
 * Automatically tracks page views, scroll depth, and time on page
 * Include this component at the root of any public offer page
 */
export default function PageTracker({ vendorId, pageId }: PageTrackerProps) {
  useEffect(() => {
    // Track page view on mount
    trackPageView(vendorId, pageId);

    // Set up scroll depth tracking
    const cleanupScroll = trackScrollDepth(vendorId, pageId);

    // Set up time on page tracking
    const cleanupTimeOnPage = trackTimeOnPage(vendorId, pageId);

    // Cleanup on unmount
    return () => {
      if (typeof cleanupScroll === 'function') {
        cleanupScroll();
      }
      if (typeof cleanupTimeOnPage === 'function') {
        cleanupTimeOnPage();
      }
    };
  }, [vendorId, pageId]);

  // This component doesn't render anything
  return null;
}
