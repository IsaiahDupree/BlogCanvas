/**
 * Streaming SSR Configuration
 * Enables React 18 Suspense streaming for better TTFB
 */

/**
 * Routes that should use streaming SSR
 */
export const STREAMING_ROUTES = [
  '/vendor/dashboard',
  '/vendor/analytics',
  '/vendor/clients',
  '/vendor/pages',
  '/app/dashboard',
  '/portal/dashboard',
];

/**
 * Check if a route should use streaming
 */
export function shouldUseStreaming(pathname: string): boolean {
  return STREAMING_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Streaming configuration options
 */
export interface StreamingConfig {
  enabled: boolean;
  progressive: boolean;
  priorityLevel: 'high' | 'medium' | 'low';
}

/**
 * Get streaming config for a route
 */
export function getStreamingConfig(pathname: string): StreamingConfig {
  const isStreamingRoute = shouldUseStreaming(pathname);

  // Dashboard routes get highest priority
  const isDashboard = pathname.includes('/dashboard');

  return {
    enabled: isStreamingRoute,
    progressive: true,
    priorityLevel: isDashboard ? 'high' : 'medium',
  };
}

/**
 * Delay for progressive hydration (ms)
 */
export const HYDRATION_DELAYS = {
  high: 0,
  medium: 100,
  low: 300,
};

/**
 * Component priority markers for streaming
 */
export const COMPONENT_PRIORITIES = {
  critical: 0,   // Above fold, immediately visible
  important: 1,  // Below fold but likely visible
  lazy: 2,       // Scroll down to see
  deferred: 3,   // Only load on interaction
};

/**
 * Stream chunk size configuration
 */
export const STREAM_CONFIG = {
  maxChunkSize: 65536, // 64KB
  flushInterval: 50,   // ms between flushes
  compressionLevel: 6, // gzip level
};
