'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
  }
}

interface MetaPixelProps {
  pixelId: string;
}

export function MetaPixel({ pixelId }: MetaPixelProps) {
  useEffect(() => {
    // Initialize fbq function if it doesn't exist
    if (!window.fbq) {
      window.fbq = function(...args: any[]) {
        if (window.fbq) {
          // @ts-ignore
          (window.fbq.callMethod ? window.fbq.callMethod(...args) : window.fbq.queue.push(args));
        }
      };
      if (!window._fbq) window._fbq = window.fbq;
      // @ts-ignore
      window.fbq.push = window.fbq;
      // @ts-ignore
      window.fbq.loaded = true;
      // @ts-ignore
      window.fbq.version = '2.0';
      // @ts-ignore
      window.fbq.queue = [];
    }
  }, []);

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
          `.trim(),
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

/**
 * Track a custom Meta Pixel event
 * @param eventName - The name of the event (e.g., 'Lead', 'Purchase')
 * @param parameters - Optional event parameters
 * @param eventId - Optional event ID for deduplication with CAPI
 */
export function trackMetaEvent(
  eventName: string,
  parameters?: Record<string, any>,
  eventId?: string
) {
  if (typeof window !== 'undefined' && window.fbq) {
    const eventData = eventId ? { ...parameters, eventID: eventId } : parameters;
    window.fbq('track', eventName, eventData);
  }
}

/**
 * Track a custom Meta Pixel event (non-standard)
 * @param eventName - The name of the custom event
 * @param parameters - Optional event parameters
 * @param eventId - Optional event ID for deduplication with CAPI
 */
export function trackCustomMetaEvent(
  eventName: string,
  parameters?: Record<string, any>,
  eventId?: string
) {
  if (typeof window !== 'undefined' && window.fbq) {
    const eventData = eventId ? { ...parameters, eventID: eventId } : parameters;
    window.fbq('trackCustom', eventName, eventData);
  }
}
